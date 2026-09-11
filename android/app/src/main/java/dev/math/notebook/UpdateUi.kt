package dev.math.notebook

import android.Manifest
import android.content.SharedPreferences
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.SystemUpdate
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.work.WorkInfo
import androidx.work.WorkManager
import java.text.DateFormat
import java.util.Date
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun UpdateButton(openInitially: Boolean = false, saving: Boolean = false) {
    val context = LocalContext.current
    val prefs = remember { Updates.prefs(context) }
    var revision by remember { mutableIntStateOf(0) }
    DisposableEffect(prefs) {
        val listener = SharedPreferences.OnSharedPreferenceChangeListener { _, _ -> revision++ }
        prefs.registerOnSharedPreferenceChangeListener(listener)
        onDispose { prefs.unregisterOnSharedPreferenceChangeListener(listener) }
    }
    val release = remember(revision) { Updates.release(context) }
    val ready =
        remember(revision) {
            runCatching { AppRelease.parse(prefs.getString("ready", "")!!) }.getOrNull()
        }
    var open by rememberSaveable { mutableStateOf(openInitially) }
    val manager = remember { WorkManager.getInstance(context) }
    val checkFlow = remember { manager.getWorkInfosForUniqueWorkFlow(Updates.CHECK) }
    val downloadFlow = remember { manager.getWorkInfosForUniqueWorkFlow(Updates.DOWNLOAD) }
    val checks by checkFlow.collectAsState(emptyList())
    val downloads by downloadFlow.collectAsState(emptyList())
    val checking = checks.any { !it.state.isFinished }
    val downloading = downloads.any { !it.state.isFinished }
    var installing by remember { mutableStateOf(false) }
    var localError by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    val notificationPermission =
        rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {}
    IconButton(onClick = { open = true }) {
        BadgedBox(badge = { if (release != null) Badge() }) {
            Icon(Icons.Outlined.SystemUpdate, "App updates")
        }
    }
    if (open)
        AlertDialog(
            onDismissRequest = { open = false },
            title = { Text("Foundations updates") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    Text("Installed version ${BuildConfig.VERSION_NAME}")
                    Text(
                        when {
                            checking -> "Checking for updates… Waiting for a connection if offline."
                            release != null -> "Version ${release.version} is available."
                            prefs.getLong("checked", 0) > 0 -> "You're up to date."
                            else -> "Check for the latest version of Foundations."
                        }
                    )
                    val last = prefs.getLong("checked", 0)
                    if (last > 0)
                        Text(
                            "Last checked: ${DateFormat.getDateTimeInstance(DateFormat.SHORT, DateFormat.SHORT).format(Date(last))}",
                            style = MaterialTheme.typography.bodySmall,
                        )
                    Row {
                        Column(Modifier.weight(1f)) {
                            Text("Background checks")
                            Text(
                                "About every 12 hours when connected. Android may delay checks to save battery.",
                                style = MaterialTheme.typography.bodySmall,
                            )
                        }
                        Switch(
                            checked = prefs.getBoolean("background", true),
                            onCheckedChange = {
                                prefs.edit().putBoolean("background", it).apply()
                                Updates.schedule(context)
                            },
                        )
                    }
                    TextButton(
                        onClick = {
                            notificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
                        }
                    ) {
                        Text("Enable update notifications")
                    }
                    if (downloading) {
                        val work = downloads.firstOrNull { it.state == WorkInfo.State.RUNNING }
                        Text(
                            if (work == null) "Download queued. Waiting for a connection…"
                            else "Downloading… ${work.progress.getInt("percent", 0)}%"
                        )
                        LinearProgressIndicator(Modifier.fillMaxWidth())
                        TextButton(onClick = { manager.cancelUniqueWork(Updates.DOWNLOAD) }) {
                            Text("Cancel download")
                        }
                    }
                    (localError ?: prefs.getString("error", null))?.let {
                        Text(it, color = MaterialTheme.colorScheme.error)
                    }
                    if (release != null && !downloading) {
                        val available = ready == release && Updates.apk(context).isFile
                        Button(
                            enabled = !installing && !saving,
                            onClick = {
                                localError = null
                                if (!available) Updates.download(context, release)
                                else
                                    scope.launch {
                                        installing = true
                                        try {
                                            withContext(Dispatchers.IO) {
                                                Updates.verify(
                                                    context,
                                                    Updates.apk(context),
                                                    release,
                                                )
                                            }
                                            Updates.install(context)
                                        } catch (e: Exception) {
                                            localError = e.message ?: "Could not open the installer"
                                        } finally {
                                            installing = false
                                        }
                                    }
                            },
                        ) {
                            Text(
                                if (saving) "Saving handwriting…"
                                else if (installing) "Verifying…"
                                else if (available) "Install update"
                                else "Download update (${release.size / 1_000_000} MB)"
                            )
                        }
                        if (available)
                            Text(
                                "Android may ask you to allow updates from Foundations. Enable that permission, return here, and tap Install update again. Your notebook stays on this device.",
                                style = MaterialTheme.typography.bodySmall,
                            )
                    }
                }
            },
            confirmButton = {
                TextButton(
                    enabled = !checking && !downloading,
                    onClick = {
                        localError = null
                        Updates.check(context)
                    },
                ) {
                    Text("Check now")
                }
            },
            dismissButton = { TextButton(onClick = { open = false }) { Text("Close") } },
        )
}
