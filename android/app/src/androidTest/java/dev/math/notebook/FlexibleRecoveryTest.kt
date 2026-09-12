package dev.math.notebook

import android.content.Context
import android.content.ContextWrapper
import android.view.View
import android.view.ViewGroup
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.lifecycle.ViewModelProvider
import java.io.File
import java.util.UUID
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class FlexibleRecoveryTest {
    @get:Rule val rule = createAndroidComposeRule<MainActivity>()
    private val model
        get() = ViewModelProvider(rule.activity)[NotebookModel::class.java]

    private fun editor(v: View): TexEditView? {
        if (v is TexEditView) return v
        if (v is ViewGroup)
            for (i in 0 until v.childCount) editor(v.getChildAt(i))?.let {
                return it
            }
        return null
    }

    @Test
    fun inputDefaultsAndExplicitOverridesSurviveDeviceChanges() {
        val name = "input-test-" + UUID.randomUUID()
        val context =
            object : ContextWrapper(rule.activity) {
                override fun getSharedPreferences(n: String, mode: Int) =
                    super.getSharedPreferences(name, mode)
            }
        rule.runOnIdle {
            val fresh = InputPreferences(context)
            assertEquals(fresh.detected, fresh.twoFinger)
            assertEquals(!fresh.detected, fresh.preferTyping)
            fresh.toggleScroll()
            fresh.typing(!fresh.preferTyping)
            val scroll = fresh.twoFinger
            val typing = fresh.preferTyping
            fresh.pen("hide")
            assertFalse(fresh.showPen)
            fresh.onInputDeviceAdded(-99)
            fresh.onInputDeviceChanged(-99)
            fresh.onInputDeviceRemoved(-99)
            assertEquals(scroll, fresh.twoFinger)
            assertEquals(typing, fresh.preferTyping)
            val restored = InputPreferences(context)
            assertEquals(scroll, restored.twoFinger)
            assertEquals(typing, restored.preferTyping)
            assertFalse(restored.showPen)
            restored.pen("show")
            assertTrue(restored.showPen)
            context
                .getSharedPreferences("notebook", 0)
                .edit()
                .clear()
                .putString("lesson", "sets")
                .commit()
            val legacy = InputPreferences(context)
            assertTrue(legacy.twoFinger)
            assertFalse(legacy.preferTyping)
        }
    }

    @Test
    fun failedAtomicSaveKeepsDraftAndCanBeRetried() {
        val root = File(rule.activity.cacheDir, "failure-" + UUID.randomUUID()).apply { mkdirs() }
        val context =
            object : ContextWrapper(rule.activity) {
                override fun getFilesDir() = root
            }
        lateinit var store: AnswerStore
        lateinit var draft: AnswerDraft
        rule.runOnIdle {
            store = AnswerStore(context)
            draft = store.draft("test-1", true)
        }
        rule.waitUntil(10000) { !draft.loading }
        val obstruction =
            File(root, "answers").apply { writeText("simulate unavailable directory") }
        rule.runOnIdle { draft.edit("My unfinished $\\frac{x}{") }
        rule.waitUntil(10000) { draft.error != null }
        assertTrue(draft.text.endsWith("{ ".trim()))
        assertFalse(draft.saving)
        assertTrue(obstruction.delete())
        rule.runOnIdle { draft.retry() }
        rule.waitUntil(10000) { !draft.saving && draft.error == null }
        assertTrue(File(root, "answers/test-1.json").readText().contains("unfinished"))
        rule.runOnIdle { store.close() }
    }

    @Test
    fun photoAndUpdateProvidersRemainIndependent() {
        val context = rule.activity
        val photo =
            File(context.filesDir, "answer-photos/provider-test.jpg").apply {
                parentFile!!.mkdirs()
                writeBytes(byteArrayOf(1, 2, 3))
            }
        val apk =
            File(context.filesDir, "updates/provider-test.apk").apply {
                parentFile!!.mkdirs()
                writeBytes(byteArrayOf(4, 5, 6))
            }
        try {
            for ((authority, file) in listOf("answers" to photo, "updates" to apk)) {
                val uri =
                    androidx.core.content.FileProvider.getUriForFile(
                        context,
                        "${context.packageName}.$authority",
                        file,
                    )
                assertArrayEquals(
                    file.readBytes(),
                    context.contentResolver.openInputStream(uri)!!.use { it.readBytes() },
                )
            }
            assertThrows(IllegalArgumentException::class.java) {
                androidx.core.content.FileProvider.getUriForFile(
                    context,
                    "${context.packageName}.answers",
                    apk,
                )
            }
        } finally {
            photo.delete()
            apk.delete()
        }
    }

    @Test
    fun rotationRetainsTypedDraftSelectionUndoAndIndependentInk() {
        lateinit var draft: AnswerDraft
        lateinit var page: InkPage
        rule.runOnIdle {
            model.select(0)
            model.position(model.lesson.slug, 0)
            model.input.pen("hide")
            model.mode(true)
            val key = "${model.lesson.slug}-${model.lesson.practiceIds.first()}"
            draft = model.answers.draft(key, true)
            page = model.page(key)
        }
        rule.waitUntil(10000) { !draft.loading && !page.loading }
        val ink = page.strokes
        rule.runOnIdle { draft.mode("type") }
        rule.waitForIdle()
        val text = "Because \$x^{2}\$ is nonnegative."
        rule.runOnIdle {
            val v = editor(rule.activity.window.decorView)!!
            v.setText(text)
            v.setSelection(0)
            v.insert("First: ")
            v.setSelection(4)
        }
        rule.waitUntil(10000) { !draft.saving }
        rule.activityRule.scenario.recreate()
        rule.waitForIdle()
        rule.runOnIdle {
            val v = editor(rule.activity.window.decorView)!!
            assertEquals("First: $text", v.text.toString())
            assertEquals(4, v.selectionStart)
            assertTrue(v.onTextContextMenuItem(android.R.id.undo))
            assertEquals(text, v.text.toString())
            assertEquals(ink, page.strokes)
        }
    }

    @Test
    fun mathInsertionAndCompletionEditOnlyTheSelectedSource() {
        lateinit var draft: AnswerDraft
        rule.runOnIdle {
            model.select(0)
            model.position(model.lesson.slug, 0)
            model.mode(true)
            model.input.pen("hide")
            draft =
                model.answers.draft("propositional-logic-${model.lesson.practiceIds.first()}", true)
        }
        rule.waitUntil(10000) { !draft.loading }
        rule.runOnIdle { draft.mode("type") }
        rule.waitForIdle()
        rule.runOnIdle {
            val v = editor(rule.activity.window.decorView)!!
            v.setText("Explain x+1 here.")
            v.setSelection(8, 11)
        }
        rule.onNodeWithText("Insert math").performScrollTo().performClick()
        rule.runOnIdle { assertEquals("Explain \$x+1\$ here.", draft.text) }
        rule.runOnIdle {
            val v = editor(rule.activity.window.decorView)!!
            v.setText("\$\\ne\$")
            v.setSelection(4)
        }
        rule.onNodeWithText("\\neg").performScrollTo().performClick()
        rule.runOnIdle { assertEquals("\$\\neg \$", draft.text) }
    }

    @Test
    fun unavailableCameraAndUnreadablePhotoRemainRecoverable() {
        lateinit var draft: AnswerDraft
        rule.runOnIdle {
            model.select(0)
            model.position(model.lesson.slug, 0)
            model.mode(true)
            model.input.pen("hide")
            draft =
                model.answers.draft("propositional-logic-${model.lesson.practiceIds.first()}", true)
        }
        rule.waitUntil(10000) { !draft.loading }
        rule.runOnIdle { draft.mode("photo") }
        val original = draft.photos
        val instrumentation =
            androidx.test.platform.app.InstrumentationRegistry.getInstrumentation()
        var unavailable = true
        val monitor =
            object : android.app.Instrumentation.ActivityMonitor() {
                override fun onStartActivity(
                    intent: android.content.Intent
                ): android.app.Instrumentation.ActivityResult? {
                    if (intent.action != android.provider.MediaStore.ACTION_IMAGE_CAPTURE)
                        return null
                    if (unavailable)
                        throw android.content.ActivityNotFoundException("No camera in this test")
                    val uri =
                        intent.getParcelableExtra(
                            android.provider.MediaStore.EXTRA_OUTPUT,
                            android.net.Uri::class.java,
                        )!!
                    rule.activity.contentResolver.openOutputStream(uri)!!.use {
                        it.write(byteArrayOf(1, 2, 3))
                    }
                    return android.app.Instrumentation.ActivityResult(
                        android.app.Activity.RESULT_OK,
                        null,
                    )
                }
            }
        instrumentation.addMonitor(monitor)
        try {
            rule.onNodeWithTag("take-photo:${draft.key}").performScrollTo().performClick()
            rule.onNodeWithText("Could not open a camera.", substring = true).assertExists()
            rule.runOnIdle { assertEquals(original, draft.photos) }
            unavailable = false
            rule.onNodeWithTag("take-photo:${draft.key}").performScrollTo().performClick()
            rule.waitUntil(10000) {
                rule
                    .onAllNodesWithText(
                        "The camera returned an unreadable photo.",
                        substring = true,
                    )
                    .fetchSemanticsNodes()
                    .isNotEmpty()
            }
            rule.runOnIdle { assertEquals(original, draft.photos) }
            rule.onNodeWithTag("take-photo:${draft.key}").assertIsEnabled()
        } finally {
            instrumentation.removeMonitor(monitor)
        }
    }

    @Test
    fun clipboardLargeDraftAndIncompleteMathRemainEditable() {
        lateinit var draft: AnswerDraft
        rule.runOnIdle {
            model.select(0)
            model.position(model.lesson.slug, 0)
            model.mode(true)
            model.input.pen("hide")
            draft =
                model.answers.draft("propositional-logic-${model.lesson.practiceIds.first()}", true)
        }
        rule.waitUntil(10000) { !draft.loading }
        rule.runOnIdle { draft.mode("type") }
        rule.waitForIdle()
        val source =
            ("A step with \$x^{2}\$ and ordinary prose.\n").repeat(250) +
                "Incomplete \$\\unsupported{x"
        rule.runOnIdle {
            val v = editor(rule.activity.window.decorView)!!
            v.requestFocus()
            v.setText("Replace this")
            v.selectAll()
            val clipboard =
                rule.activity.getSystemService(Context.CLIPBOARD_SERVICE)
                    as android.content.ClipboardManager
            clipboard.setPrimaryClip(android.content.ClipData.newPlainText("Draft", source))
            assertTrue(v.onTextContextMenuItem(android.R.id.paste))
            assertEquals(source, v.text.toString())
            v.setSelection(v.text.length)
            v.colorize()
            assertTrue(
                v.text
                    .getSpans(0, v.text.length, android.text.style.UnderlineSpan::class.java)
                    .isNotEmpty()
            )
            assertTrue(v.onTextContextMenuItem(android.R.id.undo))
            assertEquals("Replace this", v.text.toString())
            assertTrue(v.onTextContextMenuItem(android.R.id.redo))
            assertEquals(source, v.text.toString())
        }
        rule.waitUntil(10000) { !draft.saving }
        rule.runOnIdle {
            assertEquals(source, draft.text)
            draft.edit("Clipboard and recovery checks complete.")
        }
    }
}
