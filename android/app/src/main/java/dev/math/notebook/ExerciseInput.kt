package dev.math.notebook

import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.media.ExifInterface
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.core.content.FileProvider
import java.io.File
import java.util.UUID
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun ExerciseInput(
    model: NotebookModel,
    q: Question,
    minimumHeight: androidx.compose.ui.unit.Dp = 0.dp,
) {
    val key = "${model.lesson.slug}-${q.id}"
    val draft = remember(key) { model.answers.draft(key, model.input.preferTyping) }
    val page = remember(key) { model.page(key) }
    var expanded by rememberSaveable(key) { mutableStateOf(false) }
    var modes by remember { mutableStateOf(false) }
    AnswerPhotos(draft) { capture ->
        Column(
            Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            draft.error?.let {
                Text(it, color = MaterialTheme.colorScheme.error, fontSize = 12.sp)
                WorkspaceAction("Retry", onClick = draft::retry)
            }
            if (draft.loading) LinearProgressIndicator(Modifier.fillMaxWidth())
            else if (draft.mode == "type") key(key) { TypedAnswer(model, draft, q) }
            else if (draft.mode == "write") {
                val inkScroll = rememberScrollState()
                var positioned by rememberSaveable(key) { mutableStateOf(false) }
                val density = androidx.compose.ui.platform.LocalDensity.current
                BoxWithConstraints(
                    Modifier.fillMaxWidth()
                        .heightIn(max = if (minimumHeight > 0.dp) minimumHeight else 140.dp)
                        .border(1.dp, WorkspaceBorder)
                ) {
                    val width = maxWidth
                    LaunchedEffect(page.loading, width) {
                        if (!page.loading && !positioned && width > 0.dp) {
                            val firstInk =
                                page.strokes.minOfOrNull { stroke ->
                                    (0 until stroke.inputs.size).minOfOrNull { stroke.inputs[it].y }
                                        ?: 0f
                                } ?: 0f
                            inkScroll.scrollTo(
                                with(density) { (width * (firstInk / 900f) - 20.dp).roundToPx() }
                                    .coerceAtLeast(0)
                            )
                            positioned = true
                        }
                    }
                    Box(Modifier.verticalScroll(inkScroll)) {
                        PaperCanvas(model, page, q, penEnabled = model.input.showPen)
                    }
                }
            }
            Row(
                Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(Modifier.testTag("answer-mode:$key")) {
                    WorkspaceAction(
                        when (draft.mode) {
                            "type" -> "Type"
                            "photo" -> "Photo"
                            else -> "Pen"
                        },
                        Icons.Outlined.ExpandMore,
                        !draft.loading,
                    ) {
                        modes = true
                    }
                    DropdownMenu(modes, { modes = false }) {
                        listOf("type" to "Type", "write" to "Pen", "photo" to "Photo").forEach {
                            (mode, label) ->
                            DropdownMenuItem(
                                text = { Text(label, fontSize = 13.sp) },
                                onClick = {
                                    modes = false
                                    draft.mode(mode)
                                    if (mode == "photo" && draft.photos.isEmpty()) capture()
                                },
                            )
                        }
                    }
                }
                if (draft.mode == "write") {
                    if (model.input.showPen) SketchPenTools(model)
                    InkActions(page)
                }
                Spacer(Modifier.weight(1f))
                if (draft.mode != "photo")
                    QuietIcon(Icons.Outlined.OpenInFull, "Expand answer") {
                        if (draft.mode == "type") model.focusedEditor = model.lesson.slug to q.id
                        else expanded = true
                    }
            }
            if (draft.saving) Text("Saving...", color = WorkspaceMuted, fontSize = 10.sp)
        }
    }
    if (expanded)
        Dialog(
            onDismissRequest = { expanded = false },
            properties = DialogProperties(usePlatformDefaultWidth = false),
        ) {
            var finger by rememberSaveable { mutableStateOf(false) }
            var options by remember { mutableStateOf(false) }
            Surface(Modifier.fillMaxSize().systemBarsPadding(), color = WorkspaceGround) {
                Column {
                    WorkspaceHeader("Exercise ${q.id}", "", { expanded = false })
                    Column(
                        Modifier.widthIn(max = 900.dp)
                            .fillMaxWidth()
                            .align(Alignment.CenterHorizontally)
                            .padding(horizontal = 20.dp)
                            .heightIn(max = 140.dp)
                            .verticalScroll(rememberScrollState())
                    ) {
                        Prompt(q, compact = true)
                    }
                    BoxWithConstraints(
                        Modifier.weight(1f)
                            .fillMaxWidth()
                            .padding(horizontal = 20.dp, vertical = 8.dp),
                        contentAlignment = Alignment.TopCenter,
                    ) {
                        val paperWidth = maxWidth.coerceAtMost(900.dp)
                        val paperHeight = maxHeight
                        val scroll = rememberScrollState()
                        Box(
                            Modifier.width(paperWidth)
                                .fillMaxHeight()
                                .verticalScroll(scroll, enabled = !finger)
                        ) {
                            PaperCanvas(
                                model,
                                page,
                                q,
                                minimumHeight = paperHeight,
                                fingerDrawing = finger,
                                penEnabled = true,
                            )
                        }
                    }
                    Row(
                        Modifier.widthIn(max = 900.dp)
                            .fillMaxWidth()
                            .align(Alignment.CenterHorizontally)
                            .padding(horizontal = 12.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        SketchPenTools(model)
                        InkActions(page)
                        Spacer(Modifier.weight(1f))
                        if (finger) WorkspaceAction("Finger drawing on") { finger = false }
                        Box {
                            QuietIcon(Icons.Outlined.MoreHoriz, "Writing options") {
                                options = true
                            }
                            DropdownMenu(options, { options = false }) {
                                DropdownMenuItem(
                                    text = {
                                        Text(
                                            if (finger) "Turn off finger drawing"
                                            else "Draw with finger",
                                            fontSize = 13.sp,
                                        )
                                    },
                                    onClick = {
                                        finger = !finger
                                        options = false
                                    },
                                )
                                DropdownMenuItem(
                                    text = { Text("Add writing space", fontSize = 13.sp) },
                                    onClick = {
                                        page.moreSpace()
                                        options = false
                                    },
                                )
                            }
                        }
                    }
                }
            }
        }
}

@Composable
private fun AnswerPhotos(draft: AnswerDraft, content: @Composable (() -> Unit) -> Unit) {
    val context = LocalContext.current
    var pending by rememberSaveable(draft.key) { mutableStateOf<String?>(null) }
    var confirmedId by rememberSaveable(draft.key) { mutableStateOf<String?>(null) }
    var expandedId by rememberSaveable(draft.key) { mutableStateOf<String?>(null) }
    var removedId by rememberSaveable(draft.key) { mutableStateOf<String?>(null) }
    var removedIndex by rememberSaveable(draft.key) { mutableIntStateOf(0) }
    var removedRotation by rememberSaveable(draft.key) { mutableIntStateOf(0) }
    var error by remember { mutableStateOf<String?>(null) }
    fun file(id: String) = File(context.filesDir, "answer-photos/$id.jpg")
    val camera =
        rememberLauncherForActivityResult(ActivityResultContracts.TakePicture()) { success ->
            val id = pending
            if (success && id != null && file(id).length() > 0) {
                val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
                BitmapFactory.decodeFile(file(id).path, bounds)
                if (bounds.outWidth > 0 && bounds.outHeight > 0) {
                    confirmedId = id
                } else {
                    file(id).delete()
                    error = "The camera returned an unreadable photo. Please try again."
                }
            } else if (id != null) file(id).delete()
            pending = null
        }
    LaunchedEffect(confirmedId, draft.loading) {
        val id = confirmedId
        if (id != null && !draft.loading) {
            if (draft.photos.none { it.id == id }) draft.photos(draft.photos + AnswerPhoto(id, 0))
            draft.mode("photo")
            confirmedId = null
        }
    }
    fun capture() {
        if (pending != null) return
        error = null
        try {
            val id = UUID.randomUUID().toString()
            val target = file(id)
            check(target.parentFile!!.isDirectory || target.parentFile!!.mkdirs())
            check(target.createNewFile())
            pending = id
            camera.launch(
                FileProvider.getUriForFile(context, "${context.packageName}.answers", target)
            )
        } catch (e: Exception) {
            pending?.let { file(it).delete() }
            pending = null
            error =
                "Could not open a camera. Check that a camera app is installed and storage is available."
        }
    }
    Column {
        content(::capture)
        if (draft.mode == "photo")
            Column(
                Modifier.fillMaxWidth().padding(start = 16.dp, end = 16.dp, bottom = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text("Photos of your work", style = MaterialTheme.typography.titleSmall)
                    }
                    Box(Modifier.testTag("take-photo:${draft.key}")) {
                        WorkspaceAction(
                            if (draft.photos.isEmpty()) "Take photo" else "Add photo",
                            Icons.Outlined.PhotoCamera,
                            pending == null,
                            onClick = ::capture,
                        )
                    }
                }
                error?.let { Text(it, color = MaterialTheme.colorScheme.error, fontSize = 13.sp) }
                if (draft.photos.isEmpty())
                    Surface(
                        color = WorkspaceGround,
                        shape = RoundedCornerShape(4.dp),
                        border = BorderStroke(1.dp, WorkspaceBorder),
                    ) {
                        Text(
                            "Photograph your written work. Confirm it in the camera to save it here.",
                            Modifier.fillMaxWidth().padding(12.dp),
                            color = WorkspaceMuted,
                            fontSize = 14.sp,
                        )
                    }
                draft.photos.forEachIndexed { index, photo ->
                    Surface(
                        modifier = Modifier.widthIn(max = 360.dp).fillMaxWidth(),
                        shape = RoundedCornerShape(4.dp),
                        border = BorderStroke(1.dp, WorkspaceBorder),
                        color = WorkspaceGround,
                    ) {
                        Column(Modifier.padding(12.dp)) {
                            PhotoImage(
                                file(photo.id),
                                photo.rotation,
                                Modifier.widthIn(max = 320.dp)
                                    .fillMaxWidth()
                                    .height(140.dp)
                                    .clickable { expandedId = photo.id },
                            )
                            FlowRow(
                                Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                            ) {
                                if (draft.photos.size > 1)
                                    Text(
                                        "Photo ${index + 1}",
                                        Modifier.padding(vertical = 12.dp),
                                        color = WorkspaceMuted,
                                        fontSize = 12.sp,
                                    )
                                WorkspaceAction("Enlarge", Icons.Outlined.OpenInFull) {
                                    expandedId = photo.id
                                }
                                WorkspaceAction("Rotate", Icons.Outlined.RotateRight) {
                                    draft.photos(
                                        draft.photos.map {
                                            if (it.id == photo.id)
                                                it.copy(rotation = (it.rotation + 90) % 360)
                                            else it
                                        }
                                    )
                                }
                                WorkspaceAction("Remove", Icons.Outlined.DeleteOutline) {
                                    removedId = photo.id
                                    removedIndex = index
                                    removedRotation = photo.rotation
                                    draft.photos(draft.photos.filterNot { it.id == photo.id })
                                }
                            }
                        }
                    }
                }
                removedId?.let { id ->
                    WorkspaceAction("Undo photo removal", Icons.Outlined.Undo) {
                        draft.photos(
                            draft.photos.toMutableList().apply {
                                add(
                                    removedIndex.coerceAtMost(size),
                                    AnswerPhoto(id, removedRotation),
                                )
                            }
                        )
                        removedId = null
                    }
                }
            }
    }
    draft.photos
        .find { it.id == expandedId }
        ?.let { photo ->
            Dialog(
                onDismissRequest = { expandedId = null },
                properties = DialogProperties(usePlatformDefaultWidth = false),
            ) {
                Surface(Modifier.fillMaxSize().systemBarsPadding(), color = WorkspaceGround) {
                    Column {
                        WorkspaceHeader(
                            "Your photo",
                            "Pinch to zoom · drag to pan",
                            { expandedId = null },
                        )
                        PhotoImage(
                            file(photo.id),
                            photo.rotation,
                            Modifier.weight(1f).fillMaxWidth().padding(24.dp),
                            zoomable = true,
                        )
                    }
                }
            }
        }
}

@Composable
private fun PhotoImage(file: File, rotation: Int, modifier: Modifier, zoomable: Boolean = false) {
    var bitmap by remember(file.path) { mutableStateOf<android.graphics.Bitmap?>(null) }
    var failed by remember(file.path) { mutableStateOf(false) }
    LaunchedEffect(file.path, rotation, zoomable) {
        bitmap =
            withContext(Dispatchers.IO) {
                runCatching {
                        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
                        BitmapFactory.decodeFile(file.path, bounds)
                        var sample = 1
                        val previewLimit = if (zoomable) 2400 else 720
                        while (
                            maxOf(bounds.outWidth, bounds.outHeight) / sample > previewLimit
                        ) sample *= 2
                        val raw =
                            BitmapFactory.decodeFile(
                                file.path,
                                BitmapFactory.Options().apply { inSampleSize = sample },
                            ) ?: error("Unreadable photo")
                        val orientation =
                            ExifInterface(file.path)
                                .getAttributeInt(
                                    ExifInterface.TAG_ORIENTATION,
                                    ExifInterface.ORIENTATION_NORMAL,
                                )
                        val matrix = Matrix()
                        when (orientation) {
                            2 -> matrix.setScale(-1f, 1f)
                            3 -> matrix.setRotate(180f)
                            4 -> matrix.setScale(1f, -1f)
                            5 -> {
                                matrix.setRotate(90f)
                                matrix.postScale(-1f, 1f)
                            }
                            6 -> matrix.setRotate(90f)
                            7 -> {
                                matrix.setRotate(-90f)
                                matrix.postScale(-1f, 1f)
                            }
                            8 -> matrix.setRotate(-90f)
                        }
                        matrix.postRotate(rotation.toFloat())
                        android.graphics.Bitmap.createBitmap(
                            raw,
                            0,
                            0,
                            raw.width,
                            raw.height,
                            matrix,
                            true,
                        )
                    }
                    .getOrNull()
            }
        failed = bitmap == null
    }
    var scale by remember(file.path, rotation) { mutableFloatStateOf(1f) }
    var x by remember(file.path, rotation) { mutableFloatStateOf(0f) }
    var y by remember(file.path, rotation) { mutableFloatStateOf(0f) }
    Box(modifier) {
        bitmap?.let { image ->
            Image(
                image.asImageBitmap(),
                "Photograph of your written answer",
                Modifier.fillMaxSize()
                    .then(
                        if (zoomable)
                            Modifier.pointerInput(Unit) {
                                detectTransformGestures { _, pan, zoom, _ ->
                                    scale = (scale * zoom).coerceIn(1f, 5f)
                                    x += pan.x
                                    y += pan.y
                                }
                            }
                        else Modifier
                    )
                    .graphicsLayer {
                        scaleX = scale
                        scaleY = scale
                        translationX = x
                        translationY = y
                    },
            )
        } ?: Text(if (failed) "Could not open photo. Its file has been kept." else "Opening photo…")
    }
}
