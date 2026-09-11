package dev.math.notebook

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.*
import androidx.compose.ui.window.*

@Composable
internal fun ReferencePanel(
    model: NotebookModel,
    controller: ReferenceController,
    modifier: Modifier = Modifier,
) {
    val state = rememberLazyListState()
    var filters by remember { mutableStateOf(false) }
    Surface(modifier.testTag("reference-panel"), tonalElevation = 3.dp) {
        Column(Modifier.fillMaxSize().padding(22.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                TextButton(
                    onClick = {
                        if (controller.target != null) controller.back() else controller.close()
                    }
                ) {
                    Text(if (controller.target != null) "Back" else "Return to lesson")
                }
                TextButton(onClick = controller::close) { Text("Close") }
            }
            Text(
                if (controller.target == null) "Reference library" else "Full explanation",
                style = MaterialTheme.typography.headlineSmall,
            )
            val target = controller.target
            if (target == null) {
                OutlinedTextField(
                    controller.query,
                    { controller.query = it },
                    label = { Text("Search names, symbols, or TeX") },
                    modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
                    singleLine = true,
                )
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    FilterChip(
                        controller.kind == "term",
                        { controller.kind = "term" },
                        label = { Text("Terms") },
                    )
                    FilterChip(
                        controller.kind == "symbol",
                        { controller.kind = "symbol" },
                        label = { Text("Notation") },
                    )
                }
                TextButton(onClick = { filters = true }) {
                    Text(
                        "Lesson: " +
                            (model.lessons.find { it.slug == controller.lessonFilter }?.title
                                ?: "All lessons")
                    )
                }
                LaunchedEffect(controller.query, controller.kind, controller.lessonFilter) {
                    state.scrollToItem(0)
                }
                val query = controller.query.trim()
                val entries =
                    controller.library.entries
                        .filter { e ->
                            e.kind == controller.kind &&
                                (controller.lessonFilter == null ||
                                    e.lesson == controller.lessonFilter) &&
                                (query.isEmpty() ||
                                    (listOf(e.name, e.quick) + e.aliases).any {
                                        it.contains(query, ignoreCase = true)
                                    })
                        }
                        .sortedWith(
                            compareBy<ReferenceEntry> {
                                    if (query.isEmpty()) 0
                                    else if (it.name == query || query in it.aliases) -1
                                    else if (
                                        it.name.equals(query, true) ||
                                            it.aliases.any { a -> a.equals(query, true) }
                                    )
                                        0
                                    else if (it.name.contains(query, true)) 1 else 2
                                }
                                .thenBy { it.name.lowercase() }
                        )
                LazyColumn(
                    state = state,
                    userScrollEnabled = false,
                    modifier = Modifier.weight(1f).twoFingerScroll(state),
                ) {
                    if (entries.isEmpty())
                        item {
                            Text(
                                "No matching entries. Try a symbol name or another lesson.",
                                Modifier.padding(vertical = 20.dp),
                            )
                        }
                    items(entries, key = { it.id }) { e ->
                        TextButton(
                            onClick = { controller.open("term:${e.id}") },
                            modifier = Modifier.fillMaxWidth().testTag("reference:${e.id}"),
                        ) {
                            Column(Modifier.fillMaxWidth().padding(vertical = 10.dp)) {
                                Text(e.name, style = MaterialTheme.typography.titleMedium)
                                CompositionLocalProvider(
                                    LocalReferenceLinksEnabled provides false
                                ) {
                                    RichText(
                                        e.quick,
                                        Modifier.fillMaxWidth(),
                                        16f,
                                        onClick = { controller.open("term:${e.id}") },
                                    )
                                }
                            }
                        }
                        HorizontalDivider()
                    }
                }
            } else {
                LazyColumn(
                    state = state,
                    userScrollEnabled = false,
                    modifier = Modifier.weight(1f).twoFingerScroll(state),
                ) {
                    item(key = target) { ReferenceDetails(model, controller, target, true) }
                }
                LaunchedEffect(target) { state.scrollToItem(0) }
            }
        }
    }
    if (filters)
        AlertDialog(
            onDismissRequest = { filters = false },
            title = { Text("Filter by lesson") },
            text = {
                val filterState = rememberLazyListState()
                LazyColumn(
                    state = filterState,
                    userScrollEnabled = false,
                    modifier = Modifier.heightIn(max = 500.dp).twoFingerScroll(filterState),
                ) {
                    item {
                        TextButton(
                            onClick = {
                                controller.lessonFilter = null
                                filters = false
                            }
                        ) {
                            Text("All lessons")
                        }
                    }
                    items(model.lessons, key = { it.slug }) { lesson ->
                        TextButton(
                            onClick = {
                                controller.lessonFilter = lesson.slug
                                filters = false
                            }
                        ) {
                            Text(lesson.title)
                        }
                    }
                }
            },
            confirmButton = { TextButton(onClick = { filters = false }) { Text("Close") } },
        )
}

@Composable
private fun ReferenceDetails(
    model: NotebookModel,
    controller: ReferenceController,
    target: String,
    full: Boolean,
) {
    Column(
        Modifier.fillMaxWidth().padding(vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        if (target == "question-reference") {
            Text("Question references", style = MaterialTheme.typography.headlineSmall)
            Text("Tap a linked term or formula for its meaning.")
            controller.studyTexts.forEach { (source, text) ->
                RichText(text, Modifier.fillMaxWidth(), 18f, source = source)
            }
        } else if (target.startsWith("term:")) {
            val entry =
                controller.library.entries.find { it.id == target.removePrefix("term:") }
                    ?: return@Column
            Text(entry.name, style = MaterialTheme.typography.headlineSmall)
            CompositionLocalProvider(LocalReferenceLinksEnabled provides false) {
                RichText(entry.quick, Modifier.fillMaxWidth(), 18f)
            }
            if (full) {
                CompositionLocalProvider(LocalReferenceLinksEnabled provides false) {
                    RichText(entry.definition, Modifier.fillMaxWidth(), 18f)
                    Text("Example", style = MaterialTheme.typography.titleMedium)
                    RichText(entry.example, Modifier.fillMaxWidth(), 18f)
                    Text("Watch for this", style = MaterialTheme.typography.titleMedium)
                    RichText(entry.confusion, Modifier.fillMaxWidth(), 18f)
                }
                TextButton(
                    onClick = {
                        controller.close()
                        model.openTeaching(entry.lesson, entry.section)
                    }
                ) {
                    Text("Read in lesson: ${entry.section}")
                }
                if (entry.related.isNotEmpty())
                    Text("Related entries", style = MaterialTheme.typography.titleMedium)
                for (id in entry.related) controller.library.entries
                    .find { it.id == id }
                    ?.let { related ->
                        TextButton(onClick = { controller.open("term:$id") }) { Text(related.name) }
                    }
            }
        } else if (target.startsWith("formula:")) {
            val formula =
                controller.library.formulas[target.removePrefix("formula:")] ?: return@Column
            CompositionLocalProvider(LocalReferenceLinksEnabled provides false) {
                RichText("$$${formula.getString("latex")}$$", Modifier.fillMaxWidth(), 20f)
            }
            Text(formula.getString("reading"), style = MaterialTheme.typography.bodyLarge)
            val bindings = formula.getJSONArray("bindings")
            for (i in 0 until bindings.length()) {
                val binding = bindings.getJSONObject(i)
                CompositionLocalProvider(LocalReferenceLinksEnabled provides false) {
                    RichText(
                        "$" + binding.getString("symbol") + "$ — " + binding.getString("meaning"),
                        Modifier.fillMaxWidth(),
                        17f,
                    )
                }
                TextButton(
                    onClick = {
                        controller.full = true
                        controller.open("term:${binding.getString("reference")}")
                    }
                ) {
                    Text("Full reference")
                }
            }
        }
        if (!full)
            TextButton(
                onClick = { controller.full = true },
                modifier = Modifier.testTag("full-reference"),
            ) {
                Text("Full explanation")
            }
    }
}

@Composable
internal fun QuickReference(model: NotebookModel, controller: ReferenceController) {
    val target = controller.target ?: return
    val position = controller.anchor
    Popup(
        popupPositionProvider =
            remember(position) {
                object : PopupPositionProvider {
                    override fun calculatePosition(
                        anchorBounds: IntRect,
                        windowSize: IntSize,
                        layoutDirection: LayoutDirection,
                        popupContentSize: IntSize,
                    ): IntOffset {
                        val x =
                            position.x.coerceIn(
                                12,
                                (windowSize.width - popupContentSize.width - 12).coerceAtLeast(12),
                            )
                        val below = position.y + 20
                        val y =
                            if (below + popupContentSize.height < windowSize.height - 12) below
                            else (position.y - popupContentSize.height - 20).coerceAtLeast(12)
                        return IntOffset(x, y)
                    }
                }
            },
        onDismissRequest = controller::close,
        properties = PopupProperties(focusable = true),
    ) {
        Surface(
            Modifier.width(420.dp).heightIn(max = 520.dp).testTag("quick-reference"),
            shape = MaterialTheme.shapes.large,
            shadowElevation = 12.dp,
        ) {
            Column(Modifier.padding(20.dp)) {
                val state = rememberLazyListState()
                LazyColumn(
                    state = state,
                    userScrollEnabled = false,
                    modifier = Modifier.weight(1f, fill = false).twoFingerScroll(state),
                ) {
                    item { ReferenceDetails(model, controller, target, false) }
                }
                TextButton(onClick = controller::close) { Text("Close") }
            }
        }
    }
}
