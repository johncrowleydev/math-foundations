package dev.math.notebook

import android.view.ViewConfiguration
import androidx.compose.foundation.MutatePriority
import androidx.compose.foundation.gestures.ScrollableDefaults
import androidx.compose.foundation.gestures.ScrollableState
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.PointerType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.input.pointer.util.VelocityTracker
import androidx.compose.ui.platform.LocalContext
import kotlin.math.abs
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.Job
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.launch

private sealed interface ScrollCommand {
    data class Drag(val pixels: Float) : ScrollCommand

    data class Release(val velocity: Float) : ScrollCommand
}

/** Gate input to two fingers; let Compose own the scroll session and fling physics. */
fun Modifier.twoFingerScroll(state: ScrollableState): Modifier = composed {
    val flingBehavior = rememberUpdatedState(ScrollableDefaults.flingBehavior())
    val context = LocalContext.current
    pointerInput(state) {
        coroutineScope {
            val scope = this
            val config = ViewConfiguration.get(context)
            var scrolling: Job? = null
            awaitEachGesture {
                var commands: Channel<ScrollCommand>? = null
                var ids = emptySet<Long>()
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
                        scrolling?.cancel()
                        commands?.close()
                        commands = null
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
                            val delta =
                                fingers
                                    .sumOf { (it.previousPosition.y - it.position.y).toDouble() }
                                    .toFloat() / 2f
                            if (delta != 0f) lastMovement = time
                            accumulated += delta
                            var dragDelta = delta
                            if (!dragging && abs(accumulated) > viewConfiguration.touchSlop) {
                                dragging = true
                                // Lose only touch slop, never a whole first movement event.
                                dragDelta =
                                    accumulated -
                                        Math.copySign(viewConfiguration.touchSlop, accumulated)
                                val channel = Channel<ScrollCommand>(Channel.UNLIMITED)
                                commands = channel
                                scrolling =
                                    scope.launch(start = CoroutineStart.UNDISPATCHED) {
                                        try {
                                            state.scroll(MutatePriority.UserInput) {
                                                for (command in channel) {
                                                    when (command) {
                                                        is ScrollCommand.Drag ->
                                                            scrollBy(command.pixels)
                                                        is ScrollCommand.Release -> {
                                                            with(flingBehavior.value) {
                                                                performFling(command.velocity)
                                                            }
                                                            break
                                                        }
                                                    }
                                                }
                                            }
                                        } finally {
                                            channel.cancel()
                                        }
                                    }
                            }
                            if (dragging) commands?.trySend(ScrollCommand.Drag(dragDelta))
                        } else {
                            accumulated = 0f
                            dragging = false
                            tracker.resetTracking()
                            lastMovement = -1L
                        }
                        tracker.addPosition(time, Offset(0f, y))
                        fingers.forEach { it.consume() }
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
                    if (event.changes.none { it.pressed }) {
                        val velocity =
                            if (
                                releaseTime >= 0 &&
                                    time - releaseTime <= 80 &&
                                    abs(releaseVelocity) >= config.scaledMinimumFlingVelocity
                            ) {
                                releaseVelocity.coerceIn(
                                    -config.scaledMaximumFlingVelocity.toFloat(),
                                    config.scaledMaximumFlingVelocity.toFloat(),
                                )
                            } else 0f
                        commands?.trySend(ScrollCommand.Release(velocity))
                        commands?.close()
                    }
                } while (event.changes.any { it.pressed })
            }
        }
    }
}
