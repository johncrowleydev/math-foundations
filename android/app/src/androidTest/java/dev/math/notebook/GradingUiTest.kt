package dev.math.notebook

import android.content.pm.ActivityInfo
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.lifecycle.ViewModelProvider
import androidx.test.platform.app.InstrumentationRegistry
import java.io.File
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class GradingUiTest {
    @get:Rule val rule = createAndroidComposeRule<MainActivity>()

    @Test
    fun offlineSubmissionFeedbackRetryHistoryAndCorrectLock() {
        check(rule.activity.packageName.endsWith(".validation"))
        val model = ViewModelProvider(rule.activity)[NotebookModel::class.java]
        rule.waitUntil(10000) { !model.grading.loading }
        check(!model.cloud.connected)
        val qid =
            rule.runOnIdle {
                model.lessons[0]
                    .questions
                    .first {
                        it.id >= 23 &&
                            model.grading.forExercise("propositional-logic-${it.id}").isEmpty()
                    }
                    .id
            }
        val key = "propositional-logic-$qid"
        rule.runOnIdle {
            model.select(0)
            model.answerFocus = qid
            model.references.close()
        }
        val draft = rule.runOnIdle { model.answers.draft(key, true) }
        val page = rule.runOnIdle { model.page(key) }
        rule.waitUntil(10000) { !draft.loading && !page.loading && !model.grading.loading }
        rule.runOnIdle {
            draft.mode("type")
            draft.edit("My first synthetic response.")
        }
        rule.waitUntil(10000) { !draft.saving }
        assertFalse(
            File(rule.activity.filesDir, "answers/$key.json")
                .readTextOrEmpty()
                .contains("My first synthetic response.")
        )
        assertTrue(
            File(rule.activity.filesDir, "draft-answers/$key.json")
                .readText()
                .contains("My first synthetic response.")
        )
        rule.onNodeWithText("Submit", substring = false).performScrollTo().performClick()
        rule.waitUntil(10000) { model.grading.forExercise(key).isNotEmpty() }
        val first = rule.runOnIdle { JSONObject(model.grading.forExercise(key).last().toString()) }
        assertEquals("queued", first.getString("status"))
        assertEquals("My first synthetic response.", first.getString("text"))
        rule.runOnIdle {
            android.util
                .AtomicFile(
                    File(rule.activity.filesDir, "attempts/outbox/${first.getString("id")}.json")
                )
                .delete()
            model.grading.receive(JSONObject(first.toString()).put("status", "pending"))
        }
        rule.onNodeWithTag("grading-activity").assertExists()
        fun deliver(a: JSONObject, verdict: String, feedback: String) {
            val result =
                JSONObject(a.toString())
                    .put("status", "graded")
                    .put("verdict", verdict)
                    .put(
                        "grades",
                        JSONArray()
                            .put(
                                JSONObject()
                                    .put("verdict", verdict)
                                    .put("feedback", feedback)
                                    .put("at", System.currentTimeMillis())
                            ),
                    )
            rule.runOnIdle {
                android.util
                    .AtomicFile(
                        File(rule.activity.filesDir, "attempts/outbox/${a.getString("id")}.json")
                    )
                    .delete()
                model.grading.receive(result)
            }
            rule.waitUntil(10000) {
                model.grading.forExercise(key).last().optString("verdict") == verdict
            }
        }
        deliver(first, "incorrect", "Look at the scope of the negation.")
        rule.onNodeWithText("Look at the scope of the negation.").assertDoesNotExist()
        rule.onNodeWithText("Show feedback").performScrollTo().performClick()
        rule.onNodeWithText("Hide feedback").assertExists()
        rule.onNodeWithText("Try again").performScrollTo().performClick()
        rule.waitUntil(10000) { key in model.grading.editing }
        rule.runOnIdle {
            assertEquals(first.getString("text"), draft.text)
            draft.edit("My improved synthetic response.")
        }
        rule.waitUntil(10000) { !draft.saving }
        rule.onNodeWithText("Submit", substring = false).performScrollTo().performClick()
        rule.waitUntil(10000) { model.grading.forExercise(key).size == 2 }
        val second = rule.runOnIdle { model.grading.forExercise(key).last() }
        deliver(second, "correct", "Your revision handles the negation correctly.")
        rule.onNodeWithText("Try again").assertDoesNotExist()
        rule.onNodeWithText("Submit", substring = false).assertDoesNotExist()
        rule.onNodeWithText("More").performScrollTo().performClick()
        rule.onNodeWithText("Previous attempts (1)").performClick()
        rule.onNodeWithText("Exercise $qid - attempts").assertIsDisplayed()
        rule.onNodeWithContentDescription("Back").performClick()
        for (orientation in
            listOf(
                ActivityInfo.SCREEN_ORIENTATION_PORTRAIT,
                ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE,
            )) {
            rule.runOnIdle { rule.activity.requestedOrientation = orientation }
            rule.waitUntil(10000) {
                rule.activity.resources.configuration.orientation ==
                    if (orientation == ActivityInfo.SCREEN_ORIENTATION_PORTRAIT) 1 else 2
            }
            android.os.SystemClock.sleep(700)
            rule.waitForIdle()
            rule.onNodeWithText("Correct", substring = false).assertExists()
            if (orientation == ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE) {
                rule.onNodeWithTag("practice-scroll").performTouchInput { swipeUp() }
            }
            rule.onNodeWithText("More").performScrollTo().performClick()
            rule.onNodeWithText("Request recheck").performClick()
            rule
                .onNodeWithText("What should be reconsidered?")
                .performScrollTo()
                .assertIsDisplayed()
            rule.onNodeWithText("Cancel", substring = false).performClick()
            rule.mainClock.advanceTimeBy(1000)
            rule.waitForIdle()
            android.os.SystemClock.sleep(400)
            val image = InstrumentationRegistry.getInstrumentation().uiAutomation.takeScreenshot()
            val target =
                File(rule.activity.getExternalFilesDir(null), "grading/result-$orientation.png")
            target.parentFile!!.mkdirs()
            target.outputStream().use {
                image.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, it)
            }
            image.recycle()
        }
        // Fixtures remain confined to the validation package and can never reach production.
    }

    private fun File.readTextOrEmpty() = if (exists()) readText() else ""
}
