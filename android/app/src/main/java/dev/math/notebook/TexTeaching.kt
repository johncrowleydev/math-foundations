package dev.math.notebook

import android.content.Context
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import org.json.JSONObject

class TexTeaching(context: Context) {
    private val data =
        JSONObject(context.assets.open("tex-teaching.json").bufferedReader().use { it.readText() })
    private val prefs = context.getSharedPreferences("notebook", 0)
    val basics = data.getJSONArray("basics").let { a -> a.mapItems { a.getJSONObject(it) } }
    private val placements =
        data.getJSONArray("placements").let { a -> a.mapItems { a.getJSONObject(it) } }
    private val references =
        data
            .getJSONArray("references")
            .let { a -> a.mapItems { a.getJSONObject(it) } }
            .associateBy { it.getString("reference") }
    private val exercises =
        data.getJSONArray("exercises").let { a -> a.mapItems { a.getJSONObject(it) } }
    private val overrides = mutableStateMapOf<String, Boolean>()

    fun block(lesson: String, section: String) =
        placements.firstOrNull {
            it.getString("lesson") == lesson && it.getString("section") == section
        }

    fun primerSignature() =
        basics
            .filter {
                it.getString("id") in
                    setOf("tex-basics", "tex-commands", "tex-groups", "tex-feedback")
            }
            .joinToString { it.toString() }

    fun signature(lesson: String, section: String): String {
        val block = block(lesson, section) ?: return ""
        return block.toString() +
            block
                .getJSONArray("entries")
                .let { a -> a.mapItems { a.getString(it) } }
                .joinToString { id ->
                    basics.firstOrNull { it.getString("id") == id }?.toString().orEmpty()
                }
    }

    fun reference(id: String) = references[id]

    fun location(id: String): Pair<String, String>? {
        if (id in setOf("tex-basics", "tex-commands", "tex-groups", "tex-feedback"))
            return "propositional-logic" to "intro"
        return placements
            .firstOrNull { p ->
                p.getJSONArray("entries").let { a -> a.mapItems { a.getString(it) } }.contains(id)
            }
            ?.let { it.getString("lesson") to it.getString("section") }
    }

    fun searchText(id: String) =
        reference(id)
            ?.let { r ->
                r.getJSONArray("examples").let { a ->
                    a.mapItems { a.getString(it) }.joinToString(" ")
                }
            }
            .orEmpty()

    fun exercise(lesson: String, id: Int) =
        exercises.firstOrNull {
            it.getString("lesson") == lesson && it.optInt("exercise", -1) == id
        }

    fun expanded(lesson: String, typing: Boolean): Boolean =
        overrides[lesson]
            ?: if (prefs.contains("tex:show:$lesson")) prefs.getBoolean("tex:show:$lesson", typing)
            else typing

    fun setExpanded(lesson: String, value: Boolean) {
        overrides[lesson] = value
        prefs.edit().putBoolean("tex:show:$lesson", value).apply()
    }

    fun available(lesson: String, section: String, lessons: List<Lesson>): Set<String> {
        val ids = mutableSetOf<String>()
        for (l in lessons) {
            for (s in l.sections) {
                block(l.slug, s.id)?.optJSONArray("entries")?.let { a ->
                    ids += a.mapItems { a.getString(it) }
                }
                if (l.slug == lesson && s.id == section) return ids
            }
        }
        return ids
    }
}

@Composable
fun TexSource(
    source: String,
    displayPreview: Boolean = true,
    document: Boolean = false,
    onInsert: (() -> Unit)? = null,
) {
    val clipboard = LocalClipboardManager.current
    Column {
        androidx.compose.foundation.text.selection.SelectionContainer {
            Text(
                source,
                Modifier.fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
                    .padding(vertical = 8.dp),
                fontFamily = FontFamily.Monospace,
            )
        }
        Row(Modifier.horizontalScroll(rememberScrollState())) {
            TextButton(onClick = { clipboard.setText(AnnotatedString(source)) }) {
                Text("Copy TeX")
            }
            if (onInsert != null) TextButton(onClick = onInsert) { Text("Insert into answer") }
        }
        if (displayPreview)
            CompositionLocalProvider(LocalReferenceLinksEnabled provides false) {
                RichText(if (document) source else "$$\n$source\n$$", Modifier.fillMaxWidth(), 18f)
            }
    }
}

@Composable
fun TypingGuide(model: NotebookModel) {
    val teaching = model.texTeaching
    val slug = model.lesson.slug
    val expanded = teaching.expanded(slug, model.input.preferTyping)
    var primer by rememberSaveable(slug) { mutableStateOf(false) }
    var insertion by remember { mutableStateOf<String?>(null) }
    Column(Modifier.fillMaxWidth().padding(vertical = 12.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            TextButton(onClick = { teaching.setExpanded(slug, !expanded) }) {
                Text(if (expanded) "Collapse typing help" else "Expand typing help")
            }
            TextButton(onClick = { primer = !primer }) { Text("Typing guide") }
        }
        if (primer || (model.selected == 0 && expanded)) {
            Text("Typing mathematics", style = MaterialTheme.typography.titleLarge)
            teaching.basics
                .filter {
                    it.getString("id") in
                        setOf("tex-basics", "tex-commands", "tex-groups", "tex-feedback")
                }
                .forEach { b ->
                    Text(
                        b.getString("title"),
                        style = MaterialTheme.typography.titleMedium,
                        modifier = Modifier.padding(top = 12.dp),
                    )
                    Text(b.getString("text"))
                    if (b.getString("source").isNotBlank())
                        TexSource(
                            b.getString("source"),
                            document = true,
                            onInsert = { insertion = b.getString("source") },
                        )
                }
        }
    }
    insertion?.let { InsertTeachingTemplate(model, it) { insertion = null } }
}

@Composable
fun TypingBlock(model: NotebookModel, section: String) {
    val block = model.texTeaching.block(model.lesson.slug, section) ?: return
    val expandedDefault = model.texTeaching.expanded(model.lesson.slug, model.input.preferTyping)
    var override by
        rememberSaveable(block.getString("id"), expandedDefault) { mutableStateOf<Boolean?>(null) }
    val expanded = override ?: expandedDefault
    var insertion by remember { mutableStateOf<String?>(null) }
    Column(Modifier.fillMaxWidth().padding(top = 16.dp)) {
        TextButton(onClick = { override = !expanded }) {
            Text(if (expanded) "Typing this math ▴" else "Typing this math ▾")
        }
        if (expanded) {
            Text(
                "These are the editing commands for the notation above and the upcoming practice. Copy a template and replace its letters with your own expression."
            )
            val entryIds = block.getJSONArray("entries").let { a -> a.mapItems { a.getString(it) } }
            entryIds.forEach { id ->
                val basic = model.texTeaching.basics.firstOrNull { it.getString("id") == id }
                val entry = model.tex.entries.firstOrNull { it.id == id }
                Text(
                    basic?.getString("title") ?: ("\\" + entry?.command.orEmpty()),
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.padding(top = 12.dp),
                )
                Text(basic?.getString("text") ?: entry?.explanation.orEmpty())
            }
            Text(
                "Examples to type",
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.padding(top = 16.dp),
            )
            entryIds.forEach { id ->
                val basic = model.texTeaching.basics.firstOrNull { it.getString("id") == id }
                val entry = model.tex.entries.firstOrNull { it.id == id }
                if (basic != null) {
                    Text(
                        basic.getString("title"),
                        style = MaterialTheme.typography.titleMedium,
                        modifier = Modifier.padding(top = 12.dp),
                    )
                    TexSource(
                        basic.getString("source"),
                        document = true,
                        onInsert = { insertion = basic.getString("source") },
                    )
                } else if (entry != null) {
                    Text(
                        "\\" + entry.command,
                        style = MaterialTheme.typography.titleMedium,
                        modifier = Modifier.padding(top = 12.dp),
                    )
                    TexSource(entry.example, onInsert = { insertion = "$" + entry.example + "$" })
                }
            }
        }
    }
    insertion?.let { InsertTeachingTemplate(model, it) { insertion = null } }
}

@Composable
private fun InsertTeachingTemplate(model: NotebookModel, source: String, dismiss: () -> Unit) {
    var selected by remember { mutableStateOf<Int?>(null) }
    val id = selected
    if (id != null) {
        val draft = remember(id) { model.answers.draft("${model.lesson.slug}-$id", true) }
        LaunchedEffect(draft.loading) {
            if (!draft.loading) {
                draft.edit(draft.text + if (draft.text.isBlank()) source else "\n\n" + source)
                draft.mode("type")
                model.editorStates.remove(draft.key)
                model.answerFocus = id
                dismiss()
            }
        }
        AlertDialog(
            onDismissRequest = dismiss,
            title = { Text("Opening answer") },
            text = { Text(draft.error ?: "Loading your saved draft…") },
            confirmButton = {
                if (draft.error != null) TextButton(onClick = draft::retry) { Text("Retry") }
            },
            dismissButton = { TextButton(onClick = dismiss) { Text("Cancel") } },
        )
    } else
        AlertDialog(
            onDismissRequest = dismiss,
            title = { Text("Insert into an answer") },
            text = {
                Column {
                    Text(
                        "Choose an exercise. The template will be appended to its typed draft, then opened for editing."
                    )
                    androidx.compose.foundation.lazy.LazyColumn(Modifier.heightIn(max = 400.dp)) {
                        items(model.lesson.questions.size) { index ->
                            val q = model.lesson.questions[index]
                            TextButton(onClick = { selected = q.id }) {
                                Text("Exercise ${q.id} · ${q.section}")
                            }
                        }
                    }
                }
            },
            confirmButton = { TextButton(onClick = dismiss) { Text("Cancel") } },
        )
}

@Composable
fun ReferenceTex(model: NotebookModel, reference: String, full: Boolean) {
    val record = model.texTeaching.reference(reference) ?: return
    val examples = record.getJSONArray("examples").let { a -> a.mapItems { a.getString(it) } }
    if (examples.isEmpty() && record.getJSONArray("requires").length() == 0) return
    Column {
        Text("TeX syntax", style = MaterialTheme.typography.titleMedium)
        if (record.optString("note").isNotBlank()) Text(record.getString("note"))
        (if (full) examples else examples.take(1)).forEach { TexSource(it, displayPreview = false) }
        if (full)
            record
                .getJSONArray("requires")
                .let { a -> a.mapItems { a.getString(it) } }
                .forEach { id ->
                    model.tex.entries
                        .firstOrNull { it.id == id }
                        ?.let { Text(it.explanation, Modifier.padding(vertical = 4.dp)) }
                    model.texTeaching.basics
                        .firstOrNull { it.getString("id") == id }
                        ?.let { Text(it.getString("text"), Modifier.padding(vertical = 4.dp)) }
                    model.texTeaching.location(id)?.let { (lesson, section) ->
                        TextButton(
                            onClick = {
                                model.references.close()
                                model.texTeaching.setExpanded(lesson, true)
                                model.openTeaching(lesson, section)
                            }
                        ) {
                            Text(
                                "Read syntax lesson: " +
                                    (model.lessons.firstOrNull { it.slug == lesson }?.title
                                        ?: lesson)
                            )
                        }
                    }
                }
    }
}
