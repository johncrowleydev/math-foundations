package dev.math.notebook

import android.content.pm.ActivityInfo
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.lifecycle.ViewModelProvider
import androidx.test.platform.app.InstrumentationRegistry
import java.io.File
import org.junit.Assert.*
import org.junit.Before
import org.junit.Rule
import org.junit.Test

class TeachingTest {
    @get:Rule val rule = createAndroidComposeRule<MainActivity>()
    private val model
        get() = ViewModelProvider(rule.activity)[NotebookModel::class.java]

    @Before
    fun keepTabletAwake() {
        rule.runOnIdle {
            rule.activity.window.addFlags(
                android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            )
        }
    }

    private fun graph() {
        rule.runOnIdle {
            model.select(13)
            model.mode(false)
            model.openTeaching("graph-theory", "Vertices, edges, and conventions")
        }
        rule.waitForIdle()
    }

    private fun capture(name: String) {
        val screenshot = InstrumentationRegistry.getInstrumentation().uiAutomation.takeScreenshot()
        File(rule.activity.getExternalFilesDir(null), name).outputStream().use {
            screenshot.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, it)
        }
        screenshot.recycle()
    }

    private fun tapLinkedWord(word: String) {
        val point =
            rule.runOnIdle {
                fun find(view: android.view.View): Pair<Float, Float>? {
                    if (
                        view is android.widget.TextView &&
                            view.text is android.text.Spanned &&
                            view.layout != null
                    ) {
                        val text = view.text as android.text.Spanned
                        val visible = android.graphics.Rect()
                        if (view.getGlobalVisibleRect(visible))
                            for (span in
                                text.getSpans(
                                    0,
                                    text.length,
                                    android.text.style.ClickableSpan::class.java,
                                )) {
                                val start = text.getSpanStart(span)
                                val end = text.getSpanEnd(span)
                                if (
                                    text.subSequence(start, end).toString().equals(word, true) ||
                                        (word == "<formula>" &&
                                            text
                                                .getSpans(
                                                    start,
                                                    end,
                                                    io.noties.markwon.image.AsyncDrawableSpan::class
                                                        .java,
                                                )
                                                .isNotEmpty())
                                ) {
                                    val location = IntArray(2)
                                    view.getLocationOnScreen(location)
                                    val line = view.layout.getLineForOffset(start)
                                    val x =
                                        location[0] +
                                            view.totalPaddingLeft +
                                            view.layout.getPrimaryHorizontal(start) +
                                            8f
                                    val y =
                                        location[1] +
                                            view.totalPaddingTop +
                                            (view.layout.getLineTop(line) +
                                                view.layout.getLineBottom(line)) / 2f - view.scrollY
                                    if (visible.contains(x.toInt(), y.toInt())) return x to y
                                }
                            }
                    }
                    if (view is android.view.ViewGroup)
                        for (i in 0 until view.childCount) find(view.getChildAt(i))?.let {
                            return it
                        }
                    return null
                }
                find(rule.activity.window.decorView) ?: error("No visible linked word: $word")
            }
        val time = android.os.SystemClock.uptimeMillis()
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        for (action in
            listOf(android.view.MotionEvent.ACTION_DOWN, android.view.MotionEvent.ACTION_UP)) {
            val event =
                android.view.MotionEvent.obtain(
                    time,
                    time + if (action == android.view.MotionEvent.ACTION_UP) 40 else 0,
                    action,
                    point.first,
                    point.second,
                    0,
                )
            instrumentation.sendPointerSync(event)
            event.recycle()
        }
        rule.waitForIdle()
    }

    @Test
    fun graphFigureAndReferenceLibrary() {
        rule.runOnIdle {
            rule.activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
        }
        graph()
        rule.onNodeWithTag("figure:graph-first").assertExists()
        tapLinkedWord("graph")
        rule.onNodeWithTag("quick-reference").assertIsDisplayed()
        rule.runOnIdle { model.references.close() }
        rule.onNodeWithTag("open-reference").performClick()
        rule.onNodeWithText("Reference library").assertIsDisplayed()
        rule.onNodeWithText("Search names, symbols, or TeX").performTextInput("vertex")
        rule.onNodeWithTag("reference:vertex").performScrollTo().performClick()
        rule.waitForIdle()
        capture("reference-entry-check.png")
        rule.onNodeWithText("Watch for this").assertExists()
        capture("reference-library-landscape.png")
        rule.runOnIdle {
            model.references.close()
            model.references.open("term:vertex", androidx.compose.ui.unit.IntOffset(400, 300))
        }
        rule.onNodeWithTag("quick-reference").assertIsDisplayed()
        rule.onNodeWithTag("full-reference").performScrollTo().performClick()
        rule.onNodeWithTag("reference-panel").assertIsDisplayed()
        rule.onNodeWithTag("reader").assertIsDisplayed()
        capture("reference-panel-landscape.png")
        rule.runOnIdle {
            rule.activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
        }
        rule.waitUntil(10000) {
            rule.activity.resources.configuration.orientation ==
                android.content.res.Configuration.ORIENTATION_PORTRAIT
        }
        rule.onNodeWithTag("reference-panel").assertIsDisplayed()
        capture("reference-panel-portrait.png")
        rule.runOnIdle { model.references.close() }
    }

    @Test
    fun formulaTapUsesAuthoredContextAndRelatedBackPreservesReader() {
        rule.runOnIdle {
            rule.activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
        }
        rule.runOnIdle {
            model.select(14)
            model.mode(false)
            model.openTeaching("asymptotic-growth", "Big O: an eventual upper bound")
        }
        rule.waitForIdle()
        rule.waitUntil(10000) {
            rule.activity.resources.configuration.orientation ==
                android.content.res.Configuration.ORIENTATION_LANDSCAPE
        }
        android.os.SystemClock.sleep(
            800
        ) // Wait for the system rotation animation before screen-coordinate input.
        if (rule.activity.resources.configuration.screenHeightDp < 500) {
            rule.onNodeWithTag("reader").performSemanticsAction(
                androidx.compose.ui.semantics.SemanticsActions.ScrollBy
            ) {
                it(0f, 400f)
            }
            rule.waitForIdle()
        }
        tapLinkedWord("<formula>")
        capture("formula-popover-check.png")
        rule.onNodeWithTag("quick-reference").assertIsDisplayed()
        val formulaTarget = rule.runOnIdle { model.references.target!! }
        assertTrue(formulaTarget.startsWith("formula:"))
        val formula =
            rule.runOnIdle {
                model.references.library.formulas.getValue(formulaTarget.removePrefix("formula:"))
            }
        assertEquals("asymptotic-growth", formula.getString("lesson"))
        assertTrue(formula.getString("source").startsWith("section:big-o-an-eventual-upper-bound:"))
        rule.onNodeWithTag("full-reference").performScrollTo().performClick()
        rule.onNodeWithTag("reference-panel").assertIsDisplayed()
        rule.onAllNodesWithText("Full reference").onFirst().performScrollTo().performClick()
        assertTrue(rule.runOnIdle { model.references.target!!.startsWith("term:") })
        rule.onNodeWithContentDescription("Back", useUnmergedTree = true).performClick()
        assertEquals(formulaTarget, rule.runOnIdle { model.references.target })
        rule.onNodeWithText("Close", useUnmergedTree = true).performClick()
        rule.onNodeWithTag("reader").assertIsDisplayed()
    }

    @Test
    fun notationSearchAndLessonFiltersWorkFromBundledContent() {
        rule.runOnIdle {
            model.references.close()
            model.references.query = ""
            model.references.kind = "term"
            model.references.lessonFilter = null
            model.references.browse()
        }
        rule.onNodeWithText("Notation", useUnmergedTree = true).performClick()
        val search = rule.onNodeWithText("Search names, symbols, or TeX")
        search.performTextInput("\\sum")
        rule.onNodeWithTag("reference:summation").assertIsDisplayed().performClick()
        rule.runOnIdle {
            assertEquals("term:summation", model.references.target)
            assertTrue(model.references.full)
            val keyboard =
                rule.activity.getSystemService(android.content.Context.INPUT_METHOD_SERVICE)
                    as android.view.inputmethod.InputMethodManager
            keyboard.hideSoftInputFromWindow(rule.activity.window.decorView.windowToken, 0)
        }
        rule.onNodeWithText("Summation notation").assertExists()
        rule.onNodeWithContentDescription("Back", useUnmergedTree = true).performClick()
        search.performSemanticsAction(androidx.compose.ui.semantics.SemanticsActions.SetText) {
            it(androidx.compose.ui.text.AnnotatedString("Σ"))
        }
        rule.onNodeWithTag("reference:summation").assertIsDisplayed()
        rule.onNodeWithText("Lesson: All lessons").performClick()
        rule.onNodeWithText("Propositional Logic", useUnmergedTree = true).performClick()
        rule.onNodeWithTag("reference:summation").assertDoesNotExist()
        rule
            .onNodeWithText("No matching entries. Try a symbol name or another lesson.")
            .assertIsDisplayed()
        search.performSemanticsAction(androidx.compose.ui.semantics.SemanticsActions.SetText) {
            it(androidx.compose.ui.text.AnnotatedString(""))
        }
        rule.onNodeWithText("Terms", useUnmergedTree = true).performClick()
        rule.onNodeWithText("Lesson: Propositional Logic").assertIsDisplayed()
        rule.runOnIdle {
            assertEquals("propositional-logic", model.references.lessonFilter)
            model.references.close()
        }
    }
}
