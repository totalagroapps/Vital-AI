package ai.mivor.kiosk

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat

/**
 * Respaldo para abrir emergencias cuando Android no deja que MIVOR se ponga delante sola
 * (restricción de abrir pantallas desde segundo plano, Android 10+).
 * Con la pantalla apagada o bloqueada se muestra a pantalla completa; con el teléfono en uso,
 * como aviso flotante con el botón "Llamar".
 */
object SosNotification {

    const val ACTION_SOS_DIAL = "ai.mivor.kiosk.action.SOS_DIAL"

    private const val CHANNEL_ID = "sos_emergency"
    private const val NOTIFICATION_ID = 911
    private const val AUTO_DISMISS_MS = 10 * 60_000L

    fun show(context: Context, emergencyNumber: String) {
        if (!canNotify(context)) return
        ensureChannel(context)

        val openSos = PendingIntent.getActivity(
            context,
            0,
            Intent(context, MainActivity::class.java)
                .setAction(ACTION_SOS_DIAL)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_sos_emergency)
            .setContentTitle("SOS: llamar a emergencias")
            .setContentText("Toca para llamar al $emergencyNumber")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setContentIntent(openSos)
            .setFullScreenIntent(openSos, true)
            .addAction(R.drawable.ic_emergency_call, "Llamar al $emergencyNumber", openSos)
            .setOngoing(true)
            .setAutoCancel(true)
            .setTimeoutAfter(AUTO_DISMISS_MS)
            .build()

        try {
            NotificationManagerCompat.from(context).notify(NOTIFICATION_ID, notification)
        } catch (e: SecurityException) {
            // Permiso de notificaciones retirado justo ahora: queda el intento directo de llamada
        }
    }

    fun cancel(context: Context) {
        NotificationManagerCompat.from(context).cancel(NOTIFICATION_ID)
    }

    private fun canNotify(context: Context): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) return false
        return NotificationManagerCompat.from(context).areNotificationsEnabled()
    }

    /** Android 14+ puede negar la pantalla completa a apps que no son de llamadas ni alarmas. */
    private fun canUseFullScreen(context: Context): Boolean =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE ||
            context.getSystemService(NotificationManager::class.java).canUseFullScreenIntent()

    /** ¿Está todo listo para que el aviso de emergencia se vea? (para el panel del cuidador) */
    fun isFullyAllowed(context: Context) = canNotify(context) && canUseFullScreen(context)

    /** Pantalla de Ajustes donde el cuidador puede dar lo que falte. */
    fun settingsIntent(context: Context): Intent =
        if (canNotify(context) && Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, Uri.parse("package:${context.packageName}"))
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                .putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
        } else {
            Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${context.packageName}"))
        }

    private fun ensureChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = context.getSystemService(NotificationManager::class.java)
        if (manager.getNotificationChannel(CHANNEL_ID) != null) return
        manager.createNotificationChannel(
            NotificationChannel(CHANNEL_ID, "Emergencias SOS", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "Aviso para llamar a emergencias si WhatsApp se queda bloqueado durante un SOS"
                enableVibration(true)
                lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
                setBypassDnd(true)
            }
        )
    }
}
