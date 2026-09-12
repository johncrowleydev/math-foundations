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
import androidx.compose.foundation.relocation.BringIntoViewRequester
import androidx.compose.foundation.relocation.bringIntoViewRequester
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
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
        minLines = 3
        maxLines = 12
        textSize = 16f
        typeface = Typeface.create("sans-serif", Typeface.NORMAL)
        setTextColor(0xff253a36.toInt())
        setBackgroundColor(android.graphics.Color.TRANSPARENT)
        hint = "Write your answer…"
        setHintTextColor(0xff89938d.toInt())
        val density = resources.displayMetrics.density
        textCursorDrawable =
            android.graphics.drawable.GradientDrawable().apply {
                setColor(0xff286354.toInt())
                setSize((2 * density).toInt().coerceAtLeast(2), (22 * density).toInt())
            }
        pointerIcon =
            android.view.PointerIcon.getSystemIcon(context, android.view.PointerIcon.TYPE_TEXT)
        setPadding(
            (14 * density).toInt(),
            (12 * density).toInt(),
            (14 * density).toInt(),
            (12 * density).toInt(),
        )
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
    if (!focused) TypedAnswerBody(model, draft, question)
}

/** Hosted outside virtualized reader items, preserving the editor while the keyboard resizes. */
@Composable
fun FocusedAnswerEditor(model: NotebookModel) {
    val target = model.focusedEditor ?: return
    val lesson = model.lessons.first { it.slug == target.first }
    val question = lesson.question(target.second)
    val draft = remember(target) { model.answers.draft("${target.first}-${target.second}", true) }
    androidx.compose.ui.window.Dialog(
        onDismissRequest = { model.focusedEditor = null },
        properties =
            androidx.compose.ui.window.DialogProperties(
                usePlatformDefaultWidth = false,
                decorFitsSystemWindows = false,
            ),
    ) {
        val dialogView = androidx.compose.ui.platform.LocalView.current
        DisposableEffect(dialogView) {
            val window =
                (dialogView.parent as? androidx.compose.ui.window.DialogWindowProvider)?.window
            if (window != null) {
                androidx.core.view.WindowCompat.getInsetsController(window, dialogView).apply {
                    systemBarsBehavior =
                        androidx.core.view.WindowInsetsControllerCompat
                            .BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                    hide(androidx.core.view.WindowInsetsCompat.Type.systemBars())
                }
            }
            onDispose {}
        }
        Surface(Modifier.fillMaxSize().systemBarsPadding().imePadding(), color = WorkspaceGround) {
            Column {
                WorkspaceHeader("Exercise ${question.id}", "", { model.focusedEditor = null })
                Box(
                    Modifier.weight(1f)
                        .fillMaxWidth()
                        .verticalScroll(rememberScrollState())
                        .padding(20.dp),
                    contentAlignment = Alignment.TopCenter,
                ) {
                    Column(Modifier.widthIn(max = 900.dp).fillMaxWidth()) {
                        Column(
                            Modifier.heightIn(max = 140.dp)
                                .verticalScroll(rememberScrollState())
                                .padding(bottom = 8.dp)
                        ) {
                            Prompt(question, compact = true)
                        }
                        key(draft.key) { TypedAnswerBody(model, draft, question, expanded = true) }
                    }
                }
            }
        }
    }
}

@Composable
private fun TypedAnswerBody(
    model: NotebookModel,
    draft: AnswerDraft,
    question: Question,
    expanded: Boolean = false,
) {
    val library = model.tex
    var editor by remember { mutableStateOf<TexEditView?>(null) }
    var help by remember { mutableStateOf(false) }
    var symbols by remember { mutableStateOf(false) }
    var caret by remember { mutableIntStateOf(0) }
    var editorFocused by remember { mutableStateOf(false) }
    val caretVisibility = remember { BringIntoViewRequester() }
    val imeBottom = WindowInsets.ime.getBottom(androidx.compose.ui.platform.LocalDensity.current)
    LaunchedEffect(editor, caret, imeBottom, editorFocused) {
        if (editorFocused && imeBottom > 0) {
            delay(250)
            editor?.let { view ->
                val layout = view.layout ?: return@let
                val line = layout.getLineForOffset(view.selectionEnd.coerceIn(0, view.text.length))
                val top = layout.getLineTop(line) + view.totalPaddingTop - view.scrollY
                val bottom = layout.getLineBottom(line) + view.totalPaddingTop - view.scrollY
                caretVisibility.bringIntoView(
                    androidx.compose.ui.geometry.Rect(
                        0f,
                        top.toFloat(),
                        view.width.toFloat(),
                        bottom.toFloat() + 8f,
                    )
                )
            }
        }
    }
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
    Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(
            Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(2.dp),
        ) {
            WorkspaceAction("Insert math") {
                editor?.let { v ->
                    val selected =
                        v.text
                            ?.substring(
                                minOf(v.selectionStart, v.selectionEnd).coerceAtLeast(0),
                                maxOf(v.selectionStart, v.selectionEnd).coerceAtLeast(0),
                            )
                            .orEmpty()
                    v.insert("$" + selected + "$", 1 + selected.length)
                }
            }
            if (question.columns.isNotEmpty())
                TextButton(
                    shape = RoundedCornerShape(8.dp),
                    contentPadding = PaddingValues(horizontal = 6.dp, vertical = 2.dp),
                    onClick = {
                        val rows =
                            listOf(question.columns.joinToString(" & ")) +
                                List(question.rows) {
                                    List(question.columns.size) { "?" }.joinToString(" & ")
                                }
                        val template =
                            "\\begin{matrix}" + rows.joinToString(" \\\\ ") + "\\end{matrix}"
                        editor?.insert(if (inMath) template else "$$\n$template\n$$")
                    },
                ) {
                    Text("Table", fontSize = 12.sp)
                }
            WorkspaceAction("Insert symbol") { symbols = true }
            WorkspaceAction("Help", Icons.Outlined.HelpOutline) { help = true }
            QuietIcon(Icons.Outlined.Undo, "Undo") {
                editor?.onTextContextMenuItem(android.R.id.undo)
            }
            QuietIcon(Icons.Outlined.Redo, "Redo") {
                editor?.onTextContextMenuItem(android.R.id.redo)
            }
        }
        if (prefix != null)
            Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState())) {
                library.entries
                    .filter { ("\\" + it.command).startsWith(prefix) }
                    .take(8)
                    .forEach { entry ->
                        TextButton(
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(horizontal = 6.dp, vertical = 2.dp),
                            onClick = {
                                editor?.let { v ->
                                    val end = v.selectionStart
                                    v.setSelection((end - prefix.length).coerceAtLeast(0), end)
                                    v.insert("\\" + entry.command + " ")
                                }
                            },
                        ) {
                            Text("\\" + entry.command)
                        }
                    }
            }
        BoxWithConstraints(Modifier.fillMaxWidth()) {
            val input: @Composable (Modifier) -> Unit = { modifier ->
                Surface(
                    modifier,
                    color = Color.White,
                    shape = RoundedCornerShape(4.dp),
                    border = BorderStroke(1.dp, WorkspaceBorder),
                ) {
                    Column {
                        Text(
                            "ANSWER",
                            Modifier.padding(start = 14.dp, top = 12.dp),
                            color = WorkspaceMuted,
                            fontSize = 10.sp,
                            letterSpacing = 1.sp,
                        )
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
                                    onFocusChangeListener =
                                        android.view.View.OnFocusChangeListener { _, focused ->
                                            editorFocused = focused
                                        }
                                    editor = this
                                }
                            },
                            modifier =
                                Modifier.fillMaxWidth()
                                    .bringIntoViewRequester(caretVisibility)
                                    .heightIn(min = if (expanded) 300.dp else 86.dp)
                                    .testTag("typed:${draft.key}"),
                            update = { view ->
                                view.isEnabled = !draft.loading
                                if (view.text.toString() != source) {
                                    val selection = view.selectionStart.coerceIn(0, source.length)
                                    view.setText(source)
                                    view.setSelection(selection)
                                }
                                if (view.renderingProblems != renderingProblems) {
                                    view.renderingProblems = renderingProblems
                                    view.colorize()
                                }
                            },
                        )
                    }
                }
            }
            if (maxWidth >= 660.dp)
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    input(Modifier.weight(1f))
                    Column(Modifier.weight(1f)) {
                        AnswerPreview(source, library, if (expanded) 330.dp else 116.dp) {
                            renderingProblems = it
                        }
                    }
                }
            else
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    input(Modifier.fillMaxWidth())
                    AnswerPreview(source, library, if (expanded) 330.dp else 116.dp) {
                        renderingProblems = it
                    }
                }
        }
    }
    if (symbols)
        SymbolPicker(model, { symbols = false }) { command ->
            val insertion = "\\" + command + " "
            editor?.insert(
                if (inMath) insertion else "$" + insertion + "$",
                if (inMath) insertion.length else insertion.length + 1,
            )
            symbols = false
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
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(
                    "Inside math, commands are blue, braces brown, operators green, and scripts purple. Underlines indicate syntax to check, not incorrect mathematics.",
                    style = MaterialTheme.typography.bodySmall,
                    color = WorkspaceMuted,
                )
                OutlinedTextField(
                    query,
                    { query = it },
                    label = { Text("Find a command or construction") },
                    modifier = Modifier.fillMaxWidth(),
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
                                WorkspaceAction("Insert template", onClick = { insert(template) })
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
                            WorkspaceAction(
                                "Copy example",
                                onClick = {
                                    val clipboard =
                                        model
                                            .getApplication<android.app.Application>()
                                            .getSystemService(
                                                android.content.Context.CLIPBOARD_SERVICE
                                            ) as android.content.ClipboardManager
                                    clipboard.setPrimaryClip(
                                        android.content.ClipData.newPlainText(
                                            "TeX example",
                                            entry.example,
                                        )
                                    )
                                },
                            )
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
    minimumHeight: androidx.compose.ui.unit.Dp = 166.dp,
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
    Surface(
        Modifier.fillMaxWidth().testTag("answer-preview"),
        color = Color(0xfff7f8f4),
        shape = RoundedCornerShape(4.dp),
        border = BorderStroke(1.dp, WorkspaceBorder),
    ) {
        Column(
            Modifier.fillMaxWidth().heightIn(min = minimumHeight).padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Text("PREVIEW", color = WorkspaceMuted, fontSize = 10.sp, letterSpacing = 1.sp)
            if (source.isBlank())
                Text(
                    "Your formatted answer will appear here as you type.",
                    color = Color(0xff89938d),
                    fontSize = 13.sp,
                )
            else
                CompositionLocalProvider(LocalReferenceLinksEnabled provides false) {
                    RichText(preview, Modifier.fillMaxWidth(), 16f)
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
}

@Composable
private fun SymbolPicker(model: NotebookModel, close: () -> Unit, insert: (String) -> Unit) {
    var query by remember { mutableStateOf("") }
    val argumentCommands = setOf("frac", "sqrt", "binom", "mathbb", "mathcal", "pmod")
    AlertDialog(
        onDismissRequest = close,
        title = { Text("Insert symbol", fontSize = 16.sp) },
        text = {
            Column {
                OutlinedTextField(
                    query,
                    { query = it },
                    singleLine = true,
                    label = { Text("Find a symbol or TeX command") },
                    modifier = Modifier.fillMaxWidth(),
                )
                LazyColumn(Modifier.heightIn(max = 320.dp)) {
                    items(
                        model.tex.entries.filter {
                            it.group != "formatting" &&
                                it.command !in argumentCommands &&
                                (it.command + " " + it.explanation).contains(query, true)
                        },
                        key = { it.id },
                    ) { entry ->
                        TextButton(
                            onClick = { insert(entry.command) },
                            contentPadding = PaddingValues(vertical = 6.dp, horizontal = 2.dp),
                        ) {
                            Row(
                                Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                CompositionLocalProvider(
                                    LocalReferenceLinksEnabled provides false
                                ) {
                                    RichText(
                                        "$\\" + entry.command + "$",
                                        Modifier.width(44.dp),
                                        18f,
                                    )
                                }
                                Column(Modifier.weight(1f)) {
                                    Text(
                                        "\\" + entry.command,
                                        fontSize = 12.sp,
                                        color = WorkspaceMuted,
                                    )
                                    Text(
                                        entry.explanation,
                                        fontSize = 12.sp,
                                        color = MaterialTheme.colorScheme.onSurface,
                                        maxLines = 2,
                                    )
                                }
                            }
                        }
                    }
                }
            }
        },
        confirmButton = { WorkspaceAction("Close", onClick = close) },
    )
}
