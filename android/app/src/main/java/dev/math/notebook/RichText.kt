package dev.math.notebook

import android.graphics.Typeface
import android.widget.TextView
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import io.noties.markwon.Markwon
import io.noties.markwon.ext.latex.JLatexMathPlugin
import io.noties.markwon.ext.tables.TablePlugin
import io.noties.markwon.inlineparser.MarkwonInlineParserPlugin

// Markwon's inline math delimiter is $$; the source curriculum uses $.
internal fun nativeMarkdown(source: String): String {
    val tokens = Regex("(?s)\\$\\$.*?\\$\\$|`[^`]*`|(?<!\\$)\\$([^$\\n]+)\\$(?!\\$)")
    return tokens.replace(source) { m ->
        if (m.value.startsWith("$$") || m.value.startsWith("`")) m.value
        else "$$${m.groupValues[1]}$$"
    }
}

@Composable
fun RichText(
    markdown: String,
    modifier: Modifier = Modifier,
    size: Float = 19f,
    onClick: (() -> Unit)? = null,
) {
    AndroidView(
        modifier = modifier,
        factory = { context ->
            TextView(context).apply {
                textSize = size
                setTextColor(0xff2c3836.toInt())
                typeface = Typeface.create("sans-serif", Typeface.NORMAL)
                setLineSpacing(7f * resources.displayMetrics.density, 1.12f)
                includeFontPadding = false
                setTextIsSelectable(false)
                if (android.os.Build.VERSION.SDK_INT >= 34) setAutoHandwritingEnabled(false)
                tag =
                    Markwon.builder(context)
                        .usePlugin(TablePlugin.create(context))
                        .usePlugin(MarkwonInlineParserPlugin.create())
                        .usePlugin(JLatexMathPlugin.create(textSize) { it.inlinesEnabled(true) })
                        .usePlugin(InlineMathBaselinePlugin())
                        .build()
            }
        },
        update = { view ->
            if (view.contentDescription != markdown) {
                view.contentDescription = markdown
                (view.tag as Markwon).setMarkdown(view, nativeMarkdown(markdown))
            }
            // Native TextViews receive taps inside their bounds before the Compose
            // choice row. Forward those taps so the entire answer remains a target.
            if (onClick != null) view.setOnClickListener { onClick() }
        },
    )
}
