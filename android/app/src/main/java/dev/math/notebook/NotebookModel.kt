package dev.math.notebook

import android.app.Application
import android.util.AtomicFile
import android.util.Base64
import androidx.compose.runtime.*
import androidx.ink.brush.Brush
import androidx.ink.brush.StockBrushes
import androidx.ink.storage.decode
import androidx.ink.storage.encode
import androidx.ink.strokes.Stroke
import androidx.ink.strokes.StrokeInputBatch
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import java.io.ByteArrayOutputStream
import java.io.File
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject

data class Question(
    val id: Int,
    val prompt: String,
    val math: String,
    val answer: String,
    val section: String,
    val instructions: String,
    val lines: Int,
    val columns: List<String>,
    val rows: Int,
)

data class QuickCheck(
    val id: String,
    val prompt: String,
    val options: List<String>,
    val answer: Int,
    val explanation: String,
)

data class Section(
    val title: String,
    val markdown: String,
    val questionIds: List<Int>,
    val quickChecks: List<QuickCheck> = emptyList(),
)

data class Lesson(
    val slug: String,
    val title: String,
    val eyebrow: String,
    val intro: String,
    val sections: List<Section>,
    val questions: List<Question>,
    val practiceIds: List<Int>,
) {
    fun question(id: Int) = questions.first { it.id == id }
}

fun <T> JSONArray.mapItems(block: (Int) -> T): List<T> = (0 until length()).map(block)

class NotebookModel(app: Application) : AndroidViewModel(app) {
    private val prefs = app.getSharedPreferences("notebook", 0)
    private val data =
        JSONObject(app.assets.open("notebook.json").bufferedReader().use { it.readText() })
    val lessons: List<Lesson> =
        data.getJSONArray("lessons").let { array ->
            array.mapItems { i ->
                val l = array.getJSONObject(i)
                Lesson(
                    l.getString("slug"),
                    l.getString("title"),
                    l.getString("eyebrow"),
                    l.getString("intro"),
                    l.getJSONArray("sections").let { sections ->
                        sections.mapItems { j ->
                            val s = sections.getJSONObject(j)
                            Section(
                                s.getString("title"),
                                s.getString("markdown"),
                                s.getJSONArray("questionIds").let { ids ->
                                    ids.mapItems { ids.getInt(it) }
                                },
                                s.optJSONArray("quickChecks")?.let { checks ->
                                    checks.mapItems { k ->
                                        val c = checks.getJSONObject(k)
                                        QuickCheck(
                                            c.getString("id"),
                                            c.getString("prompt"),
                                            c.getJSONArray("options").let { options ->
                                                options.mapItems { options.getString(it) }
                                            },
                                            c.getInt("answer"),
                                            c.getString("explanation"),
                                        )
                                    }
                                } ?: emptyList(),
                            )
                        }
                    },
                    l.getJSONArray("questions").let { questions ->
                        questions.mapItems { j ->
                            val q = questions.getJSONObject(j)
                            val table = q.optJSONObject("table")
                            Question(
                                q.getInt("id"),
                                q.getString("prompt"),
                                q.optString("math"),
                                q.getString("answer"),
                                q.getString("section"),
                                q.getString("instructions"),
                                q.getInt("answerLines"),
                                table?.getJSONArray("columns")?.let { cols ->
                                    cols.mapItems { cols.getString(it) }
                                } ?: emptyList(),
                                table?.getInt("rows") ?: 0,
                            )
                        }
                    },
                    l.getJSONArray("practiceIds").let { ids -> ids.mapItems { ids.getInt(it) } },
                )
            }
        }
    var selected by
        mutableIntStateOf(
            lessons
                .indexOfFirst {
                    it.slug == prefs.getString("lesson", data.getString("currentLesson"))
                }
                .coerceAtLeast(0)
        )
    var practice by mutableStateOf(prefs.getBoolean("practice", false))
    var penColor by mutableIntStateOf(prefs.getInt("color", 0xff253a43.toInt()))
    var penWidth by mutableFloatStateOf(prefs.getFloat("width", 2.4f))
    var eraser by mutableStateOf(false)
    var saveError by mutableStateOf<String?>(null)
    private val pages = androidx.compose.runtime.mutableStateMapOf<String, InkPage>()
    val pendingSaves
        get() = pages.values.any { it.saving || it.error != null }

    val lesson
        get() = lessons[selected]

    fun select(index: Int) {
        selected = index
        prefs.edit().putString("lesson", lesson.slug).apply()
    }

    fun mode(value: Boolean) {
        practice = value
        prefs.edit().putBoolean("practice", value).apply()
    }

    fun color(value: Int) {
        penColor = value
        eraser = false
        prefs.edit().putInt("color", value).apply()
    }

    fun width(value: Float) {
        penWidth = value
        eraser = false
        prefs.edit().putFloat("width", value).apply()
    }

    fun position(slug: String) = prefs.getInt("position:$slug", 0)

    fun position(slug: String, value: Int) {
        prefs.edit().putInt("position:$slug", value).apply()
    }

    fun reading(slug: String) = prefs.getInt("reading:$slug", 0) to prefs.getInt("offset:$slug", 0)

    fun reading(slug: String, index: Int, offset: Int) {
        prefs.edit().putInt("reading:$slug", index).putInt("offset:$slug", offset).apply()
    }

    fun page(key: String): InkPage =
        pages.getOrPut(key) { InkPage(key) { page -> save(page) }.also(::load) }

    private fun load(page: InkPage) {
        page.error = null
        viewModelScope.launch {
            try {
                val result =
                    withContext(Dispatchers.IO) {
                        InkFiles.read(
                            File(getApplication<Application>().filesDir, "ink/${page.key}.json")
                        )
                    }
                page.strokes = result.first
                page.height = result.second
                page.loading = false
            } catch (e: Exception) {
                page.error = "Could not open saved handwriting. Your saved file has been kept."
                saveError = page.error
            }
        }
    }

    // One IO writer, immutable snapshots, and atomic replacement prevent out-of-order saves.
    private val writer = java.util.concurrent.Executors.newSingleThreadExecutor()
    private val main = android.os.Handler(android.os.Looper.getMainLooper())

    private fun save(page: InkPage) {
        val strokes = page.strokes.toList()
        val height = page.height
        val revision = ++page.revision
        page.saving = true
        writer.execute {
            try {
                InkFiles.write(
                    File(getApplication<Application>().filesDir, "ink/${page.key}.json"),
                    strokes,
                    height,
                )
                main.post {
                    if (revision == page.revision) {
                        page.saving = false
                        page.error = null
                    }
                }
            } catch (e: Exception) {
                main.post {
                    page.error = "Handwriting could not be saved. Free some storage and retry."
                    saveError = page.error
                    page.saving = false
                }
            }
        }
    }

    fun retrySaves() {
        saveError = null
        pages.values.filter { it.error != null }.forEach { if (it.loading) load(it) else save(it) }
    }

    override fun onCleared() {
        writer.shutdown()
    }
}

class InkPage(val key: String, private val persist: (InkPage) -> Unit) {
    var strokes by mutableStateOf<List<Stroke>>(emptyList())
    var height by mutableFloatStateOf(520f)
    var loading by mutableStateOf(true)
    var saving by mutableStateOf(false)
    var error by mutableStateOf<String?>(null)
    var revision = 0
    private val undo = mutableStateListOf<List<Stroke>>()
    private val redo = mutableStateListOf<List<Stroke>>()
    val canUndo
        get() = undo.isNotEmpty()

    val canRedo
        get() = redo.isNotEmpty()

    fun replace(next: List<Stroke>) {
        if (loading || next == strokes) return
        undo.add(strokes)
        if (undo.size > 60) undo.removeAt(0)
        redo.clear()
        strokes = next
        persist(this)
    }

    fun undo() {
        if (canUndo) {
            redo.add(strokes)
            strokes = undo.removeAt(undo.lastIndex)
            persist(this)
        }
    }

    fun redo() {
        if (canRedo) {
            undo.add(strokes)
            strokes = redo.removeAt(redo.lastIndex)
            persist(this)
        }
    }

    fun moreSpace() {
        height += 360f
        persist(this)
    }

    fun ensureHeight(value: Float) {
        if (!loading && value > height + 1f) {
            height = value
            persist(this)
        }
    }
}

object InkFiles {
    fun read(file: File): Pair<List<Stroke>, Float> {
        val atomic = AtomicFile(file)
        if (!file.exists() && !File(file.path + ".bak").exists()) return emptyList<Stroke>() to 520f
        val json = JSONObject(atomic.openRead().bufferedReader().use { it.readText() })
        require(json.getInt("version") == 1) { "Unsupported ink version" }
        val array = json.getJSONArray("strokes")
        return array.mapItems { i ->
            val s = array.getJSONObject(i)
            val brush =
                Brush.createWithColorIntArgb(
                    StockBrushes.pressurePen(),
                    s.getInt("color"),
                    s.getDouble("size").toFloat(),
                    0.1f,
                )
            val inputs =
                StrokeInputBatch.decode(
                    Base64.decode(s.getString("inputs"), Base64.NO_WRAP).inputStream()
                )
            Stroke(brush, inputs)
        } to json.getDouble("height").toFloat()
    }

    fun write(file: File, strokes: List<Stroke>, height: Float) {
        file.parentFile!!.mkdirs()
        val json = JSONObject().put("version", 1).put("height", height)
        json.put(
            "strokes",
            JSONArray().also { array ->
                strokes.forEach { stroke ->
                    val bytes =
                        ByteArrayOutputStream().also { stroke.inputs.encode(it) }.toByteArray()
                    array.put(
                        JSONObject()
                            .put("color", stroke.brush.colorIntArgb)
                            .put("size", stroke.brush.size)
                            .put("inputs", Base64.encodeToString(bytes, Base64.NO_WRAP))
                    )
                }
            },
        )
        val atomic = AtomicFile(file)
        val stream = atomic.startWrite()
        try {
            stream.write(json.toString().toByteArray())
            atomic.finishWrite(stream)
        } catch (e: Exception) {
            atomic.failWrite(stream)
            throw e
        }
    }
}
