package ai.mivor.kiosk

import android.os.Handler
import android.os.Looper
import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

/**
 * Conexión del kiosko con la cuenta MIVOR del paciente.
 *
 * El cuidador genera un código de 6 cifras en la web (Más > Kiosko MIVOR) y el kiosko lo canjea
 * por su propia llave (X-Device-Token). Con esa llave solo puede usar los endpoints /api/device: registrar
 * tomas por voz y consultar la medicación. Nunca se guarda la contraseña de nadie en la tablet.
 *
 * Las llamadas se hacen en segundo plano y el resultado se entrega en el hilo principal.
 */
object MivorApi {
    const val BASE_URL = "https://med-ai-hub-v2-production.up.railway.app"
    private const val TIMEOUT_MS = 10_000

    private val executor = Executors.newSingleThreadExecutor()
    private val main = Handler(Looper.getMainLooper())

    sealed class Result<out T> {
        data class Ok<T>(val value: T) : Result<T>()
        /** La llave ya no vale (el cuidador desvinculó la tablet desde la web). */
        object Unlinked : Result<Nothing>()
        data class Error(val message: String) : Result<Nothing>()
    }

    data class Pairing(val token: String, val patientName: String)
    data class VoiceReply(val intent: String, val speech: String)

    fun pair(code: String, deviceName: String, callback: (Result<Pairing>) -> Unit) = run(callback) {
        val body = JSONObject().put("code", code).put("device_name", deviceName)
        val (status, json) = request("POST", "/api/devices/pair", body, token = null)
        when (status) {
            200 -> Result.Ok(Pairing(json.getString("device_token"), json.optString("patient_name")))
            400 -> Result.Error("Código incorrecto o caducado. Genera uno nuevo en MIVOR.")
            429 -> Result.Error("Demasiados intentos. Espera un minuto.")
            else -> Result.Error("No se pudo vincular (error $status).")
        }
    }

    fun voice(token: String, text: String, callback: (Result<VoiceReply>) -> Unit) = run(callback) {
        val (status, json) = request("POST", "/api/device/voice", JSONObject().put("text", text), token)
        when (status) {
            200 -> Result.Ok(VoiceReply(json.optString("intent"), json.optString("speech")))
            401 -> Result.Unlinked
            else -> Result.Error("error $status")
        }
    }

    /** Resumen del día para la pantalla de inicio (la toma de ahora, la siguiente, la lista y las citas). */
    fun today(token: String, callback: (Result<Today>) -> Unit) = run(callback) {
        todayResult(request("GET", "/api/device/today", null, token))
    }

    /** Marca (o desmarca, "deshacer") la toma de hoy de un medicamento. Devuelve el resumen actualizado. */
    fun setTaken(token: String, medicationId: Int, taken: Boolean, callback: (Result<Today>) -> Unit) = run(callback) {
        todayResult(request(if (taken) "POST" else "DELETE", "/api/device/medications/$medicationId/taken", null, token))
    }

    private fun todayResult(response: Pair<Int, JSONObject>): Result<Today> {
        val (status, json) = response
        return when (status) {
            200 -> Result.Ok(Today.from(json))
            401 -> Result.Unlinked
            else -> Result.Error("error $status")
        }
    }

    private fun <T> run(callback: (Result<T>) -> Unit, block: () -> Result<T>) {
        executor.execute {
            val result = try {
                block()
            } catch (e: IOException) {
                Result.Error("Sin conexión con MIVOR.")
            } catch (e: Exception) {
                Result.Error(e.message ?: "Error inesperado.")
            }
            main.post { callback(result) }
        }
    }

    private fun request(method: String, path: String, body: JSONObject?, token: String?): Pair<Int, JSONObject> {
        val conn = URL(BASE_URL + path).openConnection() as HttpURLConnection
        try {
            conn.requestMethod = method
            conn.connectTimeout = TIMEOUT_MS
            conn.readTimeout = TIMEOUT_MS
            conn.setRequestProperty("Accept", "application/json")
            token?.let { conn.setRequestProperty("X-Device-Token", it) }
            // Zona horaria del móvil: MIVOR calcula las tomas en la hora de donde vive el paciente
            conn.setRequestProperty("X-Timezone", java.util.TimeZone.getDefault().id)
            if (body != null) {
                conn.doOutput = true
                conn.setRequestProperty("Content-Type", "application/json; charset=utf-8")
                conn.outputStream.use { it.write(body.toString().toByteArray(Charsets.UTF_8)) }
            }
            val status = conn.responseCode
            val stream = if (status in 200..299) conn.inputStream else conn.errorStream
            val text = stream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() }.orEmpty()
            val json = try { JSONObject(text) } catch (e: Exception) { JSONObject() }
            return status to json
        } finally {
            conn.disconnect()
        }
    }
}
