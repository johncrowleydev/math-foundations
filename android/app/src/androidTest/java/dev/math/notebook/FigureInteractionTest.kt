package dev.math.notebook

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.unit.dp
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class FigureInteractionTest {
    @get:Rule val rule = createComposeRule()

    @Test
    fun nodeAndMatrixLabelUseTheSameAuthoredVertexContext() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val references = ReferenceController(TeachingLibrary(context))
        val figure = references.library.figures.getValue("graph-matrix")
        rule.setContent {
            MaterialTheme {
                CompositionLocalProvider(
                    LocalReferences provides references,
                    LocalReferenceLesson provides "graph-theory",
                ) {
                    Box(Modifier.width(700.dp)) { TeachingFigure(figure) }
                }
            }
        }
        fun drawing() =
            rule.onNode(
                SemanticsMatcher("mathematical drawing") {
                    it.config.getOrNull(SemanticsProperties.ContentDescription)?.any { text ->
                        text.startsWith(figure.getString("title") + ".")
                    } == true
                }
            )
        val node =
            figure.getJSONArray("nodes").let { a ->
                (0 until a.length()).map { a.getJSONObject(it) }.first { it.getString("id") == "d" }
            }
        drawing().performTouchInput {
            click(Offset(width * (175f + 3.5f * 95f) / 600f, height * 68f / 360f))
        }
        val first = references.target
        assertNotNull(first)
        val explanation = references.library.formulas.getValue(first!!.removePrefix("formula:"))
        assertEquals("figure:graph-matrix:label:d", explanation.getString("source"))
        assertTrue(explanation.getString("reading").contains("vertex"))
        references.close()
        rule.onNodeWithTag("figure-next:graph-matrix").performClick()
        // The second state shows the graph; d must retain its matrix-header meaning.
        drawing().performTouchInput {
            click(
                Offset(
                    width * node.getDouble("x").toFloat() / 600f,
                    height * node.getDouble("y").toFloat() / 360f,
                )
            )
        }
        assertEquals(first, references.target)
        references.close()
        rule.onNodeWithTag("figure-next:graph-matrix").assertIsNotEnabled()
        rule.onNodeWithTag("figure-back:graph-matrix").performClick()
        rule.onNodeWithTag("figure-back:graph-matrix").assertIsNotEnabled()
        rule.onNodeWithTag("figure-next:graph-matrix").assertIsEnabled().performClick()
        rule.onNodeWithText("Reset").performClick()
        rule.onNodeWithTag("figure-back:graph-matrix").assertIsNotEnabled()
        rule.onNodeWithTag("figure-next:graph-matrix").assertIsEnabled()
        drawing().performTouchInput {
            click(Offset(width * (175f + 3.5f * 95f) / 600f, height * 68f / 360f))
        }
        assertEquals(first, references.target)
    }

    @Test
    fun expandedFigureKeepsAuthoredStepsAndReturnsToItsPlace() {
        val references =
            ReferenceController(
                TeachingLibrary(InstrumentationRegistry.getInstrumentation().targetContext)
            )
        val figure = references.library.figures.getValue("graph-first")
        rule.setContent {
            MaterialTheme {
                CompositionLocalProvider(
                    LocalReferences provides references,
                    LocalReferenceLesson provides "graph-theory",
                ) {
                    androidx.compose.foundation.layout.Box(
                        Modifier.width(304.dp).height(600.dp).then(Modifier)
                    ) {
                        androidx.compose.foundation.layout.Column(
                            Modifier.then(Modifier)
                                .verticalScroll(androidx.compose.foundation.rememberScrollState())
                        ) {
                            TeachingFigure(figure)
                        }
                    }
                }
            }
        }
        rule.onNodeWithText("Expand figure").performScrollTo().performClick()
        rule.onNode(hasText("Next") and hasAnyAncestor(isDialog())).performScrollTo().performClick()
        rule.onNode(hasText("2 / 2") and hasAnyAncestor(isDialog())).assertExists()
        rule
            .onNode(hasText("Reset") and hasAnyAncestor(isDialog()))
            .performScrollTo()
            .performClick()
        rule.onNode(hasText("1 / 2") and hasAnyAncestor(isDialog())).assertExists()
        rule
            .onNode(hasText("About this figure") and hasAnyAncestor(isDialog()))
            .performScrollTo()
            .performClick()
        rule.onNodeWithText("Done").performClick()
        rule.onNodeWithTag("figure-back:graph-first").assertIsNotEnabled()
    }
}
