package dev.math.notebook

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.text.Spanned
import android.widget.TextView
import androidx.test.platform.app.InstrumentationRegistry
import io.noties.markwon.Markwon
import io.noties.markwon.ext.latex.JLatexAsyncDrawableSpan
import io.noties.markwon.ext.latex.JLatexMathPlugin
import io.noties.markwon.inlineparser.MarkwonInlineParserPlugin
import org.junit.Assert.*
import org.junit.Test
import ru.noties.jlatexmath.JLatexMathDrawable

class InlineMathBaselineTest {
    @Test
    fun inlineGlyphSitsOnBodyBaselineAndTallMathHasRoom() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        instrumentation.runOnMainSync {
            val context = instrumentation.targetContext
            val view = TextView(context)
            val markwon =
                Markwon.builder(context)
                    .usePlugin(MarkwonInlineParserPlugin.create())
                    .usePlugin(JLatexMathPlugin.create(38f) { it.inlinesEnabled(true) })
                    .usePlugin(InlineMathBaselinePlugin())
                    .build()
            markwon.setMarkdown(view, "Body \$\$n\$\$ text\n\n\$\$\n\\frac{1}{2}\n\$\$")
            val text = view.text as Spanned
            val inline = text.getSpans(0, text.length, InlineMathBaselineSpan::class.java)
            assertEquals(1, inline.size)
            assertEquals(1, text.getSpans(0, text.length, JLatexAsyncDrawableSpan::class.java).size)
            val span = inline.single()
            val paint =
                Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    textSize = 38f
                    color = Color.BLACK
                }
            val bitmap = Bitmap.createBitmap(300, 200, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bitmap)
            span.drawable.initWithKnownDimensions(300, 38f)
            span.drawable.setResult(JLatexMathDrawable.builder("n").textSize(38f).build())
            span.draw(canvas, "n", 0, 1, 0f, 0, 100, 180, paint)
            val inkBottom =
                (0 until bitmap.height).last { y ->
                    (0 until bitmap.width).any { x -> Color.alpha(bitmap.getPixel(x, y)) > 0 }
                }
            assertTrue("Inline n ends at $inkBottom, expected baseline 100", inkBottom in 97..101)
            for (formula in listOf("x_i", "x^2", "\\frac{1}{\\frac{2}{3}}")) {
                span.drawable.setResult(JLatexMathDrawable.builder(formula).textSize(38f).build())
                val fm = Paint.FontMetricsInt()
                span.getSize(paint, "x", 0, 1, fm)
                assertTrue(
                    "Formula clipped: $formula",
                    fm.descent - fm.ascent >= span.drawable.bounds.height(),
                )
                assertTrue(fm.ascent <= paint.fontMetricsInt.ascent)
                assertTrue(fm.descent >= paint.fontMetricsInt.descent)
            }
            bitmap.recycle()
        }
    }
}
