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
    private var inputPreferences: InputPreferences? = null

    override fun dispatchTouchEvent(event: android.view.MotionEvent): Boolean {
        inputPreferences?.observe(event)
        return super.dispatchTouchEvent(event)
    }

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
                typography =
                    Typography(
                        headlineSmall =
                            androidx.compose.ui.text.TextStyle(
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Medium,
                            ),
                        bodyLarge =
                            androidx.compose.ui.text.TextStyle(
                                fontSize = 14.sp,
                                lineHeight = 20.sp,
                            ),
                        bodyMedium =
                            androidx.compose.ui.text.TextStyle(
                                fontSize = 13.sp,
                                lineHeight = 19.sp,
                            ),
                        bodySmall =
                            androidx.compose.ui.text.TextStyle(
                                fontSize = 11.sp,
                                lineHeight = 16.sp,
                            ),
                        labelLarge = androidx.compose.ui.text.TextStyle(fontSize = 12.sp),
                        titleLarge =
                            androidx.compose.ui.text.TextStyle(
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Medium,
                            ),
                        titleMedium =
                            androidx.compose.ui.text.TextStyle(
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Medium,
                            ),
                        titleSmall =
                            androidx.compose.ui.text.TextStyle(
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Medium,
                            ),
                    ),
                shapes =
                    Shapes(
                        small = RoundedCornerShape(4.dp),
                        medium = RoundedCornerShape(6.dp),
                        large = RoundedCornerShape(8.dp),
                        extraLarge = RoundedCornerShape(10.dp),
                    ),
                colorScheme =
                    lightColorScheme(
                        primary = Forest,
                        secondary = Forest,
                        secondaryContainer = Color(0xffe0ebe2),
                        onSecondaryContainer = Forest,
                        background = Ground,
                        surface = Paper,
                        surfaceContainerHigh = Color(0xfff2f5ef),
                        surfaceContainer = Color(0xffeef2eb),
                        surfaceVariant = Color(0xfff0f1ec),
                        onSurfaceVariant = Color(0xff536057),
                        onSurface = Ink,
                        outline = Line,
                    ),
            ) {
                val model: NotebookModel = viewModel()
                inputPreferences = model.input
                CompositionLocalProvider(
                    LocalMinimumInteractiveComponentSize provides
                        if (LocalConfiguration.current.screenWidthDp >= 600) 32.dp else 40.dp
                ) {
                    Notebook(model, updateRequest)
                }
            }
        }
    }
}

@Composable
private fun Notebook(model: NotebookModel, showUpdates: Int = 0) {
    val controller = model.references
    DisposableEffect(model.input) {
        model.input.start()
        onDispose { model.input.stop() }
    }
    val config = LocalConfiguration.current
    val compact = config.screenWidthDp < 600 || config.screenHeightDp < 480
    val portrait =
        compact ||
            config.screenWidthDp < 840 ||
            config.orientation == android.content.res.Configuration.ORIENTATION_PORTRAIT
    CompositionLocalProvider(
        LocalReferences provides controller,
        LocalReferenceLesson provides model.lesson.slug,
    ) {
        BackHandler(controller.full || controller.target != null) { controller.back() }
        Row(Modifier.fillMaxSize().imePadding()) {
            if (controller.standalone) ReferencePanel(model, controller, Modifier.fillMaxSize())
            else {
                Box(Modifier.weight(1f)) { NotebookLayout(model, showUpdates) }
                if (controller.full && !portrait)
                    ReferencePanel(model, controller, Modifier.width(420.dp).fillMaxHeight())
            }
        }
        if (controller.full && portrait && !controller.standalone) {
            androidx.compose.ui.window.Dialog(
                onDismissRequest = controller::close,
                properties =
                    androidx.compose.ui.window.DialogProperties(usePlatformDefaultWidth = false),
            ) {
                ReferencePanel(
                    model,
                    controller,
                    if (compact) Modifier.fillMaxSize().systemBarsPadding().imePadding()
                    else Modifier.fillMaxWidth(0.9f).fillMaxHeight(0.86f),
                )
            }
        } else if (!controller.full && controller.target != null) QuickReference(model, controller)
        FocusedAnswerEditor(model)
    }
}

@Composable
private fun NotebookLayout(model: NotebookModel, showUpdates: Int = 0) {
    var focusId by rememberSaveable { mutableStateOf<Int?>(null) }
    LaunchedEffect(model.answerFocus) {
        model.answerFocus?.let {
            focusId = it
            model.mode(false)
            model.answerFocus = null
        }
    }
    var library by rememberSaveable { mutableStateOf(false) }
    val config = LocalConfiguration.current
    val editingOnCompact =
        (config.screenWidthDp < 600 || config.screenHeightDp < 480) &&
            WindowInsets.ime.getBottom(androidx.compose.ui.platform.LocalDensity.current) > 0
    val compact = config.screenWidthDp < 600 || config.screenHeightDp < 480
    val portrait =
        compact ||
            config.screenWidthDp < 840 ||
            config.orientation == android.content.res.Configuration.ORIENTATION_PORTRAIT
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
                        .padding(16.dp, 18.dp)
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
                            fontSize = 20.sp,
                            fontFamily = FontFamily.Serif,
                            color = Ink,
                        )
                    }
                    Spacer(Modifier.height(20.dp))
                    Label("YOUR NOTEBOOK")
                    Spacer(Modifier.height(8.dp))
                    Text("Discrete mathematics", fontSize = 16.sp, fontWeight = FontWeight.Medium)
                    Text(
                        "15 lessons · a place to think",
                        fontSize = 12.sp,
                        color = Muted,
                        modifier = Modifier.padding(top = 6.dp),
                    )
                    Spacer(Modifier.height(8.dp))
                    val railState = rememberLazyListState()
                    LazyColumn(
                        state = railState,
                        userScrollEnabled = true,
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(5.dp),
                    ) {
                        itemsIndexed(model.lessons) { i, l ->
                            val selected = i == model.selected
                            Row(
                                Modifier.fillMaxWidth()
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(Color.Transparent)
                                    .clickable {
                                        model.select(i)
                                        focusId = null
                                    }
                                    .padding(8.dp, 8.dp),
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
                }
            Column(Modifier.weight(1f).fillMaxHeight()) {
                if (editingOnCompact) {} else if (config.screenHeightDp < 480) {
                    Row(
                        Modifier.fillMaxWidth().padding(horizontal = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        IconButton(onClick = { library = true }) {
                            Icon(Icons.AutoMirrored.Outlined.MenuBook, "Choose chapter")
                        }
                        Text(
                            model.lesson.title,
                            Modifier.weight(1f),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            fontSize = 14.sp,
                        )
                        TextButton(
                            onClick = {
                                model.mode(false)
                                focusId = null
                            }
                        ) {
                            Text("Read")
                        }
                        TextButton(
                            onClick = {
                                model.mode(true)
                                focusId = null
                            }
                        ) {
                            Text("Practice")
                        }
                        TextButton(
                            onClick = model.references::browse,
                            modifier = Modifier.testTag("open-reference"),
                        ) {
                            Text("Reference")
                        }
                        InputSettingsButton(model.input)
                        UpdateButton(showUpdates, model.pendingSaves)
                    }
                } else if (compact) {
                    Column(Modifier.fillMaxWidth().padding(horizontal = 8.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            IconButton(onClick = { library = true }) {
                                Icon(Icons.AutoMirrored.Outlined.MenuBook, "Choose chapter")
                            }
                            Text(
                                model.lesson.title,
                                Modifier.weight(1f),
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                            )
                            InputSettingsButton(model.input)
                            UpdateButton(showUpdates, model.pendingSaves)
                        }
                        Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState())) {
                            TextButton(
                                onClick = {
                                    model.mode(false)
                                    focusId = null
                                }
                            ) {
                                Text("Read")
                            }
                            TextButton(
                                onClick = {
                                    model.mode(true)
                                    focusId = null
                                }
                            ) {
                                Text("Practice")
                            }
                            TextButton(
                                onClick = model.references::browse,
                                modifier = Modifier.testTag("open-reference"),
                            ) {
                                Text("Reference")
                            }
                        }
                    }
                } else
                    Row(
                        Modifier.fillMaxWidth().height(48.dp).padding(horizontal = 20.dp),
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
                                .background(Color.Transparent)
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
                        TextButton(
                            onClick = model.references::browse,
                            modifier = Modifier.testTag("open-reference"),
                        ) {
                            Text("Reference")
                        }
                        InputSettingsButton(model.input)
                        UpdateButton(showUpdates, model.pendingSaves)
                    }
                HorizontalDivider(color = Line)
                if (model.saveError != null || model.answers.error != null)
                    Surface(color = Color(0xffffe8de)) {
                        Row(
                            Modifier.fillMaxWidth().padding(horizontal = 24.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                (model.saveError ?: model.answers.error)!!,
                                Modifier.weight(1f),
                                fontSize = 13.sp,
                            )
                            TextButton(onClick = model::retrySaves) { Text("Retry saving") }
                        }
                    }
                key(model.lesson.slug) {
                    if (model.practice || focusId != null)
                        Practice(model, focusId, portrait) { focusId = null }
                    else Reader(model) { focusId = it }
                }
            }
        }
        if (!editingOnCompact && !model.practice && focusId == null)
            Row(
                Modifier.fillMaxWidth()
                    .height(if (compact) 40.dp else 32.dp)
                    .padding(horizontal = 12.dp),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                ScrollPreference(model.input, true)
            }
    }
    if (library)
        AlertDialog(
            onDismissRequest = { library = false },
            title = { Text("Chapters") },
            text = {
                val state = rememberLazyListState(model.selected)
                LazyColumn(
                    state = state,
                    userScrollEnabled = true,
                    modifier = Modifier.heightIn(max = 620.dp),
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
                                fontSize = 14.sp,
                                color = if (i == model.selected) Forest else Ink,
                                modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp),
                            )
                        }
                    }
                }
            },
            confirmButton = { TextButton(onClick = { library = false }) { Text("Close") } },
        )
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
            .background(Color.Transparent)
            .clickable(onClick = onClick)
            .padding(10.dp, 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text,
            fontSize = 13.sp,
            color = if (selected) Forest else Muted,
            fontWeight = FontWeight.Medium,
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
            Modifier.size(32.dp)
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
                    add("section:${s.id}" to s)
                    s.quickChecks.forEach { check -> add("quick:${check.id}" to check) }
                    s.questionIds.forEach { id -> add("question:$id" to lesson.question(id)) }
                }
                add("end" to "end")
            }
        }
    LaunchedEffect(model.teachingJump) {
        val jump = model.teachingJump ?: return@LaunchedEffect
        val section = jump.second
        val index =
            if (section == "Introduction") 0
            else entries.indexOfFirst { (it.second as? Section)?.title == section }
        if (index >= 0) state.scrollToItem(index)
        model.consumeTeachingJump(jump)
    }
    LaunchedEffect(state) {
        snapshotFlow { state.firstVisibleItemIndex to state.firstVisibleItemScrollOffset }
            .distinctUntilChanged()
            .collect { model.reading(lesson.slug, it.first, it.second) }
    }
    Column(Modifier.fillMaxSize()) {
        Row(
            Modifier.fillMaxWidth().padding(20.dp, 2.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Spacer(Modifier.weight(1f))
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
                                userScrollEnabled = true,
                                modifier = Modifier.height(440.dp),
                            ) {
                                itemsIndexed(lesson.sections) { i, s ->
                                    TextButton(
                                        onClick = {
                                            outline = false
                                            scope.launch {
                                                state.scrollToItem(
                                                    entries.indexOfFirst {
                                                        it.first == "section:${s.id}"
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
            userScrollEnabled = !model.input.twoFinger,
            modifier =
                Modifier.weight(1f)
                    .fillMaxWidth()
                    .testTag("reader")
                    .then(if (model.input.twoFinger) Modifier.twoFingerScroll(state) else Modifier),
            contentPadding = PaddingValues(bottom = 60.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(18.dp),
        ) {
            itemsIndexed(entries, key = { _, entry -> entry.first }) { _, entry ->
                Box(
                    Modifier.widthIn(max = 840.dp)
                        .fillMaxWidth()
                        .padding(
                            horizontal =
                                if (
                                    LocalConfiguration.current.screenWidthDp < 600 ||
                                        LocalConfiguration.current.screenHeightDp < 480
                                )
                                    12.dp
                                else 28.dp
                        )
                ) {
                    when (val value = entry.second) {
                        is Section ->
                            Column(
                                Modifier.fillMaxWidth()
                                    .background(Paper, RoundedCornerShape(16.dp))
                                    .padding(
                                        if (
                                            LocalConfiguration.current.screenWidthDp < 600 ||
                                                LocalConfiguration.current.screenHeightDp < 480
                                        )
                                            16.dp
                                        else 26.dp,
                                        24.dp,
                                    )
                            ) {
                                Text(
                                    value.title,
                                    fontFamily = FontFamily.Serif,
                                    fontSize = 24.sp,
                                    lineHeight = 30.sp,
                                    color = Ink,
                                )
                                Spacer(Modifier.height(8.dp))
                                if (value.blocks != null)
                                    TeachingBlocks(
                                        value.blocks,
                                        Modifier.fillMaxWidth(),
                                        source = "section:${value.id}",
                                    )
                                else RichText(value.markdown, Modifier.fillMaxWidth())
                                TypingBlock(model, value.id)
                            }
                        is Question -> QuestionCard(model, value, onFocus)
                        is QuickCheck -> QuickCheckCard(value, "${lesson.slug}:${value.id}")
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
                                        fontSize =
                                            if (LocalConfiguration.current.screenWidthDp < 600)
                                                32.sp
                                            else 34.sp,
                                        lineHeight =
                                            if (LocalConfiguration.current.screenWidthDp < 600)
                                                39.sp
                                            else 41.sp,
                                        color = Ink,
                                        modifier = Modifier.padding(top = 14.dp, bottom = 20.dp),
                                    )
                                    if (lesson.introBlocks != null)
                                        TeachingBlocks(
                                            lesson.introBlocks,
                                            Modifier.fillMaxWidth(),
                                            source = "intro",
                                        )
                                    else RichText(lesson.intro, Modifier.fillMaxWidth(), 16f)
                                    TypingGuide(model)
                                }
                            else
                                Row(
                                    Modifier.fillMaxWidth().padding(vertical = 12.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    Text(
                                        "${lesson.practiceIds.size} more practice problems",
                                        Modifier.weight(1f),
                                        color = Muted,
                                        fontSize = 13.sp,
                                    )
                                    WorkspaceAction(
                                        "Open practice",
                                        Icons.AutoMirrored.Outlined.ArrowForward,
                                    ) {
                                        model.mode(true)
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
            .border(1.dp, Line, RoundedCornerShape(6.dp))
            .clip(RoundedCornerShape(6.dp))
            .background(Paper)
    ) {
        Text(
            "Exercise ${q.id}",
            Modifier.padding(start = 16.dp, top = 10.dp, bottom = 4.dp),
            fontSize = 11.sp,
            color = Muted,
        )
        Column(Modifier.padding(horizontal = 16.dp, vertical = 4.dp)) { Prompt(q, compact = true) }
        ExerciseInput(model, q)
        Answer(q, Modifier.padding(start = 10.dp, end = 16.dp, bottom = 6.dp))
    }
}

@Composable
internal fun Prompt(q: Question, compact: Boolean = false) {
    if (q.instructions.isNotBlank()) {
        RichText(
            q.instructions,
            Modifier.fillMaxWidth(),
            if (compact) 14f else 15f,
            source = "question:${q.id}:instructions",
        )
        Spacer(Modifier.height(8.dp))
    }
    RichText(
        q.prompt,
        Modifier.fillMaxWidth(),
        if (compact) 16f else 17f,
        source = "question:${q.id}:prompt",
    )
    if (q.math.isNotBlank()) {
        Spacer(Modifier.height(8.dp))
        RichText(
            "$$\n${q.math}\n$$",
            Modifier.fillMaxWidth(),
            18f,
            source = "question:${q.id}:math",
        )
    }
}

@Composable
internal fun PaperCanvas(
    model: NotebookModel,
    page: InkPage,
    q: Question,
    minimumHeight: androidx.compose.ui.unit.Dp = 0.dp,
    fingerDrawing: Boolean = false,
    penEnabled: Boolean = true,
) {
    Column {
        if (q.columns.isNotEmpty())
            Row(Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 12.dp)) {
                q.columns.forEachIndexed { index, col ->
                    Box(Modifier.weight(1f), contentAlignment = Alignment.Center) {
                        RichText("$$$col$$", size = 15f, source = "question:${q.id}:column:$index")
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
                            InkCanvas(context, page, model, q.columns.size, q.rows).apply {
                                this.fingerDrawing = fingerDrawing
                                inputEnabled = penEnabled
                            }
                        },
                        modifier = Modifier.fillMaxSize().testTag("ink:${page.key}"),
                        update = {
                            page.strokes
                            it.fingerDrawing = fingerDrawing
                            it.inputEnabled = penEnabled
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
                        if (fingerDrawing) "Write here"
                        else if (penEnabled) "" else "Saved handwriting",
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
internal fun InkActions(page: InkPage) {
    QuietIcon(
        Icons.AutoMirrored.Outlined.Undo,
        "Undo",
        enabled = page.canUndo,
        onClick = page::undo,
    )
    QuietIcon(
        Icons.AutoMirrored.Outlined.Redo,
        "Redo",
        enabled = page.canRedo,
        onClick = page::redo,
    )
    var clear by remember { mutableStateOf(false) }
    QuietIcon(Icons.Outlined.DeleteOutline, "Clear writing", enabled = page.strokes.isNotEmpty()) {
        clear = true
    }
    if (page.error != null)
        Text("Save failed", fontSize = 11.sp, color = MaterialTheme.colorScheme.error)
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
        TextButton(
            onClick = { revealed = !revealed },
            contentPadding = PaddingValues(horizontal = 6.dp, vertical = 2.dp),
        ) {
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
                RichText(q.answer, Modifier.fillMaxWidth(), 16f, source = "question:${q.id}:answer")
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
    val config = LocalConfiguration.current
    val keyboardVisible =
        WindowInsets.ime.getBottom(androidx.compose.ui.platform.LocalDensity.current) > 0
    val compact = config.screenWidthDp < 600 || config.screenHeightDp < 480
    var index by
        rememberSaveable(lesson.slug) {
            mutableIntStateOf(model.position(lesson.slug).coerceIn(0, lesson.practiceIds.lastIndex))
        }
    var picker by remember { mutableStateOf(false) }
    val q = lesson.question(focusId ?: lesson.practiceIds[index])
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.TopCenter) {
        Column(
            Modifier.widthIn(max = 900.dp)
                .fillMaxSize()
                .padding(horizontal = if (compact) 12.dp else 24.dp, vertical = 8.dp)
        ) {
            if (!compact || !keyboardVisible)
                Row(
                    Modifier.fillMaxWidth().padding(bottom = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(q.section, Modifier.weight(1f), fontSize = 14.sp, color = Muted)
                    if (focusId != null)
                        WorkspaceAction(
                            "Back to reading",
                            Icons.AutoMirrored.Outlined.ArrowBack,
                            onClick = exitFocus,
                        )
                    else
                        WorkspaceAction(
                            "${index + 1} / ${lesson.practiceIds.size}",
                            Icons.Outlined.ExpandMore,
                        ) {
                            picker = true
                        }
                }
            key(q.id) {
                LazyColumn(
                    Modifier.weight(1f).fillMaxWidth().testTag("practice-scroll"),
                    contentPadding = PaddingValues(bottom = 12.dp),
                ) {
                    item {
                        Column(
                            Modifier.fillMaxWidth()
                                .clip(RoundedCornerShape(6.dp))
                                .background(Paper)
                                .border(1.dp, Line, RoundedCornerShape(6.dp))
                        ) {
                            Text(
                                "Exercise ${q.id}",
                                Modifier.padding(start = 16.dp, top = 12.dp, bottom = 4.dp),
                                fontSize = 11.sp,
                                color = Muted,
                            )
                            Column(Modifier.padding(horizontal = 16.dp, vertical = 4.dp)) {
                                Prompt(q, compact = true)
                            }
                            ExerciseInput(model, q, minimumHeight = if (compact) 200.dp else 260.dp)
                            Column(Modifier.padding(start = 10.dp, end = 16.dp, bottom = 6.dp)) {
                                Answer(q)
                            }
                        }
                    }
                }
            }
            if ((!compact || !keyboardVisible) && focusId == null)
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    WorkspaceAction("Previous", Icons.AutoMirrored.Outlined.ArrowBack, index > 0) {
                        index--
                        model.position(lesson.slug, index)
                    }
                    Spacer(Modifier.weight(1f))
                    WorkspaceAction(
                        "Next problem",
                        Icons.AutoMirrored.Outlined.ArrowForward,
                        index < lesson.practiceIds.lastIndex,
                    ) {
                        index++
                        model.position(lesson.slug, index)
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
                    userScrollEnabled = true,
                    modifier = Modifier.height(440.dp),
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
