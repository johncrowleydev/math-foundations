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
import androidx.compose.ui.graphics.Color
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
    var sketch by rememberSaveable(key) { mutableStateOf(false) }
    AnswerPhotos(draft) { capture ->
        Column(
            Modifier.fillMaxWidth().padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Surface(
                color = WorkspaceGround,
                shape = RoundedCornerShape(12.dp),
                border = BorderStroke(1.dp, WorkspaceBorder),
            ) {
                Row(
                    Modifier.fillMaxWidth().padding(4.dp).horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    AnswerMode(
                        "Type",
                        Icons.Outlined.Keyboard,
                        draft.mode == "type",
                        !draft.loading,
                    ) {
                        draft.mode("type")
                    }
                    AnswerMode(
                        "Pen",
                        Icons.Outlined.Edit,
                        draft.mode == "write" && !sketch,
                        !draft.loading,
                    ) {
                        draft.mode("write")
                    }
                    AnswerMode("Sketch", Icons.Outlined.Gesture, sketch, !draft.loading) {
                        sketch = true
                    }
                    AnswerMode(
                        "Photo",
                        Icons.Outlined.PhotoCamera,
                        draft.mode == "photo",
                        !draft.loading,
                    ) {
                        draft.mode("photo")
                        if (draft.photos.isEmpty()) capture()
                    }
                }
            }
            draft.error?.let { error ->
                Text(error, color = MaterialTheme.colorScheme.error, fontSize = 13.sp)
                WorkspaceAction("Retry", onClick = draft::retry)
            }
            if (draft.loading) LinearProgressIndicator(Modifier.fillMaxWidth())
            else if (draft.mode == "type") key(key) { TypedAnswer(model, draft, q) }
            else if (draft.mode == "write") {
                if (model.input.showPen) SketchPenTools(model)
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    border = BorderStroke(1.dp, WorkspaceBorder),
                ) {
                    Box(
                        Modifier.heightIn(
                                max =
                                    if (minimumHeight > 0.dp) minimumHeight.coerceAtLeast(280.dp)
                                    else 230.dp
                            )
                            .verticalScroll(rememberScrollState())
                    ) {
                        PaperCanvas(model, page, q, penEnabled = model.input.showPen)
                    }
                }
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    if (model.input.showPen) InkActions(page)
                    Spacer(Modifier.weight(1f))
                    WorkspaceAction("Expand", Icons.Outlined.OpenInFull) { sketch = true }
                }
            }
            if (draft.saving) Text("Saving…", color = WorkspaceMuted, fontSize = 11.sp)
        }
    }
    if (sketch)
        Dialog(
            onDismissRequest = { sketch = false },
            properties = DialogProperties(usePlatformDefaultWidth = false),
        ) {
            var draw by remember { mutableStateOf(true) }
            Surface(Modifier.fillMaxSize().systemBarsPadding(), color = WorkspaceGround) {
                Column {
                    WorkspaceHeader(
                        "Sketch",
                        "Exercise ${q.id} · saved automatically",
                        { sketch = false },
                    )
                    Row(
                        Modifier.widthIn(max = 900.dp)
                            .fillMaxWidth()
                            .align(Alignment.CenterHorizontally)
                            .padding(horizontal = 8.dp, vertical = 8.dp)
                            .horizontalScroll(rememberScrollState()),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = MaterialTheme.colorScheme.surface,
                        ) {
                            Row(Modifier.padding(4.dp)) {
                                AnswerMode("Draw", Icons.Outlined.Edit, draw) { draw = true }
                                AnswerMode("Move", Icons.Outlined.PanTool, !draw) { draw = false }
                            }
                        }
                        InkActions(page)
                        WorkspaceAction("Add space", Icons.Outlined.Add, onClick = page::moreSpace)
                    }
                    Box(
                        Modifier.widthIn(max = 900.dp)
                            .fillMaxWidth()
                            .align(Alignment.CenterHorizontally)
                            .padding(horizontal = 8.dp)
                    ) {
                        SketchPenTools(model)
                    }
                    Text(
                        if (draw) "Draw with a finger or pen. Select Move to pan the paper."
                        else "Drag to move the paper. Select Draw to continue writing.",
                        Modifier.widthIn(max = 900.dp)
                            .fillMaxWidth()
                            .align(Alignment.CenterHorizontally)
                            .padding(horizontal = 8.dp, vertical = 8.dp),
                        color = WorkspaceMuted,
                        fontSize = 12.sp,
                    )
                    BoxWithConstraints(
                        Modifier.weight(1f)
                            .fillMaxWidth()
                            .padding(horizontal = 24.dp, vertical = 12.dp),
                        contentAlignment = Alignment.TopCenter,
                    ) {
                        val paperWidth = maxWidth.coerceAtMost(900.dp)
                        val paperHeight = maxHeight
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            shadowElevation = 2.dp,
                            color = Color.White,
                            modifier = Modifier.width(paperWidth).fillMaxHeight(),
                        ) {
                            Box(Modifier.verticalScroll(rememberScrollState(), enabled = !draw)) {
                                PaperCanvas(
                                    model,
                                    page,
                                    q,
                                    minimumHeight = paperHeight,
                                    fingerDrawing = draw,
                                    penEnabled = draw,
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
                        Text("Saved on this device", color = WorkspaceMuted, fontSize = 12.sp)
                    }
                    Box(Modifier.testTag("take-photo:${draft.key}")) {
                        WorkspaceAction(
                            if (draft.photos.isEmpty()) "Take photo" else "Add photo",
                            Icons.Outlined.PhotoCamera,
                            pending == null,
                            ::capture,
                        )
                    }
                }
                error?.let { Text(it, color = MaterialTheme.colorScheme.error, fontSize = 13.sp) }
                if (draft.photos.isEmpty())
                    Surface(
                        color = WorkspaceGround,
                        shape = RoundedCornerShape(10.dp),
                        border = BorderStroke(1.dp, WorkspaceBorder),
                    ) {
                        Text(
                            "Photograph your written work. Confirm it in the camera to save it here.",
                            Modifier.fillMaxWidth().padding(20.dp),
                            color = WorkspaceMuted,
                            fontSize = 14.sp,
                        )
                    }
                draft.photos.forEachIndexed { index, photo ->
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        border = BorderStroke(1.dp, WorkspaceBorder),
                        color = WorkspaceGround,
                    ) {
                        Column(Modifier.padding(12.dp)) {
                            PhotoImage(
                                file(photo.id),
                                photo.rotation,
                                Modifier.fillMaxWidth().height(180.dp).clickable {
                                    expandedId = photo.id
                                },
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
    LaunchedEffect(file.path, rotation) {
        bitmap =
            withContext(Dispatchers.IO) {
                runCatching {
                        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
                        BitmapFactory.decodeFile(file.path, bounds)
                        var sample = 1
                        while (maxOf(bounds.outWidth, bounds.outHeight) / sample > 2400) sample *= 2
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
