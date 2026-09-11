package dev.math.notebook

import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.lifecycle.viewmodel.compose.viewModel
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.launch

private val Forest = Color(0xff266655)
private val Ink = Color(0xff253a36)
private val Muted = Color(0xff738078)
private val Paper = Color(0xfffffef9)
private val Ground = Color(0xfff2f1eb)
private val Line = Color(0xffdde2d8)

class MainActivity : ComponentActivity() {
    private var updateRequest by mutableIntStateOf(0)

    private fun consumeUpdateIntent(incoming: android.content.Intent) {
        if (incoming.getBooleanExtra("showUpdates", false)) {
            updateRequest++
            incoming.removeExtra("showUpdates")
        }
    }

    override fun onNewIntent(intent: android.content.Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        consumeUpdateIntent(intent)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        consumeUpdateIntent(intent)
        Updates.schedule(this)
        enableEdgeToEdge(
            statusBarStyle =
                SystemBarStyle.light(
                    android.graphics.Color.TRANSPARENT,
                    android.graphics.Color.TRANSPARENT,
                ),
            navigationBarStyle =
                SystemBarStyle.light(
                    android.graphics.Color.TRANSPARENT,
                    android.graphics.Color.TRANSPARENT,
                ),
        )
        WindowCompat.getInsetsController(window, window.decorView).apply {
            systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            hide(WindowInsetsCompat.Type.systemBars())
        }
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        // Request the fastest display mode at the panel's native resolution.
        val mode =
            display
                ?.supportedModes
                ?.filter {
                    it.physicalWidth == display?.mode?.physicalWidth &&
                        it.physicalHeight == display?.mode?.physicalHeight
                }
                ?.maxByOrNull { it.refreshRate }
        if (mode != null)
            window.attributes = window.attributes.apply { preferredDisplayModeId = mode.modeId }
        setContent {
            MaterialTheme(
                colorScheme =
                    lightColorScheme(
                        primary = Forest,
                        background = Ground,
                        surface = Paper,
                        onSurface = Ink,
                        outline = Line,
                    )
            ) {
                Notebook(viewModel(), updateRequest)
            }
        }
    }
}

@Composable
private fun Notebook(model: NotebookModel, showUpdates: Int = 0) {
    var focusId by rememberSaveable { mutableStateOf<Int?>(null) }
    var library by rememberSaveable { mutableStateOf(false) }
    val portrait =
        LocalConfiguration.current.orientation ==
            android.content.res.Configuration.ORIENTATION_PORTRAIT
    BackHandler(model.practice || focusId != null) {
        if (focusId != null) focusId = null else model.mode(false)
    }
    Column(Modifier.fillMaxSize().background(Ground).windowInsetsPadding(WindowInsets.systemBars)) {
        Row(Modifier.weight(1f).fillMaxWidth()) {
            if (!portrait)
                Column(
                    Modifier.width(228.dp)
                        .fillMaxHeight()
                        .background(Color(0xffe9eee6))
                        .padding(22.dp, 28.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.AutoMirrored.Outlined.MenuBook,
                            null,
                            tint = Forest,
                            modifier = Modifier.size(28.dp),
                        )
                        Spacer(Modifier.width(10.dp))
                        Text(
                            "foundations",
                            fontSize = 24.sp,
                            fontFamily = FontFamily.Serif,
                            color = Ink,
                        )
                    }
                    Spacer(Modifier.height(38.dp))
                    Label("YOUR NOTEBOOK")
                    Spacer(Modifier.height(14.dp))
                    Text("Discrete mathematics", fontSize = 16.sp, fontWeight = FontWeight.Medium)
                    Text(
                        "15 lessons · a place to think",
                        fontSize = 12.sp,
                        color = Muted,
                        modifier = Modifier.padding(top = 6.dp),
                    )
                    Spacer(Modifier.height(22.dp))
                    val railState = rememberLazyListState()
                    LazyColumn(
                        state = railState,
                        userScrollEnabled = false,
                        modifier =
                            Modifier.weight(1f).twoFingerScroll { railState.dispatchRawDelta(it) },
                        verticalArrangement = Arrangement.spacedBy(5.dp),
                    ) {
                        itemsIndexed(model.lessons) { i, l ->
                            val selected = i == model.selected
                            Row(
                                Modifier.fillMaxWidth()
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(if (selected) Paper else Color.Transparent)
                                    .clickable {
                                        model.select(i)
                                        focusId = null
                                    }
                                    .padding(10.dp, 13.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Text(
                                    "%02d".format(i + 1),
                                    fontSize = 12.sp,
                                    color = if (selected) Forest else Muted,
                                    modifier = Modifier.width(28.dp),
                                )
                                Text(
                                    l.title,
                                    fontSize = 13.sp,
                                    lineHeight = 18.sp,
                                    fontWeight =
                                        if (selected) FontWeight.SemiBold else FontWeight.Normal,
                                    color = if (selected) Forest else Ink,
                                )
                            }
                        }
                    }
                    HorizontalDivider(color = Line, modifier = Modifier.padding(vertical = 18.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.Outlined.Gesture,
                            null,
                            tint = Forest,
                            modifier = Modifier.size(18.dp),
                        )
                        Spacer(Modifier.width(8.dp))
                        Text("Made for your S Pen", fontSize = 12.sp, color = Forest)
                    }
                    Text(
                        "Two fingers to scroll\nYour handwriting saves here",
                        fontSize = 11.sp,
                        lineHeight = 18.sp,
                        color = Muted,
                        modifier = Modifier.padding(top = 9.dp),
                    )
                }
            Column(Modifier.weight(1f).fillMaxHeight()) {
                Row(
                    Modifier.fillMaxWidth().height(82.dp).padding(horizontal = 32.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    if (portrait) {
                        IconButton(
                            onClick = { library = true },
                            modifier = Modifier.padding(end = 14.dp),
                        ) {
                            Icon(
                                Icons.AutoMirrored.Outlined.MenuBook,
                                "Choose chapter",
                                tint = Forest,
                            )
                        }
                    }
                    Column(Modifier.weight(1f)) {
                        Label("CHAPTER %02d / 15".format(model.selected + 1))
                        Text(
                            model.lesson.title,
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Medium,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.padding(top = 4.dp),
                        )
                    }
                    Row(
                        Modifier.clip(RoundedCornerShape(50))
                            .background(Color(0xffe6e9e1))
                            .padding(4.dp)
                    ) {
                        ModeButton(
                            "Read & write",
                            !model.practice && focusId == null,
                            Icons.AutoMirrored.Outlined.MenuBook,
                        ) {
                            model.mode(false)
                            focusId = null
                        }
                        ModeButton(
                            "Practice",
                            model.practice || focusId != null,
                            Icons.Outlined.EditNote,
                        ) {
                            model.mode(true)
                            focusId = null
                        }
                    }
                    UpdateButton(showUpdates, model.pendingSaves)
                }
                HorizontalDivider(color = Line)
                if (model.saveError != null)
                    Surface(color = Color(0xffffe8de)) {
                        Row(
                            Modifier.fillMaxWidth().padding(horizontal = 24.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(model.saveError!!, Modifier.weight(1f), fontSize = 13.sp)
                            TextButton(onClick = model::retrySaves) { Text("Retry saving") }
                        }
                    }
                key(model.lesson.slug) {
                    if (model.practice || focusId != null)
                        Practice(model, focusId, portrait) { focusId = null }
                    else Reader(model) { focusId = it }
                }
            }
            if (!portrait) Tools(model)
        }
        if (portrait) PortraitTools(model)
    }
    if (library)
        AlertDialog(
            onDismissRequest = { library = false },
            title = { Text("Your notebook", fontFamily = FontFamily.Serif) },
            text = {
                val state = rememberLazyListState(model.selected)
                LazyColumn(
                    state = state,
                    userScrollEnabled = false,
                    modifier =
                        Modifier.heightIn(max = 620.dp).twoFingerScroll {
                            state.dispatchRawDelta(it)
                        },
                ) {
                    itemsIndexed(model.lessons) { i, l ->
                        TextButton(
                            onClick = {
                                model.select(i)
                                focusId = null
                                library = false
                            },
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Text(
                                "%02d   %s".format(i + 1, l.title),
                                fontSize = 16.sp,
                                color = if (i == model.selected) Forest else Ink,
                                modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                            )
                        }
                    }
                }
            },
            confirmButton = { TextButton(onClick = { library = false }) { Text("Close") } },
        )
}

@Composable
private fun PortraitTools(model: NotebookModel) {
    HorizontalDivider(color = Line)
    Row(
        Modifier.fillMaxWidth().height(82.dp).background(Paper).padding(horizontal = 28.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Tool(Icons.Outlined.Edit, "Pen", !model.eraser) { model.eraser = false }
        Tool(Icons.AutoMirrored.Outlined.Backspace, "Stroke eraser", model.eraser) {
            model.eraser = true
        }
        VerticalDivider(Modifier.height(30.dp).padding(horizontal = 6.dp), color = Line)
        listOf(0xff253a43.toInt(), 0xff286f5d.toInt(), 0xff346fb0.toInt(), 0xffad534a.toInt())
            .forEach { color ->
                Box(
                    Modifier.size(44.dp)
                        .clip(CircleShape)
                        .border(
                            2.dp,
                            if (model.penColor == color && !model.eraser) Color(color)
                            else Color.Transparent,
                            CircleShape,
                        )
                        .clickable { model.color(color) },
                    contentAlignment = Alignment.Center,
                ) {
                    Box(Modifier.size(24.dp).background(Color(color), CircleShape))
                }
            }
        VerticalDivider(Modifier.height(30.dp).padding(horizontal = 6.dp), color = Line)
        listOf(1.4f, 2.4f, 4f).forEach { width ->
            Box(
                Modifier.size(46.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(
                        if (model.penWidth == width) Color(0xffe9f0e8) else Color.Transparent
                    )
                    .clickable { model.width(width) },
                contentAlignment = Alignment.Center,
            ) {
                Box(Modifier.width(23.dp).height(width.dp).background(Ink, CircleShape))
            }
        }
        Spacer(Modifier.weight(1f))
        Icon(Icons.Outlined.TouchApp, null, tint = Muted, modifier = Modifier.size(18.dp))
        Text("2 fingers to scroll", fontSize = 11.sp, color = Muted)
    }
}

@Composable
private fun Label(text: String) {
    Text(
        text,
        fontSize = 10.sp,
        letterSpacing = 1.7.sp,
        fontWeight = FontWeight.SemiBold,
        color = Muted,
    )
}

@Composable
private fun ModeButton(text: String, selected: Boolean, icon: ImageVector, onClick: () -> Unit) {
    Row(
        Modifier.clip(RoundedCornerShape(50))
            .background(if (selected) Paper else Color.Transparent)
            .clickable(onClick = onClick)
            .padding(18.dp, 10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(icon, null, Modifier.size(19.dp), tint = if (selected) Forest else Muted)
        Spacer(Modifier.width(8.dp))
        Text(
            text,
            fontSize = 13.sp,
            color = if (selected) Forest else Muted,
            fontWeight = FontWeight.Medium,
        )
    }
}

@Composable
private fun Tools(model: NotebookModel) {
    Column(
        Modifier.width(78.dp).fillMaxHeight().background(Paper).padding(vertical = 26.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Label("TOOLS")
        Spacer(Modifier.height(24.dp))
        Tool(Icons.Outlined.Edit, "Pen", !model.eraser) { model.eraser = false }
        Spacer(Modifier.height(8.dp))
        Tool(Icons.AutoMirrored.Outlined.Backspace, "Stroke eraser", model.eraser) {
            model.eraser = true
        }
        HorizontalDivider(Modifier.padding(18.dp), color = Line)
        listOf(0xff253a43.toInt(), 0xff286f5d.toInt(), 0xff346fb0.toInt(), 0xffad534a.toInt())
            .forEach { color ->
                Box(
                    Modifier.padding(vertical = 7.dp)
                        .size(42.dp)
                        .clip(CircleShape)
                        .border(
                            if (model.penColor == color && !model.eraser) 2.dp else 0.dp,
                            if (model.penColor == color && !model.eraser) Color(color)
                            else Color.Transparent,
                            CircleShape,
                        )
                        .clickable { model.color(color) },
                    contentAlignment = Alignment.Center,
                ) {
                    Box(Modifier.size(24.dp).background(Color(color), CircleShape))
                }
            }
        HorizontalDivider(Modifier.padding(18.dp), color = Line)
        listOf(1.4f, 2.4f, 4f).forEach { width ->
            Box(
                Modifier.padding(vertical = 3.dp)
                    .size(46.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(
                        if (model.penWidth == width) Color(0xffe9f0e8) else Color.Transparent
                    )
                    .clickable { model.width(width) },
                contentAlignment = Alignment.Center,
            ) {
                Box(Modifier.width(23.dp).height(width.dp).background(Ink, CircleShape))
            }
        }
        Spacer(Modifier.weight(1f))
        Icon(Icons.Outlined.TouchApp, null, tint = Muted, modifier = Modifier.size(21.dp))
        Text(
            "2 fingers\nto scroll",
            fontSize = 10.sp,
            lineHeight = 16.sp,
            color = Muted,
            modifier = Modifier.padding(top = 10.dp),
        )
    }
}

@Composable
private fun Tool(
    icon: ImageVector,
    label: String,
    selected: Boolean = false,
    enabled: Boolean = true,
    onClick: () -> Unit,
) {
    IconButton(
        onClick = onClick,
        enabled = enabled,
        modifier =
            Modifier.size(46.dp)
                .background(
                    if (selected) Color(0xffe0eddf) else Color.Transparent,
                    RoundedCornerShape(12.dp),
                ),
    ) {
        Icon(
            icon,
            label,
            tint = if (!enabled) Line else if (selected) Forest else Muted,
            modifier = Modifier.size(23.dp),
        )
    }
}

@Composable
private fun Reader(model: NotebookModel, onFocus: (Int) -> Unit) {
    val lesson = model.lesson
    val saved = remember { model.reading(lesson.slug) }
    val state = rememberLazyListState(saved.first, saved.second)
    val scope = rememberCoroutineScope()
    var outline by remember { mutableStateOf(false) }
    // Every content/ink item has a stable key and a place in the outline.
    val entries =
        remember(lesson.slug) {
            buildList<Pair<String, Any>> {
                add("intro" to lesson.intro)
                lesson.sections.forEachIndexed { i, s ->
                    add("section:$i" to s)
                    s.questionIds.forEach { id -> add("question:$id" to lesson.question(id)) }
                }
                add("end" to "end")
            }
        }
    LaunchedEffect(state) {
        snapshotFlow { state.firstVisibleItemIndex to state.firstVisibleItemScrollOffset }
            .distinctUntilChanged()
            .collect { model.reading(lesson.slug, it.first, it.second) }
    }
    Column(Modifier.fillMaxSize()) {
        Row(
            Modifier.fillMaxWidth().padding(30.dp, 12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                "LEARN AT YOUR OWN PACE",
                fontSize = 10.sp,
                letterSpacing = 1.8.sp,
                color = Muted,
                modifier = Modifier.weight(1f),
            )
            Box {
                TextButton(onClick = { outline = true }) {
                    Icon(Icons.AutoMirrored.Outlined.List, null, Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("On this page", fontSize = 12.sp)
                }
                if (outline)
                    AlertDialog(
                        onDismissRequest = { outline = false },
                        title = { Text("On this page") },
                        text = {
                            val outlineState = rememberLazyListState()
                            LazyColumn(
                                state = outlineState,
                                userScrollEnabled = false,
                                modifier =
                                    Modifier.height(440.dp).twoFingerScroll {
                                        outlineState.dispatchRawDelta(it)
                                    },
                            ) {
                                itemsIndexed(lesson.sections) { i, s ->
                                    TextButton(
                                        onClick = {
                                            outline = false
                                            scope.launch {
                                                state.scrollToItem(
                                                    entries.indexOfFirst {
                                                        it.first == "section:$i"
                                                    }
                                                )
                                            }
                                        }
                                    ) {
                                        Text(
                                            s.title,
                                            fontSize = 14.sp,
                                            modifier = Modifier.fillMaxWidth(),
                                        )
                                    }
                                }
                            }
                        },
                        confirmButton = {
                            TextButton(onClick = { outline = false }) { Text("Close") }
                        },
                    )
            }
        }
        LazyColumn(
            state = state,
            userScrollEnabled = false,
            modifier =
                Modifier.weight(1f).fillMaxWidth().testTag("reader").twoFingerScroll {
                    state.dispatchRawDelta(it)
                },
            contentPadding = PaddingValues(bottom = 60.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(26.dp),
        ) {
            itemsIndexed(entries, key = { _, entry -> entry.first }) { _, entry ->
                Box(Modifier.widthIn(max = 960.dp).fillMaxWidth().padding(horizontal = 28.dp)) {
                    when (val value = entry.second) {
                        is Section ->
                            Column(
                                Modifier.fillMaxWidth()
                                    .background(Paper, RoundedCornerShape(16.dp))
                                    .padding(38.dp, 32.dp)
                            ) {
                                Text(
                                    value.title,
                                    fontFamily = FontFamily.Serif,
                                    fontSize = 30.sp,
                                    lineHeight = 37.sp,
                                    color = Ink,
                                )
                                Spacer(Modifier.height(22.dp))
                                RichText(value.markdown, Modifier.fillMaxWidth())
                            }
                        is Question -> QuestionCard(model, value, onFocus)
                        else ->
                            if (entry.first == "intro")
                                Column(Modifier.fillMaxWidth().padding(12.dp, 14.dp)) {
                                    Text(
                                        lesson.eyebrow.uppercase(),
                                        fontSize = 11.sp,
                                        letterSpacing = 2.sp,
                                        color = Forest,
                                        fontWeight = FontWeight.SemiBold,
                                    )
                                    Text(
                                        lesson.title,
                                        fontFamily = FontFamily.Serif,
                                        fontSize = 46.sp,
                                        lineHeight = 53.sp,
                                        color = Ink,
                                        modifier = Modifier.padding(top = 14.dp, bottom = 20.dp),
                                    )
                                    RichText(lesson.intro, Modifier.fillMaxWidth(), 18f)
                                    Row(
                                        Modifier.padding(top = 23.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                    ) {
                                        Icon(
                                            Icons.Outlined.Draw,
                                            null,
                                            Modifier.size(18.dp),
                                            tint = Forest,
                                        )
                                        Spacer(Modifier.width(9.dp))
                                        Text(
                                            "Read a little. Try it by hand. Keep going.",
                                            fontSize = 13.sp,
                                            color = Forest,
                                        )
                                    }
                                }
                            else
                                Column(
                                    Modifier.fillMaxWidth()
                                        .background(Color(0xffe4eddf), RoundedCornerShape(16.dp))
                                        .padding(32.dp)
                                ) {
                                    Text(
                                        "Make it your own.",
                                        fontFamily = FontFamily.Serif,
                                        fontSize = 30.sp,
                                    )
                                    Text(
                                        "${lesson.practiceIds.size} more problems, with room to work through each one.",
                                        modifier = Modifier.padding(vertical = 14.dp),
                                        color = Muted,
                                    )
                                    Button(onClick = { model.mode(true) }) {
                                        Text("Open practice")
                                        Spacer(Modifier.width(10.dp))
                                        Icon(Icons.AutoMirrored.Outlined.ArrowForward, null)
                                    }
                                }
                    }
                }
            }
        }
    }
}

@Composable
private fun QuestionCard(model: NotebookModel, q: Question, onFocus: (Int) -> Unit) {
    val page = remember(q.id, model.lesson.slug) { model.page("${model.lesson.slug}-${q.id}") }
    Column(
        Modifier.fillMaxWidth()
            .border(1.dp, Color(0xffcbdac9), RoundedCornerShape(16.dp))
            .clip(RoundedCornerShape(16.dp))
            .background(Paper)
    ) {
        Row(
            Modifier.fillMaxWidth().background(Color(0xffedf3e8)).padding(26.dp, 13.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(Icons.Outlined.EditNote, null, tint = Forest, modifier = Modifier.size(23.dp))
            Spacer(Modifier.width(10.dp))
            Text(
                "TRY IT HERE",
                fontSize = 10.sp,
                letterSpacing = 1.7.sp,
                fontWeight = FontWeight.SemiBold,
                color = Forest,
                modifier = Modifier.weight(1f),
            )
            Text("Exercise ${q.id}", fontSize = 12.sp, color = Muted)
            IconButton(
                onClick = { onFocus(q.id) },
                modifier = Modifier.padding(start = 10.dp).size(36.dp),
            ) {
                Icon(
                    Icons.Outlined.OpenInFull,
                    "Open full writing workspace",
                    Modifier.size(19.dp),
                    tint = Forest,
                )
            }
        }
        Column(Modifier.padding(26.dp, 22.dp)) { Prompt(q, compact = true) }
        PaperCanvas(model, page, q)
        Row(
            Modifier.fillMaxWidth().padding(16.dp, 6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            InkActions(page)
            Spacer(Modifier.weight(1f))
            TextButton(onClick = page::moreSpace) {
                Icon(Icons.Outlined.Add, null, Modifier.size(17.dp))
                Text("More space", fontSize = 12.sp)
            }
        }
        Answer(q, Modifier.padding(26.dp, 0.dp, 26.dp, 20.dp))
    }
}

@Composable
private fun Prompt(q: Question, compact: Boolean = false) {
    if (q.instructions.isNotBlank()) {
        RichText(q.instructions, Modifier.fillMaxWidth(), if (compact) 14f else 15f)
        Spacer(Modifier.height(16.dp))
    }
    RichText(q.prompt, Modifier.fillMaxWidth(), if (compact) 19f else 21f)
    if (q.math.isNotBlank()) {
        Spacer(Modifier.height(14.dp))
        RichText("$$\n${q.math}\n$$", Modifier.fillMaxWidth(), 22f)
    }
    if (q.columns.isNotEmpty()) {
        Spacer(Modifier.height(12.dp))
        Text(
            "Complete the table in the writing space. Use T before F in lexicographic row order.",
            fontSize = 12.sp,
            color = Muted,
            lineHeight = 19.sp,
        )
    }
}

@Composable
private fun PaperCanvas(
    model: NotebookModel,
    page: InkPage,
    q: Question,
    minimumHeight: androidx.compose.ui.unit.Dp = 0.dp,
) {
    Column {
        if (q.columns.isNotEmpty())
            Row(Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 12.dp)) {
                q.columns.forEach { col ->
                    Box(Modifier.weight(1f), contentAlignment = Alignment.Center) {
                        RichText("$$$col$$", size = 15f)
                    }
                }
            }
        BoxWithConstraints(Modifier.fillMaxWidth()) {
            LaunchedEffect(minimumHeight, maxWidth, page.loading) {
                if (!page.loading && maxWidth.value > 0)
                    page.ensureHeight(minimumHeight.value * 900f / maxWidth.value)
            }
            val height = maxWidth * (page.height / 900f)
            Box(Modifier.fillMaxWidth().height(height).border(1.dp, Line)) {
                if (!page.loading)
                    AndroidView(
                        factory = { context ->
                            InkCanvas(context, page, model, q.columns.size, q.rows)
                        },
                        modifier = Modifier.fillMaxSize().testTag("ink:${page.key}"),
                        update = {
                            page.strokes
                            it.refresh()
                        },
                    )
                if (page.loading)
                    Text(
                        if (page.error == null) "Opening your writing space…" else page.error!!,
                        Modifier.align(Alignment.Center),
                        color = Muted,
                    )
                else if (page.strokes.isEmpty())
                    Text(
                        "Your S Pen goes here",
                        Modifier.align(Alignment.BottomEnd).padding(20.dp),
                        fontFamily = FontFamily.Serif,
                        fontSize = 16.sp,
                        color = Color(0xffa4ada3),
                    )
            }
        }
    }
}

@Composable
private fun InkActions(page: InkPage) {
    Tool(Icons.AutoMirrored.Outlined.Undo, "Undo", enabled = page.canUndo, onClick = page::undo)
    Tool(Icons.AutoMirrored.Outlined.Redo, "Redo", enabled = page.canRedo, onClick = page::redo)
    var clear by remember { mutableStateOf(false) }
    Tool(Icons.Outlined.DeleteOutline, "Clear writing", enabled = page.strokes.isNotEmpty()) {
        clear = true
    }
    Text(
        if (page.loading) "Loading"
        else if (page.error != null) "Save failed"
        else if (page.saving) "Saving…" else "Saved on tablet",
        fontSize = 11.sp,
        color = if (page.error != null) Color(0xffb04c39) else Muted,
        modifier = Modifier.padding(start = 8.dp),
    )
    if (clear)
        AlertDialog(
            onDismissRequest = { clear = false },
            title = { Text("Clear this writing space?") },
            text = { Text("You can restore it with Undo while this notebook stays open.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        page.replace(emptyList())
                        clear = false
                    }
                ) {
                    Text("Clear writing")
                }
            },
            dismissButton = { TextButton(onClick = { clear = false }) { Text("Keep it") } },
        )
}

@Composable
private fun Answer(q: Question, modifier: Modifier = Modifier) {
    var revealed by rememberSaveable(q.id) { mutableStateOf(false) }
    Column(modifier) {
        OutlinedButton(onClick = { revealed = !revealed }) {
            Icon(
                if (revealed) Icons.Outlined.VisibilityOff else Icons.Outlined.Visibility,
                null,
                Modifier.size(18.dp),
            )
            Spacer(Modifier.width(9.dp))
            Text(if (revealed) "Hide answer" else "Reveal answer", fontSize = 13.sp)
        }
        if (revealed)
            Column(
                Modifier.fillMaxWidth()
                    .padding(top = 14.dp)
                    .background(Color(0xffedf3e8), RoundedCornerShape(10.dp))
                    .padding(20.dp)
            ) {
                Label("ANSWER")
                Spacer(Modifier.height(12.dp))
                RichText(q.answer, Modifier.fillMaxWidth(), 17f)
            }
    }
}

@Composable
private fun Practice(
    model: NotebookModel,
    focusId: Int?,
    portrait: Boolean,
    exitFocus: () -> Unit,
) {
    val lesson = model.lesson
    var index by
        rememberSaveable(lesson.slug) {
            mutableIntStateOf(model.position(lesson.slug).coerceIn(0, lesson.practiceIds.lastIndex))
        }
    var picker by remember { mutableStateOf(false) }
    val q = lesson.question(focusId ?: lesson.practiceIds[index])
    Column(Modifier.fillMaxSize().padding(26.dp, 20.dp)) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Label(if (focusId == null) "ONE PROBLEM. ROOM TO THINK." else "FROM YOUR LESSON")
                Text(
                    q.section,
                    fontSize = 18.sp,
                    fontFamily = FontFamily.Serif,
                    modifier = Modifier.padding(top = 6.dp),
                )
            }
            if (focusId != null)
                TextButton(onClick = exitFocus) {
                    Icon(Icons.AutoMirrored.Outlined.ArrowBack, null, Modifier.size(18.dp))
                    Text("Back to reading")
                }
            else
                OutlinedButton(onClick = { picker = true }) {
                    Icon(Icons.Outlined.GridView, null, Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("${index+1} / ${lesson.practiceIds.size}")
                }
        }
        Spacer(Modifier.height(22.dp))
        key(q.id) {
            val page = remember { model.page("${lesson.slug}-${q.id}") }
            PracticePanels(
                portrait,
                Modifier.weight(1f),
                prompt = { paneModifier -> PracticePrompt(q, paneModifier) },
                writing = { paneModifier ->
                    Column(
                        paneModifier
                            .clip(RoundedCornerShape(16.dp))
                            .background(Paper)
                            .border(1.dp, Line, RoundedCornerShape(16.dp))
                    ) {
                        Row(
                            Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 5.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            InkActions(page)
                            Spacer(Modifier.weight(1f))
                            TextButton(onClick = page::moreSpace) {
                                Icon(Icons.Outlined.Add, null, Modifier.size(17.dp))
                                Text("More space", fontSize = 12.sp)
                            }
                        }
                        HorizontalDivider(color = Line)
                        val writingState = rememberLazyListState()
                        BoxWithConstraints(Modifier.weight(1f)) {
                            val minimumHeight = maxHeight
                            LazyColumn(
                                state = writingState,
                                userScrollEnabled = false,
                                modifier =
                                    Modifier.fillMaxSize().twoFingerScroll {
                                        writingState.dispatchRawDelta(it)
                                    },
                            ) {
                                item { PaperCanvas(model, page, q, minimumHeight) }
                            }
                        }
                    }
                },
            )
        }
        Row(
            Modifier.fillMaxWidth().padding(top = 18.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                "No score. No timer. Just you and the idea.",
                fontSize = 12.sp,
                color = Muted,
                modifier = Modifier.weight(1f),
            )
            if (focusId == null) {
                OutlinedButton(
                    onClick = {
                        index--
                        model.position(lesson.slug, index)
                    },
                    enabled = index > 0,
                ) {
                    Icon(Icons.AutoMirrored.Outlined.ArrowBack, null, Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Previous")
                }
                Spacer(Modifier.width(12.dp))
                Button(
                    onClick = {
                        index++
                        model.position(lesson.slug, index)
                    },
                    enabled = index < lesson.practiceIds.lastIndex,
                ) {
                    Text("Next problem")
                    Spacer(Modifier.width(12.dp))
                    Icon(Icons.AutoMirrored.Outlined.ArrowForward, null, Modifier.size(18.dp))
                }
            }
        }
    }
    if (picker)
        AlertDialog(
            onDismissRequest = { picker = false },
            title = { Text("Choose a practice problem") },
            text = {
                val state = rememberLazyListState()
                LazyColumn(
                    state = state,
                    userScrollEnabled = false,
                    modifier =
                        Modifier.height(440.dp).twoFingerScroll { state.dispatchRawDelta(it) },
                ) {
                    itemsIndexed(lesson.practiceIds) { i, id ->
                        val question = lesson.question(id)
                        TextButton(
                            onClick = {
                                index = i
                                model.position(lesson.slug, i)
                                picker = false
                            },
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Text(
                                "${i+1}.  Exercise $id · ${question.section}",
                                fontSize = 13.sp,
                                modifier = Modifier.fillMaxWidth(),
                                color = if (i == index) Forest else Ink,
                            )
                        }
                    }
                }
            },
            confirmButton = { TextButton(onClick = { picker = false }) { Text("Close") } },
        )
}

@Composable
private fun PracticePrompt(q: Question, modifier: Modifier) {
    var revealed by rememberSaveable(q.id) { mutableStateOf(false) }
    val state = rememberLazyListState()
    val scope = rememberCoroutineScope()
    Column(modifier.clip(RoundedCornerShape(16.dp)).background(Paper)) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Label("EXERCISE ${q.id}")
            Spacer(Modifier.weight(1f))
            TextButton(
                onClick = {
                    revealed = !revealed
                    scope.launch { state.scrollToItem(0) }
                }
            ) {
                Text(if (revealed) "Hide answer" else "Reveal answer", fontSize = 12.sp)
            }
        }
        HorizontalDivider(color = Line)
        LazyColumn(
            state = state,
            userScrollEnabled = false,
            modifier = Modifier.weight(1f).twoFingerScroll { state.dispatchRawDelta(it) },
            contentPadding = PaddingValues(24.dp),
        ) {
            item {
                if (revealed) {
                    Label("ANSWER")
                    Spacer(Modifier.height(14.dp))
                    RichText(q.answer, Modifier.fillMaxWidth(), 19f)
                    HorizontalDivider(Modifier.padding(vertical = 24.dp), color = Line)
                }
                Prompt(q)
            }
        }
    }
}

@Composable
private fun PracticePanels(
    portrait: Boolean,
    modifier: Modifier,
    prompt: @Composable (Modifier) -> Unit,
    writing: @Composable (Modifier) -> Unit,
) {
    if (portrait)
        Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(22.dp)) {
            prompt(Modifier.fillMaxWidth().height(300.dp))
            writing(Modifier.fillMaxWidth().weight(1f))
        }
    else
        Row(modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(22.dp)) {
            prompt(Modifier.width(300.dp).fillMaxHeight())
            writing(Modifier.weight(1f).fillMaxHeight())
        }
}
