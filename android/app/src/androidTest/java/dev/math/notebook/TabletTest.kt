package dev.math.notebook

import android.os.SystemClock
import android.view.InputDevice
import android.view.MotionEvent
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.lifecycle.ViewModelProvider
import androidx.test.platform.app.InstrumentationRegistry
import java.io.File
import org.junit.Assert.*
import org.junit.Before
import org.junit.Rule
import org.junit.Test

class TabletTest {
    @get:Rule val rule = createAndroidComposeRule<MainActivity>()
    private val model
        get() = ViewModelProvider(rule.activity)[NotebookModel::class.java]

    @Before
    fun landscape() {
        rule.runOnIdle {
            model.input.pen("show")
            model.input.typing(false)
            if (!model.input.twoFinger) model.input.toggleScroll()
            rule.activity.requestedOrientation =
                android.content.pm.ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
        }
        rule.waitUntil(10000) {
            rule.activity.resources.configuration.orientation ==
                android.content.res.Configuration.ORIENTATION_LANDSCAPE
        }
        rule.waitForIdle()
    }

    @Test
    fun quickChecksWorkInBothTabletOrientations() {
        rule.runOnIdle { model.select(1) }
        rule.waitForIdle()
        rule.runOnIdle {
            val lesson = model.lessons[0]
            var index = 1
            for (section in lesson.sections) {
                if (section.quickChecks.isNotEmpty()) break
                index += 1 + section.questionIds.size
            }
            model.reading(lesson.slug, index + 1, 0)
            model.select(0)
            model.mode(false)
            rule.activity.requestedOrientation =
                android.content.pm.ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
        }
        rule.waitUntil(10000) {
            rule.activity.resources.configuration.orientation ==
                android.content.res.Configuration.ORIENTATION_PORTRAIT
        }
        val key = "propositional-logic:quick-1"
        rule.onNodeWithTag("quick:$key").assertIsDisplayed()
        rule.onNodeWithTag("choice:$key:1").performClick().assertIsSelected()
        if (rule.onAllNodesWithTag("answer:$key").fetchSemanticsNodes().isEmpty())
            rule.onNodeWithTag("reveal:$key").performClick()
        rule.onNodeWithTag("answer:$key").assertIsDisplayed()
        capture("portrait-quick-check.png")
        landscape()
        rule.onNodeWithTag("choice:$key:1").assertIsSelected()
        rule.onNodeWithTag("answer:$key").assertIsDisplayed()
        capture("landscape-quick-check.png")
    }

    @Test
    fun portraitReaderKeepsItsSectionOnRotation() {
        rule.runOnIdle {
            model.select(0)
            model.mode(false)
            rule.activity.requestedOrientation =
                android.content.pm.ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
        }
        rule.waitUntil(10000) {
            rule.activity.resources.configuration.orientation ==
                android.content.res.Configuration.ORIENTATION_PORTRAIT
        }
        rule.waitForIdle()
        rule.onNodeWithText("On this page").performClick()
        rule.onNode(hasText("Propositions") and hasClickAction()).performClick()
        rule.waitForIdle()
        assertEquals(1, rule.runOnIdle { model.reading(model.lesson.slug).first })
        capture("portrait-reader.png")
        landscape()
        rule.onNodeWithTag("reader").assertIsDisplayed()
        assertEquals(1, rule.runOnIdle { model.reading(model.lesson.slug).first })
        capture("landscape-reader.png")
        rule.runOnIdle { model.reading(model.lesson.slug, 0, 0) }
    }

    @Test
    fun readerTracksSlowDragInBothOrientations() {
        rule.runOnIdle {
            model.select(0)
            model.mode(false)
        }
        for (orientation in
            listOf(
                android.content.pm.ActivityInfo.SCREEN_ORIENTATION_PORTRAIT,
                android.content.pm.ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE,
            )) {
            rule.runOnIdle { rule.activity.requestedOrientation = orientation }
            val expected =
                if (orientation == android.content.pm.ActivityInfo.SCREEN_ORIENTATION_PORTRAIT)
                    android.content.res.Configuration.ORIENTATION_PORTRAIT
                else android.content.res.Configuration.ORIENTATION_LANDSCAPE
            rule.waitUntil(10000) { rule.activity.resources.configuration.orientation == expected }
            rule.waitForIdle()
            rule.onNodeWithText("On this page").performClick()
            rule.onNode(hasText("Propositions") and hasClickAction()).performClick()
            val reader = rule.onNodeWithTag("reader")
            reader.performTouchInput {
                down(0, Offset(centerX - 70, bottom - 100))
                down(1, Offset(centerX + 70, bottom - 100))
            }
            var previous = 0
            for (step in 1..28) {
                reader.performTouchInput {
                    updatePointerTo(0, Offset(centerX - 70, bottom - 100 - step * 8))
                    updatePointerTo(1, Offset(centerX + 70, bottom - 100 - step * 8))
                    move(delayMillis = 32)
                }
                rule.waitForIdle()
                val position = rule.runOnIdle { model.reading(model.lesson.slug) }
                assertEquals(1, position.first)
                if (step > 8)
                    assertEquals(
                        "Reader stopped following at step $step in orientation $orientation",
                        8,
                        position.second - previous,
                    )
                previous = position.second
            }
            reader.performTouchInput {
                advanceEventTime(200)
                up(0)
                up(1)
            }
            rule.waitForIdle()
            assertEquals(previous, rule.runOnIdle { model.reading(model.lesson.slug).second })
        }
    }

    @Test
    fun fingersOnlyScrollInPairs() {
        rule.runOnIdle {
            model.select(0)
            model.mode(false)
        }
        val reader = rule.onNodeWithTag("reader")
        val initial = rule.runOnIdle { model.reading(model.lesson.slug) }
        reader.performTouchInput { swipeUp() }
        rule.waitForIdle()
        assertEquals(initial, rule.runOnIdle { model.reading(model.lesson.slug) })
        reader.performTouchInput {
            down(0, Offset(centerX - 70, bottom - 80))
            down(1, Offset(centerX + 70, bottom - 80))
            for (i in 1..20) {
                moveTo(0, Offset(centerX - 70, bottom - 80 - i * 22), delayMillis = 16)
                moveTo(1, Offset(centerX + 70, bottom - 80 - i * 22), delayMillis = 16)
            }
            up(0)
            up(1)
        }
        rule.waitForIdle()
        assertNotEquals(initial, rule.runOnIdle { model.reading(model.lesson.slug) })
    }

    @Test
    fun penPersistenceUndoRedoAndAnswerReveal() {
        rule.runOnIdle {
            model.select(0)
            model.mode(true)
            model.position(model.lesson.slug, 0)
            model.eraser = false
        }
        val q = rule.runOnIdle { model.lesson.practiceIds[model.position(model.lesson.slug)] }
        val key = "propositional-logic-$q"
        val page = rule.runOnIdle { model.page(key) }
        val draft = rule.runOnIdle { model.answers.draft(key, false) }
        rule.waitUntil(10000) { !page.loading && !draft.loading }
        rule.runOnIdle { draft.mode("write") }
        val previousWork = rule.runOnIdle { page.strokes }
        rule.runOnIdle { page.replace(emptyList()) }
        val original = rule.runOnIdle { page.strokes }
        val canvas = rule.onNodeWithTag("ink:$key")
        canvas.assertIsDisplayed()
        val bounds = canvas.fetchSemanticsNode().boundsInWindow
        // Inject real Android stylus events, including pressure, through the activity window.
        val start = SystemClock.uptimeMillis()
        val x = bounds.left + 120
        val y = bounds.top + 150
        inject(start, MotionEvent.ACTION_DOWN, x, y, 0.2f)
        for (i in 1..24) {
            SystemClock.sleep(8)
            inject(start, MotionEvent.ACTION_MOVE, x + i * 7, y + i * 2, 0.2f + i * 0.025f)
        }
        inject(start, MotionEvent.ACTION_UP, x + 168, y + 48, 0.8f)
        rule.waitUntil(10000) { page.strokes.size == original.size + 1 }
        val stroke = rule.runOnIdle { page.strokes.last() }
        assertTrue(stroke.inputs.hasPressure())
        assertTrue(stroke.inputs.size > 2)
        rule.waitUntil(10000) { !page.saving }
        val saved = InkFiles.read(File(rule.activity.filesDir, "ink/$key.json"))
        assertEquals(original.size + 1, saved.first.size)
        assertEquals(stroke.inputs.size, saved.first.last().inputs.size)
        rule.runOnIdle {
            rule.activity.requestedOrientation =
                android.content.pm.ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
        }
        rule.waitUntil(10000) {
            rule.activity.resources.configuration.orientation ==
                android.content.res.Configuration.ORIENTATION_PORTRAIT
        }
        rule.waitForIdle()
        rule.onNodeWithTag("ink:$key").assertIsDisplayed()
        rule.runOnIdle { assertEquals(original.size + 1, model.page(key).strokes.size) }
        rule.onNodeWithContentDescription("Choose chapter").assertIsDisplayed()
        capture("portrait-practice.png")
        landscape()
        rule.onNodeWithTag("ink:$key").assertIsDisplayed()
        capture("landscape-practice.png")
        rule.onNodeWithContentDescription("Undo").performClick()
        rule.runOnIdle { assertEquals(original.size, page.strokes.size) }
        rule.onNodeWithContentDescription("Redo").performClick()
        rule.runOnIdle { assertEquals(original.size + 1, page.strokes.size) }
        // The selected stroke eraser must remove ink and remain undoable.
        rule.onNodeWithContentDescription("Eraser").performClick()
        fun findInk(view: android.view.View): InkCanvas? {
            if (view is InkCanvas && view.page.key == key) return view
            if (view is android.view.ViewGroup)
                for (i in 0 until view.childCount) findInk(view.getChildAt(i))?.let {
                    return it
                }
            return null
        }
        val nativeInk = rule.runOnIdle { findInk(rule.activity.window.decorView)!! }
        val origin = IntArray(2)
        rule.runOnIdle { nativeInk.getLocationOnScreen(origin) }
        val eraserTime = SystemClock.uptimeMillis()
        val midpoint = stroke.inputs[stroke.inputs.size / 2]
        val eraseX = origin[0] + midpoint.x * nativeInk.width / 900f
        val eraseY = origin[1] + midpoint.y * nativeInk.width / 900f
        inject(eraserTime, MotionEvent.ACTION_DOWN, eraseX, eraseY, 0.5f)
        inject(eraserTime, MotionEvent.ACTION_UP, eraseX, eraseY, 0.5f)
        rule.waitUntil(10000) { page.strokes.size == original.size }
        rule.onNodeWithContentDescription("Undo").performClick()
        rule.runOnIdle { assertEquals(original.size + 1, page.strokes.size) }
        rule.onNodeWithContentDescription("Eraser").performClick()
        rule.onNodeWithText("Reveal answer").performClick()
        rule.onNodeWithText("Hide answer").assertIsDisplayed()
        rule.onNodeWithText("Hide answer").performClick()
        // Reload into a separate page instance to verify actual durable storage.
        rule.waitUntil(10000) { !page.saving }
        assertEquals(
            original.size + 1,
            InkFiles.read(File(rule.activity.filesDir, "ink/$key.json")).first.size,
        )
        rule.runOnIdle { page.replace(previousWork) }
        rule.waitUntil(10000) { !page.saving }
    }

    @Test
    fun fingerCannotWriteAndCanceledPenIsDiscarded() {
        rule.runOnIdle {
            model.select(0)
            model.mode(true)
        }
        val q = rule.runOnIdle { model.lesson.practiceIds[model.position(model.lesson.slug)] }
        val key = "propositional-logic-$q"
        val page = rule.runOnIdle { model.page(key) }
        val draft = rule.runOnIdle { model.answers.draft(key, false) }
        rule.waitUntil(10000) { !page.loading && !draft.loading }
        rule.runOnIdle { draft.mode("write") }
        val size = rule.runOnIdle { page.strokes.size }
        val node = rule.onNodeWithTag("ink:$key")
        node.performTouchInput { swipe(Offset(100f, 150f), Offset(500f, 250f)) }
        rule.runOnIdle { assertEquals(size, page.strokes.size) }
        val b = node.fetchSemanticsNode().boundsInWindow
        val time = SystemClock.uptimeMillis()
        inject(time, MotionEvent.ACTION_DOWN, b.left + 100, b.top + 180, 0.4f)
        inject(time, MotionEvent.ACTION_MOVE, b.left + 160, b.top + 200, 0.7f)
        inject(time, MotionEvent.ACTION_CANCEL, b.left + 170, b.top + 220, 0.7f)
        rule.waitForIdle()
        rule.runOnIdle { assertEquals(size, page.strokes.size) }
    }

    private fun inject(start: Long, action: Int, x: Float, y: Float, pressure: Float) {
        val stylusDeviceId =
            InputDevice.getDeviceIds().firstOrNull { id ->
                val device = InputDevice.getDevice(id)
                device?.supportsSource(InputDevice.SOURCE_STYLUS) == true &&
                    device.getMotionRange(MotionEvent.AXIS_PRESSURE) != null
            } ?: error("Pressure test requires the connected tablet's stylus input device")
        val properties =
            MotionEvent.PointerProperties().apply {
                id = 0
                toolType = MotionEvent.TOOL_TYPE_STYLUS
            }
        val coordinates =
            MotionEvent.PointerCoords().apply {
                this.x = x
                this.y = y
                this.pressure = pressure
                size = 0.02f
            }
        val event =
            MotionEvent.obtain(
                start,
                SystemClock.uptimeMillis(),
                action,
                1,
                arrayOf(properties),
                arrayOf(coordinates),
                0,
                0,
                1f,
                1f,
                stylusDeviceId,
                0,
                InputDevice.getDevice(stylusDeviceId)!!.getMotionRange(MotionEvent.AXIS_PRESSURE)
                    .source,
                0,
            )
        try {
            // UIAutomation rewrites injected device IDs to the virtual device. Dispatch through
            // the activity to retain the real stylus pressure range for Ink's capability lookup.
            rule.runOnIdle { rule.activity.dispatchTouchEvent(event) }
        } finally {
            event.recycle()
        }
    }

    private fun capture(name: String) {
        // Compose idleness does not wait for the system's rotation animation.
        SystemClock.sleep(1200)
        val bitmap = InstrumentationRegistry.getInstrumentation().uiAutomation.takeScreenshot()
        File(rule.activity.getExternalFilesDir(null), name).outputStream().use {
            bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, it)
        }
        bitmap.recycle()
    }
}
