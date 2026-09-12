package dev.math.notebook

import android.graphics.Typeface
import android.widget.TextView
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import io.noties.markwon.Markwon
import io.noties.markwon.ext.latex.JLatexMathPlugin
import io.noties.markwon.ext.tables.TablePlugin
import io.noties.markwon.inlineparser.MarkwonInlineParserPlugin

// Markwon's inline math delimiter is $$; the source curriculum uses $.
internal fun nativeMarkdown(source: String): String {
    val document = TexSyntax.parse(source, emptySet(), skipCode = true)
    val result = StringBuilder()
    var position = 0
    for (block in document.blocks) {
        result.append(source.substring(position, block.start))
        if (block.closed && !block.display)
            result
                .append("$$")
                .append(source.substring(block.contentStart, block.contentEnd))
                .append("$$")
        else result.append(source.substring(block.start, block.end))
        position = block.end
    }
    return result.append(source.substring(position)).toString()
}

@Composable
fun RichText(
    markdown: String,
    modifier: Modifier = Modifier,
    size: Float = 16f,
    onClick: (() -> Unit)? = null,
    source: String = "",
) {
    val references = LocalReferences.current
    val lesson = LocalReferenceLesson.current
    val linksEnabled = LocalReferenceLinksEnabled.current && onClick == null
    val displayMarkdown =
        if (linksEnabled) markdown
        else markdown.replace(Regex("\\[([^\\]]*)\\]\\(ref:[^)]*\\)"), "$1")
    val renderIdentity =
        listOf(markdown, lesson, source, linksEnabled.toString()).joinToString("\u0000")
    val lastRender = remember { arrayOf("") }
    AndroidView(
        modifier = modifier,
        factory = { context ->
            TextView(context).apply {
                textSize = size
                setTextColor(0xff2c3836.toInt())
                typeface = Typeface.create("sans-serif", Typeface.NORMAL)
                setLineSpacing(3f * resources.displayMetrics.density, 1.10f)
                includeFontPadding = false
                setTextIsSelectable(false)
                if (android.os.Build.VERSION.SDK_INT >= 34) setAutoHandwritingEnabled(false)
                tag =
                    Markwon.builder(context)
                        .usePlugin(
                            object : io.noties.markwon.AbstractMarkwonPlugin() {
                                override fun configureTheme(
                                    builder: io.noties.markwon.core.MarkwonTheme.Builder
                                ) {
                                    builder.bulletWidth(
                                        (4 * resources.displayMetrics.density).toInt()
                                    )
                                }
                            }
                        )
                        .usePlugin(TablePlugin.create(context))
                        .usePlugin(MarkwonInlineParserPlugin.create())
                        .usePlugin(JLatexMathPlugin.create(textSize) { it.inlinesEnabled(true) })
                        .usePlugin(InlineMathBaselinePlugin())
                        .build()
            }
        },
        update = { view ->
            if (lastRender[0] != renderIdentity) {
                lastRender[0] = renderIdentity
                view.contentDescription = markdown
                (view.tag as Markwon).setMarkdown(view, nativeMarkdown(displayMarkdown))
                if (references != null && linksEnabled)
                    attachReferenceLinks(view, references, lesson, source)
            }
            // Native TextViews receive taps inside their bounds before the Compose
            // choice row. Forward those taps so the entire answer remains a target.
            view.setOnClickListener(
                if (onClick != null) android.view.View.OnClickListener { onClick() } else null
            )
        },
    )
}
