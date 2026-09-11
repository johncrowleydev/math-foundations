package dev.math.notebook

import android.content.Context
import android.graphics.Canvas
import android.graphics.Matrix
import android.graphics.Paint
import android.view.MotionEvent
import android.view.View
import android.widget.FrameLayout
import androidx.ink.authoring.InProgressStrokeId
import androidx.ink.authoring.InProgressStrokesFinishedListener
import androidx.ink.authoring.InProgressStrokesView
import androidx.ink.brush.Brush
import androidx.ink.brush.StockBrushes
import androidx.ink.rendering.android.canvas.CanvasStrokeRenderer
import androidx.ink.strokes.Stroke
import androidx.input.motionprediction.MotionEventPredictor

/** Canonical 900-unit paper: ink does not move when opened in a wider workspace. */
class InkCanvas(
    context: Context,
    val page: InkPage,
    private val model: NotebookModel,
    private val tableColumns: Int = 0,
    private val tableRows: Int = 0,
) : FrameLayout(context) {
    private val renderer = CanvasStrokeRenderer.create()
    private val inProgress = InProgressStrokesView(context)
    private val predictor = MotionEventPredictor.newInstance(this)
    private val paperToView = Matrix()
    private var active: InProgressStrokeId? = null
    private var pointer = -1
    private var erasing = false
    private var erased = emptySet<Stroke>()
    private val background =
        object : View(context) {
            private val dots =
                Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    color = 0xffdcded6.toInt()
                    strokeWidth = 1f
                }

            override fun onDraw(canvas: Canvas) {
                super.onDraw(canvas)
                val scale = width / 900f
                paperToView.setScale(scale, scale)
                canvas.save()
                canvas.scale(scale, scale)
                for (x in 24..880 step 24) for (y in 24..(height / scale).toInt() step 24) canvas
                    .drawCircle(x.toFloat(), y.toFloat(), 0.8f, dots)
                if (tableColumns > 0) {
                    dots.color = 0xffb3c7bd.toInt()
                    for (i in 0..tableColumns) {
                        val x = 24f + i * 852f / tableColumns
                        canvas.drawLine(x, 12f, x, 12f + tableRows * 52f, dots)
                    }
                    for (i in 0..tableRows) canvas.drawLine(
                        24f,
                        12f + i * 52f,
                        876f,
                        12f + i * 52f,
                        dots,
                    )
                    dots.color = 0xffdcded6.toInt()
                }
                for (stroke in page.strokes) if (stroke !in erased)
                    renderer.draw(canvas, stroke, paperToView)
                canvas.restore()
            }
        }

    init {
        setBackgroundColor(0xfffffef9.toInt())
        clipChildren = true
        addView(background, LayoutParams(-1, -1))
        addView(inProgress, LayoutParams(-1, -1))
        inProgress.addFinishedStrokesListener(
            object : InProgressStrokesFinishedListener {
                override fun onStrokesFinished(strokes: Map<InProgressStrokeId, Stroke>) {
                    if (BuildConfig.DEBUG)
                        android.util.Log.d(
                            "NotebookInk",
                            "Finished ${strokes.size} strokes for ${page.key}",
                        )
                    page.replace(page.strokes + strokes.values)
                    background.invalidate()
                    inProgress.removeFinishedStrokes(strokes.keys)
                }
            }
        )
        inProgress.eagerInit()
        if (android.os.Build.VERSION.SDK_INT >= 34) setAutoHandwritingEnabled(false)
    }

    fun refresh() {
        background.invalidate()
    }

    override fun onInterceptTouchEvent(event: MotionEvent) = true

    override fun onTouchEvent(event: MotionEvent): Boolean {
        if (BuildConfig.DEBUG && event.actionMasked != MotionEvent.ACTION_MOVE)
            android.util.Log.d(
                "NotebookInk",
                "action=${event.actionMasked} tool=${event.getToolType(event.actionIndex)} loading=${page.loading}",
            )
        if (page.loading) return true
        predictor.record(event)
        val index = event.actionIndex
        val pen =
            event.getToolType(index) == MotionEvent.TOOL_TYPE_STYLUS ||
                event.getToolType(index) == MotionEvent.TOOL_TYPE_ERASER
        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN,
            MotionEvent.ACTION_POINTER_DOWN ->
                if (pen && pointer == -1) {
                    requestUnbufferedDispatch(event)
                    pointer = event.getPointerId(index)
                    erasing =
                        model.eraser ||
                            event.getToolType(index) == MotionEvent.TOOL_TYPE_ERASER ||
                            event.isButtonPressed(MotionEvent.BUTTON_STYLUS_PRIMARY)
                    if (erasing) {
                        erased = emptySet()
                        eraseAt(event.getX(index), event.getY(index))
                    } else {
                        val inverse = Matrix().apply { setScale(900f / width, 900f / width) }
                        val brush =
                            Brush.createWithColorIntArgb(
                                StockBrushes.pressurePen(),
                                model.penColor,
                                model.penWidth,
                                0.1f,
                            )
                        active = inProgress.startStroke(event, pointer, brush, inverse)
                    }
                }
            MotionEvent.ACTION_MOVE ->
                if (pointer != -1) {
                    val p = event.findPointerIndex(pointer)
                    if (p >= 0) {
                        if (erasing) {
                            for (h in 0 until event.historySize) eraseAt(
                                event.getHistoricalX(p, h),
                                event.getHistoricalY(p, h),
                            )
                            eraseAt(event.getX(p), event.getY(p))
                        } else
                            active?.let { stroke ->
                                val predicted = predictor.predict()
                                try {
                                    inProgress.addToStroke(event, pointer, stroke, predicted)
                                } finally {
                                    predicted?.recycle()
                                }
                            }
                    }
                }
            MotionEvent.ACTION_UP,
            MotionEvent.ACTION_POINTER_UP ->
                if (event.getPointerId(index) == pointer) {
                    val canceled = event.flags and MotionEvent.FLAG_CANCELED != 0
                    if (erasing) {
                        if (!canceled) page.replace(page.strokes.filterNot { it in erased })
                        erased = emptySet()
                        background.invalidate()
                    } else
                        active?.let {
                            if (canceled) inProgress.cancelStroke(it, event)
                            else inProgress.finishStroke(event, pointer, it)
                        }
                    active = null
                    pointer = -1
                }
            MotionEvent.ACTION_CANCEL -> {
                active?.let { inProgress.cancelStroke(it, event) }
                active = null
                pointer = -1
                erased = emptySet()
                background.invalidate()
            }
        }
        // Fingers are accepted but never draw; ancestor gesture handling owns scrolling.
        return true
    }

    private fun eraseAt(viewX: Float, viewY: Float) {
        val x = viewX * 900f / width
        val y = viewY * 900f / width
        val hit =
            page.strokes.filter { stroke ->
                val points = stroke.inputs
                (0 until points.size).any { i ->
                    val a = points[i]
                    val b = points[if (i == 0) i else i - 1]
                    distanceToSegmentSquared(x, y, a.x, a.y, b.x, b.y) < 18f * 18f
                }
            }
        if (hit.isNotEmpty()) {
            erased = erased + hit
            background.invalidate()
        }
    }
}

internal fun distanceToSegmentSquared(
    x: Float,
    y: Float,
    ax: Float,
    ay: Float,
    bx: Float,
    by: Float,
): Float {
    val dx = bx - ax
    val dy = by - ay
    val denominator = dx * dx + dy * dy
    val t =
        if (denominator == 0f) 0f
        else (((x - ax) * dx + (y - ay) * dy) / denominator).coerceIn(0f, 1f)
    val ex = x - ax - t * dx
    val ey = y - ay - t * dy
    return ex * ex + ey * ey
}
