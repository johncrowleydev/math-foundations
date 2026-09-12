package dev.math.notebook

import android.content.pm.ActivityInfo
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.lifecycle.ViewModelProvider
import androidx.test.platform.app.InstrumentationRegistry
import java.io.File
import org.junit.Rule
import org.junit.Test

class PageOutlineTest {
    @get:Rule val rule = createAndroidComposeRule<MainActivity>()

    private fun capture(name: String) {
        rule.waitForIdle()
        val image = InstrumentationRegistry.getInstrumentation().uiAutomation.takeScreenshot()
        val file = File(rule.activity.getExternalFilesDir(null), "outline/$name.png")
        file.parentFile!!.mkdirs()
        file.outputStream().use {
            image.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, it)
        }
        image.recycle()
    }

    @Test
    fun pinnedNavigationTracksSectionsAndTheirExercises() {
        val model = rule.runOnIdle { ViewModelProvider(rule.activity)[NotebookModel::class.java] }
        rule.runOnIdle {
            rule.activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
            model.select(0)
            model.mode(false)
            model.references.close()
        }
        rule.waitUntil(10000) { rule.activity.resources.configuration.orientation == 2 }
        rule.onNodeWithTag("reader").performScrollToIndex(0)
        rule.onNodeWithTag("pinned-outline").assertIsDisplayed()
        rule.onNodeWithTag("outline-entry:0").assertIsSelected()
        rule.onNodeWithTag("outline-entry:3").performScrollTo().performClick()
        rule.onNodeWithTag("outline-entry:3").assertIsSelected()
        capture("landscape-section")
        val section = model.lesson.sections.indexOfFirst { it.questionIds.isNotEmpty() }
        val sectionItem =
            1 +
                model.lesson.sections.take(section).sumOf {
                    1 + it.quickChecks.size + it.questionIds.size
                }
        val exerciseItem = sectionItem + 1 + model.lesson.sections[section].quickChecks.size
        rule.onNodeWithTag("reader").performScrollToIndex(exerciseItem)
        rule.onNodeWithTag("outline-entry:${section + 1}").assertIsSelected()
        capture("landscape-exercise")
        rule.onNodeWithTag("reader").performScrollToIndex(sectionItem)
        rule.onNodeWithTag("outline-entry:${section + 1}").assertIsSelected()
        rule.runOnIdle {
            rule.activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
        }
        rule.waitUntil(10000) { rule.activity.resources.configuration.orientation == 1 }
        rule.onNodeWithTag("pinned-outline").assertDoesNotExist()
        rule.onNodeWithText("On this page").performClick()
        rule.onNodeWithTag("outline-entry:${section + 1}").assertIsSelected()
        capture("portrait-outline")
        rule.onNodeWithText("Close").performClick()
    }
}
