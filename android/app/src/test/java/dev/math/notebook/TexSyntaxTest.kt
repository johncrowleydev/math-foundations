package dev.math.notebook

import org.junit.Assert.*
import org.junit.Test

class TexSyntaxTest {
    private val commands = setOf("frac", "alpha", "begin", "end", "{", "}", "\\", "$")

    @Test
    fun escapedDelimitersAndProseAreNotMath() {
        val doc = TexSyntax.parse("Price \\$5. Then \$x+1\$.", commands)
        assertEquals(1, doc.blocks.size)
        assertEquals(
            "x+1",
            "Price \\$5. Then \$x+1\$."
                .let { it.substring(doc.blocks[0].contentStart, doc.blocks[0].contentEnd) },
        )
        assertTrue(doc.problems.isEmpty())
    }

    @Test
    fun bracePairsAndCommandsKeepSourceOffsets() {
        val source = "Because \$\\frac{x^{2}}{3}\$ is positive."
        val doc = TexSyntax.parse(source, commands)
        assertTrue(doc.problems.isEmpty())
        assertEquals(6, doc.pairs.size)
        assertEquals(
            "\\frac",
            doc.tokens.first { it.kind == "command" }.let { source.substring(it.start, it.end) },
        )
        assertTrue(doc.tokens.all { it.start >= 8 && it.end <= source.indexOf(" is positive") })
    }

    @Test
    fun unfinishedInputIsReportedWithoutInventingClosure() {
        val source = "\$\\frac{x}{"
        val doc = TexSyntax.parse(source, commands)
        assertFalse(doc.blocks.single().closed)
        assertEquals(source.length, doc.blocks.single().end)
        assertTrue(doc.problems.any { it.message.contains("closing brace") })
        assertTrue(doc.problems.any { it.message.contains("Close inline") })
    }

    @Test
    fun unknownCommandsAndMismatchedEnvironmentsAreDiagnosed() {
        val doc = TexSyntax.parse("\$\\unknown+\\begin{matrix}a\\end{cases}\$", commands)
        assertTrue(doc.problems.any { it.message.contains("Unsupported command") })
        assertTrue(doc.problems.any { it.message.contains("does not match") })
    }

    @Test
    fun displayMathAndEscapedBracesWork() {
        val doc = TexSyntax.parse("Before\n$$\\{x\\}$$\nAfter", commands)
        assertTrue(doc.blocks.single().display)
        assertTrue(doc.problems.isEmpty())
        assertTrue(doc.pairs.isEmpty())
    }

    @Test
    fun proseEscapesStayLiteralInPreview() {
        assertEquals("Cost \\$5", TexSyntax.previewProse("Cost \\$5"))
        assertEquals("\\*a\\* and x\\_1", TexSyntax.previewProse("*a* and x_1"))
    }

    @Test
    fun largeMixedDocumentKeepsProseUntouchedAndOffsetsInBounds() {
        val source = "An explanation. \$x_{12}+1$\n".repeat(2000)
        val doc = TexSyntax.parse(source, commands)
        assertEquals(2000, doc.blocks.size)
        assertTrue(doc.problems.isEmpty())
        assertTrue(doc.tokens.all { it.start >= 0 && it.end <= source.length && it.start < it.end })
    }
}
