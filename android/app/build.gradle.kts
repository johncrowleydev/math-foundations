import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}
val releaseVersion = Properties().apply {
    rootProject.file("../version.properties").inputStream().use { load(it) }
}
android {
    namespace = "dev.math.notebook"
    compileSdk = 36
    defaultConfig {
        applicationId = "dev.math.notebook"
        minSdk = 33
        targetSdk = 35
        versionCode = providers.gradleProperty("appVersionCode").orElse(releaseVersion.getProperty("code")).get().toInt()
        versionName = providers.gradleProperty("appVersionName").orElse(releaseVersion.getProperty("name")).get()
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }
    buildFeatures { compose = true; buildConfig = true }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    testOptions { unitTests.isIncludeAndroidResources = true }
    packaging { resources.excludes += setOf("META-INF/AL2.0", "META-INF/LGPL2.1") }
}
val generateContent by tasks.registering(Exec::class) {
    workingDir = rootProject.projectDir.parentFile
    commandLine(if (System.getProperty("os.name").startsWith("Windows")) "node.exe" else "node",
        "--import", "tsx", "scripts/build-android-content.ts")
    inputs.dir("../../content")
    inputs.file("../../scripts/build-android-content.ts")
    inputs.file("../../scripts/content.ts")
    inputs.file("../../scripts/notebook-exercises.ts")
    inputs.file("../../scripts/notebook-placements.ts")
    inputs.file("../../scripts/inline-prerequisites.ts")
    outputs.file("src/main/assets/notebook.json")
}
tasks.named("preBuild") { dependsOn(generateContent) }
dependencies {
    implementation("androidx.work:work-runtime-ktx:2.10.1")
    implementation(platform("androidx.compose:compose-bom:2025.06.01"))
    implementation("androidx.activity:activity-compose:1.10.1")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.9.1")
    implementation("androidx.ink:ink-authoring:1.0.0")
    implementation("androidx.ink:ink-brush:1.0.0")
    implementation("androidx.ink:ink-strokes:1.0.0")
    implementation("androidx.ink:ink-geometry:1.0.0")
    implementation("androidx.ink:ink-rendering:1.0.0")
    implementation("androidx.ink:ink-storage:1.0.0")
    implementation("androidx.input:input-motionprediction:1.0.0")
    implementation("io.noties.markwon:core:4.6.2")
    implementation("io.noties.markwon:ext-tables:4.6.2")
    implementation("io.noties.markwon:inline-parser:4.6.2")
    implementation("io.noties.markwon:ext-latex:4.6.2")
    debugImplementation("androidx.compose.ui:ui-tooling")
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.robolectric:robolectric:4.14.1")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation(platform("androidx.compose:compose-bom:2025.06.01"))
    androidTestImplementation("androidx.test:runner:1.6.2")
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    androidTestImplementation("ru.noties:jlatexmath-android:0.2.0")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
