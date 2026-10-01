package ai.mivor.kiosk

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import androidx.core.content.FileProvider
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest
import java.util.Locale
import java.util.concurrent.Executors

/**
 * Instala la app MIVOR Salud junto al kiosko.
 *
 * Descarga el APK oficial de la release "latest" de GitHub, comprueba que es MIVOR
 * (com.vitalai.app) y que su SHA-256 coincide con el que anuncia /api/version, y abre el
 * instalador de Android: el cuidador solo tiene que pulsar "Instalar".
 * El kiosko la abre después en modo adulto mayor con el enlace mivor://mayor.
 */
object MivorAppInstaller {
    const val PACKAGE = "com.vitalai.app"
    const val SENIOR_URI = "mivor://mayor"
    private const val APK_URL = "https://github.com/totalagroapps/Vital-AI/releases/download/latest/mivor-latest.apk"
    private const val MAX_APK_BYTES = 150L * 1024 * 1024

    private val executor = Executors.newSingleThreadExecutor()
    private val main = Handler(Looper.getMainLooper())

    fun isInstalled(context: Context) = context.packageManager.getLaunchIntentForPackage(PACKAGE) != null

    /** Android 8+: el kiosko necesita el permiso "instalar apps desconocidas" (lo da el cuidador una vez). */
    fun canInstall(context: Context) =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.O || context.packageManager.canRequestPackageInstalls()

    /** Abre MIVOR en modo adulto mayor (o normal, si la versión instalada aún no lo conoce). */
    fun seniorIntent(context: Context): Intent? {
        val senior = Intent(Intent.ACTION_VIEW, Uri.parse(SENIOR_URI)).setPackage(PACKAGE)
        if (senior.resolveActivity(context.packageManager) != null) return senior.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        return context.packageManager.getLaunchIntentForPackage(PACKAGE)?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }

    /** Descarga y verifica el APK en segundo plano. [onProgress] en %, [onDone] con el archivo o el error. */
    fun download(context: Context, onProgress: (Int) -> Unit, onDone: (File?, String?) -> Unit) {
        val dir = File(context.cacheDir, "mivor").apply { mkdirs() }
        val apk = File(dir, "mivor-salud.apk")
        executor.execute {
            val error = try {
                val expectedSha = expectedSha256()
                val conn = URL(APK_URL).openConnection() as HttpURLConnection
                conn.connectTimeout = 15_000
                conn.readTimeout = 30_000
                conn.instanceFollowRedirects = true
                val total = conn.contentLengthLong
                if (conn.responseCode != 200) throw Exception("No se pudo descargar MIVOR (error ${conn.responseCode}).")
                if (total > MAX_APK_BYTES) throw Exception("El archivo de MIVOR es demasiado grande.")
                val digest = MessageDigest.getInstance("SHA-256")
                conn.inputStream.use { input ->
                    apk.outputStream().use { output ->
                        val buffer = ByteArray(16 * 1024)
                        var read: Int
                        var done = 0L
                        var lastPercent = -1
                        while (input.read(buffer).also { read = it } != -1) {
                            output.write(buffer, 0, read)
                            digest.update(buffer, 0, read)
                            done += read
                            if (done > MAX_APK_BYTES) throw Exception("El archivo de MIVOR es demasiado grande.")
                            val percent = if (total > 0) (done * 100 / total).toInt() else -1
                            if (percent != lastPercent) {
                                lastPercent = percent
                                main.post { onProgress(percent) }
                            }
                        }
                    }
                }
                conn.disconnect()
                val actualSha = digest.digest().joinToString("") { String.format(Locale.ROOT, "%02x", it) }
                if (expectedSha != null && actualSha != expectedSha) {
                    throw Exception("El archivo descargado no coincide con el oficial. Inténtalo de nuevo más tarde.")
                }
                val info = context.packageManager.getPackageArchiveInfo(apk.absolutePath, 0)
                if (info?.packageName != PACKAGE) throw Exception("El archivo descargado no es la app MIVOR.")
                null
            } catch (e: Exception) {
                apk.delete()
                e.message ?: "Sin conexión."
            }
            main.post { if (error == null) onDone(apk, null) else onDone(null, error) }
        }
    }

    /** SHA-256 del APK publicado, según /api/version (null si el servidor no lo da). */
    private fun expectedSha256(): String? = try {
        val conn = URL("${MivorApi.BASE_URL}/api/version").openConnection() as HttpURLConnection
        conn.connectTimeout = 10_000
        conn.readTimeout = 10_000
        val json = JSONObject(conn.inputStream.bufferedReader().use { it.readText() })
        conn.disconnect()
        json.optString("sha256").lowercase(Locale.ROOT).takeIf { it.length == 64 }
    } catch (e: Exception) {
        null
    }

    fun installIntent(context: Context, apk: File): Intent {
        val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", apk)
        return Intent(Intent.ACTION_VIEW)
            .setDataAndType(uri, "application/vnd.android.package-archive")
            .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
    }
}
