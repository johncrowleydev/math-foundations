package dev.math.notebook

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.*
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

internal val WorkspaceGround = Color(0xfff1f3ef)
internal val WorkspaceMuted = Color(0xff65716b)
internal val WorkspaceBorder = Color(0xffd6ded7)

@Composable
internal fun WorkspaceHeader(title: String, subtitle: String, onClose: () -> Unit) {
    Surface(color = MaterialTheme.colorScheme.surface, shadowElevation = 1.dp) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = onClose) { Icon(Icons.AutoMirrored.Outlined.ArrowBack, "Back") }
            Column(Modifier.weight(1f).padding(horizontal = 8.dp)) {
                Text(title, fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
                if (subtitle.isNotEmpty()) Text(subtitle, fontSize = 12.sp, color = WorkspaceMuted)
            }
            Button(
                onClick = onClose,
                shape = RoundedCornerShape(10.dp),
                contentPadding = PaddingValues(horizontal = 18.dp, vertical = 8.dp),
            ) {
                Text("Done", fontSize = 13.sp)
            }
        }
    }
}

@Composable
internal fun WorkspaceAction(
    label: String,
    icon: ImageVector? = null,
    enabled: Boolean = true,
    onClick: () -> Unit,
) {
    OutlinedButton(
        onClick = onClick,
        enabled = enabled,
        shape = RoundedCornerShape(8.dp),
        border = BorderStroke(1.dp, WorkspaceBorder),
        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp),
    ) {
        if (icon != null) {
            Icon(icon, null, Modifier.size(16.dp))
            Spacer(Modifier.width(6.dp))
        }
        Text(label, fontSize = 12.sp, maxLines = 1)
    }
}

@Composable
internal fun AnswerMode(
    label: String,
    icon: ImageVector,
    selected: Boolean,
    enabled: Boolean = true,
    onClick: () -> Unit,
) {
    Surface(
        onClick = onClick,
        enabled = enabled,
        shape = RoundedCornerShape(8.dp),
        color = if (selected) MaterialTheme.colorScheme.primary else Color.Transparent,
        contentColor = if (selected) Color.White else MaterialTheme.colorScheme.onSurface,
    ) {
        Row(
            Modifier.heightIn(min = 44.dp).padding(horizontal = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Icon(icon, null, Modifier.size(17.dp))
            Text(
                label,
                fontSize = 13.sp,
                fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Medium,
            )
        }
    }
}

@Composable
internal fun SketchPenTools(model: NotebookModel) {
    Row(
        Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        AnswerMode("Pen", Icons.Outlined.Edit, !model.eraser) { model.eraser = false }
        AnswerMode("Eraser", Icons.Outlined.Backspace, model.eraser) { model.eraser = true }
        VerticalDivider(Modifier.height(24.dp))
        listOf(
                "Ink" to 0xff253a43.toInt(),
                "Green" to 0xff286f5d.toInt(),
                "Blue" to 0xff346fb0.toInt(),
                "Red" to 0xffad534a.toInt(),
            )
            .forEach { (name, color) ->
                IconButton(
                    onClick = { model.color(color) },
                    modifier =
                        Modifier.semantics {
                            contentDescription = "$name ink"
                            selected = model.penColor == color
                        },
                ) {
                    Surface(
                        Modifier.size(24.dp),
                        shape = androidx.compose.foundation.shape.CircleShape,
                        color = Color(color),
                        border =
                            if (model.penColor == color) BorderStroke(3.dp, Color.White) else null,
                    ) {}
                }
            }
        VerticalDivider(Modifier.height(24.dp))
        listOf(1.4f, 2.4f, 4f).forEach { width ->
            FilterChip(
                model.penWidth == width,
                { model.width(width) },
                {
                    Text(
                        when (width) {
                            1.4f -> "Fine"
                            2.4f -> "Medium"
                            else -> "Broad"
                        },
                        fontSize = 12.sp,
                    )
                },
            )
        }
    }
}
