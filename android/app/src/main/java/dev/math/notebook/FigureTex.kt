package dev.math.notebook

import android.graphics.Canvas
import android.graphics.RectF
import android.util.LruCache
import ru.noties.jlatexmath.JLatexMathDrawable
import ru.noties.jlatexmath.awt.Color

/** The same TeX engine as RichText, drawing vector glyphs directly into a native figure. */
internal object FigureTex {
    private val cache = object : LruCache<String, JLatexMathDrawable>(512) {}

    internal fun drawable(latex: String, size: Float): JLatexMathDrawable {
        val key = "$size:$latex"
        return cache.get(key)
            ?: JLatexMathDrawable.builder(latex).textSize(size).build().also {
                it.setBounds(0, 0, it.intrinsicWidth, it.intrinsicHeight)
                cache.put(key, it)
            }
    }

    fun width(latex: String, size: Float) = drawable(latex, size).intrinsicWidth.toFloat()

    fun draw(
        canvas: Canvas,
        latex: String,
        x: Float,
        y: Float,
        size: Float,
        center: Boolean = true,
        verticalCenter: Boolean = false,
        maxWidth: Float = Float.POSITIVE_INFINITY,
        maxHeight: Float = Float.POSITIVE_INFINITY,
        color: Int = 0xff253a36.toInt(),
    ): RectF {
        val result = drawable(latex, size)
        val fit = minOf(1f, maxWidth / result.intrinsicWidth, maxHeight / result.intrinsicHeight)
        val baseline = result.icon().iconHeight - result.icon().iconDepth
        val left = if (center) x - result.intrinsicWidth * fit / 2f else x
        val top = if (verticalCenter) y - result.intrinsicHeight * fit / 2f else y - baseline * fit
        result.icon().setForeground(Color(color))
        val saved = canvas.save()
        try {
            canvas.translate(left, top)
            canvas.scale(fit, fit)
            result.draw(canvas)
        } finally {
            canvas.restoreToCount(saved)
        }
        return RectF(
            left,
            top,
            left + result.intrinsicWidth * fit,
            top + result.intrinsicHeight * fit,
        )
    }
}
