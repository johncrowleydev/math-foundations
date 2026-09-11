package dev.math.notebook

import android.content.pm.ActivityInfo
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.key
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModelProvider
import androidx.test.platform.app.InstrumentationRegistry
import java.io.File
import org.junit.Rule
import org.junit.Test

/** Captures every authored state at the reader's real width, in both tablet orientations. */
class FigureGalleryTest {
    @get:Rule val rule = createAndroidComposeRule<MainActivity>()

    private fun capture(name: String) {
        android.os.SystemClock.sleep(160)
        val bitmap = InstrumentationRegistry.getInstrumentation().uiAutomation.takeScreenshot()
        val file = File(rule.activity.getExternalFilesDir(null), "figure-gallery/$name.png")
        file.parentFile!!.mkdirs()
        file.outputStream().use {
            bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, it)
        }
        bitmap.recycle()
    }

    @Test
    fun captureAllAuthoredStates() {
        rule.runOnIdle {
            rule.activity.window.addFlags(
                android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            )
        }
        val ids =
            rule.runOnIdle {
                ViewModelProvider(rule.activity)[NotebookModel::class.java]
                    .references
                    .library
                    .figures
                    .keys
                    .toList()
            }
        val filter = InstrumentationRegistry.getArguments().getString("figures")?.split(",")
        for ((orientation, name) in
            listOf(
                ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE to "landscape",
                ActivityInfo.SCREEN_ORIENTATION_PORTRAIT to "portrait",
            )) {
            rule.runOnIdle { rule.activity.requestedOrientation = orientation }
            rule.waitUntil(10000) {
                val c = rule.activity.resources.configuration.orientation
                c == (if (name == "landscape") 2 else 1)
            }
            android.os.SystemClock.sleep(900)
            for (id in ids.filter { filter == null || it in filter }) {
                val state = LazyListState()
                val model =
                    rule.runOnIdle { ViewModelProvider(rule.activity)[NotebookModel::class.java] }
                val figure = model.references.library.figures.getValue(id)
                rule.runOnIdle {
                    rule.activity.setContent {
                        MaterialTheme {
                            CompositionLocalProvider(
                                LocalReferences provides model.references,
                                LocalReferenceLesson provides figure.getString("lesson"),
                            ) {
                                Surface {
                                    LazyColumn(
                                        state = state,
                                        userScrollEnabled = false,
                                        modifier = Modifier.fillMaxSize().twoFingerScroll(state),
                                        horizontalAlignment = Alignment.CenterHorizontally,
                                    ) {
                                        item {
                                            Box(
                                                Modifier.widthIn(max = 960.dp)
                                                    .fillMaxWidth()
                                                    .padding(horizontal = 66.dp, vertical = 24.dp)
                                            ) {
                                                key("$id:$name") { TeachingFigure(figure) }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                rule.waitForIdle()
                for (step in 0 until figure.getJSONArray("frames").length()) {
                    if (step > 0) rule.onNodeWithTag("figure-next:$id").performClick()
                    rule.runOnIdle { state.requestScrollToItem(0, 0) }
                    rule.waitForIdle()
                    capture("$id-$name-$step-top")
                    rule.runOnIdle { state.requestScrollToItem(0, 10000) }
                    rule.waitForIdle()
                    capture("$id-$name-$step-bottom")
                }
                rule.onNodeWithText("About this figure").performClick()
                rule.runOnIdle { state.requestScrollToItem(0, 10000) }
                rule.waitForIdle()
                capture("$id-$name-notes")
            }
        }
    }
}
