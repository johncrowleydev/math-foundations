package dev.math.notebook

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import java.io.File
import java.text.DateFormat
import java.util.Date
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject

@Composable
internal fun CloudSettings() {
    val cloud = CloudSync.get(LocalContext.current)
    var key by remember { mutableStateOf("") }
    var editing by remember { mutableStateOf(!cloud.connected) }
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text("Cloud sync", style = MaterialTheme.typography.titleSmall)
        Text(
            "foundations.johncrowley.dev",
            style = MaterialTheme.typography.bodySmall,
            color = WorkspaceMuted,
        )
        Text(cloud.status, style = MaterialTheme.typography.bodySmall)
        if (cloud.lastSync > 0)
            Text(
                "Last synced ${DateFormat.getDateTimeInstance(DateFormat.SHORT, DateFormat.SHORT).format(Date(cloud.lastSync))}",
                style = MaterialTheme.typography.bodySmall,
                color = WorkspaceMuted,
            )
        if (cloud.pendingCount > 0)
            Text(
                "${cloud.pendingCount} changes waiting",
                style = MaterialTheme.typography.bodySmall,
            )
        if (cloud.conflicts.isNotEmpty())
            Text(
                "${cloud.conflicts.size} answers have versions to compare. Open Versions beside the answer.",
                style = MaterialTheme.typography.bodySmall,
            )
        if (editing) {
            OutlinedTextField(
                key,
                { key = it.trim() },
                label = { Text("API key") },
                visualTransformation = PasswordVisualTransformation(),
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                supportingText = {
                    Text("Enter the same key on each device. Your existing work stays here.")
                },
            )
            Row {
                TextButton(
                    onClick = {
                        cloud.connect(key)
                        key = ""
                        editing = false
                    },
                    enabled = key.isNotBlank(),
                ) {
                    Text("Connect")
                }
                if (cloud.connected)
                    TextButton(
                        onClick = {
                            editing = false
                            key = ""
                        }
                    ) {
                        Text("Cancel")
                    }
            }
        } else
            Row(Modifier.horizontalScroll(rememberScrollState())) {
                TextButton(onClick = cloud::syncNow) { Text("Sync now") }
                TextButton(onClick = { editing = true }) { Text("Change key") }
                if (cloud.connected) TextButton(onClick = cloud::disconnect) { Text("Disconnect") }
            }
        if (!cloud.connected && !editing)
            TextButton(onClick = { editing = true }) { Text("Enter API key") }
        Text(
            "Answers and photos sync on Wi-Fi or mobile data. Input settings below stay on this device.",
            style = MaterialTheme.typography.bodySmall,
            color = WorkspaceMuted,
        )
    }
    HorizontalDivider(Modifier.padding(vertical = 12.dp))
}

@Composable
internal fun CloudResume(model: NotebookModel) {
    val target = model.cloud.resume ?: return
    val title = model.lessons.find { it.slug == target.optString("slug") }?.title ?: return
    Row(
        Modifier.fillMaxWidth().padding(horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        TextButton(onClick = model::resumeCloud, modifier = Modifier.weight(1f)) {
            Text("Resume $title from your other device", style = MaterialTheme.typography.bodySmall)
        }
        TextButton(onClick = model.cloud::dismissResume) { Text("Dismiss") }
    }
}

@Composable
internal fun CloudVersionsAction(model: NotebookModel, answer: String) {
    val cloud = model.cloud
    val records = cloud.histories.filter { it.getString("key").substringAfter('/') == answer }
    if (records.isEmpty()) return
    var open by remember(answer) { mutableStateOf(false) }
    WorkspaceAction(
        if (records.any { it.getJSONArray("conflicts").length() > 0 }) "Compare versions"
        else "Saved versions"
    ) {
        open = true
    }
    if (open) CloudVersions(model, records) { open = false }
}

@Composable
private fun CloudVersions(model: NotebookModel, records: List<JSONObject>, close: () -> Unit) {
    val context = LocalContext.current
    var chosenRecord by remember { mutableIntStateOf(0) }
    val record = records[chosenRecord.coerceAtMost(records.lastIndex)]
    val versions = record.getJSONArray("versions")
    var chosenVersion by remember(record.getString("key")) { mutableIntStateOf(0) }
    val version = versions.getJSONObject(chosenVersion.coerceAtMost(versions.length() - 1))
    val kind = record.getString("key").substringBefore('/')
    Dialog(
        onDismissRequest = close,
        properties = DialogProperties(usePlatformDefaultWidth = false),
    ) {
        Surface(
            Modifier.widthIn(max = 900.dp)
                .fillMaxWidth()
                .heightIn(max = 680.dp)
                .fillMaxHeight()
                .systemBarsPadding()
                .padding(12.dp),
            shape = MaterialTheme.shapes.medium,
        ) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = close) {
                        Icon(Icons.AutoMirrored.Outlined.ArrowBack, "Back to answer")
                    }
                    Text(
                        "Answer versions",
                        Modifier.weight(1f),
                        style = MaterialTheme.typography.titleMedium,
                    )
                    TextButton(onClick = close) { Text("Done") }
                }
                Text(
                    "Compare your saved work. Choosing a version keeps the other copies available here.",
                    style = MaterialTheme.typography.bodySmall,
                    color = WorkspaceMuted,
                )
                Row(Modifier.horizontalScroll(rememberScrollState())) {
                    records.forEachIndexed { i, r ->
                        TextButton(onClick = { chosenRecord = i }) {
                            Text(
                                when (r.getString("key").substringBefore('/')) {
                                    "ink" -> "Handwriting"
                                    "text" -> "Typed answer"
                                    else -> "Photos"
                                },
                                color =
                                    if (i == chosenRecord) MaterialTheme.colorScheme.primary
                                    else WorkspaceMuted,
                            )
                        }
                    }
                }
                Row(Modifier.horizontalScroll(rememberScrollState())) {
                    for (i in 0 until versions.length()) TextButton(
                        onClick = { chosenVersion = i }
                    ) {
                        Text(
                            "Version ${i+1}${if(versions.getJSONObject(i).getString("id")==record.getString("id")) " · current" else ""}",
                            color =
                                if (i == chosenVersion) MaterialTheme.colorScheme.primary
                                else WorkspaceMuted,
                        )
                    }
                }
                Text(
                    version.getString("device") +
                        " · " +
                        DateFormat.getDateTimeInstance(DateFormat.SHORT, DateFormat.SHORT)
                            .format(Date(version.getLong("updated"))),
                    style = MaterialTheme.typography.bodySmall,
                    color = WorkspaceMuted,
                )
                HorizontalDivider()
                Column(Modifier.weight(1f).fillMaxWidth().verticalScroll(rememberScrollState())) {
                    key(version.getString("id")) {
                        val payload = version.getJSONObject("payload")
                        when (kind) {
                            "text" ->
                                AnswerPreview(
                                    payload.getString("text"),
                                    model.tex,
                                    minimumHeight = 80.dp,
                                    diagnostics = {},
                                )
                            "photos" -> {
                                val photos = payload.getJSONArray("photos")
                                if (photos.length() == 0)
                                    Text("No attached photos", color = WorkspaceMuted)
                                for (i in 0 until photos.length()) {
                                    val p = photos.getJSONObject(i)
                                    PhotoImage(
                                        File(
                                            context.filesDir,
                                            "cloud-media/${p.getString("hash")}",
                                        ),
                                        p.getInt("rotation"),
                                        Modifier.fillMaxWidth().height(320.dp),
                                        true,
                                    )
                                }
                            }
                            "ink" -> {
                                var page by remember { mutableStateOf<InkPage?>(null) }
                                var error by remember { mutableStateOf<String?>(null) }
                                LaunchedEffect(version.getString("id")) {
                                    try {
                                        val strokes =
                                            withContext(Dispatchers.IO) {
                                                val f =
                                                    File(
                                                        context.cacheDir,
                                                        "version-${version.getString("id")}.json",
                                                    )
                                                try {
                                                    f.writeText(payload.toString())
                                                    InkFiles.read(f)
                                                } finally {
                                                    f.delete()
                                                }
                                            }
                                        page =
                                            InkPage("version") {}
                                                .apply {
                                                    this.strokes = strokes.first
                                                    height = strokes.second
                                                    loading = false
                                                }
                                    } catch (e: Exception) {
                                        error =
                                            "This handwriting version could not be opened. It has been retained."
                                    }
                                }
                                error?.let { Text(it) }
                                page?.let { p ->
                                    BoxWithConstraints(Modifier.fillMaxWidth()) {
                                        AndroidView(
                                            factory = {
                                                InkCanvas(it, p, model, 0, 0).apply {
                                                    inputEnabled = false
                                                }
                                            },
                                            modifier =
                                                Modifier.fillMaxWidth()
                                                    .height(maxWidth * (p.height / 900f)),
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                    TextButton(onClick = close) { Text("Decide later") }
                    Button(
                        onClick = {
                            model.cloud.choose(record.getString("key"), version)
                            close()
                        },
                        enabled = !model.pendingSaves,
                    ) {
                        Text("Use this version")
                    }
                }
            }
        }
    }
}
