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

    internal fun restore(json: JSONObject) {
        text = json.optString("text")
        mode = json.optString("mode", mode)
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
            store.save(this)
        }
    }

    fun mode(value: String) {
        if (!loading) {
            mode = value
            store.save(this)
        }
    }

    fun photos(value: List<AnswerPhoto>) {
        if (!loading) {
            photos = value
            store.save(this)
        }
    }

    fun retry() {
        if (loading) store.load(this) else store.save(this)
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

class AnswerStore(context: Context) {
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

    private fun file(key: String): File {
        require(key.matches(Regex("[a-z0-9-]+")))
        return File(root, "$key.json")
    }

    internal fun load(draft: AnswerDraft) {
        draft.error = null
        worker.execute {
            try {
                val f = AtomicFile(file(draft.key))
                val json =
                    try {
                        f.openRead().bufferedReader().use { JSONObject(it.readText()) }
                    } catch (e: java.io.FileNotFoundException) {
                        if (
                            file(draft.key).exists() || File(file(draft.key).path + ".bak").exists()
                        )
                            throw e
                        JSONObject()
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
                    draft.restore(json)
                    draft.loading = false
                }
            } catch (e: Exception) {
                main.post {
                    draft.error = "Could not open this answer. Its saved file has been kept."
                }
            }
        }
    }

    internal fun save(draft: AnswerDraft) {
        val bytes = draft.json().toString().toByteArray(Charsets.UTF_8)
        val revision = ++draft.revision
        draft.saving = true
        worker.execute {
            try {
                root.mkdirs()
                val target = AtomicFile(file(draft.key))
                val stream = target.startWrite()
                try {
                    stream.write(bytes)
                    target.finishWrite(stream)
                } catch (e: Exception) {
                    target.failWrite(stream)
                    throw e
                }
                main.post {
                    if (draft.revision == revision) {
                        draft.saving = false
                        draft.error = null
                    }
                }
            } catch (e: Exception) {
                main.post {
                    if (draft.revision == revision) {
                        draft.saving = false
                        draft.error = "Answer could not be saved. Free some storage and retry."
                    }
                }
            }
        }
    }

    fun close() {
        worker.shutdown()
    }
}
