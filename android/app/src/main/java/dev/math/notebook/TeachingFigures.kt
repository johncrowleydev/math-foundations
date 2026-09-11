package dev.math.notebook

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInWindow
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlin.math.*
import org.json.JSONObject

@Composable
internal fun TeachingFigure(figure: JSONObject) {
    val id = figure.getString("id")
    val frames = figure.getJSONArray("frames")
    var step by rememberSaveable(id) { mutableIntStateOf(0) }
    var about by rememberSaveable(id) { mutableStateOf(false) }
    val frame = frames.getJSONObject(step.coerceIn(0, frames.length() - 1))
    Column(
        Modifier.fillMaxWidth()
            .testTag("figure:$id")
            .background(Color(0xffedf3ef), RoundedCornerShape(14.dp))
            .padding(
                if (
                    androidx.compose.ui.platform.LocalConfiguration.current.screenWidthDp < 600 ||
                        androidx.compose.ui.platform.LocalConfiguration.current.screenHeightDp < 480
                )
                    12.dp
                else 20.dp
            )
    ) {
        Text(figure.getString("title"), style = MaterialTheme.typography.titleLarge)
        Spacer(Modifier.height(12.dp))
        var expanded by remember { mutableStateOf(false) }
        BoxWithConstraints(Modifier.fillMaxWidth()) {
            val availableWidth = maxWidth
            val narrow = availableWidth < 500.dp
            val fits = figure.getString("kind") != "plot"
            val pan = narrow && !fits
            Column {
                if (pan)
                    Text(
                        "Swipe across the figure to inspect its labels.",
                        style = MaterialTheme.typography.bodySmall,
                    )
                Box(
                    Modifier.fillMaxWidth()
                        .testTag("figure-viewport:$id")
                        .horizontalScroll(rememberScrollState(), enabled = pan)
                ) {
                    Box(if (pan) Modifier.width(560.dp) else Modifier.width(availableWidth)) {
                        if (narrow && figure.getString("kind") == "flow")
                            CompactReasoningFigure(figure, frame)
                        else FigureDrawing(figure, frame)
                    }
                }
                TextButton(onClick = { expanded = true }) { Text("Expand figure") }
            }
        }
        if (expanded)
            androidx.compose.ui.window.Dialog(
                onDismissRequest = { expanded = false },
                properties =
                    androidx.compose.ui.window.DialogProperties(usePlatformDefaultWidth = false),
            ) {
                Surface(Modifier.fillMaxSize().systemBarsPadding()) {
                    Column(Modifier.verticalScroll(rememberScrollState()).padding(16.dp)) {
                        TextButton(onClick = { expanded = false }) { Text("Close figure") }
                        Text(figure.getString("title"), style = MaterialTheme.typography.titleLarge)
                        BoxWithConstraints(Modifier.fillMaxWidth()) {
                            val drawingWidth = maxWidth.coerceAtLeast(560.dp)
                            Box(Modifier.horizontalScroll(rememberScrollState())) {
                                Box(Modifier.width(drawingWidth)) { FigureDrawing(figure, frame) }
                            }
                        }
                        RichText(frame.getString("text"), source = "figure:$id:frame:$step")
                        if (frames.length() > 1)
                            FlowRow {
                                TextButton(onClick = { step-- }, enabled = step > 0) {
                                    Text("Previous")
                                }
                                Text("${step + 1} / ${frames.length()}", Modifier.padding(12.dp))
                                TextButton(
                                    onClick = { step++ },
                                    enabled = step < frames.length() - 1,
                                ) {
                                    Text("Next")
                                }
                                TextButton(onClick = { step = 0 }, enabled = step != 0) {
                                    Text("Reset")
                                }
                            }
                        TextButton(onClick = { about = !about }) { Text("About this figure") }
                        if (about) {
                            RichText(
                                figure.getString("creation"),
                                size = 14f,
                                source = "figure:$id:creation",
                            )
                            RichText(
                                figure.getString("limitations"),
                                size = 14f,
                                source = "figure:$id:limitations",
                            )
                        }
                    }
                }
            }
        Spacer(Modifier.height(12.dp))
        RichText(
            frame.getString("text"),
            Modifier.fillMaxWidth(),
            17f,
            source = "figure:$id:frame:$step",
        )
        if (frames.length() > 1)
            FlowRow(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                TextButton(
                    onClick = { step-- },
                    enabled = step > 0,
                    modifier = Modifier.testTag("figure-back:$id"),
                ) {
                    Text("Previous")
                }
                Text("${step+1} / ${frames.length()}", Modifier.padding(top = 16.dp))
                TextButton(
                    onClick = { step++ },
                    enabled = step < frames.length() - 1,
                    modifier = Modifier.testTag("figure-next:$id"),
                ) {
                    Text("Next")
                }
                TextButton(onClick = { step = 0 }, enabled = step != 0) { Text("Reset") }
            }
        TextButton(onClick = { about = !about }) {
            Text(if (about) "Hide figure notes" else "About this figure")
        }
        if (about) {
            RichText(figure.getString("creation"), size = 14f, source = "figure:$id:creation")
            Spacer(Modifier.height(8.dp))
            RichText(figure.getString("limitations"), size = 14f, source = "figure:$id:limitations")
        }
    }
}

@Composable
private fun CompactReasoningFigure(figure: JSONObject, frame: JSONObject) {
    val steps = frame.strings("steps").ifEmpty { figure.strings("steps") }
    val labels = figure.getJSONObject("mathLabels")
    Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
        steps.forEachIndexed { index, text ->
            val active = index == frame.optInt("active", -1)
            Surface(
                Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(10.dp),
                color = if (active) Color(0xffd2e6d7) else Color(0xfffffef9),
                border = if (active) BorderStroke(2.dp, Color(0xff253a36)) else null,
            ) {
                if (labels.has(text)) CompactFigureFormula(figure, text)
                else Text(text, Modifier.padding(12.dp), style = MaterialTheme.typography.bodyLarge)
            }
            if (index < steps.lastIndex)
                Text("↓", Modifier.padding(4.dp), style = MaterialTheme.typography.titleLarge)
        }
    }
}

@Composable
private fun CompactFigureFormula(figure: JSONObject, label: String) {
    val latex = figure.getJSONObject("mathLabels").getString(label)
    val density = androidx.compose.ui.platform.LocalDensity.current
    val pixels = with(density) { 18.sp.toPx() }
    val drawable = remember(latex, pixels) { FigureTex.drawable(latex, pixels) }
    val references = LocalReferences.current
    var origin by remember { mutableStateOf(Offset.Zero) }
    BoxWithConstraints(Modifier.fillMaxWidth().padding(12.dp)) {
        val width = with(density) { drawable.intrinsicWidth.toDp() }.coerceAtLeast(maxWidth)
        val height = with(density) { drawable.intrinsicHeight.toDp() }.coerceAtLeast(28.dp)
        val overflow = with(density) { drawable.intrinsicWidth.toDp() } > maxWidth
        Column {
            if (overflow)
                Text(
                    "Swipe to read the full expression",
                    style = MaterialTheme.typography.labelSmall,
                )
            Box(Modifier.horizontalScroll(rememberScrollState())) {
                Canvas(
                    Modifier.width(width)
                        .height(height)
                        .onGloballyPositioned { origin = it.positionInWindow() }
                        .semantics { contentDescription = latex }
                        .pointerInput(latex) {
                            detectTapGestures { tap ->
                                references
                                    ?.library
                                    ?.formulaAt(
                                        figure.getString("lesson"),
                                        "figure:${figure.getString("id")}:label:$label",
                                        0,
                                        latex,
                                    )
                                    ?.let {
                                        references.open(
                                            "formula:${it.getString("id")}",
                                            IntOffset(
                                                (origin.x + tap.x).toInt(),
                                                (origin.y + tap.y).toInt(),
                                            ),
                                        )
                                    }
                            }
                        }
                ) {
                    FigureTex.draw(
                        drawContext.canvas.nativeCanvas,
                        latex,
                        0f,
                        size.height / 2f,
                        pixels,
                        center = false,
                        verticalCenter = true,
                    )
                }
            }
        }
    }
}

@Composable
private fun FigureDrawing(figure: JSONObject, frame: JSONObject) {
    val id = figure.getString("id")
    if (figure.getString("kind") == "graph" && frame.optString("representation") == "matrix") {
        val nodes =
            figure.getJSONArray("nodes").let { a ->
                a.mapItems { a.getJSONObject(it).getString("id") }
            }
        val edges =
            figure.getJSONArray("edges").let { a ->
                a.mapItems { a.getJSONArray(it).let { e -> e.getString(0) to e.getString(1) } }
            }
        val matrix =
            JSONObject()
                .put("kind", "predicate-table")
                .put("id", id)
                .put("lesson", figure.getString("lesson"))
                .put("title", figure.getString("title"))
                .put("rows", org.json.JSONArray(nodes))
                .put("columns", org.json.JSONArray(nodes))
                .put("rowLabel", "From")
                .put("columnLabel", "To")
                .put("format", "binary")
                .put(
                    "mathLabels",
                    JSONObject(figure.getJSONObject("mathLabels").toString())
                        .put("0", "0")
                        .put("1", "1"),
                )
                .put(
                    "values",
                    org.json.JSONArray(
                        nodes.map { a ->
                            nodes.map { b ->
                                (a to b) in edges ||
                                    !figure.getBoolean("directed") && (b to a) in edges
                            }
                        }
                    ),
                )
        val tableFrame =
            JSONObject(frame.toString())
                .put("highlight", org.json.JSONArray(frame.strings("highlight").map { "row:$it" }))
        MathematicalDrawing(matrix, tableFrame)
    } else if (figure.getString("kind") == "graph") GraphDrawing(figure, frame)
    else MathematicalDrawing(figure, frame)
}

@Composable
private fun GraphDrawing(figure: JSONObject, frame: JSONObject) {
    val references = LocalReferences.current
    var windowOrigin by remember { mutableStateOf(Offset.Zero) }
    val vertices = figure.getJSONArray("nodes").let { a -> a.mapItems { a.getJSONObject(it) } }
    val nodes =
        vertices.associate {
            it.getString("id") to Offset(it.getDouble("x").toFloat(), it.getDouble("y").toFloat())
        }
    val edges =
        figure.getJSONArray("edges").let { a ->
            a.mapItems { a.getJSONArray(it).let { e -> e.getString(0) to e.getString(1) } }
        }
    val route = frame.strings("route")
    val directed = figure.getBoolean("directed")
    val mathLabels = figure.getJSONObject("mathLabels")
    val highlighted = frame.strings("highlight").toSet()
    val description =
        "${figure.getString("title")}. Vertices ${nodes.keys.joinToString()}. Edges ${edges.joinToString { "${it.first} ${if(directed) "to" else "and"} ${it.second}" }}. ${frame.getString("text")}"
    Canvas(
        Modifier.fillMaxWidth()
            .aspectRatio(600f / 360f)
            .onGloballyPositioned { windowOrigin = it.positionInWindow() }
            .pointerInput(figure, frame) {
                detectTapGestures { tap ->
                    val scale = size.width / 600f
                    val vertex =
                        nodes.entries.firstOrNull { (id, p) ->
                            (tap - p * scale).getDistance() <=
                                maxOf(
                                    26f,
                                    FigureTex.width(mathLabels.getString(id), 24f) / 2 + 10f,
                                ) * scale
                        } ?: return@detectTapGestures
                    val label = vertex.key
                    references
                        ?.library
                        ?.formulaAt(
                            figure.getString("lesson"),
                            "figure:${figure.getString("id")}:label:$label",
                            0,
                            mathLabels.getString(label),
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
            .semantics { contentDescription = description }
    ) {
        val scale = size.width / 600f
        val labelSize = maxOf(24f * scale, 14.dp.toPx())
        fun position(id: String) = nodes.getValue(id) * scale
        fun radius(id: String) =
            maxOf(
                19f * scale,
                FigureTex.width(mathLabels.getString(id), labelSize) / 2f + 8f * scale,
            )
        fun arrowhead(finish: Offset, unit: Offset, color: Color) {
            val side = Offset(-unit.y, unit.x)
            val path =
                Path().apply {
                    moveTo(finish.x, finish.y)
                    val left = finish - unit * (13f * scale) + side * (6f * scale)
                    lineTo(left.x, left.y)
                    val right = finish - unit * (13f * scale) - side * (6f * scale)
                    lineTo(right.x, right.y)
                    close()
                }
            drawPath(path, color)
        }
        for ((a, b) in edges) {
            val isRoute =
                route.zipWithNext().any { (u, v) ->
                    u == a && v == b || !directed && u == b && v == a
                }
            val active = isRoute || a in highlighted || (!directed && b in highlighted)
            val color = if (active) Color(0xff266655) else Color(0xff7e918b)
            val start = position(a)
            val end = position(b)
            if (a == b) {
                val startPoint = start + Offset(-13f, -13f) * scale
                val endPoint = start + Offset(13f, -13f) * scale
                val control1 = start + Offset(-60f, -75f) * scale
                val control2 = start + Offset(60f, -75f) * scale
                val loop =
                    Path().apply {
                        moveTo(startPoint.x, startPoint.y)
                        cubicTo(
                            control1.x,
                            control1.y,
                            control2.x,
                            control2.y,
                            endPoint.x,
                            endPoint.y,
                        )
                    }
                drawPath(loop, color, style = Stroke((if (active) 4f else 2.5f) * scale))
                arrowhead(
                    endPoint,
                    (endPoint - control2) / (endPoint - control2).getDistance(),
                    color,
                )
                continue
            }
            val vector = end - start
            val unit = vector / vector.getDistance()
            val finish = end - unit * radius(b)
            val origin = start + unit * radius(a)
            if (directed && edges.contains(b to a)) {
                val control = (start + end) / 2f + Offset(-unit.y, unit.x) * 32f * scale
                val curve =
                    Path().apply {
                        moveTo(origin.x, origin.y)
                        quadraticBezierTo(control.x, control.y, finish.x, finish.y)
                    }
                drawPath(curve, color, style = Stroke((if (active) 5f else 2.5f) * scale))
                arrowhead(finish, (finish - control) / (finish - control).getDistance(), color)
            } else {
                drawLine(color, origin, finish, (if (active) 5f else 2.5f) * scale)
                if (directed) arrowhead(finish, unit, color)
            }
        }
        for ((id, _) in nodes) {
            val p = position(id)
            drawCircle(Color(0xfffffef9), radius(id), p)
            drawCircle(
                Color(0xff266655),
                radius(id),
                p,
                style = Stroke((if (id in highlighted) 5f else 2f) * scale),
            )
            FigureTex.draw(
                drawContext.canvas.nativeCanvas,
                mathLabels.getString(id),
                p.x,
                p.y,
                labelSize,
                verticalCenter = true,
            )
        }
    }
}

@Composable
internal fun TeachingBlocks(
    blocks: org.json.JSONArray,
    modifier: Modifier = Modifier,
    source: String = "",
) {
    val references = LocalReferences.current
    Column(modifier, verticalArrangement = Arrangement.spacedBy(18.dp)) {
        for (i in 0 until blocks.length()) {
            val block = blocks.getJSONObject(i)
            key(block.getString("id")) {
                if (block.getString("kind") == "figure")
                    references?.library?.figures?.get(block.getString("figureId"))?.let {
                        TeachingFigure(it)
                    }
                else
                    RichText(
                        block.getString("markdown"),
                        Modifier.fillMaxWidth(),
                        source = "$source:${block.getString("id")}",
                    )
            }
        }
    }
}
