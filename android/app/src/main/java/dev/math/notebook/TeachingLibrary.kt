package dev.math.notebook

import android.content.Context
import androidx.compose.runtime.*
import androidx.compose.ui.unit.IntOffset
import org.json.JSONObject

internal data class ReferenceEntry(
    val id: String,
    val kind: String,
    val name: String,
    val aliases: List<String>,
    val quick: String,
    val definition: String,
    val example: String,
    val confusion: String,
    val lesson: String,
    val section: String,
    val related: List<String>,
)

internal class TeachingLibrary(context: Context) {
    private val json =
        JSONObject(context.assets.open("teaching.json").bufferedReader().use { it.readText() })
    val entries =
        json.getJSONArray("references").let { items ->
            items.mapItems { i ->
                val r = items.getJSONObject(i)
                ReferenceEntry(
                    r.getString("id"),
                    r.getString("kind"),
                    r.getString("name"),
                    r.strings("aliases"),
                    r.getString("quick"),
                    r.getString("definition"),
                    r.getString("example"),
                    r.getString("confusion"),
                    r.getString("lesson"),
                    r.getString("section"),
                    r.strings("related"),
                )
            }
        }
    val figures =
        json
            .getJSONArray("figures")
            .let { a -> a.mapItems { a.getJSONObject(it) } }
            .associateBy { it.getString("id") }
    val formulas =
        json
            .getJSONArray("formulas")
            .let { a -> a.mapItems { a.getJSONObject(it) } }
            .associateBy { it.getString("id") }
    private val formulaContexts by lazy {
        formulas.values.associateBy {
            it.getString("lesson") + "\n" + it.getString("source") + "\n" + it.getInt("ordinal")
        }
    }

    fun formulaAt(lesson: String, source: String, ordinal: Int, latex: String): JSONObject? {
        val formula = formulaContexts["$lesson\n$source\n$ordinal"] ?: return null
        return formula.takeIf {
            it.getString("latex").trim().replace(Regex("\\s+"), " ") ==
                latex.trim().replace(Regex("\\s+"), " ")
        }
    }
}

internal fun JSONObject.strings(key: String): List<String> =
    optJSONArray(key)?.let { a -> a.mapItems { a.getString(it) } } ?: emptyList()

internal class ReferenceController(val library: TeachingLibrary) {
    var target by mutableStateOf<String?>(null)
    var full by mutableStateOf(false)
    var standalone by mutableStateOf(false)
    var anchor by mutableStateOf(IntOffset.Zero)
    var history by mutableStateOf<List<String>>(emptyList())
    var studyTexts by mutableStateOf<List<Pair<String, String>>>(emptyList())
    var query by mutableStateOf("")
    var kind by mutableStateOf("term")
    var lessonFilter by mutableStateOf<String?>(null)

    fun open(id: String, position: IntOffset = IntOffset.Zero) {
        if (full && target != null) history = history + target!!
        target = id
        anchor = position
    }

    fun browse() {
        target = null
        full = true
        standalone = true
        history = emptyList()
    }

    fun close() {
        target = null
        full = false
        standalone = false
        history = emptyList()
    }

    fun back() {
        if (history.isNotEmpty()) {
            target = history.last()
            history = history.dropLast(1)
        } else if (standalone && target != null) target = null else close()
    }
}

internal val LocalReferences = staticCompositionLocalOf<ReferenceController?> { null }
internal val LocalReferenceLesson = staticCompositionLocalOf { "" }
internal val LocalReferenceLinksEnabled = staticCompositionLocalOf { true }
