package dev.math.notebook

import android.content.Context
import android.graphics.Typeface
import android.text.*
import android.text.style.*
import android.view.Gravity
import android.widget.EditText
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import org.json.JSONObject

class TexLibrary(context: Context) {
    data class Entry(
        val id: String,
        val command: String,
        val group: String,
        val example: String,
        val explanation: String,
    )

    val entries: List<Entry> =
        JSONObject(context.assets.open("tex-syntax.json").bufferedReader().use { it.readText() })
            .getJSONArray("entries")
            .let { a ->
                (0 until a.length()).map { i ->
                    val e = a.getJSONObject(i)
                    Entry(
                        e.getString("id"),
                        e.getString("command"),
                        e.getString("group"),
                        e.getString("example"),
                        e.getString("explanation"),
                    )
                }
            }
    val commands = entries.map { it.command }.toSet()
}

private class SyntaxColor(color: Int) : ForegroundColorSpan(color)

private class SyntaxError : UnderlineSpan()

private class MathTypeface : TypefaceSpan("monospace")

private class BraceMatch : BackgroundColorSpan(0xffd5e9d6.toInt())

/**
 * Only owned appearance spans change. Editable content, composing spans and native undo stay
 * intact.
 */
internal class TexEditView(context: Context) : EditText(context) {
    var commands: Set<String> = emptySet()
    var renderingProblems: List<TexSyntax.Problem> = emptyList()
    var changed: (String) -> Unit = {}
    var cursorChanged: (Int) -> Unit = {}
    private var applying = false
    private var ready = false

    init {
        gravity = Gravity.TOP
        inputType =
            android.text.InputType.TYPE_CLASS_TEXT or
                android.text.InputType.TYPE_TEXT_FLAG_MULTI_LINE
        imeOptions =
            imeOptions or
                android.view.inputmethod.EditorInfo.IME_FLAG_NO_EXTRACT_UI or
                android.view.inputmethod.EditorInfo.IME_FLAG_NO_FULLSCREEN
        setSingleLine(false)
        minLines = 5
        maxLines = 14
        textSize = 18f
        typeface = Typeface.create("sans-serif", Typeface.NORMAL)
        setTextColor(0xff253a36.toInt())
        setBackgroundColor(0xfffffef9.toInt())
        setPadding(20, 16, 20, 16)
        if (android.os.Build.VERSION.SDK_INT >= 34) setAutoHandwritingEnabled(false)
        freezesText = true
        ready = true
        addTextChangedListener(
            object : TextWatcher {
                override fun beforeTextChanged(
                    s: CharSequence?,
                    start: Int,
                    count: Int,
                    after: Int,
                ) {}

                override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}

                override fun afterTextChanged(s: Editable?) {
                    if (!applying) {
                        colorize()
                        changed(s.toString())
                    }
                }
            }
        )
    }

    override fun onSelectionChanged(start: Int, end: Int) {
        super.onSelectionChanged(start, end)
        // EditText invokes this during construction, before subclass fields are initialized.
        if (ready && !applying) {
            colorize()
            cursorChanged(start)
        }
    }

    fun snapshot(): android.os.Parcelable? = onSaveInstanceState()

    fun restoreSnapshot(state: android.os.Parcelable) {
        onRestoreInstanceState(state)
        colorize()
    }

    fun insert(value: String, inside: Int = value.length) {
        val start = minOf(selectionStart, selectionEnd).coerceAtLeast(0)
        val end = maxOf(selectionStart, selectionEnd).coerceAtLeast(start)
        text?.replace(start, end, value)
        setSelection((start + inside).coerceIn(0, text?.length ?: 0))
        requestFocus()
    }

    fun colorize() {
        val edit = text ?: return
        if (applying) return
        applying = true
        try {
            edit.getSpans(0, edit.length, SyntaxColor::class.java).forEach(edit::removeSpan)
            edit.getSpans(0, edit.length, SyntaxError::class.java).forEach(edit::removeSpan)
            edit.getSpans(0, edit.length, BraceMatch::class.java).forEach(edit::removeSpan)
            edit.getSpans(0, edit.length, MathTypeface::class.java).forEach(edit::removeSpan)
            val doc = TexSyntax.parse(edit.toString(), commands)
            doc.blocks.forEach {
                edit.setSpan(MathTypeface(), it.start, it.end, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            }
            doc.tokens.forEach { t ->
                val color =
                    when (t.kind) {
                        "command" -> 0xff155a96
                        "brace" -> 0xff71512b
                        "script" -> 0xff85357b
                        "operator" -> 0xff2c6950
                        else -> 0xff76527e
                    }
                edit.setSpan(
                    SyntaxColor(color.toInt()),
                    t.start,
                    t.end,
                    Spanned.SPAN_EXCLUSIVE_EXCLUSIVE,
                )
            }
            (doc.problems + renderingProblems)
                .filter { it.start >= 0 && it.end <= edit.length && it.start < it.end }
                .forEach {
                    edit.setSpan(SyntaxError(), it.start, it.end, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                }
            val at = listOf(selectionStart, selectionStart - 1).firstOrNull { it in doc.pairs }
            if (at != null)
                listOf(at, doc.pairs.getValue(at)).forEach {
                    edit.setSpan(BraceMatch(), it, it + 1, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                }
        } finally {
            applying = false
        }
    }
}

@Composable
fun TypedAnswer(model: NotebookModel, draft: AnswerDraft, question: Question) {
    val focused = model.focusedEditor?.let { "${it.first}-${it.second}" == draft.key } == true
    Column {
        TextButton(onClick = { model.focusedEditor = model.lesson.slug to question.id }) {
            Text(if (focused) "Editor is open" else "Focus editor")
        }
        if (!focused) TypedAnswerBody(model, draft, question)
    }
}

/** Lives outside every lazy reader/practice item, so IME resizing cannot recycle the dialog. */
@Composable
fun FocusedAnswerEditor(model: NotebookModel) {
    val target = model.focusedEditor ?: return
    val lesson = model.lessons.first { it.slug == target.first }
    val question = lesson.question(target.second)
    val draft = remember(target) { model.answers.draft("${target.first}-${target.second}", true) }
    androidx.compose.ui.window.Dialog(
        onDismissRequest = { model.focusedEditor = null },
        properties = androidx.compose.ui.window.DialogProperties(usePlatformDefaultWidth = false),
    ) {
        Surface(Modifier.fillMaxSize().systemBarsPadding().imePadding()) {
            Column {
                TextButton(onClick = { model.focusedEditor = null }) { Text("Done editing") }
                Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(12.dp)) {
                    key(draft.key) { TypedAnswerBody(model, draft, question) }
                }
            }
        }
    }
}

@Composable
private fun TypedAnswerBody(model: NotebookModel, draft: AnswerDraft, question: Question) {
    val library = model.tex
    var editor by remember { mutableStateOf<TexEditView?>(null) }
    var help by remember { mutableStateOf(false) }
    var caret by remember { mutableIntStateOf(0) }
    DisposableEffect(editor, draft.key) {
        val view = editor
        onDispose { view?.snapshot()?.let { model.editorStates[draft.key] = it } }
    }
    val source = draft.text
    var renderingProblems by
        remember(source) { mutableStateOf<List<TexSyntax.Problem>>(emptyList()) }
    val doc = remember(source) { TexSyntax.parse(source, library.commands) }
    val inMath = doc.blocks.any { caret in it.contentStart..it.contentEnd }
    val prefix =
        if (inMath)
            Regex("\\\\[A-Za-z]*$").find(source.take(caret.coerceIn(0, source.length)))?.value
        else null
    Column(Modifier.fillMaxWidth()) {
        Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState())) {
            TextButton(
                onClick = {
                    val v = editor ?: return@TextButton
                    val selected =
                        v.text
                            ?.substring(
                                minOf(v.selectionStart, v.selectionEnd).coerceAtLeast(0),
                                maxOf(v.selectionStart, v.selectionEnd).coerceAtLeast(0),
                            )
                            .orEmpty()
                    v.insert("$" + selected + "$", 1 + selected.length)
                }
            ) {
                Text("Insert math")
            }
            if (question.columns.isNotEmpty())
                TextButton(
                    onClick = {
                        val rows =
                            listOf(question.columns.joinToString(" & ")) +
                                List(question.rows) {
                                    List(question.columns.size) { "?" }.joinToString(" & ")
                                }
                        val template =
                            "\\begin{matrix}" + rows.joinToString(" \\\\ ") + "\\end{matrix}"
                        editor?.insert(if (inMath) template else "$$\n$template\n$$")
                    }
                ) {
                    Text("Table template")
                }
            TextButton(onClick = { help = true }) { Text("Syntax help") }
            TextButton(onClick = { editor?.onTextContextMenuItem(android.R.id.undo) }) {
                Text("Undo")
            }
            TextButton(onClick = { editor?.onTextContextMenuItem(android.R.id.redo) }) {
                Text("Redo")
            }
        }
        val required =
            model.texTeaching
                .exercise(model.lesson.slug, draft.key.substringAfterLast('-').toInt())
                ?.optJSONArray("requires")
        val relevant = required?.let { a -> a.mapItems { a.getString(it) } }.orEmpty()
        if (relevant.isNotEmpty())
            Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState())) {
                library.entries
                    .filter { it.id in relevant }
                    .take(8)
                    .forEach { entry ->
                        TextButton(
                            onClick = {
                                editor?.insert(
                                    if (inMath) entry.example else "$" + entry.example + "$"
                                )
                            }
                        ) {
                            Text("\\" + entry.command)
                        }
                    }
            }
        if (prefix != null)
            Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState())) {
                library.entries
                    .filter { ("\\" + it.command).startsWith(prefix) }
                    .take(8)
                    .forEach { entry ->
                        TextButton(
                            onClick = {
                                editor?.let { v ->
                                    val end = v.selectionStart
                                    v.setSelection((end - prefix.length).coerceAtLeast(0), end)
                                    v.insert("\\" + entry.command + " ")
                                }
                            }
                        ) {
                            Text("\\" + entry.command)
                        }
                    }
            }
        BoxWithConstraints(Modifier.fillMaxWidth()) {
            val input: @Composable (Modifier) -> Unit = { modifier ->
                AndroidView(
                    factory = { context ->
                        TexEditView(context).apply {
                            commands = library.commands
                            setText(source)
                            setSelection(text.length)
                            model.editorStates[draft.key]?.let { saved ->
                                restoreSnapshot(saved)
                                if (text.toString() != source) {
                                    setText(source)
                                    setSelection(text.length)
                                }
                            }
                            caret = selectionStart
                            changed = draft::edit
                            cursorChanged = { caret = it }
                            editor = this
                        }
                    },
                    modifier = modifier.testTag("typed:${draft.key}"),
                    update = { view ->
                        view.isEnabled = !draft.loading
                        if (view.renderingProblems != renderingProblems) {
                            view.renderingProblems = renderingProblems
                            view.colorize()
                        }
                    },
                )
            }
            if (maxWidth >= 760.dp)
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    input(Modifier.weight(1f))
                    Column(Modifier.weight(1f)) {
                        AnswerPreview(source, library) { renderingProblems = it }
                    }
                }
            else
                Column {
                    input(Modifier.fillMaxWidth())
                    AnswerPreview(source, library) { renderingProblems = it }
                }
        }
    }
    if (help)
        SyntaxHelp(model, onClose = { help = false }) { sourceToInsert ->
            // Construction templates already contain delimiters. In math, strip a single enclosing
            // pair.
            val parsed = TexSyntax.parse(sourceToInsert, library.commands)
            val single =
                parsed.blocks.singleOrNull()?.takeIf {
                    it.start == 0 && it.end == sourceToInsert.length && it.closed
                }
            val active = doc.blocks.firstOrNull { caret in it.contentStart..it.contentEnd }
            val insertion =
                when {
                    active == null -> sourceToInsert
                    single != null ->
                        sourceToInsert.substring(single.contentStart, single.contentEnd)
                    else -> {
                        val delimiter = if (active.display) "$$" else "$"
                        delimiter + "\n\n" + sourceToInsert + "\n\n" + delimiter
                    }
                }
            editor?.insert(insertion)
            help = false
        }
}

@Composable
fun SyntaxHelp(model: NotebookModel, onClose: () -> Unit, insert: (String) -> Unit) {
    val library = model.tex
    var query by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onClose,
        title = { Text("TeX syntax") },
        text = {
            Column {
                Text(
                    "Inside math, commands are blue, braces brown, operators green, and scripts purple. Underlines indicate syntax to check, not incorrect mathematics."
                )
                OutlinedTextField(
                    query,
                    { query = it },
                    label = { Text("Find a command or construction") },
                    singleLine = true,
                )
                LazyColumn(Modifier.heightIn(max = 420.dp)) {
                    items(
                        model.texTeaching.basics.filter {
                            (it.getString("title") +
                                    " " +
                                    it.getString("text") +
                                    " " +
                                    it.getString("source"))
                                .contains(query, true)
                        },
                        key = { it.getString("id") },
                    ) { construction ->
                        Column(Modifier.padding(vertical = 12.dp)) {
                            Text(
                                construction.getString("title"),
                                style = MaterialTheme.typography.titleMedium,
                            )
                            Text(construction.getString("text"))
                            val template = construction.getString("source")
                            if (template.isNotBlank()) {
                                Text(
                                    template,
                                    fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace,
                                )
                                TextButton(onClick = { insert(template) }) {
                                    Text("Insert template")
                                }
                            }
                            model.texTeaching.location(construction.getString("id"))?.let {
                                (lesson, section) ->
                                TextButton(
                                    onClick = {
                                        onClose()
                                        model.references.close()
                                        model.texTeaching.setExpanded(lesson, true)
                                        model.openTeaching(lesson, section)
                                    }
                                ) {
                                    Text("Read typing lesson")
                                }
                            }
                        }
                    }
                    items(
                        library.entries.filter {
                            (it.command + " " + it.explanation + " " + it.example).contains(
                                query,
                                true,
                            )
                        },
                        key = { it.id },
                    ) { entry ->
                        Column(Modifier.padding(vertical = 12.dp)) {
                            Text("\\" + entry.command, style = MaterialTheme.typography.titleMedium)
                            Text(entry.explanation)
                            Text(
                                entry.example,
                                fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace,
                            )
                            TextButton(onClick = { insert("$" + entry.example + "$") }) {
                                Text("Insert example")
                            }
                        }
                    }
                }
            }
        },
        confirmButton = { TextButton(onClick = onClose) { Text("Close") } },
    )
}

@Composable
private fun AnswerPreview(
    source: String,
    library: TexLibrary,
    diagnostics: (List<TexSyntax.Problem>) -> Unit,
) {
    var preview by remember { mutableStateOf("") }
    var errors by remember { mutableStateOf<List<String>>(emptyList()) }
    LaunchedEffect(source) {
        delay(180)
        val result =
            withContext(Dispatchers.Default) {
                val doc = TexSyntax.parse(source, library.commands)
                val issues =
                    doc.problems
                        .map {
                            "Line ${source.take(it.start).count { c -> c == '\n' } + 1}: ${it.message}"
                        }
                        .toMutableList()
                val nativeProblems = mutableListOf<TexSyntax.Problem>()
                val out = StringBuilder()
                var position = 0
                fun plain(value: String) = TexSyntax.previewProse(value)
                for (block in doc.blocks) {
                    out.append(plain(source.substring(position, block.start)))
                    val latex = source.substring(block.contentStart, block.contentEnd)
                    val valid =
                        block.closed &&
                            doc.problems.none { it.start in block.start until block.end }
                    val rendered =
                        valid &&
                            latex.length <= 6000 &&
                            runCatching {
                                    ru.noties.jlatexmath.JLatexMathDrawable.builder(latex)
                                        .textSize(20f)
                                        .build()
                                }
                                .isSuccess
                    if (rendered)
                        out.append(
                            if (block.display) "\n\n$$\n$latex\n$$\n\n" else "$" + latex + "$"
                        )
                    else {
                        out.append("[math needs attention]")
                        if (valid) {
                            val message =
                                "Check command arguments, or split a very long expression into smaller blocks."
                            issues +=
                                "Line ${source.take(block.start).count { it == '\n' } + 1}: $message"
                            nativeProblems += TexSyntax.Problem(block.start, block.end, message)
                        }
                    }
                    position = block.end
                }
                out.append(plain(source.substring(position)))
                Triple(out.toString(), issues.distinct(), nativeProblems.toList())
            }
        preview = result.first
        errors = result.second
        diagnostics(result.third)
    }
    Column(Modifier.fillMaxWidth().padding(12.dp).testTag("answer-preview")) {
        Text("Preview", style = MaterialTheme.typography.labelLarge)
        if (source.isBlank()) Text("Your text and mathematics will appear here.")
        else
            CompositionLocalProvider(LocalReferenceLinksEnabled provides false) {
                RichText(preview, Modifier.fillMaxWidth(), 18f)
            }
        errors.forEach {
            Text(
                it,
                color = MaterialTheme.colorScheme.error,
                modifier = Modifier.padding(top = 8.dp),
            )
        }
    }
}
