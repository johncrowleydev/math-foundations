package dev.math.notebook

import android.content.Context
import android.hardware.input.InputManager
import android.view.InputDevice
import android.view.MotionEvent
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.*
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** Hardware observations never overwrite the user's choices or change an active editor. */
class InputPreferences(context: Context) : InputManager.InputDeviceListener {
    private val prefs = context.getSharedPreferences("notebook", 0)
    private val manager = context.getSystemService(InputManager::class.java)
    private val observedStylusDevices = mutableSetOf<Int>()
    var detected by mutableStateOf(hasStylus())
        private set

    var penOverride by mutableStateOf(prefs.getString("input:pen", "auto")!!)
        private set

    val showPen
        get() = penOverride == "show" || (penOverride == "auto" && detected)

    // Freeze automatic defaults for this session; hardware changes must not switch gestures.
    var twoFinger by
        mutableStateOf(prefs.getBoolean("input:twoFinger", detected || prefs.contains("lesson")))
        private set

    var preferTyping by
        mutableStateOf(prefs.getBoolean("input:typing", !detected && !prefs.contains("lesson")))
        private set

    init {
        // Persist installation defaults once. A newly created lesson bookmark must not
        // make a phone look like a legacy pen-only installation on its next launch.
        if (!prefs.contains("input:initialized"))
            prefs
                .edit()
                .putBoolean("input:twoFinger", twoFinger)
                .putBoolean("input:typing", preferTyping)
                .putBoolean("input:initialized", true)
                .apply()
    }

    private fun hasStylus() =
        manager.inputDeviceIds.any { id ->
            id in observedStylusDevices ||
                manager.getInputDevice(id)?.supportsSource(InputDevice.SOURCE_STYLUS) == true
        }

    fun start() {
        detected = hasStylus()
        manager.registerInputDeviceListener(this, null)
    }

    fun stop() {
        manager.unregisterInputDeviceListener(this)
    }

    override fun onInputDeviceAdded(id: Int) {
        detected = hasStylus()
    }

    override fun onInputDeviceRemoved(id: Int) {
        observedStylusDevices.remove(id)
        detected = hasStylus()
    }

    override fun onInputDeviceChanged(id: Int) {
        detected = hasStylus()
    }

    fun observe(event: MotionEvent) {
        if (
            (0 until event.pointerCount).any {
                event.getToolType(it) == MotionEvent.TOOL_TYPE_STYLUS ||
                    event.getToolType(it) == MotionEvent.TOOL_TYPE_ERASER
            }
        ) {
            observedStylusDevices += event.deviceId
            detected = true
        }
    }

    fun toggleScroll() {
        twoFinger = !twoFinger
        prefs.edit().putBoolean("input:twoFinger", twoFinger).apply()
    }

    fun pen(value: String) {
        require(value in listOf("auto", "show", "hide"))
        penOverride = value
        prefs.edit().putString("input:pen", value).apply()
    }

    fun typing(value: Boolean) {
        preferTyping = value
        prefs.edit().putBoolean("input:typing", value).apply()
    }
}

@OptIn(androidx.compose.foundation.ExperimentalFoundationApi::class)
@Composable
fun ScrollPreference(input: InputPreferences, lessonScrolling: Boolean = true) {
    if (!lessonScrolling) {
        Text(
            "Standard scrolling",
            Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            fontSize = 11.sp,
        )
        return
    }
    val haptic = LocalHapticFeedback.current
    var hint by remember { mutableStateOf(false) }
    val toggle = {
        input.toggleScroll()
        haptic.performHapticFeedback(HapticFeedbackType.LongPress)
    }
    Text(
        if (input.twoFinger) "2 fingers to scroll" else "1 finger to scroll",
        Modifier.sizeIn(minWidth = 48.dp, minHeight = 28.dp)
            .testTag("scroll-preference")
            .semantics {
                stateDescription =
                    if (input.twoFinger) "Lesson uses two-finger scrolling"
                    else "Lesson uses standard scrolling"
                customActions =
                    listOf(
                        CustomAccessibilityAction("Switch lesson scrolling") {
                            toggle()
                            true
                        }
                    )
            }
            .combinedClickable(onClick = { hint = true }, onLongClick = toggle)
            .padding(horizontal = 8.dp, vertical = 4.dp),
        fontSize = 11.sp,
    )
    if (hint)
        AlertDialog(
            onDismissRequest = { hint = false },
            title = { Text("Lesson scrolling", style = MaterialTheme.typography.titleSmall) },
            text = {
                Text(
                    "Long press this label to switch between two-finger and standard scrolling. Other lists always scroll normally."
                )
            },
            confirmButton = { TextButton(onClick = { hint = false }) { Text("Close") } },
        )
}

@Composable
fun InputSettingsButton(input: InputPreferences) {
    var open by remember { mutableStateOf(false) }
    TextButton(onClick = { open = true }, modifier = Modifier.testTag("input-settings")) {
        Text("Settings")
    }
    if (open)
        AlertDialog(
            onDismissRequest = { open = false },
            title = { Text("Settings") },
            text = {
                Column(Modifier.verticalScroll(rememberScrollState())) {
                    CloudSettings()
                    Text("Lesson scrolling", style = MaterialTheme.typography.titleSmall)
                    Row(
                        Modifier.fillMaxWidth()
                            .heightIn(min = 36.dp)
                            .toggleable(
                                input.twoFinger,
                                role = Role.Checkbox,
                                onValueChange = { input.toggleScroll() },
                            ),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Checkbox(input.twoFinger, null)
                        Spacer(Modifier.width(8.dp))
                        Text("Require two fingers")
                    }
                    HorizontalDivider(Modifier.padding(vertical = 6.dp))
                    Text("Pen tools", style = MaterialTheme.typography.titleSmall)
                    listOf(
                            "auto" to "Automatic",
                            "show" to "Show pen tools",
                            "hide" to "Hide pen tools",
                        )
                        .forEach { (key, label) ->
                            Row(
                                Modifier.fillMaxWidth()
                                    .heightIn(min = 36.dp)
                                    .selectable(
                                        input.penOverride == key,
                                        role = Role.RadioButton,
                                        onClick = { input.pen(key) },
                                    ),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                RadioButton(input.penOverride == key, null)
                                Spacer(Modifier.width(8.dp))
                                Text(label)
                            }
                        }
                    Text(
                        if (input.detected) "Stylus input detected"
                        else "No stylus currently detected",
                        style = MaterialTheme.typography.bodySmall,
                        color = WorkspaceMuted,
                    )
                    Row(
                        Modifier.fillMaxWidth()
                            .heightIn(min = 36.dp)
                            .padding(top = 6.dp)
                            .toggleable(
                                input.preferTyping,
                                role = Role.Checkbox,
                                onValueChange = { input.typing(it) },
                            ),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Checkbox(input.preferTyping, null)
                        Spacer(Modifier.width(8.dp))
                        Text("Prefer typed answers")
                    }
                    Text(
                        "Existing answers keep their selected mode. Hiding pen tools never removes your handwriting.",
                        style = MaterialTheme.typography.bodySmall,
                        color = WorkspaceMuted,
                    )
                }
            },
            confirmButton = { TextButton(onClick = { open = false }) { Text("Done") } },
        )
}
