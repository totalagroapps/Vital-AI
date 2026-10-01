package ai.mivor.kiosk

import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale
import java.util.concurrent.Executors
import android.os.Handler
import android.os.Looper

/** Un medicamento de hoy tal como lo devuelve /api/device/today. */
data class TodayMed(
    val id: Int,
    val name: String,
    val label: String,
    val detail: String,
    val time: String?,
    val taken: Boolean,
    val takenTime: String?
) {
    /** "08:00" -> 480; null si no tiene hora. */
    val minuteOfDay: Int?
        get() = time?.split(":")?.takeIf { it.size == 2 }?.let { (h, m) -> h.toIntOrNull()?.times(60)?.plus(m.toIntOrNull() ?: 0) }

    companion object {
        fun from(json: JSONObject?): TodayMed? = json?.let {
            TodayMed(
                id = it.getInt("id"),
                name = it.optString("name"),
                label = it.optString("label").ifBlank { it.optString("name") },
                detail = it.optString("detail"),
                time = it.optString("time").takeIf { t -> !it.isNull("time") && t.isNotBlank() },
                taken = it.optBoolean("taken"),
                takenTime = it.optString("taken_time").takeIf { t -> !it.isNull("taken_time") && t.isNotBlank() }
            )
        }
    }
}

/** [startsAtMillis]: inicio de la cita (epoch en ms); se muestra en la hora local del teléfono. */
data class TodayAppointment(val startsAtMillis: Long, val doctor: String, val video: Boolean)

/** Resumen del día para la pantalla de inicio del kiosko. */
data class Today(
    val firstName: String,
    val hasMeds: Boolean,
    val allDone: Boolean,
    val due: TodayMed?,
    val next: TodayMed?,
    val meds: List<TodayMed>,
    val appointments: List<TodayAppointment>
) {
    companion object {
        fun from(json: JSONObject): Today = Today(
            firstName = json.optString("first_name"),
            hasMeds = json.optBoolean("has_meds"),
            allDone = json.optBoolean("all_done"),
            due = if (json.isNull("due")) null else TodayMed.from(json.optJSONObject("due")),
            next = if (json.isNull("next")) null else TodayMed.from(json.optJSONObject("next")),
            meds = (json.optJSONArray("meds") ?: JSONArray()).let { arr ->
                (0 until arr.length()).mapNotNull { TodayMed.from(arr.optJSONObject(it)) }
            },
            appointments = (json.optJSONArray("appointments") ?: JSONArray()).let { arr ->
                (0 until arr.length()).mapNotNull { i ->
                    val a = arr.optJSONObject(i) ?: return@mapNotNull null
                    val starts = a.optLong("starts_ms", 0L).takeIf { it > 0 } ?: return@mapNotNull null
                    TodayAppointment(starts, a.optString("doctor"), a.optBoolean("video"))
                }
            }
        )
    }
}

/**
 * Tiempo de hoy con Open-Meteo (gratuito y sin cuenta). Solo se envía la posición aproximada
 * (redondeada a ~10 km): nunca la exacta ni nada de la persona.
 */
object WeatherApi {
    data class Weather(val temperature: Int, val label: String, val icon: Int)

    private val executor = Executors.newSingleThreadExecutor()
    private val main = Handler(Looper.getMainLooper())

    fun fetch(latitude: Double, longitude: Double, callback: (Weather?) -> Unit) {
        executor.execute {
            val weather = try {
                val lat = String.format(Locale.ROOT, "%.1f", latitude)
                val lon = String.format(Locale.ROOT, "%.1f", longitude)
                val url = URL("https://api.open-meteo.com/v1/forecast?latitude=$lat&longitude=$lon&current=temperature_2m,weather_code,is_day")
                val conn = url.openConnection() as HttpURLConnection
                try {
                    conn.connectTimeout = 10_000
                    conn.readTimeout = 10_000
                    if (conn.responseCode != 200) null
                    else {
                        val current = JSONObject(conn.inputStream.bufferedReader().use { it.readText() }).getJSONObject("current")
                        describe(
                            Math.round(current.getDouble("temperature_2m")).toInt(),
                            current.getInt("weather_code"),
                            current.optInt("is_day", 1) == 1
                        )
                    }
                } finally {
                    conn.disconnect()
                }
            } catch (e: Exception) {
                null
            }
            main.post { callback(weather) }
        }
    }

    /** Códigos WMO de Open-Meteo, en palabras sencillas. */
    private fun describe(temperature: Int, code: Int, isDay: Boolean): Weather = when (code) {
        0 -> Weather(temperature, if (isDay) "Soleado" else "Despejado", if (isDay) R.drawable.ic_weather_sun else R.drawable.ic_weather_cloud)
        1, 2 -> Weather(temperature, "Algo nublado", if (isDay) R.drawable.ic_weather_sun else R.drawable.ic_weather_cloud)
        3, 45, 48 -> Weather(temperature, if (code == 3) "Nublado" else "Niebla", R.drawable.ic_weather_cloud)
        in 71..77, 85, 86 -> Weather(temperature, "Nieve", R.drawable.ic_weather_rain)
        in 95..99 -> Weather(temperature, "Tormenta", R.drawable.ic_weather_rain)
        else -> Weather(temperature, "Lluvia", R.drawable.ic_weather_rain)
    }
}
