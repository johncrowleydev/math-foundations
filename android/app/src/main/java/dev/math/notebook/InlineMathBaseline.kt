package dev.math.notebook

import android.graphics.Canvas
import android.graphics.Paint
import android.text.Spannable
import android.text.Spanned
import android.widget.TextView
import io.noties.markwon.AbstractMarkwonPlugin
import io.noties.markwon.core.MarkwonTheme
import io.noties.markwon.ext.latex.JLatexAsyncDrawableSpan
import io.noties.markwon.image.AsyncDrawable
import io.noties.markwon.image.AsyncDrawableSpan
import io.noties.markwon.utils.SpanUtils
import kotlin.math.ceil
import kotlin.math.min
import ru.noties.jlatexmath.JLatexMathDrawable
import ru.noties.jlatexmath.awt.Color

/** Keep the asynchronous loader, but use TeX's baseline instead of centering inline images. */
internal class InlineMathBaselinePlugin : AbstractMarkwonPlugin() {
    override fun beforeSetText(textView: TextView, markdown: Spanned) {
        val text = markdown as? Spannable ?: return
        val theme = MarkwonTheme.builderWithDefaults(textView.context).build()
        for (span in text.getSpans(0, text.length, JLatexAsyncDrawableSpan::class.java)) {
            // Markwon 4.6.2's inline subclass is package-private; the block span must stay
            // unchanged.
            if (span.javaClass.simpleName != "JLatexInlineAsyncDrawableSpan") continue
            val start = text.getSpanStart(span)
            val end = text.getSpanEnd(span)
            val flags = text.getSpanFlags(span)
            text.removeSpan(span)
            text.setSpan(
                InlineMathBaselineSpan(theme, span.drawable, span.color()),
                start,
                end,
                flags,
            )
        }
    }
}

internal class InlineMathBaselineSpan(
    theme: MarkwonTheme,
    drawable: AsyncDrawable,
    private val color: Int,
) : AsyncDrawableSpan(theme, drawable, ALIGN_BASELINE, false) {
    internal fun baseline(result: JLatexMathDrawable): Float {
        val bounds = drawable.bounds
        val scale =
            min(
                1f,
                min(
                    bounds.width().toFloat() / result.intrinsicWidth,
                    bounds.height().toFloat() / result.intrinsicHeight,
                ),
            )
        val top = (bounds.height() - (result.intrinsicHeight * scale + .5f).toInt()) / 2
        // Icon height/depth include the renderer's padding, unlike a glyph's bounding box.
        return top + (result.icon().iconHeight - result.icon().iconDepth) * scale
    }

    override fun getSize(
        paint: Paint,
        text: CharSequence,
        start: Int,
        end: Int,
        fm: Paint.FontMetricsInt?,
    ): Int {
        val result =
            drawable.result as? JLatexMathDrawable
                ?: return super.getSize(paint, text, start, end, fm)
        val above = ceil(baseline(result)).toInt()
        val below = ceil(drawable.bounds.height() - baseline(result)).toInt()
        fm?.apply {
            val body = paint.fontMetricsInt
            ascent = minOf(body.ascent, -above)
            descent = maxOf(body.descent, below)
            top = minOf(body.top, ascent)
            bottom = maxOf(body.bottom, descent)
        }
        return drawable.bounds.width()
    }

    override fun draw(
        canvas: Canvas,
        text: CharSequence,
        start: Int,
        end: Int,
        x: Float,
        top: Int,
        y: Int,
        bottom: Int,
        paint: Paint,
    ) {
        drawable.initWithKnownDimensions(SpanUtils.width(canvas, text), paint.textSize)
        val result = drawable.result as? JLatexMathDrawable
        if (result == null) {
            super.draw(canvas, text, start, end, x, top, y, bottom, paint)
            return
        }
        result.icon().setForeground(Color(if (color == 0) paint.color else color))
        val save = canvas.save()
        try {
            canvas.translate(x, y - baseline(result))
            drawable.draw(canvas)
        } finally {
            canvas.restoreToCount(save)
        }
    }
}
