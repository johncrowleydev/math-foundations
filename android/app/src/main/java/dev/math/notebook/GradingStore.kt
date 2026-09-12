package dev.math.notebook

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Matrix
import android.graphics.Paint
import android.util.AtomicFile
import androidx.compose.runtime.*
import androidx.ink.rendering.android.canvas.CanvasStrokeRenderer
import java.io.File
import java.util.UUID
import java.util.concurrent.Executors
import org.json.JSONArray
import org.json.JSONObject

/** Local recovery drafts never enter this outbox. Only Submit creates a cloud attempt. */
class GradingStore internal constructor(private val context: Context) {
    companion object {
        @Volatile private var instance: GradingStore? = null

        fun get(context: Context): GradingStore =
            instance
                ?: synchronized(this) {
                    instance ?: GradingStore(context.applicationContext).also { instance = it }
                }
    }

    private val root = File(context.filesDir, "attempts")
    private val worker = Executors.newSingleThreadExecutor()
    private val main = android.os.Handler(android.os.Looper.getMainLooper())
    private val prefs = context.getSharedPreferences("grading", 0)
    val contentVersion =
        JSONObject(
                context.assets.open("grading-version.json").bufferedReader().use { it.readText() }
            )
            .getString("version")
    var attempts by mutableStateOf<List<JSONObject>>(emptyList())
        private set

    var working by mutableStateOf<Set<String>>(emptySet())
        private set

    var errors by mutableStateOf<Map<String, String>>(emptyMap())
        private set

    var editing by mutableStateOf<Set<String>>(emptySet())
        private set

    var loading by mutableStateOf(true)
        private set

    init {
        worker.execute { refresh() }
    }

    internal fun closeForTest() {
        worker.shutdown()
        worker.awaitTermination(5, java.util.concurrent.TimeUnit.SECONDS)
    }

    fun forExercise(key: String) =
        attempts
            .filter { it.optString("exercise") == key }
            .sortedWith(
                compareBy<JSONObject> { it.optLong("submitted") }.thenBy { it.optString("id") }
            )

    fun correct(key: String) = forExercise(key).any { it.optString("verdict") == "correct" }

    fun pending(key: String) =
        forExercise(key).any {
            it.optString("status") in setOf("queued", "pending", "grading", "rechecking")
        }

    fun revealed(key: String) {
        prefs.edit().putBoolean("revealed:$key", true).apply()
    }

    fun isRevealed(key: String) = prefs.getBoolean("revealed:$key", false)

    fun hasRecoveryDraft(key: String) = prefs.getBoolean("editing:$key", false)

    fun edit(key: String) {
        prefs.edit().putBoolean("editing:$key", true).apply()
        editing = editing + key
    }

    fun stopEditing(key: String) {
        editing = editing - key
    }

    private fun write(file: File, value: JSONObject) {
        file.parentFile!!.mkdirs()
        val a = AtomicFile(file)
        val stream = a.startWrite()
        try {
            stream.write(value.toString().toByteArray(Charsets.UTF_8))
            a.finishWrite(stream)
        } catch (e: Exception) {
            a.failWrite(stream)
            throw e
        }
    }

    private fun read(file: File) =
        JSONObject(AtomicFile(file).openRead().bufferedReader().use { it.readText() })

    private fun files(folder: String) =
        File(root, folder)
            .listFiles()
            .orEmpty()
            .filter { it.name.endsWith(".json") || it.name.endsWith(".json.bak") }
            .map { File(it.path.removeSuffix(".bak")) }
            .distinct()

    private fun refresh() {
        try {
            val (values, rejected) =
                synchronized(NotebookDisk.lock) {
                    val out =
                        files("outbox").map { f ->
                            read(f)
                                .put("status", "queued")
                                .put("grades", JSONArray())
                                .put("verdict", "")
                        }
                    val rechecks = files("rechecks").map { read(it).getString("attempt") }.toSet()
                    val received =
                        files("received").map { f ->
                            read(f).also {
                                if (it.getString("id") in rechecks) it.put("status", "rechecking")
                            }
                        }
                    val failures =
                        files("rejected").associate { f ->
                            val v = read(f)
                            v.getString("exercise") to v.getString("error")
                        }
                    ((out + received).associateBy { it.getString("id") }.values.toList()) to
                        failures
                }
            main.post {
                attempts = values
                errors = errors + rejected
                loading = false
            }
        } catch (e: Exception) {
            main.post {
                errors =
                    errors +
                        ("storage" to "Could not open saved attempts. Your files have been kept.")
                loading = false
            }
        }
    }

    internal fun receive(value: JSONObject) {
        synchronized(NotebookDisk.lock) {
            write(File(root, "received/${value.getString("id")}.json"), value)
        }
        refresh()
    }

    fun submit(model: NotebookModel, q: Question) {
        val key = "${model.lesson.slug}-${q.id}"
        val draft = model.answers.draft(key, model.input.preferTyping)
        val page = model.page(key)
        if (
            loading ||
                key in working ||
                correct(key) ||
                pending(key) ||
                draft.loading ||
                page.loading ||
                draft.saving ||
                draft.error != null ||
                (draft.mode == "write" &&
                    (page.saving || page.error != null || page.activeInputs > 0))
        )
            return
        val mode = draft.mode
        if (
            (mode == "type" && draft.text.isBlank()) ||
                (mode == "write" && page.strokes.isEmpty()) ||
                (mode == "photo" && draft.photos.isEmpty())
        ) {
            errors = errors + (key to "Add a response before submitting.")
            return
        }
        val id = UUID.randomUUID().toString()
        val submission =
            JSONObject()
                .put("id", id)
                .put("exercise", key)
                .put("submitted", System.currentTimeMillis())
                .put("contentVersion", contentVersion)
                .put("mode", mode)
                .put("text", if (mode == "type") draft.text else "")
                .put("revealed", isRevealed(key))
        val strokes = page.strokes.toList()
        val paperHeight = page.height
        val photos = draft.photos.toList()
        working = working + key
        errors = errors - key
        worker.execute {
            try {
                val images = JSONArray()
                if (mode == "write") {
                    val temp = File(context.cacheDir, "submission-$id.json")
                    try {
                        InkFiles.write(temp, strokes, paperHeight)
                        submission.put("ink", read(temp))
                    } finally {
                        temp.delete()
                    }
                    // Full canonical width; crop unused vertical margins and split long work.
                    val top =
                        (strokes.minOf { s -> (0 until s.inputs.size).minOf { s.inputs[it].y } } -
                                24f)
                            .coerceAtLeast(0f)
                    val bottom =
                        (strokes.maxOf { s -> (0 until s.inputs.size).maxOf { s.inputs[it].y } } +
                                24f)
                            .coerceAtLeast(top + 100f)
                    val renderer = CanvasStrokeRenderer.create()
                    var y = if (q.columns.isNotEmpty()) 0f else top
                    while (y < bottom) {
                        val height = minOf(1000f, bottom - y)
                        val bitmap =
                            Bitmap.createBitmap(
                                1350,
                                (height * 1.5f).toInt().coerceAtLeast(1),
                                Bitmap.Config.ARGB_8888,
                            )
                        val canvas = Canvas(bitmap)
                        canvas.drawColor(Color.WHITE)
                        val matrix =
                            Matrix().apply {
                                setScale(1.5f, 1.5f)
                                postTranslate(0f, -y * 1.5f)
                            }
                        if (q.columns.isNotEmpty()) {
                            val paint =
                                Paint(Paint.ANTI_ALIAS_FLAG).apply {
                                    color = Color.LTGRAY
                                    strokeWidth = 1.5f
                                }
                            for (i in 0..q.columns.size) {
                                val x = (24f + i * 852f / q.columns.size) * 1.5f
                                canvas.drawLine(
                                    x,
                                    (12f - y) * 1.5f,
                                    x,
                                    (12f + q.rows * 52f - y) * 1.5f,
                                    paint,
                                )
                            }
                            for (i in 0..q.rows) canvas.drawLine(
                                36f,
                                (12f + i * 52f - y) * 1.5f,
                                1314f,
                                (12f + i * 52f - y) * 1.5f,
                                paint,
                            )
                        }
                        // Ink's renderer uses this matrix for brush detail, but draws in
                        // stroke coordinates. Apply the same transform to the canvas too.
                        canvas.save()
                        canvas.concat(matrix)
                        strokes.forEach { renderer.draw(canvas, it, matrix) }
                        canvas.restore()
                        images.put(storeBitmap(bitmap))
                        bitmap.recycle()
                        y += height
                    }
                } else if (mode == "photo") {
                    val originals = JSONArray()
                    photos.forEach { photo ->
                        val source = File(context.filesDir, "answer-photos/${photo.id}.jpg")
                        val bounds =
                            android.graphics.BitmapFactory.Options().apply {
                                inJustDecodeBounds = true
                            }
                        android.graphics.BitmapFactory.decodeFile(source.path, bounds)
                        var sample = 1
                        while (maxOf(bounds.outWidth, bounds.outHeight) / sample > 2400) sample *= 2
                        val bitmap =
                            android.graphics.BitmapFactory.decodeFile(
                                source.path,
                                android.graphics.BitmapFactory.Options().apply {
                                    inSampleSize = sample
                                },
                            ) ?: error("Could not read photo")
                        val matrix = Matrix()
                        when (
                            android.media
                                .ExifInterface(source.path)
                                .getAttributeInt(android.media.ExifInterface.TAG_ORIENTATION, 1)
                        ) {
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
                        matrix.postRotate(photo.rotation.toFloat())
                        val rotated =
                            Bitmap.createBitmap(
                                bitmap,
                                0,
                                0,
                                bitmap.width,
                                bitmap.height,
                                matrix,
                                true,
                            )
                        val originalHash = CloudSync.hash(source.readBytes())
                        val originalFile = File(context.filesDir, "cloud-media/$originalHash")
                        originalFile.parentFile!!.mkdirs()
                        val atomic = AtomicFile(originalFile)
                        val stream = atomic.startWrite()
                        try {
                            source.inputStream().use { it.copyTo(stream) }
                            atomic.finishWrite(stream)
                        } catch (e: Exception) {
                            atomic.failWrite(stream)
                            throw e
                        }
                        originals.put(
                            JSONObject().put("hash", originalHash).put("rotation", photo.rotation)
                        )
                        images.put(storeBitmap(rotated))
                        if (rotated !== bitmap) rotated.recycle()
                        bitmap.recycle()
                    }
                    submission.put("photos", originals)
                }
                submission.put("images", images)
                synchronized(NotebookDisk.lock) {
                    write(File(root, "outbox/$id.json"), submission)
                    File(root, "rejected/$key.json").delete()
                }
                refresh()
                main.post {
                    prefs.edit().putBoolean("editing:$key", false).apply()
                    editing = editing - key
                }
                model.cloud.syncNow()
            } catch (e: Exception) {
                main.post {
                    errors =
                        errors +
                            (key to
                                "Submission could not be saved. Your draft is still here. ${e.message.orEmpty()}")
                }
            } finally {
                main.post { working = working - key }
            }
        }
    }

    private fun storeBitmap(bitmap: Bitmap): String {
        val bytes =
            java.io.ByteArrayOutputStream().use { out ->
                check(bitmap.compress(Bitmap.CompressFormat.JPEG, 94, out))
                out.toByteArray()
            }
        val hash = CloudSync.hash(bytes)
        val file = File(context.filesDir, "cloud-media/$hash")
        file.parentFile!!.mkdirs()
        val atomic = AtomicFile(file)
        val stream = atomic.startWrite()
        try {
            stream.write(bytes)
            atomic.finishWrite(stream)
        } catch (e: Exception) {
            atomic.failWrite(stream)
            throw e
        }
        return hash
    }

    fun recheck(cloud: CloudSync, attempt: JSONObject, reason: String) {
        val key = attempt.getString("exercise")
        if (key in working || pending(key)) return
        working = working + key
        worker.execute {
            try {
                val id = UUID.randomUUID().toString()
                synchronized(NotebookDisk.lock) {
                    write(
                        File(root, "rechecks/$id.json"),
                        JSONObject()
                            .put("id", id)
                            .put("attempt", attempt.getString("id"))
                            .put("reason", reason)
                            .put("exercise", key),
                    )
                }
                refresh()
                cloud.syncNow()
            } catch (e: Exception) {
                main.post { errors = errors + (key to "Could not save the recheck request.") }
            } finally {
                main.post { working = working - key }
            }
        }
    }

    internal fun sync(cloud: CloudSync) {
        for (f in synchronized(NotebookDisk.lock) { files("outbox") }) {
            val a = synchronized(NotebookDisk.lock) { read(f) }
            try {
                val images = a.getJSONArray("images")
                for (i in 0 until images.length()) {
                    val hash = images.getString(i)
                    cloud.mediaTransfer(hash, File(context.filesDir, "cloud-media/$hash"))
                }
                val originals = a.optJSONArray("photos") ?: JSONArray()
                for (i in 0 until originals.length()) {
                    val hash = originals.getJSONObject(i).getString("hash")
                    cloud.mediaTransfer(hash, File(context.filesDir, "cloud-media/$hash"))
                }
                val result =
                    JSONObject(
                        String(cloud.request("POST", "/attempts", a.toString().toByteArray()))
                    )
                receive(result)
                synchronized(NotebookDisk.lock) { AtomicFile(f).delete() }
            } catch (e: CloudHttpError) {
                if (e.code != 409 && e.code != 400) throw e
                synchronized(NotebookDisk.lock) {
                    write(
                        File(root, "rejected/${a.getString("exercise")}.json"),
                        a.put("error", e.message),
                    )
                    AtomicFile(f).delete()
                }
            }
        }
        for (f in synchronized(NotebookDisk.lock) { files("rechecks") }) {
            val r = synchronized(NotebookDisk.lock) { read(f) }
            try {
                val body =
                    JSONObject().put("id", r.getString("id")).put("reason", r.getString("reason"))
                receive(
                    JSONObject(
                        String(
                            cloud.request(
                                "POST",
                                "/attempts/${r.getString("attempt")}/recheck",
                                body.toString().toByteArray(),
                            )
                        )
                    )
                )
                synchronized(NotebookDisk.lock) { AtomicFile(f).delete() }
            } catch (e: CloudHttpError) {
                if (e.code != 409 && e.code != 400) throw e
                main.post { errors = errors + (r.getString("exercise") to e.message.orEmpty()) }
                synchronized(NotebookDisk.lock) { AtomicFile(f).delete() }
            }
        }
        refresh()
    }

    fun copyForRetry(model: NotebookModel, attempt: JSONObject) {
        val key = attempt.getString("exercise")
        if (correct(key) || pending(key)) return
        val draft = model.answers.draft(key, model.input.preferTyping)
        if (draft.loading || model.page(key).loading) return
        val mode = attempt.getString("mode")
        if (mode == "type") {
            draft.edit(attempt.getString("text"))
            draft.mode("type")
            edit(key)
            return
        }
        working = working + key
        worker.execute {
            try {
                if (mode == "write") {
                    val f = File(context.cacheDir, "retry-${attempt.getString("id")}.json")
                    val ink =
                        try {
                            f.writeText(attempt.getJSONObject("ink").toString())
                            InkFiles.read(f)
                        } finally {
                            f.delete()
                        }
                    main.post {
                        model.page(key).replace(ink.first)
                        model.page(key).ensureHeight(ink.second)
                        draft.mode("write")
                        edit(key)
                    }
                } else {
                    val list = mutableListOf<AnswerPhoto>()
                    val photos = attempt.getJSONArray("photos")
                    for (i in 0 until photos.length()) {
                        val p = photos.getJSONObject(i)
                        val id = UUID.randomUUID().toString()
                        val target = File(context.filesDir, "answer-photos/$id.jpg")
                        target.parentFile!!.mkdirs()
                        File(context.filesDir, "cloud-media/${p.getString("hash")}").copyTo(target)
                        list.add(AnswerPhoto(id, p.getInt("rotation")))
                    }
                    main.post {
                        draft.photos(list)
                        draft.mode("photo")
                        edit(key)
                    }
                }
            } catch (e: Exception) {
                main.post {
                    errors =
                        errors +
                            (key to
                                "Could not open this response for editing. The attempt is preserved.")
                }
            } finally {
                main.post { working = working - key }
            }
        }
    }
}
