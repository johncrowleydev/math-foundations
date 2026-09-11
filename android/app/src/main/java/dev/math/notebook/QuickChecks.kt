package dev.math.notebook

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** Optional, ungraded checks. Choices and reveals survive leaving the lesson. */
@Composable
internal fun QuickCheckCard(check: QuickCheck, storageKey: String) {
    val context = LocalContext.current
    val prefs = remember(context) { context.getSharedPreferences("quick-checks", 0) }
    var selected by
        rememberSaveable(storageKey) { mutableIntStateOf(prefs.getInt("$storageKey:choice", -1)) }
    var revealed by
        rememberSaveable(storageKey) {
            mutableStateOf(prefs.getBoolean("$storageKey:revealed", false))
        }
    Column(
        Modifier.fillMaxWidth()
            .testTag("quick:$storageKey")
            .background(Color(0xffeef3e9), RoundedCornerShape(16.dp))
            .padding(30.dp)
    ) {
        Text(
            "Quick check",
            fontFamily = FontFamily.Serif,
            fontSize = 25.sp,
            color = Color(0xff266655),
        )
        Spacer(Modifier.height(16.dp))
        RichText(check.prompt, Modifier.fillMaxWidth(), 18f, source = "quick:${check.id}:prompt")
        Column(
            Modifier.fillMaxWidth().padding(top = 16.dp).selectableGroup(),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            check.options.forEachIndexed { index, option ->
                val choose = {
                    selected = index
                    prefs.edit().putInt("$storageKey:choice", index).apply()
                }
                Row(
                    Modifier.fillMaxWidth()
                        .heightIn(min = 60.dp)
                        .background(
                            if (selected == index) Color(0xffdce9d9) else Color(0xfffffef9),
                            RoundedCornerShape(12.dp),
                        )
                        .selectable(
                            selected = selected == index,
                            role = Role.RadioButton,
                            onClick = choose,
                        )
                        .testTag("choice:$storageKey:$index")
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    RadioButton(selected = selected == index, onClick = null)
                    Spacer(Modifier.width(12.dp))
                    RichText(option, Modifier.weight(1f), 17f, onClick = choose)
                }
            }
        }
        val references = LocalReferences.current
        if (references != null)
            TextButton(
                onClick = {
                    references.studyTexts =
                        listOf("quick:${check.id}:prompt" to check.prompt) +
                            check.options.mapIndexed { i, option ->
                                "quick:${check.id}:option:$i" to option
                            }
                    references.full = true
                    references.open("question-reference")
                }
            ) {
                Text("References for this question")
            }
        TextButton(
            onClick = {
                revealed = !revealed
                prefs.edit().putBoolean("$storageKey:revealed", revealed).apply()
            },
            modifier = Modifier.padding(top = 12.dp).testTag("reveal:$storageKey"),
        ) {
            Text(if (revealed) "Hide answer" else "Reveal answer")
        }
        if (revealed) {
            Column(Modifier.fillMaxWidth().testTag("answer:$storageKey").padding(top = 8.dp)) {
                RichText(
                    "**Answer:** ${check.options[check.answer]}",
                    Modifier.fillMaxWidth(),
                    17f,
                    source = "quick:${check.id}:option:${check.answer}",
                )
                Spacer(Modifier.height(10.dp))
                RichText(
                    check.explanation,
                    Modifier.fillMaxWidth(),
                    17f,
                    source = "quick:${check.id}:explanation",
                )
            }
        }
    }
}
