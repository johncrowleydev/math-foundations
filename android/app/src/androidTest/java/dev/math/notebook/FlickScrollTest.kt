package dev.math.notebook

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class FlickScrollTest {
    @get:Rule val rule = createComposeRule()
    private var distance = 0f

    private fun host() {
        rule.setContent {
            Box(
                Modifier.fillMaxSize().testTag("scroll").twoFingerScroll { delta ->
                    distance += delta
                    delta
                }
            )
        }
    }

    private fun TouchInjectionScope.dragPair() {
        down(0, Offset(centerX - 70, centerY + 120))
        down(1, Offset(centerX + 70, centerY + 120))
        for (i in 1..10) {
            moveTo(0, Offset(centerX - 70, centerY + 120 - i * 20), delayMillis = 8)
            moveTo(1, Offset(centerX + 70, centerY + 120 - i * 20), delayMillis = 8)
        }
    }

    @Test
    fun pairFlickContinuesBeyondDrag() {
        host()
        rule.onNodeWithTag("scroll").performTouchInput {
            dragPair()
            up(0)
            up(1)
        }
        rule.waitForIdle()
        assertTrue("Momentum should exceed the 200px drag; actual $distance", distance > 260f)
    }

    @Test
    fun oneFingerCannotScrollOrFling() {
        host()
        rule.onNodeWithTag("scroll").performTouchInput { swipeUp() }
        rule.waitForIdle()
        assertEquals(0f, distance, 0.01f)
    }

    @Test
    fun newContactStopsMomentum() {
        host()
        rule.onNodeWithTag("scroll").performTouchInput {
            dragPair()
            up(0)
            up(1)
            down(0, center)
            advanceEventTime(100)
            up(0)
        }
        rule.waitForIdle()
        assertTrue("New contact must stop the fling: $distance", distance <= 210f)
    }

    @Test
    fun lingeringFingerDoesNotLaunchStaleVelocity() {
        host()
        rule.onNodeWithTag("scroll").performTouchInput {
            dragPair()
            up(0)
            advanceEventTime(160)
            up(1)
        }
        rule.waitForIdle()
        assertTrue(distance in 100f..210f)
    }

    @Test
    fun holdingBothFingersBeforeReleaseDoesNotFling() {
        host()
        rule.onNodeWithTag("scroll").performTouchInput {
            dragPair()
            advanceEventTime(200)
            up(0)
            up(1)
        }
        rule.waitForIdle()
        assertTrue(distance in 100f..210f)
    }
}
