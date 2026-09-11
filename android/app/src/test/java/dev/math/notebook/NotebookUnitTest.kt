package dev.math.notebook

import org.junit.Assert.*
import org.junit.Test

class NotebookUnitTest {
    @Test
    fun mathDelimitersPreserveBlocksAndCode() {
        assertEquals("Use \$\$p\$\$ and \$\$q\$\$.", nativeMarkdown("Use \$p\$ and \$q\$."))
        val display = "$$\np \\to q\n$$"
        assertEquals(display, nativeMarkdown(display))
        assertEquals("`\$x\$` stays code", nativeMarkdown("`\$x\$` stays code"))
    }

    @Test
    fun eraserHitsSegmentsBetweenSamples() {
        assertEquals(0f, distanceToSegmentSquared(50f, 50f, 0f, 0f, 100f, 100f), 0.001f)
        assertEquals(100f, distanceToSegmentSquared(50f, 10f, 0f, 0f, 100f, 0f), 0.001f)
        assertEquals(25f, distanceToSegmentSquared(3f, 4f, 0f, 0f, 0f, 0f), 0.001f)
    }
}
