package ai.mivor.kiosk

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.telephony.SmsManager
import android.util.Log
import androidx.core.content.ContextCompat

/**
 * Respaldo del SOS: SMS directo a todos los contactos configurados, sin tocar nada.
 * Funciona aunque no haya datos móviles, WhatsApp falle o el servicio de accesibilidad esté apagado.
 */
object SosSms {

    private const val TAG = "SosSms"

    fun hasPermission(context: Context) =
        ContextCompat.checkSelfPermission(context, Manifest.permission.SEND_SMS) == PackageManager.PERMISSION_GRANTED

    /** Números a los que se envía: WhatsApp familiar + los 3 contactos, sin repetir. */
    fun recipients(config: KioskConfig): List<String> =
        (listOf(config.whatsappNumber) + config.contacts.map { it.phone })
            .filter { it.isNotBlank() }
            .map { config.toSmsNumber(it) }
            .filter { it.isNotEmpty() }
            .distinctBy { it.removePrefix("+") }

    /** Envía el mensaje a cada contacto. Devuelve a cuántos se pudo entregar al operador. */
    fun send(context: Context, config: KioskConfig, message: String): Int {
        if (!hasPermission(context)) return 0
        val smsManager = smsManager(context) ?: return 0
        val parts = smsManager.divideMessage(message)

        return recipients(config).count { number ->
            try {
                smsManager.sendMultipartTextMessage(number, null, parts, null, null)
                true
            } catch (e: Exception) {
                // Un número mal escrito no debe impedir avisar a los demás
                Log.w(TAG, "No se pudo enviar el SMS SOS a $number", e)
                false
            }
        }
    }

    private fun smsManager(context: Context): SmsManager? = try {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            context.getSystemService(SmsManager::class.java)
        } else {
            @Suppress("DEPRECATION")
            SmsManager.getDefault()
        }
    } catch (e: Exception) {
        Log.w(TAG, "Este dispositivo no puede enviar SMS", e)
        null
    }
}
