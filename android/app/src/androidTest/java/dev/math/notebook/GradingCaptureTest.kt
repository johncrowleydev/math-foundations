package dev.math.notebook

import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.lifecycle.ViewModelProvider
import java.io.File
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class GradingCaptureTest {
    @get:Rule val rule = createAndroidComposeRule<MainActivity>()

    @Test
    fun croppedInkBelowOriginIsVisibleInEverySubmittedPage() {
        check(rule.activity.packageName.endsWith(".validation"))
        val model = ViewModelProvider(rule.activity)[NotebookModel::class.java]
        rule.waitUntil(10000) { !model.grading.loading }
        val q =
            rule.runOnIdle {
                model.select(0)
                model.lesson.questions.first {
                    it.id > 40 &&
                        model.grading.forExercise("propositional-logic-${it.id}").isEmpty()
                }
            }
        val key = "propositional-logic-${q.id}"
        val draft = rule.runOnIdle { model.answers.draft(key, false) }
        val page = rule.runOnIdle { model.page(key) }
        rule.waitUntil(10000) { !draft.loading && !page.loading }
        val brush =
            androidx.ink.brush.Brush.createWithColorIntArgb(
                androidx.ink.brush.StockBrushes.pressurePen(),
                0xff253a43.toInt(),
                3f,
                0.1f,
            )
        val strokes =
            listOf(500f, 1500f, 2500f).map { y ->
                val inputs =
                    androidx.ink.strokes.MutableStrokeInputBatch().apply {
                        add(androidx.ink.brush.InputToolType.STYLUS, 100f, y, 0L)
                        add(androidx.ink.brush.InputToolType.STYLUS, 300f, y + 20f, 100L)
                    }
                androidx.ink.strokes.Stroke(brush, inputs)
            }
        rule.runOnIdle {
            page.replace(strokes)
            draft.mode("write")
        }
        rule.waitUntil(10000) { !draft.saving && !page.saving }
        rule.runOnIdle { model.grading.submit(model, q) }
        rule.waitUntil(10000) { model.grading.forExercise(key).isNotEmpty() }
        val images = rule.runOnIdle { model.grading.forExercise(key).last().getJSONArray("images") }
        assertEquals(3, images.length())
        for (i in 0 until images.length()) {
            val bitmap =
                android.graphics.BitmapFactory.decodeFile(
                    File(rule.activity.filesDir, "cloud-media/${images.getString(i)}").path
                )
            var inkPixels = 0
            for (y in 0 until bitmap.height) for (x in 0 until bitmap.width) {
                if (android.graphics.Color.red(bitmap.getPixel(x, y)) < 150) inkPixels++
            }
            assertTrue("Submission page $i must contain the captured stroke", inkPixels > 200)
            bitmap.recycle()
        }
    }

    @Test
    fun penPagesAndOriginalPhotosAreFrozenIndependently() {
        check(rule.activity.packageName.endsWith(".validation"))
        val model = ViewModelProvider(rule.activity)[NotebookModel::class.java]
        rule.runOnIdle { model.select(0) }
        val key = "propositional-logic-24"
        val draft = rule.runOnIdle { model.answers.draft(key, false) }
        val page = rule.runOnIdle { model.page(key) }
        rule.waitUntil(10000) { !draft.loading && !page.loading && !model.grading.loading }
        val brush =
            androidx.ink.brush.Brush.createWithColorIntArgb(
                androidx.ink.brush.StockBrushes.pressurePen(),
                0xff253a43.toInt(),
                3f,
                0.1f,
            )
        val inputs =
            androidx.ink.strokes.MutableStrokeInputBatch().apply {
                add(androidx.ink.brush.InputToolType.STYLUS, 50f, 20f, 0L)
                add(androidx.ink.brush.InputToolType.STYLUS, 300f, 2400f, 1000L)
            }
        rule.runOnIdle {
            page.replace(listOf(androidx.ink.strokes.Stroke(brush, inputs)))
            draft.edit("A separate typed draft")
            draft.mode("write")
        }
        rule.waitUntil(10000) { !page.saving && !draft.saving }
        rule.runOnIdle { model.grading.submit(model, model.lesson.question(24)) }
        rule.waitUntil(10000) { model.grading.forExercise(key).isNotEmpty() }
        val pen = rule.runOnIdle { model.grading.forExercise(key).last() }
        assertEquals("", pen.getString("text"))
        assertEquals(1, pen.getJSONObject("ink").getJSONArray("strokes").length())
        assertEquals(3, pen.getJSONArray("images").length())
        assertEquals("A separate typed draft", draft.text)

        val photoKey = "propositional-logic-25"
        val photoDraft = rule.runOnIdle { model.answers.draft(photoKey, true) }
        val photoPage = rule.runOnIdle { model.page(photoKey) }
        rule.waitUntil(10000) { !photoDraft.loading && !photoPage.loading }
        val photoID = java.util.UUID.randomUUID().toString()
        val file = File(rule.activity.filesDir, "answer-photos/$photoID.jpg")
        file.parentFile!!.mkdirs()
        val bitmap =
            android.graphics.Bitmap.createBitmap(400, 200, android.graphics.Bitmap.Config.ARGB_8888)
        bitmap.eraseColor(android.graphics.Color.WHITE)
        android.graphics
            .Canvas(bitmap)
            .drawRect(
                0f,
                0f,
                100f,
                100f,
                android.graphics.Paint().apply { color = android.graphics.Color.BLACK },
            )
        file.outputStream().use {
            bitmap.compress(android.graphics.Bitmap.CompressFormat.JPEG, 95, it)
        }
        bitmap.recycle()
        android.media.ExifInterface(file.path).apply {
            setAttribute(android.media.ExifInterface.TAG_ORIENTATION, "6")
            saveAttributes()
        }
        rule.runOnIdle {
            photoDraft.photos(listOf(AnswerPhoto(photoID, 90)))
            photoDraft.mode("photo")
        }
        rule.waitUntil(10000) { !photoDraft.saving }
        rule.runOnIdle { model.grading.submit(model, model.lesson.question(25)) }
        rule.waitUntil(10000) { model.grading.forExercise(photoKey).isNotEmpty() }
        val photo = rule.runOnIdle { model.grading.forExercise(photoKey).last() }
        assertFalse(photo.has("ink"))
        val original = photo.getJSONArray("photos").getJSONObject(0)
        assertEquals(90, original.getInt("rotation"))
        assertEquals(CloudSync.hash(file.readBytes()), original.getString("hash"))
        assertArrayEquals(
            file.readBytes(),
            File(rule.activity.filesDir, "cloud-media/${original.getString("hash")}").readBytes(),
        )
        val image =
            android.graphics.BitmapFactory.decodeFile(
                File(
                        rule.activity.filesDir,
                        "cloud-media/${photo.getJSONArray("images").getString(0)}",
                    )
                    .path
            )
        assertEquals(400, image.width)
        assertEquals(200, image.height)
        assertTrue(android.graphics.Color.red(image.getPixel(375, 175)) < 50)
        image.recycle()
        // Reopening the repository recovers both immutable pending submissions from disk.
        val reopened = GradingStore(rule.activity)
        rule.waitUntil(10000) { !reopened.loading }
        assertEquals(pen.getString("id"), reopened.forExercise(key).last().getString("id"))
        assertEquals(photo.getString("id"), reopened.forExercise(photoKey).last().getString("id"))
        reopened.closeForTest()
    }
}
