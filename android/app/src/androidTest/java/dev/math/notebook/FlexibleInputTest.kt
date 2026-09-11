package dev.math.notebook

import android.view.View
import android.view.ViewGroup
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.lifecycle.ViewModelProvider
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class FlexibleInputTest {
    @get:Rule val rule = createAndroidComposeRule<MainActivity>()
    private val model
        get() = ViewModelProvider(rule.activity)[NotebookModel::class.java]

    private fun editor(view: View): TexEditView? {
        if (view is TexEditView) return view
        if (view is ViewGroup)
            for (i in 0 until view.childCount) editor(view.getChildAt(i))?.let {
                return it
            }
        return null
    }

    @Test
    fun nativeEditorPreservesSourceSelectionAndDraft() {
        lateinit var draft: AnswerDraft
        rule.runOnIdle {
            model.select(0)
            model.input.pen("hide")
            model.input.typing(true)
            model.mode(true)
            draft =
                model.answers.draft("propositional-logic-${model.lesson.practiceIds.first()}", true)
        }
        rule.waitUntil(10000) { !draft.loading }
        rule.runOnIdle { draft.mode("type") }
        rule.waitForIdle()
        val source = "Because \$\\frac{x^{2}}{3}\$ is nonnegative."
        rule.runOnIdle {
            val view = editor(rule.activity.window.decorView)!!
            view.setText(source)
            view.setSelection(12)
            view.colorize()
            assertEquals(12, view.selectionStart)
            assertEquals(source, view.text.toString())
            assertTrue(
                view.text
                    .getSpans(
                        0,
                        view.text.length,
                        android.text.style.ForegroundColorSpan::class.java,
                    )
                    .isNotEmpty()
            )
        }
        rule.waitUntil(10000) { !draft.saving }
        assertEquals(source, draft.text)
        rule.runOnIdle { draft.mode("write") }
        rule.waitForIdle()
        rule.runOnIdle { draft.mode("type") }
        rule.waitForIdle()
        rule.runOnIdle {
            assertEquals(source, editor(rule.activity.window.decorView)!!.text.toString())
        }
        val bitmap = InstrumentationRegistry.getInstrumentation().uiAutomation.takeScreenshot()
        java.io
            .File(rule.activity.getExternalFilesDir(null), "flexible-editor.png")
            .outputStream()
            .use { bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, it) }
        bitmap.recycle()
    }

    @Test
    fun allAuthoredSyntaxExamplesRenderWithNativeEngine() {
        val failures = mutableListOf<String>()
        model.tex.entries.forEach { entry ->
            try {
                val doc = TexSyntax.parse("$" + entry.example + "$", model.tex.commands)
                assertTrue("${entry.id}: ${doc.problems}", doc.problems.isEmpty())
                ru.noties.jlatexmath.JLatexMathDrawable.builder(entry.example).textSize(24f).build()
            } catch (e: Throwable) {
                failures += "${entry.id}: ${e.message}"
            }
        }
        assertTrue(failures.joinToString("\n"), failures.isEmpty())
    }

    @Test
    fun everyTeachingAndReferenceSyntaxExampleRenders() {
        val data =
            org.json.JSONObject(
                rule.activity.assets.open("tex-teaching.json").bufferedReader().use {
                    it.readText()
                }
            )
        val failures = mutableListOf<String>()
        val sourceExamples =
            data.getJSONArray("basics").let { a ->
                a.mapItems { a.getJSONObject(it).getString("source") }
            }
        for (source in sourceExamples) {
            val doc = TexSyntax.parse(source, model.tex.commands)
            if (doc.problems.isNotEmpty()) failures += doc.problems.toString()
            doc.blocks.forEach { block ->
                runCatching {
                        ru.noties.jlatexmath.JLatexMathDrawable.builder(
                                source.substring(block.contentStart, block.contentEnd)
                            )
                            .textSize(24f)
                            .build()
                    }
                    .onFailure { failures += it.toString() }
            }
        }
        val refs = data.getJSONArray("references")
        for (i in 0 until refs.length()) {
            val r = refs.getJSONObject(i)
            val examples = r.getJSONArray("examples")
            for (j in 0 until examples.length()) {
                val latex = examples.getString(j)
                val doc = TexSyntax.parse("$" + latex + "$", model.tex.commands)
                if (doc.problems.isNotEmpty())
                    failures += r.getString("reference") + ": " + doc.problems
                runCatching {
                        ru.noties.jlatexmath.JLatexMathDrawable.builder(latex).textSize(24f).build()
                    }
                    .onFailure { failures += r.getString("reference") + ": " + it }
            }
        }
        assertTrue(failures.joinToString("\n"), failures.isEmpty())
    }

    @Test
    fun longPressChangesOnlyLessonPreferenceAndPersists() {
        rule.runOnIdle {
            model.mode(false)
            model.input.pen("hide")
        }
        val before = model.input.twoFinger
        rule.onNodeWithTag("scroll-preference").performTouchInput { longClick() }
        rule.runOnIdle {
            assertEquals(!before, model.input.twoFinger)
            assertEquals(!before, InputPreferences(rule.activity).twoFinger)
        }
        rule.onNodeWithTag("scroll-preference").performTouchInput { longClick() }
        rule.runOnIdle { assertEquals(before, model.input.twoFinger) }
    }

    @Test
    fun scrollToggleKeepsReadingPositionAndRestoresFingerScroll() {
        rule.runOnIdle {
            model.select(0)
            model.mode(false)
            model.references.close()
            if (model.input.twoFinger) model.input.toggleScroll()
        }
        val reader = rule.onNodeWithTag("reader")
        reader.performScrollToIndex(3)
        fun offset() =
            reader
                .fetchSemanticsNode()
                .config[androidx.compose.ui.semantics.SemanticsProperties.VerticalScrollAxisRange]
                .value()
        val before = offset()
        rule.onNodeWithTag("scroll-preference").performTouchInput { longClick() }
        assertEquals(before, offset(), 0.01f)
        reader.performTouchInput { swipeUp() }
        assertEquals(before, offset(), 0.01f)
        rule.onNodeWithTag("scroll-preference").performTouchInput { longClick() }
        assertEquals(before, offset(), 0.01f)
        reader.performTouchInput { swipeUp() }
        rule.waitForIdle()
        assertTrue("One-finger scrolling must move the reader", offset() > before)
    }

    @Test
    fun highlightingPreservesImeCompositionAndUndo() {
        rule.runOnIdle {
            val view = TexEditView(rule.activity)
            view.commands = model.tex.commands
            view.setText("Reason: ")
            view.setSelection(view.text.length)
            val connection = view.onCreateInputConnection(android.view.inputmethod.EditorInfo())!!
            connection.setComposingText("$\\frac{x}{", 1)
            val before = view.text.toString()
            val start =
                android.view.inputmethod.BaseInputConnection.getComposingSpanStart(view.text)
            val end = android.view.inputmethod.BaseInputConnection.getComposingSpanEnd(view.text)
            assertTrue(start >= 0)
            view.colorize()
            assertEquals(before, view.text.toString())
            assertEquals(
                start,
                android.view.inputmethod.BaseInputConnection.getComposingSpanStart(view.text),
            )
            assertEquals(
                end,
                android.view.inputmethod.BaseInputConnection.getComposingSpanEnd(view.text),
            )
            connection.commitText("$\\frac{x}{2}$", 1)
            connection.finishComposingText()
            val committed = view.text.toString()
            view.setSelection(0)
            view.beginBatchEdit()
            view.insert("Note: ")
            view.endBatchEdit()
            view.colorize()
            assertTrue(view.onTextContextMenuItem(android.R.id.undo))
            assertEquals(committed, view.text.toString())
            assertTrue(view.onTextContextMenuItem(android.R.id.redo))
            assertEquals("Note: " + committed, view.text.toString())
            view.setSelection(2, 5)
            val saved = view.snapshot()!!
            val restored = TexEditView(rule.activity)
            restored.commands = model.tex.commands
            restored.restoreSnapshot(saved)
            assertEquals(view.text.toString(), restored.text.toString())
            assertEquals(2, restored.selectionStart)
            assertEquals(5, restored.selectionEnd)
        }
    }

    @Test
    fun typedAndPhotoMetadataSurviveStoreReloadAndBadFilesStayRecoverable() {
        val root =
            java.io
                .File(rule.activity.cacheDir, "answer-store-" + java.util.UUID.randomUUID())
                .apply { mkdirs() }
        val context =
            object : android.content.ContextWrapper(rule.activity) {
                override fun getFilesDir() = root
            }
        lateinit var store: AnswerStore
        lateinit var draft: AnswerDraft
        val source = "An unfinished answer $\\frac{x}{"
        rule.runOnIdle {
            store = AnswerStore(context)
            draft = store.draft("test-1", true)
        }
        rule.waitUntil(10000) { !draft.loading }
        rule.runOnIdle {
            draft.edit(source)
            draft.photos(listOf(AnswerPhoto("first", 90), AnswerPhoto("second", 270)))
            draft.mode("write")
        }
        rule.waitUntil(10000) { !draft.saving }
        rule.runOnIdle {
            assertNull(draft.error)
            store.close()
            store = AnswerStore(context)
            draft = store.draft("test-1", true)
        }
        rule.waitUntil(10000) { !draft.loading }
        rule.runOnIdle {
            assertEquals(source, draft.text)
            assertEquals("write", draft.mode)
            assertEquals(listOf(AnswerPhoto("first", 90), AnswerPhoto("second", 270)), draft.photos)
            store.close()
        }
        val bad = java.io.File(root, "answers/test-2.json")
        bad.writeText("{\"version\":1,\"photos\":[{}]}")
        rule.runOnIdle {
            store = AnswerStore(context)
            draft = store.draft("test-2", true)
        }
        rule.waitUntil(10000) { draft.error != null }
        assertTrue(bad.readText().contains("photos"))
        bad.writeText("{\"version\":1,\"text\":\"Recovered\"}")
        rule.runOnIdle { draft.retry() }
        rule.waitUntil(10000) { !draft.loading }
        rule.runOnIdle {
            assertEquals("Recovered", draft.text)
            store.close()
        }
    }

    @Test
    fun cameraContractSupportsCancelRetakeRotateAttachAndUndo() {
        lateinit var draft: AnswerDraft
        rule.runOnIdle {
            model.select(0)
            val q = model.lesson.practiceIds[model.position(model.lesson.slug)]
            draft = model.answers.draft("${model.lesson.slug}-$q", true)
            model.input.pen("hide")
            model.mode(true)
        }
        rule.waitUntil(10000) { !draft.loading }
        val original = draft.photos
        rule.runOnIdle { draft.mode("type") }
        var captures = 0
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val monitor =
            object : android.app.Instrumentation.ActivityMonitor() {
                override fun onStartActivity(
                    intent: android.content.Intent
                ): android.app.Instrumentation.ActivityResult? {
                    if (intent.action != android.provider.MediaStore.ACTION_IMAGE_CAPTURE)
                        return null
                    captures++
                    if (captures == 1)
                        return android.app.Instrumentation.ActivityResult(
                            android.app.Activity.RESULT_CANCELED,
                            null,
                        )
                    val uri =
                        intent.getParcelableExtra(
                            android.provider.MediaStore.EXTRA_OUTPUT,
                            android.net.Uri::class.java,
                        )!!
                    val bitmap =
                        android.graphics.Bitmap.createBitmap(
                            96,
                            128,
                            android.graphics.Bitmap.Config.ARGB_8888,
                        )
                    bitmap.eraseColor(android.graphics.Color.rgb(40, 120, 90))
                    rule.activity.contentResolver.openOutputStream(uri)!!.use {
                        bitmap.compress(android.graphics.Bitmap.CompressFormat.JPEG, 95, it)
                    }
                    bitmap.recycle()
                    return android.app.Instrumentation.ActivityResult(
                        android.app.Activity.RESULT_OK,
                        null,
                    )
                }
            }
        instrumentation.addMonitor(monitor)
        try {
            fun take() {
                rule.onNodeWithTag("take-photo:${draft.key}").performScrollTo().performClick()
            }
            take()
            rule.waitUntil(10000) {
                rule
                    .onAllNodes(hasTestTag("take-photo:${draft.key}") and isEnabled())
                    .fetchSemanticsNodes()
                    .isNotEmpty()
            }
            assertEquals(original, draft.photos)
            take()
            assertEquals("Camera contract requests", 2, captures)
            rule.waitUntil(10000) {
                rule.onAllNodesWithText("Retake").fetchSemanticsNodes().isNotEmpty()
            }
            rule.onNodeWithText("Retake").performClick()
            rule.waitUntil(10000) {
                rule.onAllNodesWithText("Attach").fetchSemanticsNodes().isNotEmpty()
            }
            rule.onNode(hasText("Rotate") and hasAnyAncestor(isDialog())).performClick()
            rule.onNodeWithText("Attach").performClick()
            rule.waitUntil(10000) { draft.photos.size == original.size + 1 && !draft.saving }
            android.os.SystemClock.sleep(
                400
            ) // Let the platform camera-preview window finish dismissing.
            val attached = draft.photos.last()
            assertEquals(90, attached.rotation)
            assertTrue(
                java.io.File(rule.activity.filesDir, "answer-photos/${attached.id}.jpg").length() >
                    0
            )
            rule.onAllNodesWithText("Enlarge").onLast().performScrollTo()
            rule.waitForIdle()
            rule.onAllNodesWithText("Enlarge").onLast().performClick()
            rule.waitUntil(10000) {
                rule.onAllNodesWithText("Close photo").fetchSemanticsNodes().isNotEmpty()
            }
            rule.onNodeWithText("Close photo").performClick()
            rule.onAllNodesWithText("Remove").onLast().performScrollTo().performClick()
            rule.runOnIdle { assertEquals(original, draft.photos) }
            rule.onNodeWithText("Undo photo removal").performScrollTo().performClick()
            rule.runOnIdle { assertEquals(attached, draft.photos.last()) }
            assertEquals(3, captures)
        } finally {
            instrumentation.removeMonitor(monitor)
            rule.runOnIdle { draft.photos(original) }
        }
    }

    @Test
    fun fingerSketchDrawsOnlyInDrawModeAndKeepsLessonPreference() {
        lateinit var draft: AnswerDraft
        lateinit var page: InkPage
        rule.runOnIdle {
            model.select(0)
            val q = model.lesson.practiceIds[model.position(model.lesson.slug)]
            val key = "${model.lesson.slug}-$q"
            draft = model.answers.draft(key, true)
            page = model.page(key)
            model.input.pen("hide")
            model.eraser = false
            model.mode(true)
        }
        rule.waitUntil(10000) { !draft.loading && !page.loading }
        rule.runOnIdle { draft.mode("type") }
        val original = page.strokes
        val scroll = model.input.twoFinger
        rule.onNodeWithText("Sketch with finger").performScrollTo().performClick()
        rule.onNodeWithTag("ink:${draft.key}").performTouchInput {
            swipe(center, center + androidx.compose.ui.geometry.Offset(80f, 20f), 500)
        }
        rule.waitUntil(10000) { page.strokes.size == original.size + 1 }
        rule.onNodeWithText("Move", substring = false).performClick()
        rule.onNodeWithTag("ink:${draft.key}").performTouchInput { swipeUp() }
        rule.runOnIdle { assertEquals(original.size + 1, page.strokes.size) }
        rule.onNodeWithText("Done", substring = false).performClick()
        rule.runOnIdle {
            assertEquals(scroll, model.input.twoFinger)
            assertEquals("type", draft.mode)
            page.replace(original)
        }
    }
}
