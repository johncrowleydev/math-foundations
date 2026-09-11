package dev.math.notebook

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.provider.Settings
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.FileProvider
import androidx.work.*
import java.io.File
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URI
import java.security.MessageDigest
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext
import org.json.JSONObject

data class AppRelease(
    val code: Long,
    val version: String,
    val url: String,
    val sha256: String,
    val size: Long,
) {
    fun json() =
        JSONObject()
            .put("versionCode", code)
            .put("versionName", version)
            .put("url", url)
            .put("sha256", sha256)
            .put("size", size)
            .toString()

    companion object {
        fun parse(text: String): AppRelease {
            val json = JSONObject(text)
            val release =
                AppRelease(
                    json.getLong("versionCode"),
                    json.getString("versionName"),
                    json.getString("url"),
                    json.getString("sha256"),
                    json.getLong("size"),
                )
            require(release.code in 1..Int.MAX_VALUE && release.version.length in 1..64) {
                "Invalid release version"
            }
            require(release.sha256.matches(Regex("[a-f0-9]{64}"))) { "Invalid release checksum" }
            require(release.size in 1..200_000_000) { "Invalid update size" }
            val uri = URI(release.url)
            require(
                uri.scheme == "https" &&
                    uri.host == "github.com" &&
                    uri.userInfo == null &&
                    uri.port == -1 &&
                    uri.path.startsWith("/johncrowleydev/math-foundations/releases/download/") &&
                    uri.path.endsWith(".apk")
            ) {
                "Update must come from the Foundations release repository"
            }
            return release
        }
    }
}

object Updates {
    const val FEED =
        "https://github.com/johncrowleydev/math-foundations/releases/latest/download/update.json"
    const val CHECK = "foundations-update-check"
    const val DOWNLOAD = "foundations-update-download"
    private const val PERIODIC = "foundations-periodic-updates"

    fun prefs(context: Context) = context.getSharedPreferences("updates", Context.MODE_PRIVATE)

    fun release(context: Context): AppRelease? =
        runCatching { AppRelease.parse(prefs(context).getString("release", null) ?: return null) }
            .getOrNull()
            ?.takeIf { it.code > BuildConfig.VERSION_CODE }

    fun apk(context: Context) = File(context.filesDir, "updates/foundations.apk")

    fun schedule(context: Context) {
        val manager = WorkManager.getInstance(context)
        if (prefs(context).getBoolean("background", true)) {
            manager.enqueueUniquePeriodicWork(
                PERIODIC,
                ExistingPeriodicWorkPolicy.KEEP,
                PeriodicWorkRequestBuilder<UpdateCheckWorker>(12, TimeUnit.HOURS)
                    .setInitialDelay(12, TimeUnit.HOURS)
                    .setConstraints(
                        Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()
                    )
                    .build(),
            )
        } else manager.cancelUniqueWork(PERIODIC)
    }

    fun check(context: Context) {
        WorkManager.getInstance(context)
            .enqueueUniqueWork(
                CHECK,
                ExistingWorkPolicy.KEEP,
                OneTimeWorkRequestBuilder<UpdateCheckWorker>()
                    .setConstraints(
                        Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()
                    )
                    .build(),
            )
    }

    fun download(context: Context, release: AppRelease) {
        WorkManager.getInstance(context)
            .enqueueUniqueWork(
                DOWNLOAD,
                ExistingWorkPolicy.KEEP,
                OneTimeWorkRequestBuilder<UpdateDownloadWorker>()
                    .setInputData(workDataOf("release" to release.json()))
                    .setConstraints(
                        Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()
                    )
                    .build(),
            )
    }

    // Redirects are required for GitHub Releases, but never allow a downgrade to HTTP or another
    // host.
    fun connection(url: String): HttpURLConnection {
        var next = url
        repeat(6) {
            val uri = URI(next)
            require(
                uri.scheme == "https" &&
                    uri.userInfo == null &&
                    uri.port == -1 &&
                    uri.host in
                        setOf(
                            "github.com",
                            "release-assets.githubusercontent.com",
                            "objects.githubusercontent.com",
                        )
            ) {
                "Untrusted update address"
            }
            val connection = uri.toURL().openConnection() as HttpURLConnection
            connection.instanceFollowRedirects = false
            connection.connectTimeout = 20_000
            connection.readTimeout = 30_000
            connection.setRequestProperty(
                "User-Agent",
                "Math-Foundations/${BuildConfig.VERSION_NAME}",
            )
            try {
                val status = connection.responseCode
                if (status in listOf(301, 302, 303, 307, 308)) {
                    next =
                        uri.resolve(
                                connection.getHeaderField("Location")
                                    ?: error("Missing redirect address")
                            )
                            .toString()
                    connection.disconnect()
                } else {
                    if (status != 200) throw IOException("Update service returned HTTP $status")
                    return connection
                }
            } catch (e: Exception) {
                connection.disconnect()
                throw e
            }
        }
        throw IOException("Too many update redirects")
    }

    fun verify(context: Context, file: File, release: AppRelease) {
        require(file.length() == release.size) { "Downloaded update has the wrong size" }
        val digest = MessageDigest.getInstance("SHA-256")
        file.inputStream().use { input ->
            val buffer = ByteArray(64 * 1024)
            while (true) {
                val count = input.read(buffer)
                if (count < 0) break
                digest.update(buffer, 0, count)
            }
        }
        require(digest.digest().joinToString("") { "%02x".format(it) } == release.sha256) {
            "Update checksum did not match"
        }
        val flags =
            PackageManager.PackageInfoFlags.of(PackageManager.GET_SIGNING_CERTIFICATES.toLong())
        val candidate =
            context.packageManager.getPackageArchiveInfo(file.path, flags) ?: error("Invalid APK")
        val installed = context.packageManager.getPackageInfo(context.packageName, flags)
        require(
            candidate.packageName == context.packageName &&
                candidate.longVersionCode == release.code &&
                candidate.longVersionCode > installed.longVersionCode
        ) {
            "APK is not a newer Foundations release"
        }
        val currentSigners = installed.signingInfo!!.apkContentsSigners.toSet()
        val candidateInfo = candidate.signingInfo ?: error("APK has no signing identity")
        val candidateHistory =
            if (candidateInfo.hasMultipleSigners()) candidateInfo.apkContentsSigners
            else candidateInfo.signingCertificateHistory
        require(
            currentSigners.isNotEmpty() && candidateHistory.toSet().containsAll(currentSigners)
        ) {
            "Update signing identity did not match"
        }
    }

    fun install(context: Context) {
        if (!context.packageManager.canRequestPackageInstalls()) {
            context.startActivity(
                Intent(
                    Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:${context.packageName}"),
                )
            )
            return
        }
        val file = apk(context)
        val uri = FileProvider.getUriForFile(context, "${context.packageName}.updates", file)
        context.startActivity(
            Intent(Intent.ACTION_VIEW)
                .setDataAndType(uri, "application/vnd.android.package-archive")
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        )
    }

    fun notify(context: Context, release: AppRelease) {
        val manager = context.getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(
            NotificationChannel("updates", "App updates", NotificationManager.IMPORTANCE_DEFAULT)
        )
        if (!NotificationManagerCompat.from(context).areNotificationsEnabled()) return
        val open =
            PendingIntent.getActivity(
                context,
                10,
                Intent(context, MainActivity::class.java).putExtra("showUpdates", true),
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
        try {
            manager.notify(
                10,
                NotificationCompat.Builder(context, "updates")
                    .setSmallIcon(R.drawable.ic_notebook)
                    .setContentTitle("Foundations ${release.version} is available")
                    .setContentText("Open Foundations to download and install the update.")
                    .setContentIntent(open)
                    .setAutoCancel(true)
                    .build(),
            )
        } catch (_: SecurityException) {
            /* Notification permission can be revoked between calls. */
        }
    }
}

class UpdateCheckWorker(context: Context, params: WorkerParameters) :
    CoroutineWorker(context, params) {
    override suspend fun doWork(): Result =
        withContext(Dispatchers.IO) {
            val prefs = Updates.prefs(applicationContext)
            try {
                val connection = Updates.connection(Updates.FEED)
                val text =
                    try {
                        connection.inputStream.use { input ->
                            val bytes = input.readNBytes(65_537)
                            require(bytes.size <= 65_536) { "Update manifest is too large" }
                            bytes.toString(Charsets.UTF_8)
                        }
                    } finally {
                        connection.disconnect()
                    }
                val release = AppRelease.parse(text)
                val previous = Updates.release(applicationContext)
                prefs
                    .edit()
                    .putString("release", release.json())
                    .putLong("checked", System.currentTimeMillis())
                    .remove("error")
                    .commit()
                if (release.code > BuildConfig.VERSION_CODE && previous?.code != release.code)
                    Updates.notify(applicationContext, release)
                Result.success()
            } catch (e: Exception) {
                coroutineContext.ensureActive()
                prefs
                    .edit()
                    .putString("error", "Could not check for updates. ${e.message}")
                    .commit()
                Result.failure()
            }
        }
}

class UpdateDownloadWorker(context: Context, params: WorkerParameters) :
    CoroutineWorker(context, params) {
    override suspend fun doWork(): Result =
        withContext(Dispatchers.IO) {
            val prefs = Updates.prefs(applicationContext)
            val target = Updates.apk(applicationContext)
            target.parentFile!!.mkdirs()
            val partial = File(target.parentFile, "download.part")
            try {
                val release =
                    AppRelease.parse(inputData.getString("release") ?: error("Missing release"))
                require(release.code > BuildConfig.VERSION_CODE) { "Already up to date" }
                prefs.edit().remove("error").remove("ready").commit()
                val connection = Updates.connection(release.url)
                try {
                    connection.inputStream.use { input ->
                        partial.outputStream().use { output ->
                            val buffer = ByteArray(64 * 1024)
                            var total = 0L
                            var lastProgress = -1
                            val started = System.nanoTime()
                            while (true) {
                                coroutineContext.ensureActive()
                                require(System.nanoTime() - started < TimeUnit.MINUTES.toNanos(5)) {
                                    "Update download timed out"
                                }
                                val count = input.read(buffer)
                                if (count < 0) break
                                total += count
                                require(total <= release.size) { "Update is larger than expected" }
                                output.write(buffer, 0, count)
                                val progress = (100 * total / release.size).toInt()
                                if (progress != lastProgress) {
                                    setProgress(workDataOf("percent" to progress))
                                    lastProgress = progress
                                }
                            }
                            output.fd.sync()
                        }
                    }
                } finally {
                    connection.disconnect()
                }
                Updates.verify(applicationContext, partial, release)
                check(partial.renameTo(target)) { "Could not save the update" }
                prefs.edit().putString("ready", release.json()).commit()
                Result.success()
            } catch (e: Exception) {
                coroutineContext.ensureActive()
                prefs
                    .edit()
                    .putString("error", "Could not download the update. ${e.message}")
                    .commit()
                Result.failure()
            } finally {
                partial.delete()
            }
        }
}
