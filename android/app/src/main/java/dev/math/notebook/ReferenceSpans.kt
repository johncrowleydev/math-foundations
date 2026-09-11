package dev.math.notebook

import android.text.Spannable
import android.text.TextPaint
import android.text.method.LinkMovementMethod
import android.text.style.ClickableSpan
import android.text.style.URLSpan
import android.view.View
import android.widget.TextView
import androidx.compose.ui.unit.IntOffset
import io.noties.markwon.image.AsyncDrawableSpan

/** Links carry authored entry IDs; formulas resolve only to explicitly scoped explanations. */
internal fun attachReferenceLinks(
    view: TextView,
    controller: ReferenceController,
    lesson: String,
    source: String,
) {
    val text = view.text as? Spannable ?: return
    fun add(start: Int, end: Int, target: String, marked: Boolean) {
        text.setSpan(
            object : ClickableSpan() {
                override fun onClick(widget: View) {
                    val location = IntArray(2)
                    view.getLocationOnScreen(location)
                    val layout = view.layout
                    val line = layout?.getLineForOffset(start) ?: 0
                    val x =
                        location[0] +
                            view.totalPaddingLeft +
                            (layout?.getPrimaryHorizontal(start)?.toInt() ?: 0)
                    val y =
                        location[1] + view.totalPaddingTop + (layout?.getLineBottom(line) ?: 0) -
                            view.scrollY
                    controller.open(target, IntOffset(x, y))
                }

                override fun updateDrawState(ds: TextPaint) {
                    if (marked) {
                        ds.color = 0xff266655.toInt()
                        ds.isUnderlineText = true
                    }
                }
            },
            start,
            end,
            Spannable.SPAN_EXCLUSIVE_EXCLUSIVE,
        )
    }
    for (span in text.getSpans(0, text.length, URLSpan::class.java)) {
        if (span.url.startsWith("ref:")) {
            val id = span.url.removePrefix("ref:").substringBefore('?')
            if (controller.library.entries.none { it.id == id }) continue
            val start = text.getSpanStart(span)
            val end = text.getSpanEnd(span)
            text.removeSpan(span)
            add(start, end, "term:$id", !span.url.endsWith("?repeat"))
        }
    }
    for ((ordinal, span) in
        text
            .getSpans(0, text.length, AsyncDrawableSpan::class.java)
            .sortedBy { text.getSpanStart(it) }
            .withIndex()) {
        val latex = span.drawable.destination.trim().replace(Regex("\\s+"), " ")
        val formula = controller.library.formulaAt(lesson, source, ordinal, latex) ?: continue
        add(
            text.getSpanStart(span),
            text.getSpanEnd(span),
            "formula:${formula.getString("id")}",
            false,
        )
    }
    view.movementMethod = LinkMovementMethod.getInstance()
}
