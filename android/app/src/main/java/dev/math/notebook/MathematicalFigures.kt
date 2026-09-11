package dev.math.notebook

import android.graphics.Paint
import android.text.StaticLayout
import android.text.TextPaint
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.*
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInWindow
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.IntOffset
import kotlin.math.*
import org.json.JSONObject

/** Diagram geometry is derived from the mathematical objects, never from an image model. */
@Composable
internal fun MathematicalDrawing(figure: JSONObject, frame: JSONObject) {
    val references = LocalReferences.current
    val hits = remember(figure, frame) { mutableListOf<Pair<String, android.graphics.RectF>>() }
    var windowOrigin by remember { mutableStateOf(Offset.Zero) }
    val kind = figure.getString("kind")
    val mathLabels = figure.optJSONObject("mathLabels") ?: JSONObject()
    val height =
        if (kind == "flow") figure.getJSONArray("steps").length() * 110f + 10f
        else if (kind == "collections") 440f else 360f
    Canvas(
        Modifier.fillMaxWidth()
            .aspectRatio(600f / height)
            .onGloballyPositioned { windowOrigin = it.positionInWindow() }
            .pointerInput(figure, frame) {
                detectTapGestures { tap ->
                    val hit =
                        hits.lastOrNull { it.second.contains(tap.x, tap.y) }
                            ?: return@detectTapGestures
                    val id = figure.getString("id")
                    val latex = figure.getJSONObject("mathLabels").optString(hit.first)
                    references
                        ?.library
                        ?.formulaAt(
                            figure.getString("lesson"),
                            "figure:$id:label:${hit.first}",
                            0,
                            latex,
                        )
                        ?.let {
                            references.open(
                                "formula:${it.getString("id")}",
                                IntOffset(
                                    (windowOrigin.x + tap.x).toInt(),
                                    (windowOrigin.y + tap.y).toInt(),
                                ),
                            )
                        }
                }
            }
            .semantics {
                contentDescription = figure.getString("title") + ". " + frame.getString("text")
            }
    ) {
        hits.clear()
        val factor = size.width / 600f
        fun hit(label: String, r: android.graphics.RectF) {
            if (mathLabels.has(label))
                hits.add(
                    label to
                        android.graphics.RectF(
                            r.left * factor - 8,
                            r.top * factor - 8,
                            r.right * factor + 8,
                            r.bottom * factor + 8,
                        )
                )
        }
        scale(factor, pivot = Offset.Zero) {
            val dark = Color(0xff253a36)
            val green = Color(0xff266655)
            val blue = Color(0xff326d9c)
            val red = Color(0xffa9534c)
            fun number(value: Double) =
                java.math.BigDecimal.valueOf(value).stripTrailingZeros().toPlainString()
            fun label(
                value: String,
                x: Float,
                y: Float,
                center: Boolean = true,
                font: Float = 22f,
            ) {
                if (mathLabels.has(value) || value.matches(Regex("-?[0-9]+(\\.[0-9]+)?"))) {
                    val bounds =
                        FigureTex.draw(
                            drawContext.canvas.nativeCanvas,
                            mathLabels.optString(value, value),
                            x,
                            y,
                            font,
                            center,
                        )
                    hit(value, bounds)
                    return
                }
                val paint =
                    Paint(Paint.ANTI_ALIAS_FLAG).apply {
                        color = dark.toArgb()
                        textSize = font
                        textAlign = if (center) Paint.Align.CENTER else Paint.Align.LEFT
                    }
                drawContext.canvas.nativeCanvas.drawText(value, x, y, paint)
            }
            fun arrow(a: Offset, b: Offset, color: Color = green) {
                drawLine(color, a, b, 2.5f)
                val unit = (b - a) / (b - a).getDistance()
                val side = Offset(-unit.y, unit.x)
                drawLine(color, b, b - unit * 12f + side * 6f, 2.5f)
                drawLine(color, b, b - unit * 12f - side * 6f, 2.5f)
            }
            when (kind) {
                "collections" -> {
                    val collections = figure.getJSONArray("collections")
                    for (i in 0 until collections.length()) {
                        val collection = collections.getJSONObject(i)
                        val elements = collection.getJSONArray("elements")
                        val x = 25f + (i % 2) * 300f
                        val y = 20f + (i / 2) * 220f
                        val selected = collection.getString("label") in frame.strings("highlight")
                        drawRoundRect(
                            Color(0xfffffef9),
                            Offset(x, y),
                            androidx.compose.ui.geometry.Size(250f, 195f),
                            androidx.compose.ui.geometry.CornerRadius(8f),
                        )
                        drawRoundRect(
                            dark,
                            Offset(x, y),
                            androidx.compose.ui.geometry.Size(250f, 195f),
                            androidx.compose.ui.geometry.CornerRadius(8f),
                            style = Stroke(if (selected) 4f else 2f),
                        )
                        label(collection.getString("label"), x + 125f, y + 30f)
                        if (elements.length() == 0)
                            label("No elements", x + 125f, y + 110f, font = 19f)
                        for (j in 0 until elements.length()) {
                            val px = x + 65f + (j % 2) * 120f
                            val py = y + 85f + (j / 2) * 70f
                            val nested = elements.optJSONArray(j)
                            if (nested != null) {
                                drawRoundRect(
                                    green,
                                    Offset(px - 52f, py - 25f),
                                    androidx.compose.ui.geometry.Size(104f, 45f),
                                    androidx.compose.ui.geometry.CornerRadius(7f),
                                    style = Stroke(2f),
                                )
                                label(
                                    "{" +
                                        (0 until nested.length()).joinToString(",") {
                                            nested.getString(it)
                                        } +
                                        "}",
                                    px,
                                    py + 7f,
                                    font = 19f,
                                )
                            } else label(elements.getString(j), px, py + 7f, font = 22f)
                        }
                    }
                }
                "predicate-table" -> {
                    val rows = figure.strings("rows")
                    val columns = figure.strings("columns")
                    val values = figure.getJSONArray("values")
                    val highlights = frame.strings("highlight")
                    val w = 380f / columns.size
                    val h = 210f / rows.size
                    label(figure.getString("columnLabel"), 365f, 30f, font = 20f)
                    label(figure.getString("rowLabel"), 75f, 135f, font = 20f)
                    columns.forEachIndexed { i, name ->
                        label(name, 175f + (i + 0.5f) * w, 75f, font = 20f)
                    }
                    rows.forEachIndexed { r, name ->
                        label(name, 135f, 90f + (r + 0.5f) * h + 8f, font = 20f)
                        columns.forEachIndexed { c, column ->
                            val selected =
                                "row:$name" in highlights || "column:$column" in highlights
                            val origin = Offset(175f + c * w, 90f + r * h)
                            drawRect(
                                if (selected) Color(0xffd2e6d7) else Color(0xfffffef9),
                                origin,
                                androidx.compose.ui.geometry.Size(w, h),
                            )
                            drawRect(
                                dark,
                                origin,
                                androidx.compose.ui.geometry.Size(w, h),
                                style = Stroke(if (selected) 3f else 1.5f),
                            )
                            label(
                                if (values.getJSONArray(r).getBoolean(c)) {
                                    if (figure.optString("format") == "binary") "1" else "T"
                                } else {
                                    if (figure.optString("format") == "binary") "0" else "F"
                                },
                                origin.x + w / 2,
                                origin.y + h / 2 + 8f,
                            )
                        }
                    }
                    label(
                        if (figure.optString("format") == "binary")
                            "1 = pair present; 0 = pair absent"
                        else "T = true; F = false",
                        350f,
                        335f,
                        font = 19f,
                    )
                }
                "venn" -> {
                    val universe = figure.strings("universe")
                    val a = figure.strings("a")
                    val b = figure.strings("b")
                    val left = Path().apply { addOval(Rect(100f, 65f, 340f, 305f)) }
                    val right = Path().apply { addOval(Rect(260f, 65f, 500f, 305f)) }
                    val boundary = Path().apply { addRect(Rect(20f, 30f, 580f, 340f)) }
                    val selected =
                        when (frame.optString("operation")) {
                            "union" -> Path.combine(PathOperation.Union, left, right)
                            "symmetric-difference" -> Path.combine(PathOperation.Xor, left, right)
                            "union-complement" ->
                                Path.combine(
                                    PathOperation.Difference,
                                    boundary,
                                    Path.combine(PathOperation.Union, left, right),
                                )
                            "intersection-complement" ->
                                Path.combine(
                                    PathOperation.Difference,
                                    boundary,
                                    Path.combine(PathOperation.Intersect, left, right),
                                )
                            "intersection" -> Path.combine(PathOperation.Intersect, left, right)
                            "difference" -> Path.combine(PathOperation.Difference, left, right)
                            "complement" -> Path.combine(PathOperation.Difference, boundary, left)
                            else -> Path()
                        }
                    drawPath(selected, Color(0xffb8d7c5))
                    drawPath(boundary, dark, style = Stroke(2f))
                    drawPath(left, green, style = Stroke(2.5f))
                    drawPath(right, blue, style = Stroke(2.5f))
                    label("U", 40f, 55f, font = 19f)
                    label("A", 160f, 65f)
                    label("B", 440f, 65f)
                    val groups =
                        universe.groupBy { (if (it in a) 1 else 0) + (if (it in b) 2 else 0) }
                    for ((region, items) in groups) items.forEachIndexed { i, item ->
                        val x =
                            when (region) {
                                1 -> 175f
                                2 -> 425f
                                3 -> 300f
                                else -> 50f
                            }
                        val y = 150f + i * 28f
                        label(item, x, y)
                    }
                }
                "mapping" -> {
                    val domain = figure.strings("domain")
                    val codomain = figure.strings("codomain")
                    label("Inputs", 120f, 30f)
                    label("Allowed outputs", 470f, 30f)
                    fun point(index: Int, left: Boolean) =
                        Offset(if (left) 120f else 470f, 85f + index * 70f)
                    val pairs = figure.getJSONArray("pairs")
                    for (i in 0 until pairs.length()) {
                        val pair = pairs.getJSONArray(i)
                        val selected =
                            pair.getString(0) in frame.strings("highlight") ||
                                pair.getString(1) in frame.strings("highlight")
                        arrow(
                            point(domain.indexOf(pair.getString(0)), true) + Offset(28f, 0f),
                            point(codomain.indexOf(pair.getString(1)), false) - Offset(28f, 0f),
                            if (selected) red else green,
                        )
                        if (selected)
                            drawCircle(
                                dark,
                                32f,
                                point(domain.indexOf(pair.getString(0)), true),
                                style = Stroke(3f),
                            )
                    }
                    for ((items, left) in listOf(domain to true, codomain to false)) items
                        .forEachIndexed { i, item ->
                            val p = point(i, left)
                            drawCircle(Color(0xfffffef9), 27f, p)
                            drawCircle(if (left) green else blue, 27f, p, style = Stroke(2f))
                            if (item in frame.strings("highlight"))
                                drawCircle(dark, 32f, p, style = Stroke(3f))
                            label(item, p.x, p.y + 8f)
                        }
                }
                "flow" -> {
                    val steps = frame.strings("steps").ifEmpty { figure.strings("steps") }
                    for ((i, text) in steps.withIndex()) {
                        val y = 10f + i * 110f
                        val selected = i == frame.optInt("active", -1)
                        drawRoundRect(
                            if (selected) Color(0xffd2e6d7) else Color(0xfffffef9),
                            Offset(40f, y),
                            androidx.compose.ui.geometry.Size(520f, 80f),
                            androidx.compose.ui.geometry.CornerRadius(10f),
                        )
                        if (selected)
                            drawRoundRect(
                                dark,
                                Offset(40f, y),
                                androidx.compose.ui.geometry.Size(520f, 80f),
                                androidx.compose.ui.geometry.CornerRadius(10f),
                                style = Stroke(3f),
                            )
                        if (mathLabels.has(text)) {
                            val bounds =
                                FigureTex.draw(
                                    drawContext.canvas.nativeCanvas,
                                    mathLabels.getString(text),
                                    300f,
                                    y + 40f,
                                    24f,
                                    verticalCenter = true,
                                    maxWidth = 480f,
                                    maxHeight = 64f,
                                )
                            hit(text, bounds)
                        } else {
                            val paint =
                                TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
                                    color = dark.toArgb()
                                    textSize = 21f
                                }
                            val layout =
                                StaticLayout.Builder.obtain(text, 0, text.length, paint, 480)
                                    .setAlignment(android.text.Layout.Alignment.ALIGN_CENTER)
                                    .setIncludePad(false)
                                    .build()
                            drawContext.canvas.nativeCanvas.save()
                            drawContext.canvas.nativeCanvas.translate(
                                60f,
                                y + (80f - layout.height) / 2f,
                            )
                            layout.draw(drawContext.canvas.nativeCanvas)
                            drawContext.canvas.nativeCanvas.restore()
                        }
                        if (i < steps.lastIndex)
                            arrow(Offset(300f, y + 82f), Offset(300f, y + 105f))
                    }
                }
                "board" -> {
                    val rows = figure.getInt("rows")
                    val columns = figure.getInt("columns")
                    val cell = min(480f / columns, 240f / rows)
                    val start = Offset((600f - columns * cell) / 2, 45f)
                    val regions = frame.getJSONArray("regions")
                    for (i in 0 until regions.length()) {
                        val r = regions.getJSONArray(i)
                        val top = start + Offset(r.getInt(0) * cell, r.getInt(1) * cell)
                        val box =
                            androidx.compose.ui.geometry.Size(
                                r.getInt(2) * cell,
                                r.getInt(3) * cell,
                            )
                        drawRect(if (i % 2 == 0) Color(0xffd2e6d7) else Color(0xffe3eaf2), top, box)
                        drawRect(dark, top, box, style = Stroke(4f))
                        label(
                            (i + 1).toString(),
                            top.x + box.width / 2,
                            top.y + box.height / 2 + 8f,
                        )
                    }
                    for (i in 1 until columns) drawLine(
                        dark.copy(alpha = .35f),
                        start + Offset(i * cell, 0f),
                        start + Offset(i * cell, rows * cell),
                        1f,
                        pathEffect = PathEffect.dashPathEffect(floatArrayOf(3f, 4f)),
                    )
                    for (i in 1 until rows) drawLine(
                        dark.copy(alpha = .35f),
                        start + Offset(0f, i * cell),
                        start + Offset(columns * cell, i * cell),
                        1f,
                        pathEffect = PathEffect.dashPathEffect(floatArrayOf(3f, 4f)),
                    )
                    label("Solid boundaries separate numbered pieces", 300f, 330f, font = 20f)
                }
                "sum" -> {
                    val n = frame.getInt("n")
                    val rectangle = figure.getString("arrangement") == "rectangle"
                    val cell = minOf(420f / (if (rectangle) n + 1 else n), 230f / n)
                    val start = Offset((600f - (if (rectangle) n + 1 else n) * cell) / 2f, 35f)
                    for (row in 0 until n) for (column in
                        0 until if (rectangle) n + 1 else row + 1) {
                        val original = column <= row
                        val p = start + Offset(column * cell, row * cell)
                        drawRect(
                            if (original) green else blue,
                            p,
                            androidx.compose.ui.geometry.Size(cell - 3f, cell - 3f),
                        )
                    }
                    label(
                        if (rectangle) "2(1+\\cdots+$n)=${n*(n+1)}"
                        else "1+\\cdots+$n=${n*(n+1)/2}",
                        300f,
                        330f,
                        font = 22f,
                    )
                    if (rectangle)
                        for (row in 0 until n) for (column in row + 1..n) {
                            val p = start + Offset(column * cell, row * cell)
                            drawLine(
                                Color.White,
                                p + Offset(4f, 4f),
                                p + Offset(cell - 7f, cell - 7f),
                                2f,
                            )
                        }
                }
                "sequence" -> {
                    val values = figure.getJSONArray("values")
                    val maxValue =
                        (0 until values.length())
                            .maxOf { abs(values.getDouble(it)) }
                            .toFloat()
                            .coerceAtLeast(1f)
                    label(figure.getString("rule"), 300f, 30f, font = 22f)
                    drawLine(dark, Offset(45f, 290f), Offset(570f, 290f), 2f)
                    for (i in 0 until values.length()) {
                        val value = values.getDouble(i).toFloat()
                        val x = 65f + i * 490f / values.length()
                        val h = value / maxValue * 200f
                        drawRect(
                            green,
                            Offset(x, 290f - h),
                            androidx.compose.ui.geometry.Size(32f, h),
                        )
                        if (i == frame.optInt("active", -1))
                            drawRect(
                                dark,
                                Offset(x - 4f, 286f - h),
                                androidx.compose.ui.geometry.Size(40f, h + 8f),
                                style = Stroke(3f),
                            )
                        label(number(value.toDouble()), x + 16f, 280f - h, font = 18f)
                        label(
                            (i + figure.getInt("firstIndex")).toString(),
                            x + 16f,
                            318f,
                            font = 18f,
                        )
                    }
                    label("Index", 300f, 350f)
                }
                "bins" -> {
                    val counts = figure.getJSONArray("counts")
                    val w = 520f / counts.length()
                    if (figure.optBoolean("starsAndBars")) {
                        val code =
                            (0 until counts.length()).joinToString("\\mid") {
                                "\\star".repeat(counts.getInt(it))
                            }
                        label(code, 300f, 35f, font = 23f)
                    }
                    for (i in 0 until counts.length()) {
                        val x = 40f + i * w
                        drawRect(
                            dark,
                            Offset(x, 65f),
                            androidx.compose.ui.geometry.Size(w - 10f, 215f),
                            style = Stroke(2f),
                        )
                        label("${i+1}", x + (w - 10f) / 2f, 315f)
                        for (j in 0 until counts.getInt(i)) drawCircle(
                            green,
                            10f,
                            Offset(x + 25f + (j % 2) * 30f, 105f + (j / 2) * 55f),
                        )
                    }
                    label("Labeled groups", 300f, 345f)
                }
                "plot" -> {
                    val xmax = figure.getDouble("xMax")
                    val ymax = figure.getDouble("yMax")
                    val series = figure.getJSONArray("series")
                    fun point(x: Double, y: Double) =
                        Offset((65 + x / xmax * 475).toFloat(), (270 - y / ymax * 195).toFloat())
                    arrow(point(0.0, 0.0), point(xmax + 0.3, 0.0), dark)
                    arrow(point(0.0, 0.0), point(0.0, ymax * 1.03), dark)
                    label("n", 570f, 280f)
                    label("value", 65f, 42f)
                    label("0", 50f, 290f, font = 16f)
                    for (tick in 1..4) {
                        val x = xmax * tick / 4
                        label(number(x), point(x, 0.0).x, 294f, font = 16f)
                        val y = ymax * tick / 4
                        label(number(y), 45f, point(0.0, y).y + 5f, font = 15f)
                    }
                    val colors = listOf(green, blue, red)
                    for (i in 0 until series.length()) {
                        val spec = series.getJSONObject(i)
                        val coeff = spec.getJSONArray("coefficients")
                        val path = Path()
                        var started = false
                        for (sample in 0..300) {
                            val x = 1.0 + (xmax - 1) * sample / 300
                            val base = spec.optDouble("base", 2.0)
                            val y =
                                when (spec.getString("model")) {
                                    "polynomial" ->
                                        (0 until coeff.length()).sumOf {
                                            coeff.getDouble(it) * x.pow(it)
                                        }
                                    "exponential" -> base.pow(x)
                                    "logarithm" -> ln(x) / ln(base)
                                    else -> x * ln(x) / ln(base)
                                }
                            val p = point(x, y)
                            if (y in 0.0..ymax) {
                                if (!started) {
                                    path.moveTo(p.x, p.y)
                                    started = true
                                } else path.lineTo(p.x, p.y)
                            } else started = false
                        }
                        drawPath(
                            path,
                            colors[i],
                            style =
                                Stroke(
                                    3f,
                                    pathEffect =
                                        if (i == 1) PathEffect.dashPathEffect(floatArrayOf(10f, 6f))
                                        else if (i == 2)
                                            PathEffect.dashPathEffect(floatArrayOf(3f, 5f))
                                        else null,
                                ),
                        )
                        val legendY = 306f + i * 18f
                        drawLine(
                            colors[i],
                            Offset(65f, legendY - 5f),
                            Offset(98f, legendY - 5f),
                            3f,
                            pathEffect =
                                if (i == 1) PathEffect.dashPathEffect(floatArrayOf(10f, 6f))
                                else if (i == 2) PathEffect.dashPathEffect(floatArrayOf(3f, 5f))
                                else null,
                        )
                        label(spec.getString("label"), 108f, legendY, center = false, font = 16f)
                    }
                    if (figure.has("threshold")) {
                        val x = figure.getDouble("threshold")
                        drawLine(
                            dark,
                            point(x, 0.0),
                            point(x, ymax),
                            1.5f,
                            pathEffect = PathEffect.dashPathEffect(floatArrayOf(4f, 6f)),
                        )
                        label("n_0=${x.toInt()}", point(x, ymax).x, 55f, font = 17f)
                    }
                }
            }
        }
    }
}
