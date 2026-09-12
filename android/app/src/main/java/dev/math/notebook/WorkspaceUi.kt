package dev.math.notebook

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.*
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

internal val WorkspaceGround = Color(0xfff6f6f2)
internal val WorkspaceMuted = Color(0xff65716b)
internal val WorkspaceBorder = Color(0xffdfe3dc)

@Composable
internal fun WorkspaceHeader(title: String, subtitle: String, onClose: () -> Unit) {
    Row(
        Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        QuietIcon(Icons.AutoMirrored.Outlined.ArrowBack, "Back", onClick = onClose)
        Text(
            title,
            Modifier.weight(1f).padding(start = 8.dp),
            fontSize = 14.sp,
            color = WorkspaceMuted,
        )
        WorkspaceAction("Done", onClick = onClose)
    }
}

@Composable
internal fun WorkspaceAction(
    label: String,
    icon: ImageVector? = null,
    enabled: Boolean = true,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    CompositionLocalProvider(
        LocalMinimumInteractiveComponentSize provides
            if (androidx.compose.ui.platform.LocalConfiguration.current.screenWidthDp < 600) 48.dp
            else 32.dp
    ) {
        TextButton(
            onClick = onClick,
            enabled = enabled,
            modifier = modifier.heightIn(min = 32.dp),
            shape = RoundedCornerShape(4.dp),
            colors = ButtonDefaults.textButtonColors(contentColor = WorkspaceMuted),
            contentPadding = PaddingValues(horizontal = 6.dp, vertical = 2.dp),
        ) {
            if (icon != null) {
                Icon(icon, null, Modifier.size(14.dp))
                Spacer(Modifier.width(4.dp))
            }
            Text(label, fontSize = 11.sp, maxLines = 1)
        }
    }
}

@Composable
internal fun QuietIcon(
    icon: ImageVector,
    label: String,
    enabled: Boolean = true,
    selected: Boolean = false,
    onClick: () -> Unit,
) {
    CompositionLocalProvider(
        LocalMinimumInteractiveComponentSize provides
            if (androidx.compose.ui.platform.LocalConfiguration.current.screenWidthDp < 600) 48.dp
            else 32.dp
    ) {
        IconButton(
            onClick = onClick,
            enabled = enabled,
            modifier =
                Modifier.size(
                        if (
                            androidx.compose.ui.platform.LocalConfiguration.current.screenWidthDp <
                                600
                        )
                            48.dp
                        else 32.dp
                    )
                    .semantics { this.selected = selected },
        ) {
            Icon(
                icon,
                label,
                Modifier.size(16.dp),
                tint =
                    if (!enabled) WorkspaceBorder
                    else if (selected) MaterialTheme.colorScheme.primary else WorkspaceMuted,
            )
        }
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
    CompositionLocalProvider(
        LocalMinimumInteractiveComponentSize provides
            if (androidx.compose.ui.platform.LocalConfiguration.current.screenWidthDp < 600) 48.dp
            else 32.dp
    ) {
        TextButton(
            onClick,
            enabled = enabled,
            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
        ) {
            Text(
                label,
                fontSize = 11.sp,
                color = if (selected) MaterialTheme.colorScheme.primary else WorkspaceMuted,
                fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
            )
        }
    }
}

@Composable
internal fun SketchPenTools(model: NotebookModel) {
    var settings by remember { mutableStateOf(false) }
    QuietIcon(Icons.Outlined.Backspace, "Eraser", selected = model.eraser) {
        model.eraser = !model.eraser
    }
    Box {
        QuietIcon(Icons.Outlined.Tune, "Ink settings") { settings = true }
        DropdownMenu(settings, { settings = false }) {
            Text("Ink", Modifier.padding(horizontal = 12.dp, vertical = 4.dp), fontSize = 12.sp)
            Row(
                Modifier.padding(horizontal = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                listOf(
                        "Ink" to 0xff253a43.toInt(),
                        "Green" to 0xff286f5d.toInt(),
                        "Blue" to 0xff346fb0.toInt(),
                        "Red" to 0xffad534a.toInt(),
                    )
                    .forEach { (name, color) ->
                        IconButton(
                            { model.color(color) },
                            Modifier.size(36.dp).semantics {
                                contentDescription = "$name ink"
                                selected = model.penColor == color
                            },
                        ) {
                            Surface(
                                Modifier.size(16.dp),
                                shape = CircleShape,
                                color = Color(color),
                                border =
                                    if (model.penColor == color) BorderStroke(2.dp, Color.White)
                                    else null,
                            ) {}
                        }
                    }
            }
            listOf(1.4f to "Fine", 2.4f to "Medium", 4f to "Broad").forEach { (width, label) ->
                DropdownMenuItem(
                    text = { Text(label, fontSize = 12.sp) },
                    onClick = {
                        model.width(width)
                        settings = false
                    },
                    trailingIcon = {
                        if (model.penWidth == width)
                            Icon(Icons.Outlined.Check, null, Modifier.size(14.dp))
                    },
                )
            }
        }
    }
}
