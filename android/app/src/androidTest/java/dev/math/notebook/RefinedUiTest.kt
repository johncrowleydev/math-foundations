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

    private fun showPracticeControl(description: String) {
        repeat(8) {
            if (!rule.onNodeWithContentDescription(description).isDisplayed()) {
                rule.onNodeWithTag("practice-scroll").performTouchInput { swipeUp() }
                rule.waitForIdle()
            }
        }
        rule.onNodeWithContentDescription(description).assertIsDisplayed()
    }

    private fun capture(name: String) {
        rule.mainClock.advanceTimeBy(500)
        rule.waitForIdle()
        android.os.SystemClock.sleep(650)
        rule.mainClock.advanceTimeBy(500)
        rule.waitForIdle()
        val image = InstrumentationRegistry.getInstrumentation().uiAutomation.takeScreenshot()
        val f = File(rule.activity.getExternalFilesDir(null), "quiet/$name.png")
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
            if (rule.onAllNodesWithTag("pinned-outline").fetchSemanticsNodes().isEmpty()) {
                rule.onNodeWithText("On this page").performClick()
                capture("$name-outline")
                rule.onNodeWithText("Close").performClick()
            } else capture("$name-outline")
            if (name == "portrait") {
                rule.onNodeWithContentDescription("Choose chapter").performClick()
                capture("$name-chapters")
                rule.onNodeWithText("Close").performClick()
            }
            rule.onNodeWithTag("reader").performScrollToIndex(2)
            capture("$name-inline")
            val inlineDraft =
                rule.runOnIdle { model.answers.draft("propositional-logic-11", false) }
            rule.waitUntil(10000) { !inlineDraft.loading }
            val inlineMode = inlineDraft.mode
            rule.runOnIdle { inlineDraft.mode("write") }
            val inlineIndex =
                1 +
                    model.lesson.sections
                        .takeWhile { 11 !in it.questionIds }
                        .sumOf { 1 + it.quickChecks.size + it.questionIds.size } +
                    model.lesson.sections
                        .first { 11 in it.questionIds }
                        .let { 1 + it.quickChecks.size + it.questionIds.indexOf(11) }
            rule.onNodeWithTag("reader").performScrollToIndex(inlineIndex)
            capture("$name-inline-11-pen")
            rule.onNodeWithText("Pen", substring = false).performClick()
            capture("$name-answer-modes")
            rule.onNodeWithText("Type", substring = false).performClick()
            rule.runOnIdle { inlineDraft.mode(inlineMode) }
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
            rule.onNodeWithText("Insert symbol").performClick()
            capture("$name-symbols")
            rule.onNodeWithText("Close").performClick()
            rule.onNodeWithText("Help").performClick()
            capture("$name-syntax-help")
            rule.onNodeWithText("Close").performClick()
            rule.onNodeWithText("Done").performClick()
            rule.runOnIdle { draft.mode("write") }
            showPracticeControl("Ink settings")
            capture("$name-pen")
            rule.onNodeWithContentDescription("Ink settings").performClick()
            capture("$name-ink-settings")
            rule.onNodeWithText("Fine").performClick()
            showPracticeControl("Expand answer")
            rule.onNodeWithContentDescription("Expand answer").performClick()
            capture("$name-sketch")
            rule.onNodeWithContentDescription("Writing options").performClick()
            rule.onNodeWithText("Draw with finger").performClick()
            capture("$name-sketch-move")
            rule.onNodeWithText("Done").performClick()
            rule.runOnIdle { draft.mode("photo") }
            capture("$name-photo")
            val savedPhotos = draft.photos
            val photoId = "ui-inspection-" + java.util.UUID.randomUUID()
            val photoFile = File(rule.activity.filesDir, "answer-photos/$photoId.jpg")
            photoFile.parentFile!!.mkdirs()
            val photo =
                android.graphics.Bitmap.createBitmap(
                    800,
                    600,
                    android.graphics.Bitmap.Config.ARGB_8888,
                )
            val canvas = android.graphics.Canvas(photo)
            canvas.drawColor(android.graphics.Color.WHITE)
            val paint =
                android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
                    color = android.graphics.Color.DKGRAY
                    textSize = 36f
                }
            canvas.drawText("Example written work", 50f, 80f, paint)
            canvas.drawText("x + 1 = 3", 50f, 180f, paint)
            canvas.drawText("x = 2", 50f, 250f, paint)
            photoFile.outputStream().use {
                photo.compress(android.graphics.Bitmap.CompressFormat.JPEG, 90, it)
            }
            photo.recycle()
            rule.runOnIdle { draft.photos(listOf(AnswerPhoto(photoId, 0))) }
            capture("$name-photo-attached")
            rule.onNodeWithText("Enlarge").performScrollTo().performClick()
            capture("$name-photo-enlarged")
            rule.onNodeWithText("Done").performClick()
            rule.onNodeWithText("Remove").performScrollTo().performClick()
            capture("$name-photo-removed")
            rule.onNodeWithText("Undo photo removal").performClick()
            rule.runOnIdle { draft.photos(savedPhotos) }
            photoFile.delete()
            rule.onNodeWithContentDescription("App updates").performClick()
            capture("$name-updates")
            rule.onNodeWithText("Close").performClick()
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
