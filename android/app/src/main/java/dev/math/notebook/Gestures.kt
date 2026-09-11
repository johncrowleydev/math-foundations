package dev.math.notebook

import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.PointerType
import androidx.compose.ui.input.pointer.pointerInput
import kotlin.math.abs

/** No one-finger pan, stylus pan, or fling. Re-baseline whenever pointers change. */
fun Modifier.twoFingerScroll(scroll: (Float) -> Unit): Modifier = composed {
    val latestScroll = rememberUpdatedState(scroll)
    pointerInput(Unit) {
        awaitEachGesture {
            var ids = emptySet<Long>()
            var previousY = 0f
            var accumulated = 0f
            var dragging = false
            do {
                val event = awaitPointerEvent(PointerEventPass.Initial)
                val fingers = event.changes.filter { it.pressed && it.type == PointerType.Touch }
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
                        accumulated += delta
                        if (!dragging && abs(accumulated) > viewConfiguration.touchSlop)
                            dragging = true
                        if (dragging) latestScroll.value(delta)
                    } else {
                        accumulated = 0f
                        dragging = false
                    }
                    fingers.forEach { it.consume() }
                    previousY = y
                    ids = current
                } else {
                    ids = emptySet()
                    accumulated = 0f
                    dragging = false
                }
            } while (event.changes.any { it.pressed })
        }
    }
}
