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
    val id: String = title,
    val blocks: JSONArray? = null,
)

data class Lesson(
    val slug: String,
    val title: String,
    val eyebrow: String,
    val intro: String,
    val sections: List<Section>,
    val questions: List<Question>,
    val practiceIds: List<Int>,
    val introBlocks: JSONArray? = null,
) {
    fun question(id: Int) = questions.first { it.id == id }
}

fun <T> JSONArray.mapItems(block: (Int) -> T): List<T> = (0 until length()).map(block)

class NotebookModel(app: Application) : AndroidViewModel(app) {
    val cloud = CloudSync.get(app)
    val input = InputPreferences(app)
    val answers = AnswerStore(app)
    val tex = TexLibrary(app)
    val texTeaching = TexTeaching(app)
    internal val references = ReferenceController(TeachingLibrary(app))
    val editorStates = mutableMapOf<String, android.os.Parcelable>()
    var answerFocus by mutableStateOf<Int?>(null)
    var focusedEditor by mutableStateOf<Pair<String, Int>?>(null)
    var teachingJump by mutableStateOf<Pair<Int, String>?>(null)
        private set

    private var jumpSequence = 0

    fun openTeaching(slug: String, section: String) {
        focusedEditor = null
        val index = lessons.indexOfFirst { it.slug == slug }
        if (index < 0) return
        mode(false)
        select(index)
        teachingJump = (++jumpSequence) to section
    }

    fun consumeTeachingJump(jump: Pair<Int, String>) {
        if (teachingJump == jump) teachingJump = null
    }

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
                                s.optString("id", s.getString("title")),
                                s.optJSONArray("blocks"),
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
                    l.optJSONArray("introBlocks"),
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
    private val cloudListener: (String) -> Unit = { key ->
        when (key.substringBefore('/')) {
            "text",
            "photos" -> answers.refresh(key.substringAfter('/'))
            "ink" -> pages[key.substringAfter('/')]?.let { load(it) }
            "preference" -> texTeaching.refresh()
        }
    }

    init {
        cloud.listen(cloudListener)
    }

    var resumeJump by mutableStateOf<Pair<Int, String>?>(null)
        private set

    fun resumeCloud() {
        val target = cloud.resume ?: return
        val slug = target.optString("slug")
        val index = lessons.indexOfFirst { it.slug == slug }
        if (index < 0) return
        val keys = readingKeys(slug)
        val anchor =
            target.optString("anchor").takeIf { it in keys }
                ?: target.optString("section").takeIf { it in keys }
                ?: "intro"
        focusedEditor = null
        answerFocus = null
        select(index)
        mode(false)
        resumeJump = (++jumpSequence) to anchor
        cloud.dismissResume()
    }

    fun consumeResume() {
        resumeJump = null
    }

    val pendingSaves
        get() = answers.pending || pages.values.any { it.saving || it.error != null }

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

    private fun readingKeys(slug: String): List<String> = buildList {
        add("intro")
        lessons
            .first { it.slug == slug }
            .sections
            .forEach { s ->
                add("section:${s.id}")
                s.quickChecks.forEach { add("quick:${it.id}") }
                s.questionIds.forEach { add("question:$it") }
            }
        add("end")
    }

    private fun readingContent(slug: String, key: String): Int {
        val lesson = lessons.first { it.slug == slug }
        val text =
            when {
                key == "intro" -> lesson.intro + texTeaching.primerSignature()
                key.startsWith("section:") ->
                    lesson.sections
                        .find { "section:${it.id}" == key }
                        ?.let { section ->
                            section.markdown +
                                texTeaching.signature(slug, section.id) +
                                section.blocks?.toString().orEmpty() +
                                references.library.figures.values
                                    .filter {
                                        it.getString("lesson") == slug &&
                                            it.getString("section") == section.title
                                    }
                                    .joinToString { it.toString() }
                        }
                        .orEmpty()
                key.startsWith("question:") ->
                    lesson.questions
                        .find { "question:${it.id}" == key }
                        ?.let { it.instructions + it.prompt + it.math }
                        .orEmpty()
                key.startsWith("quick:") ->
                    lesson.sections
                        .flatMap { it.quickChecks }
                        .find { "quick:${it.id}" == key }
                        ?.let { it.prompt + it.options.joinToString() + it.explanation }
                        .orEmpty()
                else -> key
            }
        return text.hashCode()
    }

    fun reading(slug: String): Pair<Int, Int> {
        val keys = readingKeys(slug)
        val anchor = prefs.getString("reading-anchor:$slug", null)
        if (anchor != null) {
            val index = keys.indexOf(anchor)
            if (index < 0) {
                val section = prefs.getString("reading-section:$slug", "intro")
                return keys.indexOf(section).coerceAtLeast(0) to 0
            }
            val unchanged =
                prefs.getInt("reading-content:$slug", Int.MIN_VALUE) == readingContent(slug, anchor)
            return index to if (unchanged) prefs.getInt("offset:$slug", 0) else 0
        }
        val legacy =
            JSONObject(
                getApplication<Application>()
                    .assets
                    .open("reading-order-v7.json")
                    .bufferedReader()
                    .use { it.readText() }
            )
        val previous = legacy.optJSONArray(slug)
        val oldIndex = prefs.getInt("reading:$slug", 0)
        val previousKey = previous?.optString(oldIndex)
        val previousSection =
            previous?.let { a ->
                (0..oldIndex.coerceAtMost(a.length() - 1))
                    .map { a.optString(it) }
                    .lastOrNull { it.startsWith("section:") && it in keys }
            }
        val key = previousKey?.takeIf { it in keys } ?: previousSection ?: "intro"
        // Rewritten teaching prose has a different height: retain its section, not an
        // obsolete pixel offset that could skip newly introduced explanations.
        val offset =
            if (key.startsWith("question:") || key.startsWith("quick:"))
                prefs.getInt("offset:$slug", 0)
            else 0
        val index = keys.indexOf(key).coerceAtLeast(0)
        reading(slug, index, offset)
        return index to offset
    }

    fun reading(slug: String, index: Int, offset: Int, activity: Boolean = false) {
        val keys = readingKeys(slug)
        val key = keys.getOrNull(index) ?: "intro"
        val section =
            keys.take(index.coerceAtLeast(0) + 1).lastOrNull { it.startsWith("section:") }
                ?: "intro"
        prefs
            .edit()
            .putString("reading-anchor:$slug", key)
            .putString("reading-section:$slug", section)
            .putInt("reading-content:$slug", readingContent(slug, key))
            .putInt("reading:$slug", index)
            .putInt("offset:$slug", offset)
            .apply()
        if (activity) cloud.reading(slug, key, section)
    }

    fun page(key: String): InkPage =
        pages.getOrPut(key) { InkPage(key) { page -> save(page) }.also(::load) }

    private fun load(page: InkPage) {
        page.error = null
        val revision = page.revision
        viewModelScope.launch {
            try {
                val result =
                    withContext(Dispatchers.IO) {
                        InkFiles.read(
                            File(getApplication<Application>().filesDir, "ink/${page.key}.json")
                        )
                    }
                if (revision == page.revision) {
                    page.strokes = result.first
                    page.height = result.second
                    page.loading = false
                }
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
                synchronized(NotebookDisk.lock) {
                    InkFiles.write(
                        File(getApplication<Application>().filesDir, "ink/${page.key}.json"),
                        strokes,
                        height,
                    )
                }
                cloud.changed()
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
        answers.retry()
        saveError = null
        pages.values.filter { it.error != null }.forEach { if (it.loading) load(it) else save(it) }
    }

    override fun onCleared() {
        cloud.unlisten(cloudListener)
        writer.shutdown()
        answers.close()
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
