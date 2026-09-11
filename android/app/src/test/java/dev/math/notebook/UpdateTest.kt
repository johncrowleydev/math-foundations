package dev.math.notebook

import java.io.File
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [33])
class UpdateTest {
    private val valid =
        AppRelease(
            50,
            "1.0.0",
            "https://github.com/johncrowleydev/math-foundations/releases/download/v1.0.0/foundations.apk",
            "a".repeat(64),
            1234,
        )

    @Test
    fun manifestRoundTrips() {
        assertEquals(valid, AppRelease.parse(valid.json()))
    }

    @Test
    fun rejectsUntrustedDownloads() {
        listOf(
                "http://github.com/johncrowleydev/math-foundations/releases/download/v1/foundations.apk",
                "https://github.com/another/project/releases/download/v1/foundations.apk",
                "https://github.com.evil.example/johncrowleydev/math-foundations/releases/download/v1/foundations.apk",
                "https://attacker@github.com/johncrowleydev/math-foundations/releases/download/v1/foundations.apk",
            )
            .forEach { url ->
                assertThrows(IllegalArgumentException::class.java) {
                    AppRelease.parse(valid.copy(url = url).json())
                }
            }
    }

    @Test
    fun rejectsInvalidVersionsChecksumsAndSizes() {
        listOf(
                valid.copy(code = 0),
                valid.copy(code = Long.MAX_VALUE),
                valid.copy(sha256 = "bad"),
                valid.copy(size = 0),
                valid.copy(size = 200_000_001),
            )
            .forEach {
                assertThrows(IllegalArgumentException::class.java) { AppRelease.parse(it.json()) }
            }
    }

    @Test
    fun refusesTruncatedOrTamperedDownloadBeforeInstallation() {
        val context = RuntimeEnvironment.getApplication()
        val file = File(context.cacheDir, "tampered.apk")
        file.writeText("not an APK")
        try {
            assertThrows(IllegalArgumentException::class.java) {
                Updates.verify(context, file, valid)
            }
            val error =
                assertThrows(IllegalArgumentException::class.java) {
                    Updates.verify(context, file, valid.copy(size = file.length()))
                }
            assertTrue(error.message!!.contains("checksum"))
        } finally {
            file.delete()
        }
    }
}
