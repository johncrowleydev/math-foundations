# Math Foundations

A native Kotlin mathematics notebook for the Samsung Galaxy Tab S8 Ultra, with portrait and landscape layouts, S Pen handwriting, two-finger drag and flick scrolling, and locally saved work. Fifteen lessons contain 121 inline handwriting exercises, 1,192 focused practice exercises, and 30 optional multiple-choice or true/false checks. Answers can be revealed without grading.

## Install and update

Download **foundations.apk** from the [latest release](https://github.com/johncrowleydev/math-foundations/releases/latest). The app's update icon in the top bar opens **Check now**, **Download update**, and **Install update**. Android may require enabling “Allow from this source” for Foundations and confirming installation. Installation preserves notebook data.

Background checks run approximately every 12 hours with a network connection; Android can delay them for battery management. The switch in the update dialog disables them. Notifications are optional; an in-app badge also indicates an available release. Downloads happen only when requested and survive leaving the screen. Failed or cancelled downloads can be restarted. No credentials are embedded in the app.

Updates use public GitHub Release assets: an HTTPS manifest with increasing version code, APK size, and SHA-256 checksum. Before installation the app checks the checksum, package ID, version, and signing identity. Android performs its own installation signature verification. Installation requires user interaction; this is not a device-owner or silent management system.

## Build

Install Node.js 22+, JDK 21, Android SDK platform 36 and build tools 36.0.0. Set `JAVA_HOME` and `ANDROID_HOME`.

```sh
npm ci
npm test
npm run typecheck
bash android/gradlew -p android assembleDebug testDebugUnitTest lintDebug
```

On Windows use `android/gradlew.bat -p android` instead. If Java's Unix-domain socket path fails, set `JAVA_TOOL_OPTIONS=-Djdk.net.unixdomain.tmpdir=C:/Temp` and create that directory. The Gradle build regenerates bundled content; it does not depend on the original math website repository.

See [Android architecture and device testing](android/README.md) for content adaptation, inline prerequisite checks, and handwriting implementation details.

## Publish an OTA release

1. Increase both values in `version.properties`; version codes must strictly increase.
2. Commit and push to `main`, and ensure **Android checks** succeeds.
3. Run **Publish Android update** from GitHub Actions on `main`, or push a matching `vX.Y.Z` tag.

The workflow tests, builds, signs, verifies, and publishes the APK plus `update.json` and `SHA256SUMS` as the latest GitHub Release. An already published version is left unchanged. Keep release publication on trusted commits: the workflow has access to signing secrets. The public repository and public binary distribution do not require EC2.

GitHub Actions secrets are `FOUNDATIONS_KEYSTORE_BASE64`, `FOUNDATIONS_LINEAGE_BASE64`, and `FOUNDATIONS_PASSWORD`. A dedicated production key replaces the original device development key using Android's signed certificate lineage, allowing an in-place migration with handwriting intact. The signing key, lineage, and password are backed up locally outside this repository under the developer's `.android/math-foundations-signing` directory, restricted to that Windows user and SYSTEM. Back up those files securely; losing the key prevents publishing compatible updates.

For a local signed build, set `FOUNDATIONS_KEYSTORE`, `FOUNDATIONS_LINEAGE`, and `FOUNDATIONS_PASSWORD`, run `assembleRelease`, then `node scripts/package-release.mjs`. Artifacts are written under `output/release/`. Never commit signing credentials or device handwriting.

The original website remains in [johncrowleydev/math](https://github.com/johncrowleydev/math). This repository owns its own copy of lesson and worksheet sources; future content edits are independent.

## Inline learning prerequisites

[The complete exercise audit](docs/inline-prerequisite-audit.md) traces every inline handwriting exercise to its preceding explanations. `content/exercise-copy.yaml` owns the complete app wording for every original exercise; shared worksheet directions are never inherited. `content/inline-prerequisites.yaml` records checked wording, prerequisite sections, and the topic label used in the expanded workspace. The build rejects changed wording or teaching until the affected entries are checked again. Updating a hash without examining the content is not a valid audit. Run `npm run audit` to validate and regenerate the human-readable report.

`content/quick-checks.yaml` contains two additional checks per lesson, anchored to named teaching sections with hash validation. Selections and answer visibility persist independently of handwriting. Quick checks have no grading, score, or completion gate. Two-finger drags run in a continuous Compose scroll session, with the standard Compose fling behavior on release. A new finger or pen contact stops momentum immediately.

## Visual teaching and reference library

The offline curriculum includes 51 native mathematical figures with 139 authored states. Previous, Next, and Reset controls expose the authored examples; expanded notes document their data, construction, and limitations. Mathematical labels and captions use the same TeX renderer as the lesson text.

The shared library contains 385 Terms and Notation entries. Search accepts names, aliases, symbols, and TeX names, with alphabetical browsing and lesson filters. Linked prose opens a quick definition; formulas open their exact authored reading and local variable meanings. Full explanations include examples, common confusions, related entries, and teaching links. Landscape uses a side panel and portrait an overlay. Quick-check choices keep selection separate from their reference control.

Content is authored in `content/references/`, `content/figures.json`, and `content/formula-explanations.json`. Lesson Markdown places figures explicitly with `figure:` links and references with `ref:` links. Formula identity includes lesson, stable source anchor, occurrence ordinal, and exact TeX; the normal build rejects missing or stale explanations. Use `npx tsx scripts/build-android-content.ts --inventory-only` when authoring changes. It inventories formulas without publishing assets or approving audits.

`content/concept-introductions.json` records exact introduction passages. `content/curriculum-audit.json` freezes the manually inspected edition of all 15 lessons, 1,313 exercises, 30 quick checks, references, formulas, and figures. `npm run audit:curriculum` regenerates the detailed concept-use inventory under `output/`; `npm test` also regenerates it and rejects changes that invalidate audit evidence. Read changed material and check prerequisites before updating an audit record. Hashes and keyword detection do not establish mathematical correctness.

Stable content anchors replace index-only reading positions. The bundled version-7 ordering migrates older bookmarks; section fallback handles changed prose. Existing lesson slugs, exercise IDs, handwriting keys, saved answers, and quick-check selections are retained. See [the implementation and verification ledger](docs/visual-teaching-implementation.md) for acceptance evidence.
