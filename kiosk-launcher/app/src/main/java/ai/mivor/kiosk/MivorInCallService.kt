package ai.mivor.kiosk

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.speech.tts.TextToSpeech
import android.telecom.Call
import android.telecom.CallAudioState
import android.telecom.InCallService
import android.telecom.TelecomManager
import android.telecom.VideoProfile
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

/**
 * Gestor de llamadas del kiosko. Android solo lo usa cuando MIVOR es la app de teléfono
 * predeterminada (el cuidador lo activa en su panel).
 *
 * Llamada entrante de un contacto marcado como "Contestar solo": se silencia el timbre, se
 * anuncia en voz alta ("Te llama Hijo") y se contesta en altavoz con el volumen al máximo.
 * Cualquier otra llamada suena normal y se contesta desde la pantalla con botones grandes.
 * Nunca se contesta sola una llamada de un número que no esté en la lista.
 */
class MivorInCallService : InCallService() {

    companion object {
        private const val CHANNEL_ID = "incoming_calls"
        private const val NOTIFICATION_ID = 4242
        /** Tiempo para anunciar quién llama antes de contestar. */
        private const val ANNOUNCE_BEFORE_ANSWER_MS = 3_500L
    }

    private val handler = Handler(Looper.getMainLooper())
    private var tts: TextToSpeech? = null
    private var ttsReady = false
    private val autoAnswered = mutableSetOf<Call>()

    override fun onCreate() {
        super.onCreate()
        CallManager.service = this
        tts = TextToSpeech(this) { status ->
            ttsReady = status == TextToSpeech.SUCCESS
            if (ttsReady) tts?.language = KioskConfig(this).country.locale
        }
    }

    override fun onDestroy() {
        if (CallManager.service == this) CallManager.service = null
        handler.removeCallbacksAndMessages(null)
        tts?.shutdown()
        super.onDestroy()
    }

    val isSpeakerOn: Boolean
        get() = callAudioState?.route == CallAudioState.ROUTE_SPEAKER

    @Suppress("DEPRECATION")
    fun toggleSpeaker() {
        setAudioRoute(if (isSpeakerOn) CallAudioState.ROUTE_WIRED_OR_EARPIECE else CallAudioState.ROUTE_SPEAKER)
    }

    override fun onCallAdded(call: Call) {
        super.onCallAdded(call)
        val config = KioskConfig(this)
        val number = CallManager.numberOf(call)
        val index = config.contactIndexForNumber(number)
        val name = index?.let { config.contact(it).name } ?: number.ifBlank { "Número oculto" }
        CallManager.onCallAdded(call, name)
        call.registerCallback(stateCallback)

        val ringing = CallManager.stateOf(call) == Call.STATE_RINGING
        if (ringing) showIncomingCallScreen(name) else openCallScreen()

        if (ringing && index != null && config.isAutoAnswer(index)) {
            autoAnswer(call, name)
        }
    }

    override fun onCallRemoved(call: Call) {
        super.onCallRemoved(call)
        call.unregisterCallback(stateCallback)
        autoAnswered.remove(call)
        CallManager.onCallRemoved(call)
        NotificationManagerCompat.from(this).cancel(NOTIFICATION_ID)
    }

    private val stateCallback = object : Call.Callback() {
        override fun onStateChanged(call: Call, state: Int) {
            if (state == Call.STATE_ACTIVE) {
                NotificationManagerCompat.from(this@MivorInCallService).cancel(NOTIFICATION_ID)
                // Contestada sola: altavoz y volumen alto para que se oiga desde lejos
                if (call in autoAnswered) useSpeakerLoud()
            }
        }
    }

    private fun autoAnswer(call: Call, name: String) {
        getSystemService(TelecomManager::class.java)?.let {
            try { it.silenceRinger() } catch (e: SecurityException) { /* sin rol de teléfono */ }
        }
        if (ttsReady) tts?.speak("Te llama $name. Contestando.", TextToSpeech.QUEUE_FLUSH, null, "incoming_call")
        handler.postDelayed({
            // Solo si sigue sonando (quien llama pudo colgar o la persona contestar antes)
            if (CallManager.stateOf(call) == Call.STATE_RINGING) {
                autoAnswered += call
                call.answer(VideoProfile.STATE_AUDIO_ONLY)
            }
        }, ANNOUNCE_BEFORE_ANSWER_MS)
    }

    @Suppress("DEPRECATION") // setAudioRoute sigue siendo la vía para InCallService en Android 14+
    fun useSpeakerLoud() {
        setAudioRoute(CallAudioState.ROUTE_SPEAKER)
        val audio = getSystemService(AudioManager::class.java) ?: return
        audio.setStreamVolume(AudioManager.STREAM_VOICE_CALL, audio.getStreamMaxVolume(AudioManager.STREAM_VOICE_CALL), 0)
    }

    private fun openCallScreen() {
        startActivity(Intent(this, CallActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }

    /**
     * Llamada entrante: Android no deja abrir pantallas desde segundo plano, así que se usa una
     * notificación a pantalla completa (se muestra sola con el teléfono bloqueado o en reposo).
     */
    private fun showIncomingCallScreen(name: String) {
        ensureChannel(this)
        val open = PendingIntent.getActivity(
            this, 0,
            Intent(this, CallActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_mivor_health)
            .setContentTitle("Llamada de $name")
            .setContentText("Toca para contestar")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setContentIntent(open)
            .setFullScreenIntent(open, true)
            .setOngoing(true)
            .build()
        try {
            NotificationManagerCompat.from(this).notify(NOTIFICATION_ID, notification)
        } catch (e: SecurityException) { /* sin permiso de notificaciones */ }
        // Con la app delante (lo normal en el kiosko) también se abre directamente
        try { openCallScreen() } catch (e: Exception) { }
    }

    private fun ensureChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = context.getSystemService(NotificationManager::class.java)
        if (manager.getNotificationChannel(CHANNEL_ID) != null) return
        manager.createNotificationChannel(
            NotificationChannel(CHANNEL_ID, "Llamadas entrantes", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "Pantalla para contestar llamadas"
                setSound(null, null) // el timbre ya lo pone el sistema
            }
        )
    }
}
