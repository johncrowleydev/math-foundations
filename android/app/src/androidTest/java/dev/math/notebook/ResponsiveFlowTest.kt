package dev.math.notebook

import android.content.pm.ActivityInfo
import android.os.SystemClock
import android.view.View
import android.view.ViewGroup
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.lifecycle.ViewModelProvider
import androidx.test.platform.app.InstrumentationRegistry
import java.io.File
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class ResponsiveFlowTest {
    @get:Rule val rule = createAndroidComposeRule<MainActivity>()
    private val model
        get() = ViewModelProvider(rule.activity)[NotebookModel::class.java]

    private fun findEditor(view: View): TexEditView? {
        if (view is TexEditView) return view
        if (view is ViewGroup)
            for (i in 0 until view.childCount) findEditor(view.getChildAt(i))?.let {
                return it
            }
        return null
    }

    private fun editor() =
        android.view.inspector.WindowInspector.getGlobalWindowViews()
            .asReversed()
            .firstNotNullOfOrNull(::findEditor)!!

    private fun capture(name: String) {
        rule.mainClock.advanceTimeBy(400)
        rule.waitForIdle()
        SystemClock.sleep(350)
        val bitmap = InstrumentationRegistry.getInstrumentation().uiAutomation.takeScreenshot()
        val config = rule.activity.resources.configuration
        val file =
            File(
                rule.activity.getExternalFilesDir(null),
                "responsive-flows/${config.screenWidthDp}x${config.screenHeightDp}-$name.png",
            )
        file.parentFile!!.mkdirs()
        file.outputStream().use {
            bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, it)
        }
        bitmap.recycle()
    }

    @Test
    fun readingReferenceAndFocusedKeyboardInBothOrientations() {
        for (orientation in
            listOf(
                ActivityInfo.SCREEN_ORIENTATION_PORTRAIT,
                ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE,
            )) {
            rule.runOnIdle {
                rule.activity.requestedOrientation = orientation
                model.select(0)
                model.position(model.lesson.slug, 0)
                model.mode(false)
                model.input.pen("hide")
                model.input.typing(true)
                if (model.input.twoFinger) model.input.toggleScroll()
                model.references.close()
            }
            rule.waitUntil(10000) {
                rule.activity.resources.configuration.orientation ==
                    if (orientation == ActivityInfo.SCREEN_ORIENTATION_PORTRAIT) 1 else 2
            }
            rule.waitForIdle()
            capture("reader")
            rule.onNodeWithTag("scroll-preference").performTouchInput { longClick() }
            assertTrue(model.input.twoFinger)
            rule.onNodeWithTag("scroll-preference").performTouchInput { longClick() }
            assertFalse(model.input.twoFinger)
            rule.runOnIdle { model.references.browse() }
            rule.onNodeWithText("Notation", useUnmergedTree = true).performClick()
            capture("reference")
            rule.runOnIdle {
                model.references.close()
                model.mode(true)
            }
            val key = "${model.lesson.slug}-${model.lesson.practiceIds.first()}"
            val draft = rule.runOnIdle { model.answers.draft(key, true) }
            rule.waitUntil(10000) { !draft.loading }
            rule.runOnIdle { draft.mode("type") }
            rule.waitForIdle()
            capture("practice")
            if (rule.onAllNodesWithTag("practice-scroll").fetchSemanticsNodes().isNotEmpty())
                rule.onNodeWithTag("practice-scroll").performScrollToIndex(0)
            // The answer toolbar scrolls horizontally; scroll the containing practice pane
            // vertically before tapping a control below a long answer and its preview.
            repeat(6) {
                if (!rule.onNodeWithContentDescription("Expand answer").isDisplayed()) {
                    rule.onNodeWithTag("practice-scroll").performTouchInput { swipeUp() }
                    rule.waitForIdle()
                }
            }
            rule.onNodeWithContentDescription("Expand answer").assertIsDisplayed().performClick()
            capture("after-expand")
            rule.waitUntil(10000) { model.focusedEditor != null }
            rule.waitForIdle()
            rule.runOnIdle {
                val v = editor()
                v.setText(
                    "I will explain each step.\n\nThe expression is \$\\frac{x^{2}}{3}\$.\n\nMy next step: "
                )
                v.setSelection(v.text.length)
                v.requestFocus()
                val keyboard =
                    rule.activity.getSystemService(android.content.Context.INPUT_METHOD_SERVICE)
                        as android.view.inputmethod.InputMethodManager
                keyboard.showSoftInput(v, android.view.inputmethod.InputMethodManager.SHOW_IMPLICIT)
            }
            rule.mainClock.advanceTimeBy(500)
            rule.waitForIdle()
            SystemClock.sleep(1200)
            capture("focused-keyboard")
            rule.runOnIdle {
                val v = editor()
                assertEquals(draft.text, v.text.toString())
                assertTrue(v.hasFocus())
                val bounds = android.graphics.Rect()
                assertTrue(v.getGlobalVisibleRect(bounds))
                assertTrue(bounds.height() > 32)
                val keyboard =
                    rule.activity.getSystemService(android.content.Context.INPUT_METHOD_SERVICE)
                        as android.view.inputmethod.InputMethodManager
                keyboard.hideSoftInputFromWindow(v.windowToken, 0)
            }
            SystemClock.sleep(400)
            rule.onNodeWithText("Done").performClick()
            rule.waitForIdle()
            rule.runOnIdle { assertTrue(draft.text.contains("\\frac")) }
        }
    }
}
