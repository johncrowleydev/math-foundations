package dev.math.notebook

import android.view.ViewConfiguration
import android.widget.OverScroller
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.PointerType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.input.pointer.util.VelocityTracker
import androidx.compose.ui.platform.LocalContext
import kotlin.math.abs
import kotlinx.coroutines.Job
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.launch

/** Two fingers drag and flick. Any new contact stops momentum, including a pen. */
fun Modifier.twoFingerScroll(scroll: (Float) -> Float): Modifier = composed {
    val latestScroll = rememberUpdatedState(scroll)
    val context = LocalContext.current
    pointerInput(Unit) {
        coroutineScope {
            val scope = this
            val config = ViewConfiguration.get(context)
            val scroller = OverScroller(context)
            var fling: Job? = null
            awaitEachGesture {
                var ids = emptySet<Long>()
                var previousY = 0f
                var accumulated = 0f
                var dragging = false
                val tracker = VelocityTracker()
                var releaseTime = -1L
                var releaseVelocity = 0f
                var lastMovement = -1L
                do {
                    val event = awaitPointerEvent(PointerEventPass.Initial)
                    val time = event.changes.maxOf { it.uptimeMillis }
                    if (event.changes.any { it.pressed && !it.previousPressed }) {
                        fling?.cancel()
                        scroller.forceFinished(true)
                        releaseTime = -1L
                        releaseVelocity = 0f
                    }
                    val fingers =
                        event.changes.filter { it.pressed && it.type == PointerType.Touch }
                    val penDown =
                        event.changes.any {
                            it.pressed &&
                                (it.type == PointerType.Stylus || it.type == PointerType.Eraser)
                        }
                    val current = fingers.map { it.id.value }.toSet()
                    if (fingers.size == 2 && !penDown) {
                        val y = fingers.map { it.position.y }.average().toFloat()
                        if (ids == current) {
                            val delta = previousY - y
                            if (delta != 0f) lastMovement = time
                            accumulated += delta
                            if (!dragging && abs(accumulated) > viewConfiguration.touchSlop)
                                dragging = true
                            if (dragging) latestScroll.value(delta)
                        } else {
                            accumulated = 0f
                            dragging = false
                            tracker.resetTracking()
                            lastMovement = -1L
                        }
                        tracker.addPosition(time, Offset(0f, y))
                        fingers.forEach { it.consume() }
                        previousY = y
                        ids = current
                    } else {
                        // Preserve the final two-finger velocity across slightly staggered
                        // lifts. A lingering/moving finger or any third contact cancels it.
                        if (
                            ids.size == 2 &&
                                dragging &&
                                time - lastMovement <= 80 &&
                                !penDown &&
                                fingers.size <= 1 &&
                                event.changes.all { it.type == PointerType.Touch }
                        ) {
                            releaseVelocity = -tracker.calculateVelocity().y
                            releaseTime = time
                        } else if (
                            penDown ||
                                fingers.size > 1 ||
                                event.changes.any {
                                    it.pressed && it.position != it.previousPosition
                                }
                        ) {
                            releaseTime = -1L
                            releaseVelocity = 0f
                        }
                        ids = emptySet()
                        accumulated = 0f
                        dragging = false
                    }
                    if (
                        event.changes.none { it.pressed } &&
                            releaseTime >= 0 &&
                            time - releaseTime <= 80 &&
                            abs(releaseVelocity) >= config.scaledMinimumFlingVelocity
                    ) {
                        val velocity =
                            releaseVelocity
                                .coerceIn(
                                    -config.scaledMaximumFlingVelocity.toFloat(),
                                    config.scaledMaximumFlingVelocity.toFloat(),
                                )
                                .toInt()
                        fling =
                            scope.launch {
                                scroller.fling(0, 0, 0, velocity, 0, 0, -1_000_000, 1_000_000)
                                var previous = 0
                                while (!scroller.isFinished) {
                                    withFrameNanos {}
                                    if (!scroller.computeScrollOffset()) break
                                    val delta = (scroller.currY - previous).toFloat()
                                    previous = scroller.currY
                                    if (
                                        delta != 0f && abs(latestScroll.value(delta) - delta) > 0.5f
                                    ) {
                                        scroller.forceFinished(true)
                                    }
                                }
                            }
                    }
                } while (event.changes.any { it.pressed })
            }
        }
    }
}
