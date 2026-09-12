package dev.math.notebook

import android.content.Context
import android.content.ContextWrapper
import android.content.SharedPreferences
import java.io.File
import java.net.ServerSocket
import java.net.URL
import java.util.UUID
import org.json.JSONObject
import org.junit.*
import org.junit.Assert.*
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

/** Runs two isolated Android stores against the actual Go API, never the deployed notebook. */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [33], shadows = [CloudSyncTest.PosixAtomicFile::class])
class CloudSyncTest {
    /**
     * Android rename(2) replaces an existing file; Windows File.renameTo does not. Keep
     * Robolectric's commit behavior equivalent to the real Android filesystem.
     */
    @org.robolectric.annotation.Implements(android.util.AtomicFile::class)
    class PosixAtomicFile {
        @org.robolectric.annotation.RealObject private lateinit var atomic: android.util.AtomicFile

        @org.robolectric.annotation.Implementation
        fun finishWrite(stream: java.io.FileOutputStream?) {
            if (stream == null) return
            stream.fd.sync()
            stream.close()
            val target = atomic.baseFile.toPath()
            java.nio.file.Files.move(
                File(atomic.baseFile.path + ".new").toPath(),
                target,
                java.nio.file.StandardCopyOption.REPLACE_EXISTING,
            )
        }
    }

    private lateinit var provider: ServerSocket
    private val gradingStores = mutableListOf<GradingStore>()
    private lateinit var process: Process
    private lateinit var endpoint: String
    private val clients = mutableListOf<CloudSync>()
    private val stores = mutableListOf<AnswerStore>()
    private lateinit var root: File
    private val token = "integration-test-key"

    private class Device(context: Context, private val root: File) : ContextWrapper(context) {
        private val prefix = UUID.randomUUID().toString()

        override fun getFilesDir() = File(root, "files").apply { mkdirs() }

        override fun getCacheDir() = File(root, "cache").apply { mkdirs() }

        override fun getSharedPreferences(name: String, mode: Int): SharedPreferences =
            baseContext.getSharedPreferences("$prefix:$name", mode)
    }

    @Before
    fun start() {
        val binary = System.getenv("CLOUD_TEST_SERVER")
        Assume.assumeTrue(
            "Set CLOUD_TEST_SERVER to run Android/Go integration tests",
            binary != null,
        )
        root = kotlin.io.path.createTempDirectory("cloud-contract").toFile()
        provider = ServerSocket(0)
        Thread {
                while (!provider.isClosed) {
                    try {
                        provider.accept().use { socket ->
                            val input = socket.getInputStream().buffered()
                            val header = StringBuilder()
                            while (!header.endsWith("\r\n\r\n")) {
                                val v = input.read()
                                if (v < 0) break
                                header.append(v.toChar())
                            }
                            val length =
                                Regex("Content-Length: ([0-9]+)", RegexOption.IGNORE_CASE)
                                    .find(header)
                                    ?.groupValues
                                    ?.get(1)
                                    ?.toInt() ?: 0
                            input.readNBytes(length)
                            val body =
                                JSONObject()
                                    .put("model", "z-ai/glm-5.3-flash")
                                    .put(
                                        "choices",
                                        org.json
                                            .JSONArray()
                                            .put(
                                                JSONObject()
                                                    .put(
                                                        "message",
                                                        JSONObject()
                                                            .put(
                                                                "content",
                                                                """{"verdict":"correct","feedback":"Synthetic fixture accepted.","issue":"","improvement":"","transcription":""}""",
                                                            ),
                                                    )
                                            ),
                                    )
                                    .toString()
                                    .toByteArray()
                            socket.getOutputStream().apply {
                                write(
                                    "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: ${body.size}\r\nConnection: close\r\n\r\n"
                                        .toByteArray()
                                )
                                write(body)
                                flush()
                            }
                        }
                    } catch (_: java.io.IOException) {}
                }
            }
            .apply {
                isDaemon = true
                start()
            }
        val port = ServerSocket(0).use { it.localPort }
        endpoint = "http://127.0.0.1:$port"
        process =
            ProcessBuilder(binary!!)
                .apply {
                    environment()["FOUNDATIONS_DATA"] = File(root, "server").path
                    environment()["FOUNDATIONS_ADDR"] = "127.0.0.1:$port"
                    System.getenv("CLOUD_TEST_CATALOG")?.let {
                        environment()["FOUNDATIONS_CATALOG"] = it
                    }
                    environment()["OPENROUTER_API_KEY"] = "synthetic-key"
                    environment()["FOUNDATIONS_GRADING_URL"] =
                        "http://127.0.0.1:${provider.localPort}/"
                    environment()["FOUNDATIONS_KEY_HASH"] = CloudSync.hash(token.toByteArray())
                    redirectErrorStream(true)
                    redirectOutput(File(root, "server.log"))
                }
                .start()
        var up = false
        repeat(100) {
            if (!up) {
                up =
                    runCatching {
                            (URL("$endpoint/api/v1/status").openConnection()
                                    as java.net.HttpURLConnection)
                                .run {
                                    val c = responseCode
                                    disconnect()
                                    c == 401
                                }
                        }
                        .getOrDefault(false)
                if (!up) Thread.sleep(50)
            }
        }
        assertTrue("Go API did not start", up)
    }

    @After
    fun stop() {
        stores.forEach { it.close() }
        gradingStores.forEach { it.closeForTest() }
        if (::provider.isInitialized) provider.close()
        org.robolectric.Shadows.shadowOf(android.os.Looper.getMainLooper()).idle()
        clients.forEach { it.closeForTest() }
        if (::process.isInitialized) {
            process.destroy()
            process.waitFor()
        }
        if (::root.isInitialized) root.deleteRecursively()
    }

    private fun device(name: String) = Device(RuntimeEnvironment.getApplication(), File(root, name))

    private fun client(context: Context): CloudSync {
        context.getSharedPreferences("cloud-sync", 0).edit().putBoolean("connected", true).commit()
        return CloudSync(context, endpoint, token, false).also { clients.add(it) }
    }

    private fun answer(context: Context, text: String, mode: String = "type") {
        File(context.filesDir, "answers/logic-1.json").apply {
            parentFile!!.mkdirs()
            writeText(
                JSONObject()
                    .put("version", 1)
                    .put("text", text)
                    .put("mode", mode)
                    .put("photos", org.json.JSONArray())
                    .toString()
            )
        }
    }

    private fun sync(c: CloudSync) {
        org.robolectric.Shadows.shadowOf(android.os.Looper.getMainLooper()).idle()
        val ok = c.backgroundSync()
        org.robolectric.Shadows.shadowOf(android.os.Looper.getMainLooper()).idle()
        assertTrue(c.lastFailure?.stackTraceToString(), ok)
    }

    private fun text(context: Context) =
        JSONObject(File(context.filesDir, "answers/logic-1.json").readText()).getString("text")

    @Test
    fun existingWorkConflictIndependentInkAndResolutionSurviveRestart() {
        val a = device("tablet")
        val b = device("phone")
        answer(a, "tablet", "write")
        answer(b, "phone")
        val ca = client(a)
        var cb = client(b)
        sync(ca)
        sync(cb)
        sync(ca)
        val r = ca.versions("text/logic-1")!!
        assertEquals(1, r.getJSONArray("conflicts").length())
        assertEquals(2, r.getJSONArray("versions").length())
        // Select the phone copy; retained tablet work remains in the versions library.
        val versions = r.getJSONArray("versions")
        val selected =
            (0 until versions.length())
                .map { versions.getJSONObject(it) }
                .first { it.getJSONObject("payload").getString("text") == "phone" }
        ca.choose("text/logic-1", selected)
        sync(ca)
        sync(cb)
        assertEquals("${ca.lastFailure}\n${ca.journalForTest("text/logic-1")}", "phone", text(a))
        assertEquals("phone", text(b))
        assertEquals(
            "write",
            JSONObject(File(a.filesDir, "answers/logic-1.json").readText()).getString("mode"),
        )
        cb.closeForTest()
        clients.remove(cb)
        cb = client(b)
        File(a.filesDir, "ink/logic-1.json").apply {
            parentFile!!.mkdirs()
            writeText("""{"version":1,"height":800,"strokes":[]} """.trim())
        }
        // An explicit ink edit is distinct from typed work (empty ink needs an existing baseline).
        answer(b, "new phone text")
        sync(cb)
        sync(ca)
        assertEquals("new phone text", text(a))
        assertTrue(ca.versions("text/logic-1")!!.getJSONArray("versions").length() >= 2)
    }

    @Test
    fun blankDeviceCannotEraseAndOpenEditorDefersRemoteProjection() {
        val a = device("tablet")
        val b = device("phone")
        answer(a, "important work")
        answer(b, "")
        val ca = client(a)
        val cb = client(b)
        sync(ca)
        cb.hold("text/logic-1")
        sync(cb)
        assertEquals("", text(b))
        cb.release("text/logic-1")
        sync(cb)
        assertEquals(cb.journalForTest("text/logic-1"), "important work", text(b))
        answer(b, "")
        sync(cb)
        sync(ca)
        assertEquals("", text(a))
    }

    @Test
    fun photosQuickChecksTutorialPreferencesAndBookmarksSyncWithoutDeviceSettings() {
        val a = device("tablet")
        val b = device("phone")
        answer(a, "")
        val photo =
            File(a.filesDir, "answer-photos/photo-1.jpg").apply {
                parentFile!!.mkdirs()
                writeBytes(ByteArray(1024) { (it % 251).toByte() })
            }
        val f = File(a.filesDir, "answers/logic-1.json")
        f.writeText(
            JSONObject(f.readText())
                .put("photos", org.json.JSONArray("""[{"id":"photo-1","rotation":90}]"""))
                .toString()
        )
        a.getSharedPreferences("notebook", 0)
            .edit()
            .putBoolean("input:twoFinger", true)
            .putBoolean("tex:visible:v2:logic", true)
            .putInt("position:logic", 4)
            .putString("reading-anchor:logic", "question:1")
            .putString("reading-section:logic", "section:intro")
            .commit()
        a.getSharedPreferences("quick-checks", 0)
            .edit()
            .putInt("logic:quick-1:choice", 2)
            .putBoolean("logic:quick-1:revealed", true)
            .commit()
        val ca = client(a)
        val cb = client(b)
        ca.reading("logic", "question:1", "section:intro")
        sync(ca)
        sync(cb)
        assertArrayEquals(
            photo.readBytes(),
            File(b.filesDir, "answer-photos/photo-1.jpg").readBytes(),
        )
        assertEquals(
            90,
            JSONObject(File(b.filesDir, "answers/logic-1.json").readText())
                .getJSONArray("photos")
                .getJSONObject(0)
                .getInt("rotation"),
        )
        assertEquals(
            2,
            b.getSharedPreferences("quick-checks", 0).getInt("logic:quick-1:choice", -1),
        )
        assertTrue(b.getSharedPreferences("notebook", 0).getBoolean("tex:visible:v2:logic", false))
        assertFalse(b.getSharedPreferences("notebook", 0).contains("input:twoFinger"))
        assertNotNull(cb.versions("reading/${ca.device}:logic"))
    }

    @Test
    fun saveBeforeJournalNotificationRecoversAfterRestartAndAuthFailureKeepsWork() {
        val a = device("tablet")
        answer(a, "first")
        val ca = client(a)
        sync(ca)
        ca.closeForTest()
        clients.remove(ca)
        answer(a, "saved while offline")
        val next = client(a)
        sync(next)
        assertEquals(
            "saved while offline",
            next.versions("text/logic-1")!!.getJSONObject("payload").getString("text"),
        )
        val bad = CloudSync(device("bad"), endpoint, "wrong", false)
        clients.add(bad)
        val b = device("other")
        answer(b, "safe")
        val wrong = CloudSync(b, endpoint, "wrong", false)
        clients.add(wrong)
        b.getSharedPreferences("cloud-sync", 0).edit().putBoolean("connected", true).commit()
        wrong.backgroundSync()
        assertEquals("safe", text(b))
    }

    @Test
    fun lostAcknowledgmentReplaysTheSameOperationAfterRestart() {
        val proxy = ServerSocket(0)
        val upstream = endpoint
        val relay =
            kotlin.concurrent.thread(isDaemon = true) {
                while (!proxy.isClosed) {
                    try {
                        proxy.accept().use { socket ->
                            socket.soTimeout = 5000
                            val input = socket.getInputStream().buffered()
                            fun line(): String {
                                val out = StringBuilder()
                                while (true) {
                                    val c = input.read()
                                    if (c < 0 || c == 10) return out.toString().trimEnd('\r')
                                    out.append(c.toChar())
                                }
                            }
                            val request = line().split(' ')
                            var length = 0
                            while (true) {
                                val header = line()
                                if (header.isEmpty()) break
                                if (header.startsWith("Content-Length:", true))
                                    length = header.substringAfter(':').trim().toInt()
                            }
                            val body = ByteArray(length)
                            java.io.DataInputStream(input).readFully(body)
                            val c =
                                URL(upstream + request[1]).openConnection()
                                    as java.net.HttpURLConnection
                            try {
                                c.requestMethod = request[0]
                                c.setRequestProperty("Authorization", "Bearer $token")
                                c.doOutput = true
                                c.setFixedLengthStreamingMode(length)
                                c.outputStream.use { it.write(body) }
                                c.inputStream.use { it.readBytes() }
                                // Commit at the real service, then close without returning its ACK.
                            } finally {
                                c.disconnect()
                            }
                        }
                    } catch (e: java.io.IOException) {
                        if (proxy.isClosed) break
                    }
                }
            }
        try {
            val a = device("interrupted")
            answer(a, "saved despite a lost reply")
            a.getSharedPreferences("cloud-sync", 0).edit().putBoolean("connected", true).commit()
            val interrupted = CloudSync(a, "http://127.0.0.1:${proxy.localPort}", token, false)
            clients.add(interrupted)
            assertFalse(interrupted.backgroundSync())
            interrupted.closeForTest()
            clients.remove(interrupted)
            val recovered = client(a)
            sync(recovered)
            val record = recovered.versions("text/logic-1")!!
            assertEquals(1L, record.getLong("revision"))
            assertEquals(0, record.getJSONArray("conflicts").length())
            assertEquals("saved despite a lost reply", text(a))
        } finally {
            proxy.close()
            relay.join(5000)
        }
    }

    @Test
    fun editsInAnOpenAnswerUseItsDisplayedRevisionNotAnUnseenRemoteRevision() {
        val tablet = device("tablet-open")
        val phone = device("phone-edit")
        answer(tablet, "shared starting point")
        val a = client(tablet)
        val b = client(phone)
        sync(a)
        sync(b)
        a.hold("text/logic-1")
        answer(phone, "phone's new explanation")
        sync(b)
        sync(a)
        assertEquals("shared starting point", text(tablet))
        answer(tablet, "tablet's independent explanation")
        sync(a)
        val record = a.versions("text/logic-1")!!
        assertEquals(1, record.getJSONArray("conflicts").length())
        val versions = record.getJSONArray("versions")
        val texts =
            (0 until versions.length()).map {
                versions.getJSONObject(it).getJSONObject("payload").getString("text")
            }
        assertTrue(
            texts.containsAll(listOf("phone's new explanation", "tablet's independent explanation"))
        )
    }

    private fun drainUntil(condition: () -> Boolean) {
        val end = System.currentTimeMillis() + 5000
        while (!condition() && System.currentTimeMillis() < end) {
            org.robolectric.Shadows.shadowOf(android.os.Looper.getMainLooper()).idle()
            Thread.sleep(10)
        }
        assertTrue("Local answer writer did not settle", condition())
    }

    @Test
    fun legacyAnswersImportButNewRecoveryDraftsNeverSync() {
        val tablet = device("cached-tablet")
        val phone = device("cached-phone")
        answer(tablet, "", "write")
        answer(phone, "Phone explanation")
        val a = client(tablet)
        val b = client(phone)
        val store = AnswerStore(tablet, a).also { stores.add(it) }
        val draft = store.draft("logic-1", false)
        drainUntil { !draft.loading }
        // An exercise is visible, but only actual ink input is protected. Text/photos
        // still arrive while the user writes with the pen.
        a.hold("ink/logic-1")
        sync(b)
        sync(a)
        assertEquals("Phone explanation", draft.text)
        assertEquals("write", draft.mode)
        assertEquals(0, a.incomingCount)
        draft.mode("type")
        drainUntil { !draft.saving }
        assertEquals("Phone explanation", text(tablet))

        // A different representation arriving while typing must not reset the text.
        a.hold("text/logic-1")
        draft.edit("Tablet draft")
        drainUntil { !draft.saving }
        File(phone.filesDir, "answer-photos/remote.jpg").apply {
            parentFile!!.mkdirs()
            writeBytes(ByteArray(64) { it.toByte() })
        }
        val f = File(phone.filesDir, "answers/logic-1.json")
        f.writeText(
            JSONObject(f.readText())
                .put("photos", org.json.JSONArray("""[{"id":"remote","rotation":90}]"""))
                .toString()
        )
        sync(b)
        sync(a)
        assertEquals("Tablet draft", draft.text)
        assertEquals(listOf(AnswerPhoto("remote", 90)), draft.photos)
        draft.edit("Tablet final")
        draft.mode("write")
        drainUntil { !draft.saving }
        a.release("text/logic-1")
        a.release("ink/logic-1")
        sync(a)
        sync(b)
        assertEquals("Phone explanation", text(phone))
        assertEquals(
            "Tablet final",
            JSONObject(File(tablet.filesDir, "draft-answers/logic-1.json").readText())
                .getString("text"),
        )
        assertEquals(
            "remote",
            JSONObject(File(tablet.filesDir, "answers/logic-1.json").readText())
                .getJSONArray("photos")
                .getJSONObject(0)
                .getString("id"),
        )
        assertEquals(0, a.versions("text/logic-1")!!.getJSONArray("conflicts").length())
    }

    @Test
    fun incomingStatusIsHonestAndDownloadedTextAppliesOfflineAfterEditingEnds() {
        val tablet = device("offline-tablet")
        val phone = device("offline-phone")
        answer(tablet, "Original")
        val a = client(tablet)
        val b = client(phone)
        sync(a)
        sync(b)
        val store = AnswerStore(tablet, a).also { stores.add(it) }
        val draft = store.draft("logic-1", true)
        drainUntil { !draft.loading }
        a.hold("text/logic-1")
        answer(phone, "New explanation")
        sync(b)
        sync(a)
        assertEquals("Original", draft.text)
        assertEquals(1, a.incomingCount)
        assertEquals("Downloaded changes waiting for editing to finish", a.status)
        process.destroy()
        process.waitFor()
        a.release("text/logic-1")
        org.robolectric.Shadows.shadowOf(android.os.Looper.getMainLooper()).idle()
        assertEquals("New explanation", draft.text)
        assertEquals("New explanation", text(tablet))
        assertEquals(0, a.incomingCount)
    }

    @Test
    fun submittedAttemptsAndGradesSyncWhileUnsubmittedDraftsStayLocal() {
        Assume.assumeTrue(System.getenv("CLOUD_TEST_CATALOG") != null)
        val tablet = device("attempt-tablet")
        val phone = device("attempt-phone")
        val a = client(tablet)
        val b = client(phone)
        val ga =
            GradingStore(tablet).also {
                gradingStores.add(it)
                a.attemptStore = it
            }
        val gb =
            GradingStore(phone).also {
                gradingStores.add(it)
                b.attemptStore = it
            }
        drainUntil { !ga.loading && !gb.loading }
        val key = "propositional-logic-1"
        val local = AnswerStore(tablet, a).also { stores.add(it) }.draft(key, true)
        drainUntil { !local.loading }
        local.edit("Do not upload this recovery draft.")
        drainUntil { !local.saving }
        sync(a)
        sync(b)
        assertFalse(File(phone.filesDir, "answers/$key.json").exists())
        assertNull(a.versions("text/$key"))
        val id = UUID.randomUUID().toString()
        val payload =
            JSONObject()
                .put("id", id)
                .put("exercise", key)
                .put("submitted", System.currentTimeMillis())
                .put("contentVersion", ga.contentVersion)
                .put("mode", "type")
                .put("text", "A submitted synthetic response.")
                .put("images", org.json.JSONArray())
                .put("revealed", false)
        File(tablet.filesDir, "attempts/outbox/$id.json").apply {
            parentFile!!.mkdirs()
            writeText(payload.toString())
        }
        sync(a)
        sync(b)
        drainUntil { gb.forExercise(key).isNotEmpty() }
        assertEquals(payload.getString("text"), gb.forExercise(key).single().getString("text"))
        assertFalse(File(tablet.filesDir, "attempts/outbox/$id.json").exists())
        val deadline = System.currentTimeMillis() + 8000
        while (!gb.correct(key) && System.currentTimeMillis() < deadline) {
            Thread.sleep(250)
            sync(b)
        }
        assertTrue("Server grade did not arrive", gb.correct(key))
        sync(a)
        assertTrue(ga.correct(key))
        val rejected =
            JSONObject(payload.toString())
                .put("id", UUID.randomUUID().toString())
                .put("text", "Offline work submitted after completion")
        File(phone.filesDir, "attempts/outbox/${rejected.getString("id")}.json").apply {
            parentFile!!.mkdirs()
            writeText(rejected.toString())
        }
        sync(b)
        assertEquals(1, gb.forExercise(key).size)
        assertTrue(
            File(phone.filesDir, "attempts/rejected/$key.json")
                .readText()
                .contains("Offline work submitted after completion")
        )
        assertEquals("Do not upload this recovery draft.", local.text)
    }
}
