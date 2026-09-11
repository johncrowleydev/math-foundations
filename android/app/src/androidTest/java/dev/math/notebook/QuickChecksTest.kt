package dev.math.notebook

import androidx.compose.material3.MaterialTheme
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.StateRestorationTester
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Rule
import org.junit.Test

class QuickChecksTest {
    @get:Rule val rule = createComposeRule()

    @Test
    fun selectionRevealAndRestoration() {
        val key = "test:quick-check"
        InstrumentationRegistry.getInstrumentation()
            .targetContext
            .getSharedPreferences("quick-checks", 0)
            .edit()
            .remove("$key:choice")
            .remove("$key:revealed")
            .commit()
        val restoration = StateRestorationTester(rule)
        restoration.setContent {
            MaterialTheme {
                QuickCheckCard(
                    QuickCheck(
                        "quick-1",
                        "Which value is even?",
                        listOf("3", "4", "5"),
                        1,
                        "4 is twice the integer 2.",
                    ),
                    key,
                )
            }
        }
        rule.onNodeWithTag("answer:$key").assertDoesNotExist()
        rule.onNodeWithTag("choice:$key:0").performClick().assertIsSelected()
        rule.onNodeWithTag("reveal:$key").performClick()
        rule.onNodeWithTag("answer:$key").assertIsDisplayed()
        // Revealing supplies the answer; it neither changes the selection nor grades it.
        rule.onNodeWithTag("choice:$key:0").assertIsSelected()
        restoration.emulateSavedInstanceStateRestore()
        rule.onNodeWithTag("choice:$key:0").assertIsSelected()
        rule.onNodeWithTag("answer:$key").assertIsDisplayed()
        rule.onNodeWithTag("choice:$key:1").performClick().assertIsSelected()
        rule.onNodeWithTag("reveal:$key").performClick()
        rule.onNodeWithTag("answer:$key").assertDoesNotExist()
    }
}
