# Foundations for Galaxy Tab S8 Ultra

A native Kotlin / Jetpack Compose notebook for the SM-X900's 14.6-inch display, with dedicated landscape and portrait layouts. Lessons, mathematics, practice, and handwriting work entirely offline.

- Landscape: chapter rail, reading page, vertical pen tools; practice pairs the prompt with a wide writing area.
- Portrait: full-width reading, chapter picker, bottom pen tools; practice stacks the prompt over the writing area.
- The lessons contain 121 editorially placed exercises. The remaining 1,192 exercises are available one at a time in Practice. Original exercise IDs and mathematical objectives are retained, with self-contained prompts, context, and explained answers.
- Only stylus/eraser input makes ink. Exactly two fingers scroll, with no one-finger scrolling or fling. Buttons accept a pen tap. Holding the S Pen side button while writing temporarily selects stroke erasing.
- Pressure-sensitive AndroidX Ink strokes, motion prediction, colors, pen widths, undo/redo, reversible clearing, additional paper, and answer reveal. No grading.
- Ink is stored per lesson/question in private app storage using atomic writes. The same paper coordinates are used across orientation and inline/full-workspace changes. Reading position, practice position, and pen preferences persist. Undo history lasts for the current app session; completed handwriting survives restarting the app.

## Build and install

Requirements: JDK 17 or 21, Android SDK platform 36 and platform-tools, Node.js 22.12+, and the repository's npm dependencies. Set `ANDROID_HOME` or create an untracked `android/local.properties` containing `sdk.dir=...`.

From the repository root:

```powershell
npm ci
$env:JAVA_HOME = 'C:/Program Files/Android/openjdk/jdk-21.0.8'
$env:ANDROID_HOME = "$env:LOCALAPPDATA/Android/Sdk"
./android/gradlew.bat -p android :app:assembleDebug
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n dev.math.notebook/.MainActivity
```

On macOS/Linux use `./android/gradlew -p android ...` with your JDK/SDK paths. Gradle generates the bundled content from the existing Markdown and YAML before compiling. No PDF toolchain is needed for the Android app.

If Java on Windows reports `Unable to establish loopback connection` through `UnixDomainSockets`, use a short, existing temporary path:

```powershell
New-Item -ItemType Directory -Force C:/Temp | Out-Null
$env:JAVA_TOOL_OPTIONS = '-Djdk.net.unixdomain.tmpdir=C:/Temp'
```

The debug APK is at `app/build/outputs/apk/debug/app-debug.apk`. Install updates with `adb install -r` to preserve your notebook. Uninstalling the app or clearing app data removes local handwriting; cloud sync/export is not implemented.

## Verification

```powershell
./android/gradlew.bat -p android :app:testDebugUnitTest :app:lintDebug :app:assembleDebugAndroidTest
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb install -r android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk
adb shell am instrument -w -r dev.math.notebook.test/androidx.test.runner.AndroidJUnitRunner
```

Run instrumented tests on a development notebook: they navigate the first lesson and draw temporary test ink, then restore the original strokes. The direct instrumentation command keeps the installed app and its storage; Gradle's connected-device test task may uninstall its target afterward.

Device verification on the connected SM-X900, Android 16:

- Injected Android stylus events create pressure-bearing strokes; finished strokes serialize and reload, and undo/redo and stroke erasing work.
- Fingers do not write; single-finger swipes do not scroll; two-finger swipes do scroll.
- Canceled stylus input is discarded.
- Portrait/landscape rotation preserves completed ink and the current practice problem.
- All bundled TeX expressions build with the native renderer, and all 1,313 problems are reachable exactly once across inline and dedicated practice.

Physical S Pen feel, hover behavior, and Samsung's system-level palm classification still benefit from hands-on testing. The implementation consumes Android's cancellation signals and ignores finger input for inking; it does not estimate grading, text recognition, or palm shapes.

## Implementation

`scripts/notebook-placements.ts` attaches inline exercises to named teaching headings and stable worksheet question IDs. Exercises render after the complete section. Missing or ambiguous headings fail the build instead of silently moving problems when sections are inserted or renamed. `scripts/build-android-content.ts` generates the native asset using this plan. `content/notebook-adaptations.yaml` supplies exercise-local assumptions, scopes shared definitions to their applicable IDs, and restates prompts and answers that depended on neighboring exercises. `scripts/notebook-exercises.ts` validates the adaptation rules, rejects printed-context references, and validates the resulting math. The generated asset is not committed. The native rendering test also checks compatibility with JLaTeXMath.

The prerequisite audit covered all 121 inline exercises across all 15 lessons, including adapted instructions and revealed answers. Four placements moved later: lesson 1 exercise 31 follows converse/contrapositive, exercise 46 follows De Morgan's laws, exercise 70 follows invalid argument forms (its answer names affirming the consequent), and lesson 5 exercise 31 follows composition as well as inverse functions. Other placements already follow their required explanations or use material taught in preceding lessons. Regression tests cover these prerequisites, heading insertion/removal/duplication, and complete exercise coverage. Future prompt, answer, or teaching-content changes still require checking the mathematical prerequisites; heading validation cannot infer them from prose.

`InkCanvas.kt` embeds `InProgressStrokesView` and eagerly initializes it before layout; this is necessary for the low-latency surface to receive a size inside a Compose `AndroidView`. `NotebookModel.kt` owns ink independently of recycled views and writes immutable snapshots through one background writer. Storage failures are displayed and can be retried without replacing unreadable files.

The app deliberately targets this tablet; no phone layout, account, server, or other input workflow is included.
