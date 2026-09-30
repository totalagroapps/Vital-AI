package ai.mivor.kiosk

import android.app.KeyguardManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.telecom.Call
import android.telecom.VideoProfile
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.NotificationManagerCompat

/**
 * Pantalla de llamada (entrante, saliente o en curso) con botones grandes.
 * Se muestra también con el teléfono bloqueado. Se cierra sola al colgar.
 */
class CallActivity : AppCompatActivity() {

    private lateinit var tvName: TextView
    private lateinit var tvState: TextView
    private lateinit var btnAnswer: Button
    private lateinit var btnHangup: Button
    private lateinit var btnSpeaker: Button
    private val handler = Handler(Looper.getMainLooper())
    private val listener: () -> Unit = { handler.post { render() } }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        showOverLockScreen()
        setContentView(R.layout.activity_call)
        tvName = findViewById(R.id.tvCallName)
        tvState = findViewById(R.id.tvCallState)
        btnAnswer = findViewById(R.id.btnAnswer)
        btnHangup = findViewById(R.id.btnHangup)
        btnSpeaker = findViewById(R.id.btnSpeaker)

        btnAnswer.setOnClickListener { CallManager.call?.answer(VideoProfile.STATE_AUDIO_ONLY) }
        btnHangup.setOnClickListener {
            val call = CallManager.call ?: return@setOnClickListener finish()
            if (CallManager.stateOf(call) == Call.STATE_RINGING) call.reject(false, null) else call.disconnect()
        }
        btnSpeaker.setOnClickListener {
            CallManager.service?.toggleSpeaker()
            handler.postDelayed({ render() }, 300)
        }
        // En plena llamada no se sale con "atrás": solo colgando
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {}
        })
    }

    override fun onStart() {
        super.onStart()
        CallManager.addListener(listener)
        render()
    }

    override fun onStop() {
        CallManager.removeListener(listener)
        super.onStop()
    }

    private fun render() {
        val call = CallManager.call
        val state = CallManager.stateOf(call)
        if (call == null || state == Call.STATE_DISCONNECTED) {
            NotificationManagerCompat.from(this).cancel(4242)
            finish()
            return
        }
        tvName.text = CallManager.displayName
        tvState.text = when (state) {
            Call.STATE_RINGING -> "Te está llamando"
            Call.STATE_DIALING, Call.STATE_CONNECTING -> "Llamando…"
            Call.STATE_ACTIVE -> "En llamada"
            Call.STATE_HOLDING -> "En espera"
            else -> ""
        }
        btnAnswer.visibility = if (state == Call.STATE_RINGING) View.VISIBLE else View.GONE
        btnHangup.text = if (state == Call.STATE_RINGING) "Rechazar" else "Colgar"
        val speakerOn = CallManager.service?.isSpeakerOn == true
        btnSpeaker.visibility = if (state == Call.STATE_RINGING) View.GONE else View.VISIBLE
        btnSpeaker.text = if (speakerOn) "Altavoz: activado" else "Poner altavoz"
    }

    private fun showOverLockScreen() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
            getSystemService(KeyguardManager::class.java)?.requestDismissKeyguard(this, null)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                    WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
            )
        }
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }
}
