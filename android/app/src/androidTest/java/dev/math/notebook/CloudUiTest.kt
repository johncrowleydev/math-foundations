package dev.math.notebook

import android.content.pm.ActivityInfo
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.lifecycle.ViewModelProvider
import androidx.test.platform.app.InstrumentationRegistry
import java.io.File
import org.junit.Rule
import org.junit.Test

class CloudUiTest {
    @get:Rule val rule = createAndroidComposeRule<MainActivity>()

    @Test
    fun apiKeyFocusTypingAndRotationKeepSettingsOpen() {
        val model = ViewModelProvider(rule.activity)[NotebookModel::class.java]
        rule.runOnIdle {
            model.mode(false)
            model.references.close()
            rule.activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
        }
        rule.waitUntil(10000) { rule.activity.resources.configuration.orientation == 1 }
        rule.onNodeWithTag("input-settings").performClick()
        rule.onNodeWithTag("cloud-api-key").performClick()
        rule.waitUntil(10000) {
            androidx.core.view.ViewCompat.getRootWindowInsets(rule.activity.window.decorView)
                ?.isVisible(androidx.core.view.WindowInsetsCompat.Type.ime()) == true
        }
        rule.onNodeWithTag("settings-dialog").assertIsDisplayed()
        rule.onNodeWithTag("cloud-api-key").assertIsFocused().performTextInput("1234abcd")
        rule.onNodeWithText("Connect", substring = false).performScrollTo().assertIsEnabled()
        rule.runOnIdle {
            rule.activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
        }
        rule.waitUntil(10000) { rule.activity.resources.configuration.orientation == 2 }
        rule.onNodeWithTag("settings-dialog").assertIsDisplayed()
        rule.onNodeWithText("Connect", substring = false).performScrollTo().assertIsEnabled()
        rule
            .onNodeWithTag("cloud-api-key")
            .performScrollTo()
            .performClick()
            .performTextInput("5678")
        rule.mainClock.advanceTimeBy(500)
        android.os.SystemClock.sleep(500)
        rule.waitForIdle()
        val image = InstrumentationRegistry.getInstrumentation().uiAutomation.takeScreenshot()
        val file = File(rule.activity.getExternalFilesDir(null), "cloud/settings-keyboard.png")
        file.parentFile!!.mkdirs()
        file.outputStream().use {
            image.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, it)
        }
        image.recycle()
        rule.onNodeWithText("Done", substring = false).performClick()
        rule.onNodeWithTag("settings-dialog").assertDoesNotExist()
    }

    @Test
    fun settingsStayCompactAndScrollingStillWorks() {
        val model = ViewModelProvider(rule.activity)[NotebookModel::class.java]
        for ((orientation, name) in
            listOf(
                ActivityInfo.SCREEN_ORIENTATION_PORTRAIT to "portrait",
                ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE to "landscape",
            )) {
            rule.runOnIdle {
                rule.activity.requestedOrientation = orientation
                model.mode(false)
                model.references.close()
            }
            rule.waitUntil(10000) {
                rule.activity.resources.configuration.orientation ==
                    if (name == "portrait") 1 else 2
            }
            rule.onNodeWithTag("input-settings").performClick()
            rule.onNodeWithText("Cloud sync").assertIsDisplayed()
            rule.onNodeWithText("API key").assertIsDisplayed()
            rule.onNodeWithText("Connect", substring = false).assertIsNotEnabled()
            rule.waitForIdle()
            val bitmap = InstrumentationRegistry.getInstrumentation().uiAutomation.takeScreenshot()
            val f = File(rule.activity.getExternalFilesDir(null), "cloud/$name-settings.png")
            f.parentFile!!.mkdirs()
            f.outputStream().use {
                bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, it)
            }
            bitmap.recycle()
            rule.onNodeWithText("Prefer typed answers").performScrollTo().assertIsDisplayed()
            rule.onNodeWithText("Done", substring = false).performClick()
            rule.onNodeWithTag("reader").assertExists()
        }
    }

    @Test
    fun retainedVersionsUseNativeMathPreviewAndReturnToAnswer() {
        val model = ViewModelProvider(rule.activity)[NotebookModel::class.java]
        val id = model.lessons[0].practiceIds.first()
        val record =
            org.json
                .JSONObject()
                .put("key", "text/propositional-logic-$id")
                .put("revision", 2)
                .put("id", "version-a")
                .put("conflicts", org.json.JSONArray().put("version-b"))
                .put(
                    "versions",
                    org.json.JSONArray().apply {
                        for ((key, device, text) in
                            listOf(
                                Triple("version-a", "Tablet", "My answer: \$p \\lor q\$."),
                                Triple("version-b", "Phone", "My answer: \$p \\land q\$."),
                            )) put(
                            org.json
                                .JSONObject()
                                .put("id", key)
                                .put("device", device)
                                .put("updated", System.currentTimeMillis())
                                .put("payload", org.json.JSONObject().put("text", text))
                        )
                    },
                )
        val field =
            CloudSync::class.java.getDeclaredField("histories\$delegate").apply {
                isAccessible = true
            }
        @Suppress("UNCHECKED_CAST")
        val history =
            field.get(model.cloud)
                as androidx.compose.runtime.MutableState<List<org.json.JSONObject>>
        rule.runOnIdle {
            model.select(0)
            model.mode(true)
            model.position(model.lesson.slug, 0)
            history.value = listOf(record)
        }
        rule.onNodeWithText("Compare versions").performScrollTo().performClick()
        rule.onNodeWithText("Answer versions").assertIsDisplayed()
        rule.onNodeWithTag("answer-preview").assertIsDisplayed()
        rule.onNodeWithText("Version 2", substring = false).performClick()
        rule.onNodeWithText("Use this version").assertIsDisplayed()
        rule.mainClock.advanceTimeBy(500)
        android.os.SystemClock.sleep(600)
        rule.waitForIdle()
        val bitmap = InstrumentationRegistry.getInstrumentation().uiAutomation.takeScreenshot()
        val f = File(rule.activity.getExternalFilesDir(null), "cloud/versions.png")
        f.parentFile!!.mkdirs()
        f.outputStream().use {
            bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, it)
        }
        bitmap.recycle()
        rule.onNodeWithContentDescription("Back to answer").performClick()
        rule.onNodeWithText("Answer versions").assertDoesNotExist()
        rule.runOnIdle { history.value = emptyList() }
    }
}
