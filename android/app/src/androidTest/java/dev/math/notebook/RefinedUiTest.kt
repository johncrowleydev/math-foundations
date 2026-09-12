package dev.math.notebook

import android.content.pm.ActivityInfo
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.lifecycle.ViewModelProvider
import androidx.test.platform.app.InstrumentationRegistry
import java.io.File
import org.junit.Rule
import org.junit.Test

class RefinedUiTest {
    @get:Rule val rule = createAndroidComposeRule<MainActivity>()
    private val model
        get() = ViewModelProvider(rule.activity)[NotebookModel::class.java]

    private fun capture(name: String) {
        rule.mainClock.advanceTimeBy(500)
        rule.waitForIdle()
        android.os.SystemClock.sleep(650)
        rule.mainClock.advanceTimeBy(500)
        rule.waitForIdle()
        val image = InstrumentationRegistry.getInstrumentation().uiAutomation.takeScreenshot()
        val f = File(rule.activity.getExternalFilesDir(null), "refined/$name.png")
        f.parentFile!!.mkdirs()
        f.outputStream().use { image.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, it) }
        image.recycle()
    }

    @Test
    fun inspectAllWorkspaces() {
        for ((orientation, name) in
            listOf(
                ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE to "landscape",
                ActivityInfo.SCREEN_ORIENTATION_PORTRAIT to "portrait",
            )) {
            rule.runOnIdle {
                rule.activity.window.addFlags(
                    android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                )
                rule.activity.requestedOrientation = orientation
                model.select(0)
                model.position(model.lesson.slug, 0)
                model.mode(false)
                if (model.input.twoFinger) model.input.toggleScroll()
                model.input.pen("show")
                model.references.close()
                model.focusedEditor = null
                model.openTeaching("propositional-logic", "intro")
            }
            rule.waitUntil(10000) {
                rule.activity.resources.configuration.orientation ==
                    if (name == "landscape") 2 else 1
            }
            rule.onNodeWithTag("reader").performScrollToIndex(0)
            capture("$name-reader")
            rule.onNodeWithText("On this page").performClick()
            capture("$name-outline")
            rule.onNodeWithText("Close").performClick()
            if (name == "portrait") {
                rule.onNodeWithContentDescription("Choose chapter").performClick()
                capture("$name-chapters")
                rule.onNodeWithText("Close").performClick()
            }
            rule.onNodeWithTag("reader").performScrollToIndex(2)
            capture("$name-inline")
            rule.runOnIdle {
                model.select(13)
                model.openTeaching("graph-theory", "Vertices, edges, and conventions")
            }
            capture("$name-graph")
            rule.runOnIdle {
                model.references.open("term:vertex", androidx.compose.ui.unit.IntOffset(450, 300))
            }
            capture("$name-term-popover")
            rule.onNodeWithTag("full-reference").performClick()
            capture("$name-side-reference")
            rule.runOnIdle { model.references.close() }
            rule.onNodeWithText("Expand figure").performScrollTo().performClick()
            capture("$name-expanded-figure")
            rule.onNodeWithText("Done").performClick()
            rule.onNodeWithTag("input-settings").performClick()
            capture("$name-settings")
            rule.onNodeWithText("Done").performClick()

            rule.runOnIdle {
                model.select(0)
                model.position(model.lesson.slug, 0)
                model.mode(true)
            }
            val key = "${model.lesson.slug}-${model.lesson.practiceIds.first()}"
            val draft = rule.runOnIdle { model.answers.draft(key, true) }
            rule.waitUntil(10000) { !draft.loading }
            val oldText = draft.text
            val oldMode = draft.mode
            rule.runOnIdle {
                draft.mode("type")
                draft.edit("")
            }
            capture("$name-type-empty")
            rule.runOnIdle {
                draft.edit(
                    "The implication is false only when the assumption is true and the conclusion is false.\n\nIn symbols, \$p \\land \\neg q\$ describes that case."
                )
            }
            capture("$name-type-filled")
            rule.runOnIdle {
                model.focusedEditor = model.lesson.slug to model.lesson.practiceIds.first()
            }
            capture("$name-type-expanded")
            rule.onNodeWithText("Help").performClick()
            capture("$name-syntax-help")
            rule.onNodeWithText("Close").performClick()
            rule.onNodeWithText("Done").performClick()
            rule.onNodeWithText("Sketch").performScrollTo().performClick()
            capture("$name-sketch")
            rule.onNodeWithText("Move").performClick()
            capture("$name-sketch-move")
            rule.onNodeWithText("Done").performClick()
            rule.runOnIdle { draft.mode("photo") }
            capture("$name-photo")
            rule.runOnIdle {
                draft.mode(oldMode)
                draft.edit(oldText)
                model.references.browse()
            }
            capture("$name-reference")
            rule.runOnIdle {
                model.references.open("term:vertex")
                model.references.full = true
            }
            capture("$name-reference-entry")
            rule.runOnIdle { model.references.close() }
        }
    }
}
