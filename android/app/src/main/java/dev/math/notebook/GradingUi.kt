package dev.math.notebook

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import java.io.File
import java.text.DateFormat
import java.util.Date
import org.json.JSONObject

@Composable
internal fun attemptBorder(model: NotebookModel, q: Question): Color {
    val list = model.grading.forExercise("${model.lesson.slug}-${q.id}")
    return when {
        list.any { it.optString("verdict") == "correct" } -> Color(0xff8eae98)
        list.isNotEmpty() && list.all { it.optString("verdict") == "incorrect" } ->
            Color(0xffd2a39b)
        else -> Color(0xffdcded6)
    }
}

@Composable
internal fun GradedExerciseInput(
    model: NotebookModel,
    q: Question,
    minimumHeight: androidx.compose.ui.unit.Dp = 0.dp,
) {
    val store = model.grading
    val key = "${model.lesson.slug}-${q.id}"
    val draft = remember(key) { model.answers.draft(key, model.input.preferTyping) }
    val page = remember(key) { model.page(key) }
    val attempts = store.forExercise(key)
    val editing = key in store.editing && !store.correct(key) && !store.pending(key)
    var history by rememberSaveable(key) { mutableStateOf(false) }
    Column(Modifier.fillMaxWidth()) {
        if (store.loading)
            Text(
                "Opening attempts...",
                Modifier.padding(16.dp),
                color = WorkspaceMuted,
                fontSize = 12.sp,
            )
        else if (key in store.working)
            Text(
                "Saving your submission...",
                Modifier.padding(16.dp),
                color = WorkspaceMuted,
                fontSize = 12.sp,
            )
        else if (attempts.isEmpty() || editing) {
            ExerciseInput(model, q, minimumHeight)
            SubmissionActions(model, q)
            if (editing) WorkspaceAction("Back to latest attempt") { store.stopEditing(key) }
        } else
            AttemptPanel(
                model,
                attempts.last(),
                previousCount = attempts.size - 1,
                onHistory = { history = true },
            )
        store.errors[key]?.let {
            Text(
                it,
                Modifier.padding(horizontal = 16.dp),
                color = MaterialTheme.colorScheme.error,
                fontSize = 12.sp,
            )
        }
        store.errors["storage"]?.let {
            Text(
                it,
                Modifier.padding(16.dp),
                color = MaterialTheme.colorScheme.error,
                fontSize = 12.sp,
            )
        }
    }
    if (history)
        Dialog(
            onDismissRequest = { history = false },
            properties = DialogProperties(usePlatformDefaultWidth = false),
        ) {
            Surface(Modifier.fillMaxSize().systemBarsPadding(), color = WorkspaceGround) {
                Column {
                    WorkspaceHeader(
                        "Exercise ${q.id} - attempts",
                        "Newest first",
                        { history = false },
                    )
                    Column(
                        Modifier.weight(1f)
                            .fillMaxWidth()
                            .verticalScroll(rememberScrollState())
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp),
                    ) {
                        attempts.asReversed().forEach { attempt ->
                            key(attempt.getString("id")) {
                                Surface(
                                    color = Color.White,
                                    shape =
                                        androidx.compose.foundation.shape.RoundedCornerShape(6.dp),
                                ) {
                                    AttemptPanel(model, attempt, history = true)
                                }
                            }
                        }
                    }
                }
            }
        }
}

@Composable
internal fun SubmissionActions(model: NotebookModel, q: Question) {
    val key = "${model.lesson.slug}-${q.id}"
    val draft = model.answers.draft(key, model.input.preferTyping)
    val page = model.page(key)
    Row(
        Modifier.fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp)
            .horizontalScroll(rememberScrollState()),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        GradeButton(
            "Submit",
            primary = true,
            enabled =
                !draft.loading &&
                    !draft.saving &&
                    draft.error == null &&
                    (draft.mode != "write" ||
                        (!page.loading &&
                            !page.saving &&
                            page.error == null &&
                            page.activeInputs == 0)) &&
                    !model.grading.loading &&
                    key !in model.grading.working &&
                    !model.grading.correct(key) &&
                    !model.grading.pending(key),
        ) {
            model.focusedEditor = null
            model.grading.submit(model, q)
        }
        Text(
            "Draft stays on this device",
            Modifier.padding(start = 10.dp),
            color = WorkspaceMuted,
            fontSize = 11.sp,
        )
    }
}

@Composable
private fun AttemptPanel(
    model: NotebookModel,
    attempt: JSONObject,
    history: Boolean = false,
    previousCount: Int = 0,
    onHistory: () -> Unit = {},
) {
    val store = model.grading
    val key = attempt.getString("exercise")
    val id = attempt.getString("id")
    val draft = remember(key) { model.answers.draft(key, model.input.preferTyping) }
    val page = remember(key) { model.page(key) }
    val grades = attempt.optJSONArray("grades")
    val grade = grades?.takeIf { it.length() > 0 }?.getJSONObject(grades.length() - 1)
    val verdict = attempt.optString("verdict")
    val status = attempt.optString("status")
    var feedback by
        rememberSaveable(id, grade?.optLong("at")) {
            mutableStateOf(verdict == "correct" || status == "not_graded")
        }
    var transcript by rememberSaveable(id) { mutableStateOf(false) }
    var recheck by rememberSaveable(id) { mutableStateOf(false) }
    var previousGrades by rememberSaveable(id) { mutableStateOf(false) }
    var expanded by rememberSaveable(id) { mutableStateOf(false) }
    var more by remember { mutableStateOf(false) }
    var source by rememberSaveable(id) { mutableStateOf(false) }
    val label =
        when (status) {
            "queued" -> "Saved - waiting to upload"
            "pending",
            "grading" -> "Grading..."
            "rechecking" -> "Rechecking..."
            "error" -> "Grading unavailable"
            "not_graded" ->
                if (verdict.isEmpty()) "Not graded"
                else "Recheck inconclusive - previous grade retained"
            else -> if (verdict == "correct") "Correct" else "Incorrect"
        }
    Column(
        Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            if (status in setOf("pending", "grading", "rechecking"))
                CircularProgressIndicator(
                    Modifier.size(14.dp).testTag("grading-activity"),
                    strokeWidth = 1.5.dp,
                )
            Text(
                label,
                color =
                    when (verdict) {
                        "correct" -> Color(0xff326c48)
                        "incorrect" -> Color(0xff9d4f43)
                        else -> WorkspaceMuted
                    },
                fontSize = 12.sp,
                modifier = Modifier.testTag("attempt-status:$id"),
            )
            Text(
                DateFormat.getDateTimeInstance(DateFormat.SHORT, DateFormat.SHORT)
                    .format(Date(attempt.getLong("submitted"))),
                color = WorkspaceMuted,
                fontSize = 10.sp,
            )
        }
        if (attempt.optBoolean("revealed"))
            Text(
                "Official answer viewed before submission",
                color = WorkspaceMuted,
                fontSize = 11.sp,
            )
        AttemptResponse(model, attempt, expanded = false)

        attempt
            .optString("error")
            .takeIf { it.isNotBlank() }
            ?.let { Text(it, fontSize = 12.sp, color = WorkspaceMuted) }
        Row(
            Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            if (grade != null)
                GradeButton(if (feedback) "Hide feedback" else "Show feedback") {
                    feedback = !feedback
                }
            if (!history && !store.correct(key) && !store.pending(key))
                GradeButton(
                    if (store.hasRecoveryDraft(key)) "Continue draft" else "Try again",
                    enabled = !draft.loading && !page.loading,
                ) {
                    if (store.hasRecoveryDraft(key)) store.edit(key)
                    else store.copyForRetry(model, attempt)
                }
            Box {
                GradeButton("More") { more = true }
                DropdownMenu(expanded = more, onDismissRequest = { more = false }) {
                    if (attempt.getString("mode") != "type")
                        DropdownMenuItem(
                            text = { Text("Expand response") },
                            onClick = {
                                expanded = true
                                more = false
                            },
                        )
                    else
                        DropdownMenuItem(
                            text = { Text(if (source) "Hide source" else "View source") },
                            onClick = {
                                source = !source
                                more = false
                            },
                        )
                    if (grade?.optString("transcription")?.isNotBlank() == true)
                        DropdownMenuItem(
                            text = {
                                Text(
                                    if (transcript) "Hide transcription" else "What the grader read"
                                )
                            },
                            onClick = {
                                transcript = !transcript
                                more = false
                            },
                        )
                    if (previousCount > 0)
                        DropdownMenuItem(
                            text = { Text("Previous attempts ($previousCount)") },
                            onClick = {
                                onHistory()
                                more = false
                            },
                        )
                    if (!store.pending(key))
                        DropdownMenuItem(
                            text = {
                                Text(
                                    if (status == "error" && verdict.isEmpty()) "Retry grading"
                                    else "Request recheck"
                                )
                            },
                            onClick = {
                                more = false
                                if (status == "error" && verdict.isEmpty())
                                    store.recheck(model.cloud, attempt, "")
                                else recheck = true
                            },
                        )
                    if ((grades?.length() ?: 0) > 1)
                        DropdownMenuItem(
                            text = { Text("Previous assessments") },
                            onClick = {
                                previousGrades = !previousGrades
                                more = false
                            },
                        )
                }
            }
        }
        if (source)
            androidx.compose.foundation.text.selection.SelectionContainer {
                Text(
                    attempt.optString("text"),
                    fontSize = 12.sp,
                    fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace,
                )
            }
        if (grade != null && feedback) {
            Surface(color = Color(0xfff3f5f0), shape = RoundedCornerShape(4.dp)) {
                Column(Modifier.fillMaxWidth().padding(10.dp)) {
                    RichText(grade.optString("feedback"), Modifier.fillMaxWidth(), 14f)
                    grade
                        .optString("issue")
                        .takeIf { it.isNotBlank() }
                        ?.let { RichText("Where to look: $it", Modifier.fillMaxWidth(), 14f) }
                    grade
                        .optString("improvement")
                        .takeIf { it.isNotBlank() }
                        ?.let { RichText(it, Modifier.fillMaxWidth(), 14f) }
                }
            }
        }
        if (grade != null && transcript) {
            Text("What the grader read", fontSize = 11.sp, color = WorkspaceMuted)
            RichText(grade.optString("transcription"), Modifier.fillMaxWidth(), 14f)
        }
        if (previousGrades && grades != null)
            for (i in grades.length() - 2 downTo 0) {
                val old = grades.getJSONObject(i)
                Text(
                    "${old.optString("verdict")} - ${DateFormat.getDateTimeInstance().format(Date(old.optLong("at")))}",
                    fontSize = 12.sp,
                    color = WorkspaceMuted,
                )
                RichText(old.optString("feedback"), Modifier.fillMaxWidth(), 15f)
                old.optString("reason")
                    .takeIf { it.isNotBlank() }
                    ?.let { Text("Recheck request: $it", fontSize = 12.sp, color = WorkspaceMuted) }
            }
    }
    if (recheck) {
        var reason by rememberSaveable(id) { mutableStateOf("") }
        AlertDialog(
            onDismissRequest = { recheck = false },
            title = { Text("Request a recheck") },
            text = {
                Column(
                    Modifier.verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Text(
                        "Explain a misreading or grading issue. Your submitted response will stay unchanged."
                    )
                    OutlinedTextField(
                        reason,
                        { reason = it.take(4000) },
                        label = { Text("What should be reconsidered?") },
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        store.recheck(model.cloud, attempt, reason)
                        recheck = false
                    },
                    enabled = reason.isNotBlank(),
                ) {
                    Text("Send recheck")
                }
            },
            dismissButton = { TextButton(onClick = { recheck = false }) { Text("Cancel") } },
        )
    }
    if (expanded)
        Dialog(
            onDismissRequest = { expanded = false },
            properties = DialogProperties(usePlatformDefaultWidth = false),
        ) {
            Surface(Modifier.fillMaxSize().systemBarsPadding(), color = WorkspaceGround) {
                Column {
                    WorkspaceHeader("Submitted response", "", { expanded = false })
                    Column(
                        Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(16.dp)
                    ) {
                        AttemptResponse(model, attempt, true)
                    }
                }
            }
        }
}

@Composable
private fun AttemptResponse(model: NotebookModel, attempt: JSONObject, expanded: Boolean) {
    if (attempt.getString("mode") == "type") {
        AnswerPreview(
            attempt.getString("text"),
            model.tex,
            minimumHeight = 40.dp,
            diagnostics = {},
            label = "SUBMITTED RESPONSE",
            debounce = false,
        )
    } else {
        val context = androidx.compose.ui.platform.LocalContext.current
        val images = attempt.getJSONArray("images")
        val originals = attempt.optJSONArray("photos")
        Column(
            Modifier.fillMaxWidth()
                .then(
                    if (!expanded)
                        Modifier.heightIn(max = 140.dp).verticalScroll(rememberScrollState())
                    else Modifier
                )
        ) {
            for (i in 0 until images.length()) {
                val original = originals?.optJSONObject(i)
                BoxWithConstraints(Modifier.fillMaxWidth()) {
                    val bounds =
                        remember(images.getString(i)) {
                            android.graphics.BitmapFactory.Options().apply {
                                inJustDecodeBounds = true
                                android.graphics.BitmapFactory.decodeFile(
                                    File(context.filesDir, "cloud-media/${images.getString(i)}")
                                        .path,
                                    this,
                                )
                            }
                        }
                    val imageHeight =
                        if (expanded) 600.dp
                        else
                            (maxWidth *
                                    (bounds.outHeight.toFloat() / bounds.outWidth.coerceAtLeast(1)))
                                .coerceIn(48.dp, 140.dp)
                    PhotoImage(
                        File(
                            context.filesDir,
                            "cloud-media/${original?.getString("hash") ?: images.getString(i)}",
                        ),
                        original?.optInt("rotation") ?: 0,
                        Modifier.fillMaxWidth().height(imageHeight),
                        zoomable = expanded,
                    )
                }
            }
        }
    }
}

@Composable
private fun GradeButton(
    label: String,
    enabled: Boolean = true,
    primary: Boolean = false,
    onClick: () -> Unit,
) {
    CompositionLocalProvider(LocalMinimumInteractiveComponentSize provides 32.dp) {
        OutlinedButton(
            onClick = onClick,
            enabled = enabled,
            modifier = Modifier.height(32.dp),
            shape = RoundedCornerShape(5.dp),
            border = BorderStroke(1.dp, Color(0xffd5ddd6)),
            colors =
                ButtonDefaults.outlinedButtonColors(
                    containerColor = if (primary) Color(0xff286657) else Color(0xfff3f5f0),
                    contentColor = if (primary) Color.White else Color(0xff36594e),
                ),
            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 0.dp),
        ) {
            Text(label, fontSize = 11.sp, maxLines = 1)
        }
    }
}
