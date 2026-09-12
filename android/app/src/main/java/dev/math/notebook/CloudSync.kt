package dev.math.notebook

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.os.Handler
import android.os.Looper
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.AtomicFile
import android.util.Base64
import androidx.compose.runtime.*
import androidx.work.*
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.security.KeyStore
import java.security.MessageDigest
import java.util.UUID
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import org.json.JSONArray
import org.json.JSONObject

/**
 * All local snapshot writers and cloud projections use this same short-lived lock. Network IO never
 * holds it. The journal survives process death; files remain the offline source.
 */
object NotebookDisk {
    val lock = Any()
}

internal class CloudCredential(private val context: Context) {
    private val prefs = context.getSharedPreferences("cloud-credential", 0)

    private fun key(): SecretKey {
        val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        return (store.getKey("foundations-cloud", null) as? SecretKey)
            ?: KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
                .apply {
                    init(
                        KeyGenParameterSpec.Builder(
                                "foundations-cloud",
                                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
                            )
                            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                            .build()
                    )
                }
                .generateKey()
    }

    fun save(value: String) {
        val cipher =
            Cipher.getInstance("AES/GCM/NoPadding").apply { init(Cipher.ENCRYPT_MODE, key()) }
        val bytes = cipher.doFinal(value.toByteArray())
        check(
            prefs
                .edit()
                .putString("iv", Base64.encodeToString(cipher.iv, Base64.NO_WRAP))
                .putString("value", Base64.encodeToString(bytes, Base64.NO_WRAP))
                .commit()
        )
    }

    fun read(): String? {
        val value = prefs.getString("value", null) ?: return null
        val cipher =
            Cipher.getInstance("AES/GCM/NoPadding").apply {
                init(
                    Cipher.DECRYPT_MODE,
                    key(),
                    GCMParameterSpec(128, Base64.decode(prefs.getString("iv", ""), Base64.NO_WRAP)),
                )
            }
        return String(cipher.doFinal(Base64.decode(value, Base64.NO_WRAP)))
    }

    fun clear() {
        prefs.edit().clear().commit()
    }
}

class CloudSync
internal constructor(
    private val context: Context,
    private val endpoint: String = ENDPOINT,
    private val testKey: String? = null,
    schedule: Boolean = true,
) {
    companion object {
        const val ENDPOINT = "https://foundations.johncrowley.dev"
        @Volatile private var instance: CloudSync? = null

        fun get(context: Context): CloudSync =
            instance
                ?: synchronized(this) {
                    instance ?: CloudSync(context.applicationContext).also { instance = it }
                }

        internal fun hash(bytes: ByteArray) =
            MessageDigest.getInstance("SHA-256").digest(bytes).joinToString("") {
                "%02x".format(it)
            }
    }

    private val executor = Executors.newSingleThreadScheduledExecutor()
    private val main = Handler(Looper.getMainLooper())
    private val prefs = context.getSharedPreferences("cloud-sync", 0)
    private val notebook = context.getSharedPreferences("notebook", 0)
    private val quick = context.getSharedPreferences("quick-checks", 0)
    private val credential = CloudCredential(context)
    private val db =
        SQLiteDatabase.openOrCreateDatabase(File(context.filesDir, "cloud-journal.db"), null)
            .apply {
                execSQL(
                    "CREATE TABLE IF NOT EXISTS state(key TEXT PRIMARY KEY, revision INTEGER NOT NULL DEFAULT 0, record TEXT, baseline TEXT, pending TEXT, base INTEGER NOT NULL DEFAULT 0)"
                )
                val columns =
                    rawQuery("PRAGMA table_info(state)", null).use { c ->
                        buildList { while (c.moveToNext()) add(c.getString(1)) }
                    }
                if ("base" !in columns)
                    execSQL("ALTER TABLE state ADD COLUMN base INTEGER NOT NULL DEFAULT 0")
            }
    val device: String =
        prefs.getString("device", null)
            ?: UUID.randomUUID().toString().also { prefs.edit().putString("device", it).commit() }
    private val label =
        "${android.os.Build.MANUFACTURER} ${android.os.Build.MODEL} · ${device.take(6)}"
    var connected by mutableStateOf(prefs.getBoolean("connected", false))
        private set

    var status by mutableStateOf(if (connected) "Waiting to sync" else "Not connected")
        private set

    var lastSync by mutableLongStateOf(prefs.getLong("last", 0))
        private set

    var pendingCount by mutableIntStateOf(0)
        private set

    var incomingCount by mutableIntStateOf(0)
        private set

    var conflicts by mutableStateOf<List<JSONObject>>(emptyList())
        private set

    var histories by mutableStateOf<List<JSONObject>>(emptyList())
        private set

    var resume by mutableStateOf<JSONObject?>(null)
        private set

    var generation by mutableIntStateOf(0)
        private set

    private val leases = mutableMapOf<String, Int>()
    private val listeners = mutableListOf<(String) -> Unit>()
    @Volatile private var foreground = false
    @Volatile private var pausedAuth = false
    private var ticks = 0
    private var running = false
    @Volatile internal var lastFailure: Exception? = null
    private val mediaHashes = mutableMapOf<String, Pair<String, String>>()
    private val prefListener =
        android.content.SharedPreferences.OnSharedPreferenceChangeListener { _, _ -> changed() }

    init {
        executor.execute { refreshStatus() }
        notebook.registerOnSharedPreferenceChangeListener(prefListener)
        quick.registerOnSharedPreferenceChangeListener(prefListener)
        if (schedule)
            executor.scheduleWithFixedDelay(
                { if (foreground && ++ticks % 15 == 0) runSync() },
                2,
                2,
                TimeUnit.SECONDS,
            )
        val request =
            PeriodicWorkRequestBuilder<CloudWorker>(15, TimeUnit.MINUTES)
                .setConstraints(
                    Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()
                )
                .build()
        if (schedule)
            WorkManager.getInstance(context)
                .enqueueUniquePeriodicWork(
                    "foundations-cloud",
                    ExistingPeriodicWorkPolicy.KEEP,
                    request,
                )
    }

    fun foreground(value: Boolean) {
        foreground = value
        if (value) syncNow()
    }

    fun listen(listener: (String) -> Unit) {
        synchronized(NotebookDisk.lock) { listeners.add(listener) }
    }

    fun unlisten(listener: (String) -> Unit) {
        synchronized(NotebookDisk.lock) { listeners.remove(listener) }
    }

    fun hold(key: String) {
        synchronized(NotebookDisk.lock) { leases[key] = (leases[key] ?: 0) + 1 }
    }

    fun release(key: String) {
        synchronized(NotebookDisk.lock) {
            val n = (leases[key] ?: 1) - 1
            if (n <= 0) leases.remove(key) else leases[key] = n
        }
        // Downloaded work can be applied when editing ends, even without a network.
        main.post {
            if (db.isOpen) {
                try {
                    projectAll()
                    refreshStatus()
                } catch (e: Exception) {
                    showError(e)
                }
            }
        }
        changed()
    }

    private var scheduled: java.util.concurrent.ScheduledFuture<*>? = null

    @Synchronized
    fun changed() {
        scheduled?.cancel(false)
        scheduled = executor.schedule({ runSync() }, 2, TimeUnit.SECONDS)
    }

    fun connect(key: String) {
        executor.execute {
            try {
                require(key.matches(Regex("[a-fA-F0-9]{64}"))) { "Enter the 64-character API key." }
                request("GET", "/status", key = key)
                credential.save(key)
                pausedAuth = false
                prefs.edit().putBoolean("connected", true).commit()
                main.post { connected = true }
                runSync()
            } catch (e: Exception) {
                showError(e)
            }
        }
    }

    fun disconnect() {
        executor.execute {
            credential.clear()
            prefs.edit().putBoolean("connected", false).commit()
            pausedAuth = false
            main.post {
                connected = false
                status = "Not connected"
            }
        }
    }

    fun syncNow() {
        executor.execute {
            pausedAuth = false
            runSync()
        }
    }

    fun backgroundSync(): Boolean = executor.submit<Boolean> { runSync() }.get()

    private class AuthError : Exception("API key was rejected. Re-enter it in Cloud sync settings.")

    private fun request(
        method: String,
        path: String,
        bytes: ByteArray? = null,
        key: String? = testKey ?: credential.read(),
    ): ByteArray {
        require(!key.isNullOrEmpty()) { "Enter your API key to connect." }
        val c = URL("$endpoint/api/v1$path").openConnection() as HttpURLConnection
        try {
            c.requestMethod = method
            c.instanceFollowRedirects = false
            c.connectTimeout = 15000
            c.readTimeout = 120000
            c.setRequestProperty("Authorization", "Bearer $key")
            if (bytes != null) {
                c.doOutput = true
                c.setFixedLengthStreamingMode(bytes.size)
                c.setRequestProperty("Content-Type", "application/json")
                c.outputStream.use { it.write(bytes) }
            }
            val code = c.responseCode
            if (code == 401) throw AuthError()
            if (method == "HEAD" && code == 404) return byteArrayOf(0)
            check(code in 200..299) { "Cloud sync returned HTTP $code. Your local work is safe." }
            return if (method == "HEAD") byteArrayOf(1) else c.inputStream.use { it.readBytes() }
        } finally {
            c.disconnect()
        }
    }

    private fun mediaTransfer(id: String, source: File? = null): File {
        require(id.matches(Regex("[a-f0-9]{64}")))
        val cache = File(context.filesDir, "cloud-media/$id")
        if (source == null && cache.exists()) return cache
        val c = URL("$endpoint/api/v1/media/$id").openConnection() as HttpURLConnection
        val temporary = File(context.cacheDir, "sync-$id.part")
        try {
            c.requestMethod = if (source == null) "GET" else "PUT"
            c.connectTimeout = 15000
            c.readTimeout = 120000
            c.instanceFollowRedirects = false
            c.setRequestProperty("Authorization", "Bearer ${testKey ?: credential.read()}")
            if (source != null) {
                c.doOutput = true
                c.setFixedLengthStreamingMode(source.length())
                source.inputStream().use { input -> c.outputStream.use { input.copyTo(it) } }
            }
            if (c.responseCode == 401) throw AuthError()
            check(c.responseCode in 200..299) { "Photo transfer interrupted. It will retry." }
            if (source == null) {
                c.inputStream.use { input -> temporary.outputStream().use { input.copyTo(it) } }
                check(fileHash(temporary) == id) { "Photo verification failed. It will retry." }
                cache.parentFile!!.mkdirs()
                check(temporary.renameTo(cache)) { "Could not store photo. Check free space." }
            }
            return cache
        } finally {
            c.disconnect()
            temporary.delete()
        }
    }

    private fun fileHash(file: File): String {
        val signature = "${file.length()}:${file.lastModified()}"
        mediaHashes[file.path]
            ?.takeIf { it.first == signature }
            ?.let {
                return it.second
            }
        val digest = MessageDigest.getInstance("SHA-256")
        file.inputStream().use { input ->
            val b = ByteArray(65536)
            while (true) {
                val n = input.read(b)
                if (n < 0) break
                digest.update(b, 0, n)
            }
        }
        return digest
            .digest()
            .joinToString("") { "%02x".format(it) }
            .also { mediaHashes[file.path] = signature to it }
    }

    private fun read(file: File) =
        JSONObject(AtomicFile(file).openRead().bufferedReader().use { it.readText() })

    private fun write(file: File, json: JSONObject) {
        file.parentFile!!.mkdirs()
        val a = AtomicFile(file)
        val out = a.startWrite()
        try {
            out.write(json.toString().toByteArray())
            a.finishWrite(out)
        } catch (e: Exception) {
            a.failWrite(out)
            throw e
        }
    }

    private fun state(key: String): JSONObject? =
        db.rawQuery(
                "SELECT revision,record,baseline,pending,base FROM state WHERE key=?",
                arrayOf(key),
            )
            .use {
                if (!it.moveToFirst()) null
                else
                    JSONObject().put("revision", it.getLong(0)).put("base", it.getLong(4)).apply {
                        for ((index, name) in
                            listOf(1 to "record", 2 to "baseline", 3 to "pending")) if (
                            !it.isNull(index)
                        )
                            put(name, it.getString(index))
                    }
            }

    private fun states(): List<Pair<String, JSONObject>> =
        db.rawQuery("SELECT key FROM state", null)
            .use { buildList { while (it.moveToNext()) add(it.getString(0)) } }
            .map { it to state(it)!! }

    private fun capture(key: String, payload: JSONObject, meaningful: Boolean = true) {
        val old = state(key)
        val value = payload.toString()
        if (
            !meaningful && old?.optString("baseline").isNullOrEmpty() ||
                old?.optString("baseline") == value
        )
            return
        val pending =
            JSONObject()
                .put("id", UUID.randomUUID().toString())
                .put("key", key)
                .put("base", old?.optLong("base") ?: 0)
                .put("payload", payload)
                .put("device", label)
                .put("resolve", false)
        if (old == null)
            db.execSQL(
                "INSERT INTO state(key,baseline,pending) VALUES(?,?,?)",
                arrayOf(key, value, pending.toString()),
            )
        else
            db.execSQL(
                "UPDATE state SET baseline=?,pending=? WHERE key=?",
                arrayOf(value, pending.toString(), key),
            )
    }

    private fun scan() =
        synchronized(NotebookDisk.lock) {
            snapshots("answers").forEach { f ->
                scanRecord("text/${f.nameWithoutExtension}")
                scanRecord("photos/${f.nameWithoutExtension}")
            }
            snapshots("ink").forEach { f -> scanRecord("ink/${f.nameWithoutExtension}") }
            quick.all.keys
                .map { it.substringBeforeLast(':') }
                .distinct()
                .forEach { scanRecord("quick/$it") }
            notebook.all.keys.forEach { k ->
                when {
                    k.startsWith("tex:visible:v2:") -> scanRecord("preference/$k")
                    k.startsWith("position:") -> scanRecord("practice/$k")
                }
            }
            notebook.all.keys
                .filter { it.startsWith("reading-anchor:") }
                .forEach { key ->
                    val slug = key.removePrefix("reading-anchor:")
                    val activity =
                        prefs.getString("activity:$slug", null)?.let { JSONObject(it) }
                            ?: JSONObject()
                                .put("slug", slug)
                                .put("anchor", notebook.getString(key, "intro"))
                                .put(
                                    "section",
                                    notebook.getString("reading-section:$slug", "intro"),
                                )
                                .put("at", 1)
                    capture("reading/$device:$slug", activity)
                }
        }

    /**
     * Recheck only a candidate's local file before integrating it; never rescan the whole notebook
     * on the UI thread when a keystroke or stroke finishes.
     */
    private fun scanRecord(key: String) {
        val kind = key.substringBefore('/')
        val id = key.substringAfter('/')
        when (kind) {
            "text",
            "photos",
            "ink" -> {
                val file =
                    File(context.filesDir, "${if (kind == "ink") "ink" else "answers"}/$id.json")
                if (!file.exists() && !File(file.path + ".bak").exists()) return
                val data = read(file)
                when (kind) {
                    "text" ->
                        capture(
                            key,
                            JSONObject().put("text", data.optString("text")),
                            data.optString("text").isNotEmpty(),
                        )
                    "ink" -> capture(key, data, data.optJSONArray("strokes")?.length() != 0)
                    else -> {
                        val items = JSONArray()
                        photos(data).forEach { p ->
                            val image =
                                File(context.filesDir, "answer-photos/${p.getString("id")}.jpg")
                            check(image.exists()) {
                                "A saved photo is missing; its attachment has been kept."
                            }
                            items.put(
                                JSONObject()
                                    .put("id", p.getString("id"))
                                    .put("rotation", p.optInt("rotation"))
                                    .put("hash", fileHash(image))
                            )
                        }
                        capture(key, JSONObject().put("photos", items), items.length() > 0)
                    }
                }
            }
            "quick" ->
                if (quick.contains("$id:choice") || quick.contains("$id:revealed"))
                    capture(
                        key,
                        JSONObject()
                            .put("choice", quick.getInt("$id:choice", -1))
                            .put("revealed", quick.getBoolean("$id:revealed", false)),
                    )
            "preference" ->
                if (notebook.contains(id))
                    capture(key, JSONObject().put("value", notebook.getBoolean(id, false)))
            "practice" ->
                if (notebook.contains(id))
                    capture(key, JSONObject().put("value", notebook.getInt(id, 0)))
        }
    }

    private fun snapshots(directory: String): List<File> =
        File(context.filesDir, directory)
            .listFiles()
            .orEmpty()
            .filter { it.name.endsWith(".json") || it.name.endsWith(".json.bak") }
            .map { File(it.path.removeSuffix(".bak")) }
            .distinct()

    fun reading(slug: String, anchor: String, section: String) {
        val old = prefs.getString("activity", null)?.let { JSONObject(it) }
        if (
            old?.optString("slug") == slug &&
                old.optString("anchor") == anchor &&
                System.currentTimeMillis() - old.optLong("at") < 30000
        )
            return
        val value =
            JSONObject()
                .put("slug", slug)
                .put("anchor", anchor)
                .put("section", section)
                .put("at", System.currentTimeMillis())
                .toString()
        prefs.edit().putString("activity", value).putString("activity:$slug", value).apply()
        changed()
    }

    fun dismissResume() {
        prefs.edit().putLong("dismissed", System.currentTimeMillis()).apply()
        resume = null
    }

    private fun photos(payload: JSONObject): List<JSONObject> =
        payload.optJSONArray("photos")?.let { a ->
            (0 until a.length()).map { a.getJSONObject(it) }
        } ?: emptyList()

    private fun uploadPhotos(m: JSONObject) {
        if (!m.getString("key").startsWith("photos/")) return
        photos(m.getJSONObject("payload")).forEach { p ->
            val id = p.getString("hash")
            if (request("HEAD", "/media/$id")[0].toInt() == 0)
                mediaTransfer(id, File(context.filesDir, "answer-photos/${p.getString("id")}.jpg"))
        }
    }

    private fun downloadPhotos(record: JSONObject) {
        if (!record.getString("key").startsWith("photos/")) return
        val versions = record.getJSONArray("versions")
        for (i in 0 until versions.length()) photos(
                versions.getJSONObject(i).getJSONObject("payload")
            )
            .forEach { mediaTransfer(it.getString("hash")) }
    }

    private fun accept(record: JSONObject) =
        synchronized(NotebookDisk.lock) {
            val key = record.getString("key")
            val previous = state(key)
            if (previous == null)
                db.execSQL(
                    "INSERT INTO state(key,revision,record) VALUES(?,?,?)",
                    arrayOf(key, record.getLong("revision"), record.toString()),
                )
            else if (record.getLong("revision") >= previous.optLong("revision"))
                db.execSQL(
                    "UPDATE state SET revision=?,record=? WHERE key=?",
                    arrayOf(record.getLong("revision"), record.toString(), key),
                )
        }

    private fun project(key: String, payload: JSONObject, force: Boolean = false): Boolean {
        val id = key.substringAfter('/')
        val kind = key.substringBefore('/')
        if (!force && kind in listOf("text", "ink", "photos") && (leases[key] ?: 0) > 0)
            return false
        when (kind) {
            "text",
            "photos" -> {
                val f = File(context.filesDir, "answers/$id.json")
                val a = if (f.exists()) read(f) else JSONObject().put("version", 1)
                if (kind == "text") a.put("text", payload.getString("text"))
                else {
                    val ps = JSONArray()
                    photos(payload).forEach { p ->
                        require(p.getString("id").matches(Regex("[a-zA-Z0-9-]+")))
                        val target =
                            File(context.filesDir, "answer-photos/${p.getString("id")}.jpg")
                        if (!target.exists()) {
                            target.parentFile!!.mkdirs()
                            val atomic = AtomicFile(target)
                            val out = atomic.startWrite()
                            try {
                                File(context.filesDir, "cloud-media/${p.getString("hash")}")
                                    .inputStream()
                                    .use { it.copyTo(out) }
                                atomic.finishWrite(out)
                            } catch (e: Exception) {
                                atomic.failWrite(out)
                                throw e
                            }
                        }
                        ps.put(
                            JSONObject()
                                .put("id", p.getString("id"))
                                .put("rotation", p.getInt("rotation"))
                        )
                    }
                    a.put("photos", ps)
                }
                write(f, a)
            }
            "ink" -> write(File(context.filesDir, "ink/$id.json"), payload)
            "quick" ->
                check(
                    quick
                        .edit()
                        .putInt("$id:choice", payload.getInt("choice"))
                        .putBoolean("$id:revealed", payload.getBoolean("revealed"))
                        .commit()
                )
            "preference" ->
                check(notebook.edit().putBoolean(id, payload.getBoolean("value")).commit())
            "practice" -> check(notebook.edit().putInt(id, payload.getInt("value")).commit())
        }
        // File, cached answer, and integrated revision change in one main-thread turn.
        // No keystroke/stroke can use an old screen with the new server revision.
        check(Looper.myLooper() == Looper.getMainLooper())
        generation++
        listeners.toList().forEach { it(key) }
        return true
    }

    private fun projectAll() =
        synchronized(NotebookDisk.lock) {
            states().forEach { (key, s) ->
                if (
                    !s.optString("pending").isNullOrEmpty() || s.optString("record").isNullOrEmpty()
                )
                    return@forEach
                val payload = JSONObject(s.getString("record")).getJSONObject("payload")
                if (s.optString("baseline") != payload.toString()) {
                    if ((leases[key] ?: 0) > 0) return@forEach
                    scanRecord(key)
                    if (!state(key)?.optString("pending").isNullOrEmpty()) return@forEach
                    if (!project(key, payload)) return@forEach
                }
                db.execSQL(
                    "UPDATE state SET baseline=?,base=? WHERE key=?",
                    arrayOf<Any>(payload.toString(), s.getLong("revision"), key),
                )
            }
        }

    fun versions(key: String): JSONObject? =
        synchronized(NotebookDisk.lock) {
            state(key)?.optString("record")?.takeIf { it.isNotEmpty() }?.let { JSONObject(it) }
        }

    fun choose(key: String, version: JSONObject) {
        main.post {
            try {
                synchronized(NotebookDisk.lock) {
                    scan()
                    val s = state(key) ?: return@post
                    check((leases[key] ?: 0) == 0) {
                        "Finish editing this answer before choosing a version."
                    }
                    val payload = version.getJSONObject("payload")
                    check(s.optString("pending").isNullOrEmpty()) {
                        "Sync your latest changes before choosing a version."
                    }
                    val m =
                        JSONObject()
                            .put("id", UUID.randomUUID().toString())
                            .put("key", key)
                            .put("base", s.getLong("revision"))
                            .put("payload", payload)
                            .put("device", label)
                            .put("resolve", true)
                    // Journal first. Projection after a crash is safe: pending payload remains
                    // authoritative.
                    db.execSQL(
                        "UPDATE state SET pending=?,baseline=? WHERE key=?",
                        arrayOf(m.toString(), payload.toString(), key),
                    )
                    project(key, payload, true)
                }
                executor.execute { runSync() }
            } catch (e: Exception) {
                showError(e)
            }
        }
    }

    private fun refreshStatus() {
        val all = states()
        val unresolved =
            all.mapNotNull { (_, s) ->
                    s.optString("record").takeIf { it.isNotEmpty() }?.let { JSONObject(it) }
                }
                .filter { it.getJSONArray("conflicts").length() > 0 }
        val incoming =
            all.count { (_, s) ->
                s.optString("pending").isEmpty() &&
                    s.optString("record").isNotEmpty() &&
                    s.optString("baseline") !=
                        JSONObject(s.getString("record")).getJSONObject("payload").toString()
            }
        val n = all.count { it.second.optString("pending").isNotEmpty() }
        val local = prefs.getString("activity", null)?.let { JSONObject(it).optLong("at") } ?: 0
        val remote =
            all.filter {
                    it.first.startsWith("reading/") && !it.first.startsWith("reading/$device:")
                }
                .mapNotNull {
                    it.second
                        .optString("record")
                        .takeIf { s -> s.isNotEmpty() }
                        ?.let { s -> JSONObject(s).getJSONObject("payload") }
                }
                .filter { it.optLong("at") > maxOf(local, prefs.getLong("dismissed", 0)) }
                .maxByOrNull { it.optLong("at") }
        val history =
            all.mapNotNull { (_, s) ->
                    s.optString("record").takeIf { it.isNotEmpty() }?.let { JSONObject(it) }
                }
                .filter { it.getJSONArray("versions").length() > 1 }
        main.post {
            conflicts = unresolved
            histories = history
            pendingCount = n
            incomingCount = incoming
            resume = remote
            if (connected && lastFailure == null)
                status =
                    when {
                        n > 0 -> "Changes waiting to sync"
                        incoming > 0 -> "Downloaded changes waiting for editing to finish"
                        unresolved.isNotEmpty() -> "Answer versions need your attention"
                        else -> "Up to date"
                    }
        }
    }

    private fun runSync(): Boolean {
        if (running || !prefs.getBoolean("connected", false) || pausedAuth) return true
        running = true
        main.post { status = "Syncing…" }
        try {
            // Reconcile even if a process died between a local save and its journal notification.
            scan()
            states().forEach { (_, s) ->
                val p = s.optString("pending")
                if (p.isNotEmpty()) {
                    val m = JSONObject(p)
                    uploadPhotos(m)
                    val r =
                        JSONObject(
                            String(request("POST", "/mutations", m.toString().toByteArray()))
                        )
                    downloadPhotos(r)
                    accept(r)
                    synchronized(NotebookDisk.lock) {
                        db.execSQL(
                            "UPDATE state SET pending=NULL,base=? WHERE key=? AND pending=?",
                            arrayOf(
                                if (
                                    r.getJSONObject("payload").toString() ==
                                        m.getJSONObject("payload").toString()
                                )
                                    r.getLong("revision")
                                else m.getLong("base"),
                                m.getString("key"),
                                p,
                            ),
                        )
                    }
                }
            }
            var more: Boolean
            do {
                val result =
                    JSONObject(
                        String(request("GET", "/changes?after=${prefs.getLong("cursor",0)}"))
                    )
                val records = result.getJSONArray("records")
                for (i in 0 until records.length()) {
                    val r = records.getJSONObject(i)
                    downloadPhotos(r)
                    accept(r)
                }
                check(prefs.edit().putLong("cursor", result.getLong("cursor")).commit())
                more = result.getBoolean("more")
            } while (more)
            val now = System.currentTimeMillis()
            prefs.edit().putLong("last", now).commit()
            main.post {
                if (db.isOpen)
                    try {
                        projectAll()
                        lastFailure = null
                        lastSync = now
                        refreshStatus()
                    } catch (e: Exception) {
                        showError(e)
                    }
            }
            return true
        } catch (e: Exception) {
            refreshStatus()
            showError(e)
            return e is AuthError
        } finally {
            running = false
        }
    }

    private fun showError(e: Exception) {
        lastFailure = e
        if (e is AuthError) pausedAuth = true
        val message =
            when (e) {
                is AuthError -> e.message!!
                is java.io.IOException ->
                    "Offline or server unavailable. Your work is saved here; sync will retry."
                else -> e.message ?: "Sync paused. Your local work is safe."
            }
        main.post { status = message }
    }

    internal fun closeForTest() {
        notebook.unregisterOnSharedPreferenceChangeListener(prefListener)
        quick.unregisterOnSharedPreferenceChangeListener(prefListener)
        executor.shutdownNow()
        executor.awaitTermination(5, TimeUnit.SECONDS)
        db.close()
    }

    internal fun journalForTest(key: String) = state(key).toString()
}

class CloudWorker(context: Context, params: WorkerParameters) : Worker(context, params) {
    override fun doWork(): Result =
        try {
            if (CloudSync.get(applicationContext).backgroundSync()) Result.success()
            else Result.retry()
        } catch (e: Exception) {
            Result.retry()
        }
}
