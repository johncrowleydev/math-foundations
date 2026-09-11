package dev.math.notebook

import androidx.test.platform.app.InstrumentationRegistry
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
import ru.noties.jlatexmath.JLatexMathDrawable

class ContentRenderingTest {
    @Test
    fun allBundledMathRendersAndEveryProblemIsReachable() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val content =
            JSONObject(context.assets.open("notebook.json").bufferedReader().use { it.readText() })
        val lessons = content.getJSONArray("lessons")
        val math = linkedSetOf<String>()
        var count = 0
        var quickCount = 0
        val tokens = Regex("(?s)\\$\\$(.*?)\\$\\$|(?<!\\$)\\$([^$\\n]+)\\$(?!\\$)")
        fun collect(source: String) {
            tokens.findAll(source).forEach { match ->
                math.add(match.groupValues[1].ifEmpty { match.groupValues[2] }.trim())
            }
        }
        for (i in 0 until lessons.length()) {
            val l = lessons.getJSONObject(i)
            collect(l.getString("intro"))
            val ids = mutableSetOf<Int>()
            val sections = l.getJSONArray("sections")
            for (j in 0 until sections.length()) {
                val s = sections.getJSONObject(j)
                collect(s.getString("markdown"))
                s.getJSONArray("quickChecks").let { checks ->
                    for (k in 0 until checks.length()) {
                        val c = checks.getJSONObject(k)
                        collect(c.getString("prompt"))
                        collect(c.getString("explanation"))
                        val options = c.getJSONArray("options")
                        assertTrue(c.getInt("answer") in 0 until options.length())
                        for (n in 0 until options.length()) collect(options.getString(n))
                        quickCount++
                    }
                }
                val inline = s.getJSONArray("questionIds")
                for (k in 0 until inline.length()) assertTrue(ids.add(inline.getInt(k)))
            }
            val practice = l.getJSONArray("practiceIds")
            for (j in 0 until practice.length()) assertTrue(ids.add(practice.getInt(j)))
            val questions = l.getJSONArray("questions")
            assertEquals(questions.length(), ids.size)
            for (j in 0 until questions.length()) {
                val q = questions.getJSONObject(j)
                assertTrue(ids.contains(q.getInt("id")))
                collect(q.getString("prompt"))
                collect(q.getString("answer"))
                collect(q.getString("instructions"))
                q.optString("math").takeIf { it.isNotBlank() }?.let(math::add)
                q.optJSONObject("table")?.getJSONArray("columns")?.let { cols ->
                    for (k in 0 until cols.length()) math.add(cols.getString(k))
                }
            }
            count += questions.length()
        }
        assertEquals(15, lessons.length())
        assertEquals(1313, count)
        assertEquals(30, quickCount)
        val teaching = TeachingLibrary(context)
        for (figure in teaching.figures.values) {
            collect(figure.getString("creation"))
            collect(figure.getString("limitations"))
            val labels = figure.getJSONObject("mathLabels")
            labels.keys().forEach { math.add(labels.getString(it)) }
            val frames = figure.getJSONArray("frames")
            for (i in 0 until frames.length()) collect(frames.getJSONObject(i).getString("text"))
        }
        for (entry in teaching.entries) listOf(
                entry.quick,
                entry.definition,
                entry.example,
                entry.confusion,
            )
            .forEach(::collect)
        for (formula in teaching.formulas.values) {
            math.add(formula.getString("latex"))
            val bindings = formula.getJSONArray("bindings")
            for (i in 0 until bindings.length()) math.add(bindings.getJSONObject(i).getString("symbol"))
        }
        val failures = mutableListOf<String>()
        for (formula in math) try {
            JLatexMathDrawable.builder(formula).textSize(40f).build()
        } catch (e: Exception) {
            failures.add("$formula: ${e.message}")
        }
        assertTrue(
            "${failures.size} math failures:\n${failures.joinToString("\n")}",
            failures.isEmpty(),
        )
    }
}
