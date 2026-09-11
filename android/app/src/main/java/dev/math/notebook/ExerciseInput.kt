package dev.math.notebook

import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.media.ExifInterface
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
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
    Column(Modifier.fillMaxWidth()) {
        Row(
            Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            FilterChip(
                draft.mode == "type",
                {
                    draft.mode("type")
                    model.input.typing(true)
                },
                { Text("Type") },
                enabled = !draft.loading,
            )
            FilterChip(
                draft.mode == "write",
                {
                    draft.mode("write")
                    model.input.typing(false)
                },
                { Text(if (model.input.showPen) "Write" else "Saved writing") },
                enabled = !draft.loading,
            )
            TextButton(onClick = { sketch = true }) { Text("Sketch with finger") }
        }
        if (draft.error != null)
            Row {
                Text(draft.error!!, Modifier.weight(1f), color = MaterialTheme.colorScheme.error)
                TextButton(onClick = draft::retry) { Text("Retry") }
            }
        if (draft.loading) Text("Opening your answer…")
        else if (draft.mode == "type") key(key) { TypedAnswer(model, draft, q) }
        else {
            PaperCanvas(model, page, q, minimumHeight, penEnabled = model.input.showPen)
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                if (model.input.showPen) InkActions(page)
                TextButton(onClick = page::moreSpace) { Text("More space") }
            }
        }
        AnswerPhotos(draft)
        if (draft.saving) Text("Saving…", style = MaterialTheme.typography.labelSmall)
    }
    if (sketch)
        Dialog(
            onDismissRequest = { sketch = false },
            properties = DialogProperties(usePlatformDefaultWidth = false),
        ) {
            var draw by remember { mutableStateOf(true) }
            Surface(Modifier.fillMaxSize().systemBarsPadding()) {
                Column {
                    Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState())) {
                        FilterChip(draw, { draw = true }, { Text("Draw") })
                        FilterChip(!draw, { draw = false }, { Text("Move") })
                        InkActions(page)
                        TextButton(onClick = { page.moreSpace() }) { Text("More space") }
                        TextButton(onClick = { sketch = false }) { Text("Done") }
                    }
                    CompactPenTools(model)
                    Text(
                        if (draw) "Draw with a finger or pen. Switch to Move to pan the paper."
                        else "Drag to move the paper. Switch to Draw to add ink.",
                        Modifier.padding(12.dp),
                    )
                    Box(
                        Modifier.weight(1f)
                            .verticalScroll(rememberScrollState(), enabled = !draw)
                            .horizontalScroll(rememberScrollState(), enabled = !draw)
                    ) {
                        Box(Modifier.width(700.dp)) {
                            PaperCanvas(model, page, q, fingerDrawing = draw, penEnabled = draw)
                        }
                    }
                }
            }
        }
}

@Composable
private fun AnswerPhotos(draft: AnswerDraft) {
    val context = LocalContext.current
    var pending by rememberSaveable(draft.key) { mutableStateOf<String?>(null) }
    var preview by rememberSaveable(draft.key) { mutableStateOf<String?>(null) }
    var rotation by rememberSaveable(draft.key) { mutableIntStateOf(0) }
    var expandedId by rememberSaveable(draft.key) { mutableStateOf<String?>(null) }
    val expanded = draft.photos.find { it.id == expandedId }
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
                    preview = id
                    rotation = 0
                } else {
                    file(id).delete()
                    pending = null
                    error = "The camera did not return a readable photo. Please retake it."
                }
            } else {
                if (id != null) file(id).delete()
                pending = null
            }
        }
    fun capture() {
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
            android.util.Log.w("FoundationsCapture", "Camera capture could not start", e)
            pending?.let { file(it).delete() }
            pending = null
            error =
                "Could not open a camera. Check that a camera app is installed and storage is available."
        }
    }
    Column(Modifier.fillMaxWidth().padding(8.dp)) {
        TextButton(
            onClick = { capture() },
            enabled = !draft.loading && pending == null,
            modifier = Modifier.testTag("take-photo:${draft.key}"),
        ) {
            Text("Take photo")
        }
        error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        draft.photos.forEachIndexed { index, photo ->
            Column {
                PhotoImage(
                    file(photo.id),
                    photo.rotation,
                    Modifier.fillMaxWidth().height(200.dp).clickable { expandedId = photo.id },
                )
                FlowRow(Modifier.fillMaxWidth()) {
                    Text("Page ${index + 1}", Modifier.padding(12.dp))
                    TextButton(onClick = { expandedId = photo.id }) { Text("Enlarge") }
                    TextButton(
                        onClick = {
                            draft.photos(
                                draft.photos.map {
                                    if (it.id == photo.id)
                                        it.copy(rotation = (it.rotation + 90) % 360)
                                    else it
                                }
                            )
                        }
                    ) {
                        Text("Rotate")
                    }
                    TextButton(
                        onClick = {
                            removedId = photo.id
                            removedIndex = index
                            removedRotation = photo.rotation
                            draft.photos(draft.photos.filterNot { it.id == photo.id })
                        }
                    ) {
                        Text("Remove")
                    }
                }
            }
        }
        removedId?.let { id ->
            TextButton(
                onClick = {
                    draft.photos(
                        draft.photos.toMutableList().apply {
                            add(removedIndex.coerceAtMost(size), AnswerPhoto(id, removedRotation))
                        }
                    )
                    removedId = null
                }
            ) {
                Text("Undo photo removal")
            }
        }
    }
    if (preview != null)
        Dialog(
            onDismissRequest = {
                file(preview!!).delete()
                preview = null
                pending = null
            },
            properties = DialogProperties(usePlatformDefaultWidth = false),
        ) {
            Surface(Modifier.fillMaxWidth().fillMaxHeight(0.94f)) {
                Column {
                    PhotoImage(file(preview!!), rotation, Modifier.weight(1f).fillMaxWidth())
                    Row(Modifier.horizontalScroll(rememberScrollState())) {
                        TextButton(onClick = { rotation = (rotation + 90) % 360 }) {
                            Text("Rotate")
                        }
                        TextButton(
                            onClick = {
                                file(preview!!).delete()
                                preview = null
                                pending = null
                                capture()
                            }
                        ) {
                            Text("Retake")
                        }
                        TextButton(
                            onClick = {
                                draft.photos(draft.photos + AnswerPhoto(preview!!, rotation))
                                preview = null
                                pending = null
                            }
                        ) {
                            Text("Attach")
                        }
                        TextButton(
                            onClick = {
                                file(preview!!).delete()
                                preview = null
                                pending = null
                            }
                        ) {
                            Text("Cancel")
                        }
                    }
                }
            }
        }
    expanded?.let { photo ->
        Dialog(
            onDismissRequest = { expandedId = null },
            properties = DialogProperties(usePlatformDefaultWidth = false),
        ) {
            Surface(Modifier.fillMaxSize().systemBarsPadding()) {
                Column {
                    TextButton(onClick = { expandedId = null }) { Text("Close photo") }
                    PhotoImage(
                        file(photo.id),
                        photo.rotation,
                        Modifier.weight(1f).fillMaxWidth(),
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
