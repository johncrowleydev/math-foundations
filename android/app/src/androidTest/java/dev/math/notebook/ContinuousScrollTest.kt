package dev.math.notebook

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.unit.dp
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

/** Exercise real list measurement and native text hit targets over multiple rendered frames. */
class ContinuousScrollTest {
    @get:Rule val rule = createComposeRule()
    private lateinit var state: LazyListState
    private var rowHeight = 0f

    private fun host() {
        rule.setContent {
            state = rememberLazyListState()
            rowHeight = with(LocalDensity.current) { 120.dp.toPx() }
            LazyColumn(
                state = state,
                userScrollEnabled = false,
                modifier = Modifier.testTag("list").twoFingerScroll(state),
            ) {
                items(100) { i ->
                    RichText(
                        "Paragraph $i: read this explanation and simplify ${'$'}p \\land q${'$'}.",
                        Modifier.fillMaxWidth().height(120.dp),
                    )
                }
            }
        }
    }

    private fun position() =
        rule.runOnIdle {
            state.firstVisibleItemIndex * rowHeight + state.firstVisibleItemScrollOffset
        }

    @Test
    fun slowDragFollowsFingersThroughTextAndItemBoundaries() {
        host()
        val list = rule.onNodeWithTag("list")
        list.performTouchInput {
            down(0, Offset(centerX - 60, bottom - 60))
            down(1, Offset(centerX + 60, bottom - 60))
        }
        var previous = 0f
        for (step in 1..40) {
            list.performTouchInput {
                updatePointerTo(0, Offset(centerX - 60, bottom - 60 - step * 12))
                updatePointerTo(1, Offset(centerX + 60, bottom - 60 - step * 12))
                move(delayMillis = 32)
            }
            rule.waitForIdle()
            val current = position()
            if (step > 6) {
                assertEquals(
                    "Frame $step must follow the fingers without stopping",
                    12f,
                    current - previous,
                    1.1f,
                )
                assertTrue(
                    "Drag must retain the native scroll session",
                    rule.runOnIdle { state.isScrollInProgress },
                )
            }
            previous = current
        }
        assertTrue(
            "Must traverse multiple list items",
            rule.runOnIdle { state.firstVisibleItemIndex > 0 },
        )
        // Reverse without lifting or crossing a second dead zone.
        repeat(8) { step ->
            list.performTouchInput {
                updatePointerTo(0, Offset(centerX - 60, bottom - 60 - 480 + (step + 1) * 12))
                updatePointerTo(1, Offset(centerX + 60, bottom - 60 - 480 + (step + 1) * 12))
                move(delayMillis = 32)
            }
            val current = position()
            assertEquals(-12f, current - previous, 1.1f)
            previous = current
        }
        list.performTouchInput {
            advanceEventTime(200)
            up(0)
            up(1)
        }
        rule.waitForIdle()
        assertEquals(previous, position(), 1f)
        assertFalse(rule.runOnIdle { state.isScrollInProgress })
    }

    @Test
    fun thirdFingerAndSingleFingerCannotContinueDrag() {
        host()
        val list = rule.onNodeWithTag("list")
        list.performTouchInput {
            down(0, Offset(centerX - 60, centerY))
            down(1, Offset(centerX + 60, centerY))
            updatePointerTo(0, Offset(centerX - 60, centerY - 150))
            updatePointerTo(1, Offset(centerX + 60, centerY - 150))
            move()
        }
        val before = position()
        assertTrue(before > 50)
        list.performTouchInput {
            down(2, center)
            moveBy(Offset(0f, -60f))
            up(1)
            up(2)
            moveBy(Offset(0f, -60f))
            up(0)
        }
        rule.waitForIdle()
        assertEquals(before, position(), 1f)
    }
}
