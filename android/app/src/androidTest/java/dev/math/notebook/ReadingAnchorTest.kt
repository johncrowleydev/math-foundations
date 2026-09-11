package dev.math.notebook

import android.app.Application
import androidx.test.core.app.ApplicationProvider
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test

class ReadingAnchorTest {
    private val app
        get() = ApplicationProvider.getApplicationContext<Application>()

    private val prefs
        get() = app.getSharedPreferences("notebook", 0)

    private fun keys(model: NotebookModel, slug: String) = buildList {
        add("intro")
        model.lessons
            .first { it.slug == slug }
            .sections
            .forEach { section ->
                add("section:${section.id}")
                section.quickChecks.forEach { add("quick:${it.id}") }
                section.questionIds.forEach { add("question:$it") }
            }
        add("end")
    }

    private fun withBookmark(block: (NotebookModel, String) -> Unit) {
        val slug = "graph-theory"
        val names =
            listOf("reading-anchor", "reading-section", "reading-content", "reading", "offset")
                .map { "$it:$slug" }
        val saved = names.associateWith { prefs.all[it] }
        try {
            prefs.edit().also { editor -> names.forEach { editor.remove(it) } }.commit()
            block(NotebookModel(app), slug)
        } finally {
            prefs
                .edit()
                .also { editor ->
                    saved.forEach { (key, value) ->
                        when (value) {
                            is String -> editor.putString(key, value)
                            is Int -> editor.putInt(key, value)
                            else -> editor.remove(key)
                        }
                    }
                }
                .commit()
        }
    }

    @Test
    fun legacyBookmarkUsesPreviousOrderingAndResetsOldProseOffset() = withBookmark { model, slug ->
        val old =
            JSONObject(
                    app.assets.open("reading-order-v7.json").bufferedReader().use { it.readText() }
                )
                .getJSONArray(slug)
        val key = "section:vertices-edges-and-conventions"
        val oldIndex = (0 until old.length()).first { old.getString(it) == key }
        prefs.edit().putInt("reading:$slug", oldIndex).putInt("offset:$slug", 1200).commit()
        assertEquals(keys(model, slug).indexOf(key) to 0, model.reading(slug))
        assertEquals(key, prefs.getString("reading-anchor:$slug", null))
    }

    @Test
    fun stableAnchorRestoresOffsetAndChangedContentReturnsToSectionStart() =
        withBookmark { model, slug ->
            val index = keys(model, slug).indexOf("section:vertices-edges-and-conventions")
            model.reading(slug, index, 317)
            assertEquals(index to 317, NotebookModel(app).reading(slug))
            prefs.edit().putInt("reading-content:$slug", Int.MIN_VALUE).commit()
            assertEquals(index to 0, NotebookModel(app).reading(slug))
        }

    @Test
    fun removedItemFallsBackToItsSavedSection() = withBookmark { model, slug ->
        val index = keys(model, slug).indexOf("section:vertices-edges-and-conventions")
        model.reading(slug, index, 317)
        prefs.edit().putString("reading-anchor:$slug", "question:removed-example").commit()
        assertEquals(index to 0, NotebookModel(app).reading(slug))
    }
}
