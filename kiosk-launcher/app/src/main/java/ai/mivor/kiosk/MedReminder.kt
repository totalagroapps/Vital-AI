package ai.mivor.kiosk

import android.Manifest
import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat

/**
 * Recordatorio de medicación con la pantalla apagada.
 *
 * MainActivity programa una alarma para la próxima toma pendiente (o para el "recuérdamelo en
 * 10 minutos"). Al saltar, un aviso a pantalla completa enciende la pantalla y abre el kiosko,
 * que muestra el recordatorio y lo dice en voz alta. Con la pantalla encendida, MainActivity
 * lo muestra por su cuenta sin esperar a la alarma.
 *
 * La alarma es exacta y también salta en reposo (setExactAndAllowWhileIdle, permiso USE_EXACT_ALARM).
 * Si Android no la permitiera, se usa la inexacta, que puede llegar algunos minutos tarde.
 */
object MedReminder {

    const val ACTION_MED_REMINDER = "ai.mivor.kiosk.action.MED_REMINDER"

    private const val CHANNEL_ID = "med_reminder"
    private const val NOTIFICATION_ID = 4200
    private const val AUTO_DISMISS_MS = 30 * 60_000L

    private fun alarmIntent(context: Context): PendingIntent = PendingIntent.getBroadcast(
        context,
        0,
        Intent(context, MedReminderReceiver::class.java),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    /** Programa (o reprograma) la única alarma de recordatorio. */
    fun schedule(context: Context, atMillis: Long) {
        val alarms = context.getSystemService(AlarmManager::class.java) ?: return
        val pending = alarmIntent(context)
        alarms.cancel(pending)
        // Exacta (USE_EXACT_ALARM en el manifiesto): la inexacta podía llegar hasta 7-8 minutos tarde
        val exactAllowed = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarms.canScheduleExactAlarms()
        when {
            exactAllowed && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ->
                alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMillis, pending)
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ->
                alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMillis, pending)
            else -> alarms.setExact(AlarmManager.RTC_WAKEUP, atMillis, pending)
        }
    }

    fun cancelAlarm(context: Context) {
        context.getSystemService(AlarmManager::class.java)?.cancel(alarmIntent(context))
    }

    fun showNotification(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) return
        ensureChannel(context)

        val open = PendingIntent.getActivity(
            context,
            1,
            Intent(context, MainActivity::class.java)
                .setAction(ACTION_MED_REMINDER)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_pill)
            .setContentTitle("Es la hora de tu pastilla")
            .setContentText("Toca para verla")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setContentIntent(open)
            .setFullScreenIntent(open, true)
            .setAutoCancel(true)
            .setTimeoutAfter(AUTO_DISMISS_MS)
            .build()
        try {
            NotificationManagerCompat.from(context).notify(NOTIFICATION_ID, notification)
        } catch (e: SecurityException) {
            // Sin permiso de notificaciones: el recordatorio saldrá al encender la pantalla
        }
    }

    fun cancelNotification(context: Context) {
        NotificationManagerCompat.from(context).cancel(NOTIFICATION_ID)
    }

    private fun ensureChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = context.getSystemService(NotificationManager::class.java)
        if (manager.getNotificationChannel(CHANNEL_ID) != null) return
        manager.createNotificationChannel(
            NotificationChannel(CHANNEL_ID, "Recordatorio de medicación", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "Enciende la pantalla a la hora de cada toma"
                enableVibration(true)
                lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
            }
        )
    }
}

class MedReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        MedReminder.showNotification(context)
    }
}
