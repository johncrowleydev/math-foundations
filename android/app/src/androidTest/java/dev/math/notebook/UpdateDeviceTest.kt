package dev.math.notebook

import androidx.test.platform.app.InstrumentationRegistry
import java.io.File
import java.security.MessageDigest
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test

/** Opt-in live-release tests, run by explicit class/method selection on the personal tablet. */
class UpdateDeviceTest {
    private val instrumentation
        get() = InstrumentationRegistry.getInstrumentation()

    private val context
        get() = instrumentation.targetContext

    private fun waitFor(condition: () -> Boolean) {
        val deadline = System.currentTimeMillis() + 90_000
        while (!condition()) {
            check(System.currentTimeMillis() < deadline) {
                "Update worker timed out: ${Updates.prefs(context).getString("error", "no error")}"
            }
            Thread.sleep(200)
        }
    }

    private fun inkHashes(): String {
        val hashes = JSONObject()
        context.filesDir
            .walkTopDown()
            .filter { it.isFile && it.extension == "json" && !it.path.contains("/updates/") }
            .sortedBy { it.path }
            .forEach {
                val sha =
                    MessageDigest.getInstance("SHA-256").digest(it.readBytes()).joinToString("") { b
                        ->
                        "%02x".format(b)
                    }
                hashes.put(it.relativeTo(context.filesDir).path, sha)
            }
        return hashes.toString()
    }

    @Test
    fun downloadPublishedUpdateAndRecordHandwriting() {
        if (InstrumentationRegistry.getArguments().getString("liveOta") != "true") return
        File(context.filesDir, "before-ota-hashes.txt").writeText(inkHashes())
        val started = System.currentTimeMillis()
        Updates.check(context)
        waitFor { Updates.prefs(context).getLong("checked", 0) >= started }
        val release = Updates.release(context)
        assertNotNull("Publish a newer release before running this opt-in test", release)
        Updates.download(context, release!!)
        waitFor { Updates.prefs(context).getString("ready", null) == release.json() }
        Updates.verify(context, Updates.apk(context), release)
        assertEquals(release.size, Updates.apk(context).length())
    }

    @Test
    fun handwritingSurvivedOta() {
        if (InstrumentationRegistry.getArguments().getString("liveOta") != "true") return
        assertEquals(
            File(context.filesDir, "before-ota-hashes.txt").readText(),
            inkHashes(),
        )
    }
}
