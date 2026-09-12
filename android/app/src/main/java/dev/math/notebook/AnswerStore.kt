package dev.math.notebook

import android.content.Context
import android.util.AtomicFile
import androidx.compose.runtime.*
import java.io.File
import java.util.concurrent.Executors
import org.json.JSONArray
import org.json.JSONObject

/** Separate from legacy ink: no migration rewrites an existing handwriting file. */
class AnswerDraft(val key: String, private val store: AnswerStore, typing: Boolean) {
    var text by mutableStateOf("")
        private set

    var mode by mutableStateOf(if (typing) "type" else "write")
        private set

    var photos by mutableStateOf<List<AnswerPhoto>>(emptyList())
        private set

    var loading by mutableStateOf(true)
        internal set

    var saving by mutableStateOf(false)
        internal set

    var error by mutableStateOf<String?>(null)
        internal set

    internal var revision = 0

    internal fun restore(json: JSONObject, field: String? = null) {
        if (field == null || field == "text") text = json.optString("text")
        if (field == null || field == "mode") mode = json.optString("mode", mode)
        if (field == null || field == "photos")
            photos =
                json.optJSONArray("photos")?.let { a ->
                    (0 until a.length()).map { i ->
                        val p = a.getJSONObject(i)
                        AnswerPhoto(p.getString("id"), p.optInt("rotation", 0))
                    }
                } ?: emptyList()
    }

    fun edit(value: String) {
        if (!loading) {
            text = value
            store.save(this, "text")
        }
    }

    fun mode(value: String) {
        if (!loading) {
            mode = value
            store.save(this, "mode")
        }
    }

    fun photos(value: List<AnswerPhoto>) {
        if (!loading) {
            photos = value
            store.save(this, "photos")
        }
    }

    fun retry() {
        if (loading) store.load(this) else store.retry(this)
    }

    internal fun json() =
        JSONObject()
            .put("version", 1)
            .put("text", text)
            .put("mode", mode)
            .put(
                "photos",
                JSONArray().apply {
                    photos.forEach {
                        put(JSONObject().put("id", it.id).put("rotation", it.rotation))
                    }
                },
            )
}

data class AnswerPhoto(val id: String, val rotation: Int = 0)

class AnswerStore(context: Context, private val cloud: CloudSync = CloudSync.get(context)) {
    private val root = File(context.filesDir, "answers")
    private val worker = Executors.newSingleThreadExecutor()
    private val main = android.os.Handler(android.os.Looper.getMainLooper())
    private val drafts = mutableStateMapOf<String, AnswerDraft>()
    val pending
        get() = drafts.values.any { it.saving || it.error != null }

    val error
        get() = drafts.values.firstOrNull { it.error != null }?.error

    fun retry() {
        drafts.values.filter { it.error != null }.forEach { it.retry() }
    }

    fun draft(key: String, typing: Boolean): AnswerDraft =
        drafts.getOrPut(key) { AnswerDraft(key, this, typing).also { load(it) } }

    private val dirty = mutableMapOf<Pair<String, String>, Int>()
    private val failed = mutableSetOf<Pair<String, String>>()
    private val listener: (String) -> Unit = { record ->
        val field = record.substringBefore('/')
        if (field == "text" || field == "photos") refresh(record.substringAfter('/'), field)
    }

    init {
        cloud.listen(listener)
    }

    private fun refresh(key: String, field: String) {
        drafts[key]?.let { draft ->
            // Called synchronously with cloud projection on the UI thread. Only this field
            // changes; a remote photo never resets a typed draft, local mode, or cursor.
            synchronized(NotebookDisk.lock) { draft.restore(read(key), field) }
        }
    }

    private fun read(key: String): JSONObject =
        try {
            AtomicFile(file(key)).openRead().bufferedReader().use { JSONObject(it.readText()) }
        } catch (e: java.io.FileNotFoundException) {
            if (file(key).exists() || File(file(key).path + ".bak").exists()) throw e
            JSONObject().put("version", 1)
        }

    internal fun retry(draft: AnswerDraft) {
        dirty.keys.filter { it.first == draft.key }.map { it.second }.forEach { save(draft, it) }
    }

    private fun file(key: String): File {
        require(key.matches(Regex("[a-z0-9-]+")))
        return File(root, "$key.json")
    }

    internal fun load(draft: AnswerDraft) {
        draft.error = null
        val revision = draft.revision
        cloud.hold("text/${draft.key}")
        cloud.hold("photos/${draft.key}")
        worker.execute {
            try {
                val f = AtomicFile(file(draft.key))
                val json =
                    synchronized(NotebookDisk.lock) {
                        try {
                            f.openRead().bufferedReader().use { JSONObject(it.readText()) }
                        } catch (e: java.io.FileNotFoundException) {
                            if (
                                file(draft.key).exists() ||
                                    File(file(draft.key).path + ".bak").exists()
                            )
                                throw e
                            JSONObject()
                        }
                    }
                require(json.optInt("version", 1) == 1) { "Unsupported answer version" }
                require(
                    !json.has("mode") || json.getString("mode") in setOf("type", "write", "photo")
                )
                json.optJSONArray("photos")?.let { photos ->
                    for (i in 0 until photos.length()) {
                        val photo = photos.getJSONObject(i)
                        require(photo.getString("id").matches(Regex("[a-zA-Z0-9-]+")))
                        require(photo.optInt("rotation", 0) in setOf(0, 90, 180, 270))
                    }
                }
                main.post {
                    if (draft.revision == revision) {
                        draft.restore(json)
                        draft.loading = false
                    }
                    cloud.release("text/${draft.key}")
                    cloud.release("photos/${draft.key}")
                }
            } catch (e: Exception) {
                main.post {
                    draft.error = "Could not open this answer. Its saved file has been kept."
                    cloud.release("text/${draft.key}")
                    cloud.release("photos/${draft.key}")
                }
            }
        }
    }

    internal fun save(draft: AnswerDraft, field: String) {
        val value = draft.json().get(field)
        val revision = ++draft.revision
        val record = draft.key to field
        if (dirty.put(record, revision) == null && field != "mode")
            cloud.hold("$field/${draft.key}")
        failed.remove(record)
        draft.saving = true
        worker.execute {
            val failure =
                runCatching {
                        synchronized(NotebookDisk.lock) {
                            root.mkdirs()
                            // Merge only the edited field into the latest file. A mode change or
                            // photo attachment must never write an obsolete text snapshot back.
                            val json = read(draft.key).put(field, value)
                            val target = AtomicFile(file(draft.key))
                            val stream = target.startWrite()
                            try {
                                stream.write(json.toString().toByteArray(Charsets.UTF_8))
                                target.finishWrite(stream)
                            } catch (e: Exception) {
                                target.failWrite(stream)
                                throw e
                            }
                        }
                    }
                    .exceptionOrNull()
            main.post {
                if (dirty[record] == revision) {
                    if (failure == null) {
                        dirty.remove(record)
                        if (field != "mode") cloud.release("$field/${draft.key}")
                        failed.remove(record)
                    } else {
                        failed.add(record)
                    }
                    draft.error =
                        if (failed.any { it.first == draft.key })
                            "Answer could not be saved. Free some storage and retry."
                        else null
                    draft.saving = dirty.keys.any { it.first == draft.key && it !in failed }
                }
            }
            if (failure == null) cloud.changed()
        }
    }

    fun close() {
        cloud.unlisten(listener)
        worker.shutdown()
    }
}
