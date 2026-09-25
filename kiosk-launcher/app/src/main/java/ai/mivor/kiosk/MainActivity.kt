package ai.mivor.kiosk

import android.Manifest
import android.annotation.SuppressLint
import android.app.ActivityManager
import android.app.KeyguardManager
import android.content.ActivityNotFoundException
import android.content.ClipData
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.res.ColorStateList
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.graphics.ImageDecoder
import android.location.Location
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.provider.MediaStore
import android.provider.Settings
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.view.inputmethod.EditorInfo
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.EditText
import android.widget.ImageView
import android.widget.Spinner
import android.widget.TextView
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.widget.ImageViewCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import java.io.File
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

class MainActivity : AppCompatActivity(), TextToSpeech.OnInitListener {

    private lateinit var config: KioskConfig
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private val clockHandler = Handler(Looper.getMainLooper())
    private val voiceRestartHandler = Handler(Looper.getMainLooper())
    private val sosHandler = Handler(Looper.getMainLooper())

    private lateinit var tvClock: TextView
    private lateinit var tvDate: TextView
    private lateinit var tvVoiceStatus: TextView
    private lateinit var pillVoice: View
    private lateinit var ivAddIcon: ImageView
    private lateinit var tvAddTitle: TextView
    private lateinit var tvAddSub: TextView

    // Voice & TTS Engine
    private var tts: TextToSpeech? = null
    private var isTtsReady = false
    private var speechRecognizer: SpeechRecognizer? = null
    private var speechIntent: Intent? = null
    private var isListening = false
    private var isKioskActive = true
    private var isSpeechAvailableOnDevice = false

    // SOS
    private var sosDialog: AlertDialog? = null
    /** Tras avisar a la familia por WhatsApp, al volver a MIVOR se abre la llamada a emergencias. */
    private var pendingEmergencyDial = false
    /** Ubicación que se busca durante la cuenta atrás, para tenerla lista al enviar el aviso. */
    private var sosLocation: Location? = null
    private var sosLocationReady = false

    // Fotos
    private var cameraPhotoUri: Uri? = null

    // Clave del cuidador
    private var pinFailures = 0
    private var pinLockedUntil = 0L

    companion object {
        private const val MIVOR_PACKAGE_NAME = "com.vitalai.app"
        private val WHATSAPP_PACKAGES = listOf("com.whatsapp", "com.whatsapp.w4b")

        private const val PERMISSION_REQUEST_ALL = 100
        private const val REQUEST_CODE_SPEECH_INPUT = 1001
        private const val REQUEST_CODE_CAMERA = 1002
        private const val REQUEST_CODE_GALLERY = 1003

        /** Segundos antes de llamar sola: más margen por voz (puede ser una falsa alarma). */
        private const val SOS_COUNTDOWN_VOICE = 10
        private const val SOS_COUNTDOWN_TAP = 5
        private const val LOCATION_TIMEOUT_MS = 20_000L

        private const val MAX_PIN_ATTEMPTS = 5
        private const val PIN_LOCKOUT_MS = 30_000L

        private const val STATE_CAMERA_URI = "camera_uri"
        private const val STATE_PENDING_EMERGENCY = "pending_emergency"
        /** Tiempo máximo esperando la ubicación después de la cuenta atrás. */
        private const val LOCATION_EXTRA_WAIT_MS = 6_000L

        /**
         * Tiempo máximo en WhatsApp antes de abrir emergencias aunque no se haya vuelto a MIVOR.
         * Automático: algo más que el límite del servicio (60 s), que normalmente termina antes.
         */
        private const val SOS_MAX_WHATSAPP_AUTO_MS = 75_000L
        private const val SOS_MAX_WHATSAPP_MANUAL_MS = 45_000L
        /** Con la llamada grupal en curso no se interrumpe: se vuelve a mirar cada tanto. */
        private const val SOS_IN_CALL_RECHECK_MS = 5_000L

        private val EMERGENCY_WORDS = listOf("ayuda", "emergencia", "socorro", "me cai", "auxilio", "urgencia")
    }

    private val clockRunnable = object : Runnable {
        override fun run() {
            updateClockAndDate()
            clockHandler.postDelayed(this, 1000)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        setContentView(R.layout.activity_main)
        applySystemBarInsets()
        blockBackNavigation()

        config = KioskConfig(this)
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)

        savedInstanceState?.let {
            cameraPhotoUri = it.getString(STATE_CAMERA_URI)?.let(Uri::parse)
            pendingEmergencyDial = it.getBoolean(STATE_PENDING_EMERGENCY)
        }

        initViews()
        initTextToSpeech()
        requestInitialPermissions()
        startKioskLockMode()
        handleSosIntent(intent)

        // Primera instalación, o actualización desde una versión con la clave de fábrica 1234
        if (!config.hasPin && savedInstanceState == null) {
            showPinSetupDialog(firstTime = true)
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleSosIntent(intent)
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        outState.putString(STATE_CAMERA_URI, cameraPhotoUri?.toString())
        outState.putBoolean(STATE_PENDING_EMERGENCY, pendingEmergencyDial)
    }

    override fun onResume() {
        super.onResume()
        clockHandler.post(clockRunnable)
        refreshCustomAppTile()
        // Ya estamos delante: el aviso de respaldo sobra
        SosNotification.cancel(this)

        // De vuelta del aviso por WhatsApp (terminado, fallido o interrumpido): llamar a emergencias
        if (pendingEmergencyDial) {
            pendingEmergencyDial = false
            sosHandler.removeCallbacks(emergencyWatchdog)
            SosAutomation.cancel()
            sosHandler.postDelayed({ dialEmergency() }, 1200)
            return
        }

        startKioskLockMode()
        if (isVoicePermissionGranted()) {
            startVoiceEngine()
        }
    }

    override fun onStop() {
        super.onStop()
        // El marcador de emergencias ya tapa MIVOR: el kiosko vuelve a quedar detrás del bloqueo
        if (showingOverLockScreen) setShowOverLockScreen(false)
    }

    override fun onPause() {
        super.onPause()
        clockHandler.removeCallbacks(clockRunnable)
        stopVoiceEngine()
    }

    override fun onDestroy() {
        super.onDestroy()
        sosHandler.removeCallbacksAndMessages(null)
        tts?.stop()
        tts?.shutdown()
        speechRecognizer?.destroy()
    }

    /** Desde Android 16 (targetSdk 36) onBackPressed() ya no se llama: el gesto atrás pasa por aquí. */
    private fun blockBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                Toast.makeText(this@MainActivity, "Para salir usa \"Salir con clave\"", Toast.LENGTH_SHORT).show()
            }
        })
    }

    /**
     * Desde Android 15 (targetSdk 35+) la app dibuja siempre detrás de las barras del sistema:
     * se deja el hueco de la barra de estado, la de navegación y el recorte de la cámara.
     */
    private fun applySystemBarInsets() {
        val root = findViewById<ViewGroup>(android.R.id.content).getChildAt(0)
        ViewCompat.setOnApplyWindowInsetsListener(root) { view, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
            view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            WindowInsetsCompat.CONSUMED
        }
        // Fondo azul claro: iconos oscuros en las barras para que se lean
        WindowCompat.getInsetsController(window, window.decorView).apply {
            isAppearanceLightStatusBars = true
            isAppearanceLightNavigationBars = true
        }
    }

    private fun initViews() {
        tvClock = findViewById(R.id.tvClock)
        tvDate = findViewById(R.id.tvDate)
        tvVoiceStatus = findViewById(R.id.tvVoiceStatus)
        pillVoice = findViewById(R.id.pillVoice)
        ivAddIcon = findViewById(R.id.ivAddIcon)
        tvAddTitle = findViewById(R.id.tvAddTitle)
        tvAddSub = findViewById(R.id.tvAddSub)

        // Toca para hablar: ventana de voz del sistema o simulador
        pillVoice.setOnClickListener {
            if (isSpeechAvailableOnDevice) {
                triggerSystemSpeechPrompt()
            } else {
                showVoiceSimulatorDialog("En este emulador el servicio de voz continuo no está instalado. Usa este simulador o la ventana de voz:")
            }
        }

        // Pulsación larga: simulador de comandos (ideal para probar en emulador)
        pillVoice.setOnLongClickListener {
            showVoiceSimulatorDialog()
            true
        }

        findViewById<View>(R.id.cardMivor).setOnClickListener { launchMivorApp() }
        findViewById<View>(R.id.cardCall).setOnClickListener { showContactsDialog() }
        findViewById<View>(R.id.cardWhatsapp).setOnClickListener { launchFamilyWhatsApp() }
        findViewById<View>(R.id.cardSos).setOnClickListener { showSosCountdown(SOS_COUNTDOWN_TAP) }
        findViewById<View>(R.id.cardCamera).setOnClickListener { openCamera() }
        findViewById<View>(R.id.cardGallery).setOnClickListener { openGallery() }

        // Agregar otra función: abre la app elegida; si no hay ninguna, el cuidador la elige
        findViewById<View>(R.id.cardAdd).apply {
            setOnClickListener { openCustomApp() }
            setOnLongClickListener {
                requestPin("Cambiar función") { showAppPicker() }
                true
            }
        }

        findViewById<View>(R.id.cardSettings).setOnClickListener {
            requestPin("Ajustes") { showCaregiverSettingsDialog() }
        }
        findViewById<View>(R.id.cardLogout).setOnClickListener {
            requestPin("Salir con clave") { exitKioskToHomeChooser() }
        }
    }

    private fun updateClockAndDate() {
        val calendar = Calendar.getInstance()
        val timeFormat = SimpleDateFormat("hh:mm a", Locale.getDefault())
        val dateFormat = SimpleDateFormat("EEEE, d 'de' MMMM", config.country.locale)

        tvClock.text = timeFormat.format(calendar.time).uppercase(Locale.getDefault())
        val dateString = dateFormat.format(calendar.time)
        tvDate.text = dateString.replaceFirstChar { if (it.isLowerCase()) it.titlecase(config.country.locale) else it.toString() }
    }

    private fun startKioskLockMode() {
        if (!isKioskActive) return
        try {
            val activityManager = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
            if (activityManager.lockTaskModeState == ActivityManager.LOCK_TASK_MODE_NONE) {
                startLockTask()
            }
        } catch (e: Exception) {
            // Handled safely if not set as device owner yet
        }
    }

    private fun exitKioskMode() {
        isKioskActive = false
        try {
            stopLockTask()
        } catch (e: Exception) {
            // No estaba en modo kiosko
        }
        Toast.makeText(this, "Modo kiosko desactivado. El teléfono está libre.", Toast.LENGTH_LONG).show()
    }

    /** "Salir con clave": libera el teléfono y abre la elección de pantalla de inicio. */
    private fun exitKioskToHomeChooser() {
        exitKioskMode()
        val homeSettings = Intent(Settings.ACTION_HOME_SETTINGS)
        if (homeSettings.resolveActivity(packageManager) != null) {
            launchExternalIntent(homeSettings)
        }
    }

    // =========================================================================
    // PERMISSIONS MANAGEMENT
    // =========================================================================
    private fun isGranted(permission: String) =
        ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED

    private fun isVoicePermissionGranted() = isGranted(Manifest.permission.RECORD_AUDIO)

    private fun requestInitialPermissions() {
        val permissions = listOfNotNull(
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.CALL_PHONE,
            Manifest.permission.SEND_SMS,
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) Manifest.permission.POST_NOTIFICATIONS else null
        ).filterNot { isGranted(it) }

        if (permissions.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, permissions.toTypedArray(), PERMISSION_REQUEST_ALL)
        } else {
            startVoiceEngine()
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == PERMISSION_REQUEST_ALL) {
            if (isVoicePermissionGranted()) {
                startVoiceEngine()
            }
        }
    }

    // =========================================================================
    // TEXT TO SPEECH (VOICE SPEAKER)
    // =========================================================================
    private fun initTextToSpeech() {
        tts = TextToSpeech(this, this)
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            applyVoiceLanguage()
            tts?.setSpeechRate(0.92f) // Cadencia pausada y clara para adulto mayor
            tts?.setPitch(1.0f)
            isTtsReady = true
        }
    }

    /** Idioma de la voz y del reconocimiento según el país elegido en Ajustes. */
    private fun applyVoiceLanguage() {
        val candidates = listOf(config.country.locale, Locale("es", "ES"), Locale.getDefault())
        for (locale in candidates) {
            val result = tts?.setLanguage(locale)
            if (result != null && result != TextToSpeech.LANG_MISSING_DATA && result != TextToSpeech.LANG_NOT_SUPPORTED) break
        }
        speechIntent?.putExtra(RecognizerIntent.EXTRA_LANGUAGE, config.country.language)
    }

    private fun speak(text: String) {
        if (!isTtsReady) return
        tvVoiceStatus.text = "🔊 $text"
        tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "MIVOR_VOICE_UTTERANCE")
    }

    // =========================================================================
    // CONTINUOUS VOICE ENGINE & WAKE-WORD DETECTION
    // =========================================================================
    private fun startVoiceEngine() {
        isSpeechAvailableOnDevice = SpeechRecognizer.isRecognitionAvailable(this)

        if (!isSpeechAvailableOnDevice) {
            tvVoiceStatus.text = "🎙️ Toca para hablar o probar comandos"
            return
        }

        if (speechRecognizer == null) {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this)
            speechIntent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, config.country.language)
                putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3)
            }

            speechRecognizer?.setRecognitionListener(object : RecognitionListener {
                override fun onReadyForSpeech(params: Bundle?) {
                    isListening = true
                    tvVoiceStatus.text = "🎙️ Escuchando... Di \"Hola MIVOR\" o \"Ayuda\""
                }

                override fun onBeginningOfSpeech() {}
                override fun onRmsChanged(rmsdB: Float) {}
                override fun onBufferReceived(buffer: ByteArray?) {}

                override fun onEndOfSpeech() {
                    isListening = false
                }

                override fun onError(error: Int) {
                    isListening = false
                    // Handle errors gracefully and retry listening
                    when (error) {
                        SpeechRecognizer.ERROR_NO_MATCH,
                        SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> {
                            restartVoiceListeningWithDelay(1000)
                        }
                        SpeechRecognizer.ERROR_AUDIO -> {
                            tvVoiceStatus.text = "🎙️ Activa mic en controles del emulador"
                            restartVoiceListeningWithDelay(3000)
                        }
                        SpeechRecognizer.ERROR_CLIENT,
                        SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> {
                            restartVoiceListeningWithDelay(2000)
                        }
                        else -> {
                            restartVoiceListeningWithDelay(1500)
                        }
                    }
                }

                override fun onResults(results: Bundle?) {
                    isListening = false
                    val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    if (!matches.isNullOrEmpty()) {
                        processVoiceCommand(matches[0])
                    }
                    restartVoiceListeningWithDelay(1800)
                }

                override fun onPartialResults(partialResults: Bundle?) {
                    val partial = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    if (!partial.isNullOrEmpty()) {
                        val spoken = KioskConfig.normalize(partial[0])
                        // Palabras de emergencia: reaccionar sin esperar a que termine la frase
                        if (isEmergency(spoken)) {
                            speechRecognizer?.stopListening()
                            processVoiceCommand(spoken)
                        }
                    }
                }

                override fun onEvent(eventType: Int, params: Bundle?) {}
            })
        }

        if (sosDialog == null) startListeningSafe()
    }

    private fun startListeningSafe() {
        try {
            if (!isListening && speechRecognizer != null && speechIntent != null) {
                speechRecognizer?.startListening(speechIntent)
            }
        } catch (e: Exception) {
            restartVoiceListeningWithDelay(2000)
        }
    }

    private fun stopVoiceEngine() {
        voiceRestartHandler.removeCallbacksAndMessages(null)
        try {
            speechRecognizer?.stopListening()
            speechRecognizer?.cancel()
        } catch (e: Exception) {}
        isListening = false
    }

    private fun restartVoiceListeningWithDelay(delayMs: Long) {
        voiceRestartHandler.removeCallbacksAndMessages(null)
        voiceRestartHandler.postDelayed({
            if (isVoicePermissionGranted() && isSpeechAvailableOnDevice && sosDialog == null) {
                startListeningSafe()
            }
        }, delayMs)
    }

    // =========================================================================
    // SYSTEM SPEECH PROMPT FALLBACK (FOR EMULATORS & TAP-TO-SPEAK)
    // =========================================================================
    private fun triggerSystemSpeechPrompt() {
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, config.country.language)
            putExtra(RecognizerIntent.EXTRA_PROMPT, "Habla ahora... Di \"Hola MIVOR\" o \"Ayuda\"")
        }
        if (!launchExternalIntentForResult(intent, REQUEST_CODE_SPEECH_INPUT)) {
            showVoiceSimulatorDialog("No se pudo iniciar el servicio de voz del sistema. Usa este simulador para probar:")
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        when (requestCode) {
            REQUEST_CODE_SPEECH_INPUT -> {
                val result = data?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
                if (resultCode == RESULT_OK && !result.isNullOrEmpty()) {
                    processVoiceCommand(result[0])
                }
            }
            REQUEST_CODE_CAMERA -> {
                val uri = cameraPhotoUri
                cameraPhotoUri = null
                if (uri == null) return
                if (resultCode == RESULT_OK) {
                    showPhotoActions(uri, fromCamera = true)
                } else {
                    // Foto cancelada: borrar el archivo vacío que se había preparado
                    try { contentResolver.delete(uri, null, null) } catch (e: Exception) {}
                }
            }
            REQUEST_CODE_GALLERY -> {
                val uri = data?.data
                if (resultCode == RESULT_OK && uri != null) {
                    showPhotoActions(uri, fromCamera = false)
                }
            }
        }
    }

    // =========================================================================
    // VOICE SIMULATOR & TESTER (PERFECT FOR TESTING IN EMULATORS)
    // =========================================================================
    private fun showVoiceSimulatorDialog(diagnosticMsg: String? = null) {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_voice_tester, null)
        val dialog = MaterialAlertDialogBuilder(this).setView(dialogView).create()

        val tvDiag = dialogView.findViewById<TextView>(R.id.tvVoiceDiagnostic)
        if (diagnosticMsg != null) {
            tvDiag.text = diagnosticMsg
        }

        dialogView.findViewById<Button>(R.id.btnTriggerSystemMic).setOnClickListener {
            dialog.dismiss()
            triggerSystemSpeechPrompt()
        }

        val quickCommands = mapOf(
            R.id.btnSimWake to "hola mivor",
            R.id.btnSimSos to "ayuda emergencia",
            R.id.btnSimSon to "llama a mi hijo",
            R.id.btnSimDaughter to "llama a mi hija",
            R.id.btnSimApp to "abrir mivor",
            R.id.btnSimPhotos to "ver fotos",
            R.id.btnSimTime to "que hora es",
            R.id.btnSimPills to "que pastillas me tocan"
        )
        quickCommands.forEach { (id, command) ->
            dialogView.findViewById<Button>(id).setOnClickListener {
                dialog.dismiss()
                processVoiceCommand(command)
            }
        }

        val etCustom = dialogView.findViewById<EditText>(R.id.etCustomVoice)
        dialogView.findViewById<Button>(R.id.btnSendCustomVoice).setOnClickListener {
            val text = etCustom.text.toString().trim()
            if (text.isNotEmpty()) {
                dialog.dismiss()
                processVoiceCommand(text)
            }
        }

        dialogView.findViewById<Button>(R.id.btnCloseVoiceTester).setOnClickListener {
            dialog.dismiss()
        }

        dialog.show()
    }

    // =========================================================================
    // VOICE COMMAND PARSER (ZERO-TOUCH SENIOR ACCESSIBILITY)
    // =========================================================================
    private fun isEmergency(cmd: String) = EMERGENCY_WORDS.any { cmd.contains(it) }

    private fun containsWord(text: String, word: String) =
        word.isNotBlank() && Regex("\\b${Regex.escape(word)}\\b").containsMatchIn(text)

    private fun containsAnyWord(text: String, vararg words: String) = words.any { containsWord(text, it) }

    private fun processVoiceCommand(rawText: String) {
        val cmd = KioskConfig.normalize(rawText)

        // 1. EMERGENCIA (máxima prioridad) — con cuenta atrás por si fue una falsa alarma
        if (isEmergency(cmd)) {
            showSosCountdown(SOS_COUNTDOWN_VOICE)
            return
        }

        // 2. LLAMAR A UN CONTACTO: por su nombre o por "hijo", "hija", "cuidador"…
        val contacts = config.contacts
        val contactIndex = contacts.indices.firstOrNull { i ->
            containsWord(cmd, KioskConfig.normalize(contacts[i].name)) ||
                KioskConfig.VOICE_KEYWORDS[i].any { containsWord(cmd, it) }
        }
        if (contactIndex != null) {
            callContact(contacts[contactIndex])
            return
        }

        // 3. MIVOR SALUD
        if (cmd.contains("mivor") && containsAnyWord(cmd, "abrir", "abre", "salud", "medico", "cita", "asistente")) {
            speak("Abriendo MIVOR Salud.")
            launchMivorApp()
            return
        }

        // 4. WHATSAPP
        if (containsAnyWord(cmd, "whatsapp", "mensaje", "mensajes", "grupo")) {
            speak("Abriendo WhatsApp de tu familia.")
            launchFamilyWhatsApp()
            return
        }

        // 5. CÁMARA
        if (containsAnyWord(cmd, "camara") || Regex("\\b(toma|tomar|saca|sacar) (una )?foto").containsMatchIn(cmd)) {
            speak("Abriendo la cámara.")
            openCamera()
            return
        }

        // 6. GALERÍA
        if (containsAnyWord(cmd, "foto", "fotos", "galeria", "album")) {
            speak("Abriendo tus fotos.")
            openGallery()
            return
        }

        // 7. LLAMAR (sin decir a quién)
        if (containsAnyWord(cmd, "llamar", "llama", "llamada", "telefono")) {
            speak("¿A quién quieres llamar?")
            showContactsDialog()
            return
        }

        // 8. HORA Y FECHA
        if (containsAnyWord(cmd, "hora", "dia", "fecha")) {
            val locale = config.country.locale
            val now = Calendar.getInstance().time
            val timeStr = SimpleDateFormat("h 'y' m a", locale).format(now)
            val dateStr = SimpleDateFormat("EEEE d 'de' MMMM", locale).format(now)
            speak("Son las $timeStr del $dateStr.")
            return
        }

        // 9. MEDICAMENTOS
        if (containsAnyWord(cmd, "pastilla", "pastillas", "medicamento", "medicamentos", "remedio", "remedios", "medicina", "medicinas")) {
            val reminder = config.medsReminder
            speak(
                if (reminder.isNotBlank()) "Tu recordatorio: $reminder"
                else "Todavía no tienes recordatorios de medicamentos. Pídele a tu cuidador que los agregue en Ajustes."
            )
            return
        }

        // 10. SALUDO: "Hola MIVOR" / "MIVOR"
        if (cmd.contains("hola mivor") || cmd.contains("oye mivor") || cmd == "mivor") {
            speak("¡Hola! Te escucho. Puedes decirme: llamar a ${contacts[0].name}, WhatsApp, qué hora es, o ayuda.")
            return
        }

        speak("No te entendí. Puedes decir: llamar a ${contacts[0].name}, WhatsApp, qué hora es, o ayuda.")
    }

    // =========================================================================
    // FEATURE 1: MIVOR SALUD (HOSTED APP)
    // =========================================================================
    private fun isInstalled(packageName: String) = packageManager.getLaunchIntentForPackage(packageName) != null

    private fun launchMivorApp() {
        val launchIntent = packageManager.getLaunchIntentForPackage(MIVOR_PACKAGE_NAME)
        if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            launchExternalIntent(launchIntent)
        } else {
            MaterialAlertDialogBuilder(this)
                .setTitle("MIVOR Salud")
                .setMessage("La aplicación MIVOR Salud todavía no está instalada en este teléfono.\n\n¿Quieres abrir la versión web?")
                .setPositiveButton("Abrir MIVOR web") { _, _ ->
                    launchExternalIntent(Intent(Intent.ACTION_VIEW, Uri.parse("https://vitalai.up.railway.app")))
                }
                .setNegativeButton("Cerrar", null)
                .show()
        }
    }

    // =========================================================================
    // FEATURE 2: LLAMAR POR TELÉFONO (CONTACTOS DE UN TOQUE)
    // =========================================================================
    private fun buildDialog(view: View, backgroundRes: Int = R.drawable.bg_dialog): AlertDialog =
        MaterialAlertDialogBuilder(this)
            .setView(view)
            .setBackground(ContextCompat.getDrawable(this, backgroundRes))
            .create()

    private fun showContactsDialog() {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_contacts, null)
        val dialog = buildDialog(dialogView)

        val cardIds = listOf(R.id.cardContact1, R.id.cardContact2, R.id.cardContact3)
        val nameIds = listOf(R.id.tvContact1Name, R.id.tvContact2Name, R.id.tvContact3Name)
        val phoneIds = listOf(R.id.tvContact1Phone, R.id.tvContact2Phone, R.id.tvContact3Phone)

        config.contacts.forEachIndexed { i, contact ->
            dialogView.findViewById<TextView>(nameIds[i]).text = contact.name
            dialogView.findViewById<TextView>(phoneIds[i]).text =
                if (contact.isSet) contact.phone else "Sin número todavía"
            dialogView.findViewById<View>(cardIds[i]).apply {
                alpha = if (contact.isSet) 1f else 0.55f
                setOnClickListener {
                    if (contact.isSet) dialog.dismiss()
                    callContact(contact)
                }
            }
        }

        dialogView.findViewById<Button>(R.id.btnDialOther).setOnClickListener {
            dialog.dismiss()
            launchExternalIntent(Intent(Intent.ACTION_DIAL))
        }
        dialogView.findViewById<Button>(R.id.btnCloseContacts).setOnClickListener {
            dialog.dismiss()
        }

        dialog.show()
    }

    private fun callContact(contact: Contact) {
        if (!contact.isSet) {
            speak("${contact.name} todavía no tiene número. Pídele a tu cuidador que lo agregue en Ajustes.")
            return
        }
        speak("Llamando a ${contact.name}.")
        makeDirectCall(contact.phone)
    }

    /**
     * Llama directamente si hay permiso. Los números de emergencia siempre abren el marcador:
     * Android no deja que una app normal llame sola a emergencias.
     */
    private fun makeDirectCall(phoneNumber: String, forceDialer: Boolean = false) {
        val cleanNumber = phoneNumber.filter { it.isDigit() || it == '+' }
        if (cleanNumber.isEmpty()) {
            Toast.makeText(this, "No hay número configurado", Toast.LENGTH_LONG).show()
            return
        }
        val canCall = !forceDialer && isGranted(Manifest.permission.CALL_PHONE)
        val action = if (canCall) Intent.ACTION_CALL else Intent.ACTION_DIAL
        launchExternalIntent(Intent(action, Uri.parse("tel:$cleanNumber")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }

    // =========================================================================
    // FEATURE 3: SOS EMERGENCIA (CUENTA ATRÁS + LLAMADA + AVISO A LA FAMILIA)
    // =========================================================================
    private fun showSosCountdown(seconds: Int) {
        if (sosDialog != null) return
        stopVoiceEngine()

        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_sos, null)
        val dialog = buildDialog(dialogView, R.drawable.bg_dialog_sos).apply { setCancelable(false) }
        sosDialog = dialog

        val tvCountdown = dialogView.findViewById<TextView>(R.id.tvSosCountdown)
        val emergency = config.emergencyNumber
        val smsNote = if (SosSms.hasPermission(this) && SosSms.recipients(config).isNotEmpty())
            " También les enviaremos un SMS con tu ubicación." else ""
        dialogView.findViewById<TextView>(R.id.tvSosDetail).text =
            if (hasFamilyWhatsApp()) "Avisaremos a tu familia por WhatsApp con tu ubicación, los llamaremos y después llamaremos al $emergency.$smsNote"
            else "Llamaremos al $emergency.$smsNote"

        // Buscar la ubicación mientras corre la cuenta atrás
        sosLocation = null
        sosLocationReady = false
        fetchCurrentLocation { location ->
            sosLocation = location
            sosLocationReady = true
        }

        var remaining = seconds
        val tick = object : Runnable {
            override fun run() {
                if (remaining <= 0) {
                    dialog.dismiss()
                    triggerSosEmergency()
                    return
                }
                tvCountdown.text = remaining.toString()
                remaining--
                sosHandler.postDelayed(this, 1000)
            }
        }

        dialogView.findViewById<Button>(R.id.btnSosCallNow).setOnClickListener {
            dialog.dismiss()
            triggerSosEmergency()
        }
        dialogView.findViewById<Button>(R.id.btnSosCancel).setOnClickListener {
            dialog.dismiss()
            speak("Alerta cancelada.")
        }
        dialog.setOnDismissListener {
            sosHandler.removeCallbacks(tick)
            sosDialog = null
            restartVoiceListeningWithDelay(2500)
        }

        speak("Voy a llamar a emergencias en $seconds segundos. Si fue un error, toca cancelar.")
        sosHandler.post(tick)
        dialog.show()
    }

    private fun hasFamilyWhatsApp() =
        whatsappPackage() != null && (config.familyGroupName.isNotBlank() || config.familyAlertNumber.isNotBlank())

    /**
     * 1) Aviso con la ubicación y llamada grupal por WhatsApp (automático con el servicio de
     *    accesibilidad; si no está activado, con todo preparado para tocar "Enviar").
     * 2) Al volver a MIVOR, llamada a emergencias (ver onResume).
     */
    private fun triggerSosEmergency() {
        // Respaldo: SMS a todos los contactos en cuanto haya ubicación, pase lo que pase con WhatsApp
        withSosLocation { location -> sendSosSms(location) }

        val whatsapp = whatsappPackage()
        if (whatsapp == null || !hasFamilyWhatsApp()) {
            dialEmergency()
            return
        }

        speak("Avisando a tu familia por WhatsApp.")
        withSosLocation { location ->
            val message = sosMessage(location)
            val groupName = config.familyGroupName
            val automatic = SosWhatsAppService.isEnabled(this)

            pendingEmergencyDial = true
            sosHandler.removeCallbacks(emergencyWatchdog)
            sosHandler.postDelayed(
                emergencyWatchdog,
                if (automatic) SOS_MAX_WHATSAPP_AUTO_MS else SOS_MAX_WHATSAPP_MANUAL_MS
            )
            val opened = if (groupName.isNotBlank()) {
                if (automatic) {
                    SosAutomation.start(SosAutomation.Job(SosAutomation.Target.Group(groupName), message, whatsapp))
                    // Pantalla principal de WhatsApp; el servicio busca el grupo desde ahí
                    packageManager.getLaunchIntentForPackage(whatsapp)
                        ?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
                        ?.let { launchExternalIntent(it) } ?: false
                } else {
                    speak("Elige el grupo de tu familia y toca enviar. Después toca el botón de llamada.")
                    shareTextToWhatsApp(whatsapp, message)
                }
            } else {
                if (automatic) {
                    SosAutomation.start(SosAutomation.Job(SosAutomation.Target.OpenedChat, message, whatsapp))
                } else {
                    speak("Toca enviar para avisar a tu familia. Después toca el botón de llamada.")
                }
                openWhatsAppChat(config.familyAlertNumber, message)
            }

            if (!opened) {
                pendingEmergencyDial = false
                sosHandler.removeCallbacks(emergencyWatchdog)
                SosAutomation.cancel()
                dialEmergency()
            }
        }
    }

    /**
     * Si WhatsApp se queda bloqueado (no abre, no encuentra el grupo, la persona no toca nada…)
     * y no se ha vuelto a MIVOR, se abre igualmente la llamada a emergencias.
     */
    private val emergencyWatchdog = object : Runnable {
        override fun run() {
            if (!pendingEmergencyDial) return
            val job = SosAutomation.current
            if (job != null && job.step == SosAutomation.Step.IN_CALL && job.sawCallScreen) {
                // La familia ya está al teléfono; emergencias se abrirá al colgar
                sosHandler.postDelayed(this, SOS_IN_CALL_RECHECK_MS)
                return
            }
            pendingEmergencyDial = false
            SosAutomation.cancel()
            // Si Android bloquea abrir el marcador desde segundo plano, queda el aviso a pantalla completa
            SosNotification.show(this@MainActivity, config.emergencyNumber)
            dialEmergency()
        }
    }

    /** Toque en el aviso de emergencia (o aviso a pantalla completa con el teléfono bloqueado). */
    private fun handleSosIntent(intent: Intent?) {
        if (intent?.action != SosNotification.ACTION_SOS_DIAL) return
        intent.action = null // no repetir la llamada si la pantalla se recrea
        sosHandler.removeCallbacks(emergencyWatchdog)
        SosAutomation.cancel()

        // Encender la pantalla y mostrarse sobre el bloqueo solo para esta llamada
        setShowOverLockScreen(true)
        val keyguard = getSystemService(KeyguardManager::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && keyguard?.isKeyguardLocked == true) {
            // Sin bloqueo seguro se quita solo; con PIN/patrón, el marcador lo pedirá igualmente
            keyguard.requestDismissKeyguard(this, null)
        }

        // onResume abre el marcador (con el mismo camino que al volver de WhatsApp)
        pendingEmergencyDial = true
    }

    private var showingOverLockScreen = false

    @Suppress("DEPRECATION") // las banderas de ventana solo se usan en Android 8.0 y anteriores
    private fun setShowOverLockScreen(show: Boolean) {
        showingOverLockScreen = show
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(show)
            setTurnScreenOn(show)
        } else {
            val flags = WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            if (show) window.addFlags(flags) else window.clearFlags(flags)
        }
    }

    /** Espera a la ubicación (como mucho unos segundos más) y sigue con lo que haya. */
    private fun withSosLocation(block: (Location?) -> Unit) {
        val deadline = SystemClock.elapsedRealtime() + LOCATION_EXTRA_WAIT_MS
        val waiter = object : Runnable {
            override fun run() {
                if (sosLocationReady || SystemClock.elapsedRealtime() >= deadline) {
                    block(sosLocation)
                } else {
                    sosHandler.postDelayed(this, 250)
                }
            }
        }
        waiter.run()
    }

    private fun sendSosSms(location: Location?) {
        if (SosSms.recipients(config).isEmpty()) return
        if (!SosSms.hasPermission(this)) {
            Toast.makeText(this, "Sin permiso de SMS: no se pudo enviar el aviso por mensaje", Toast.LENGTH_LONG).show()
            return
        }
        // Sin emoji: el SMS ocupa menos partes y llega también a teléfonos antiguos
        val sent = SosSms.send(this, config, sosMessage(location).removePrefix("🚨 "))
        if (sent > 0) {
            Toast.makeText(this, "Aviso SOS enviado por SMS a $sent contacto(s)", Toast.LENGTH_LONG).show()
        }
    }

    private fun dialEmergency() {
        speak("Toca el botón verde para llamar a emergencias.")
        makeDirectCall(config.emergencyNumber, forceDialer = true)
    }

    private fun sosMessage(location: Location?): String {
        val where = if (location != null) {
            "Mi ubicación: https://maps.google.com/?q=${location.latitude},${location.longitude}"
        } else {
            "No se pudo obtener mi ubicación."
        }
        return "🚨 ALERTA SOS MIVOR: Necesito ayuda urgente. $where Los estoy llamando ahora."
    }

    /** Ubicación actual (o la última conocida). Siempre llama a [onResult], con null si no hay. */
    @SuppressLint("MissingPermission")
    private fun fetchCurrentLocation(onResult: (Location?) -> Unit) {
        if (!isGranted(Manifest.permission.ACCESS_FINE_LOCATION) && !isGranted(Manifest.permission.ACCESS_COARSE_LOCATION)) {
            onResult(null)
            return
        }

        var delivered = false
        fun deliver(location: Location?) {
            if (delivered) return
            delivered = true
            onResult(location)
        }

        fun deliverLastKnown() {
            fusedLocationClient.lastLocation.addOnCompleteListener { task ->
                deliver(if (task.isSuccessful) task.result else null)
            }
        }

        val cancel = CancellationTokenSource()
        sosHandler.postDelayed({
            if (!delivered) {
                cancel.cancel()
                deliverLastKnown()
            }
        }, LOCATION_TIMEOUT_MS)

        fusedLocationClient.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, cancel.token)
            .addOnSuccessListener { location ->
                if (location != null) deliver(location) else deliverLastKnown()
            }
            .addOnFailureListener { deliverLastKnown() }
    }

    // =========================================================================
    // FEATURE 4: WHATSAPP
    // =========================================================================
    private fun whatsappPackage(): String? = WHATSAPP_PACKAGES.firstOrNull { isInstalled(it) }

    private fun openWhatsAppChat(phone: String, text: String? = null): Boolean {
        val digits = config.toInternationalDigits(phone)
        if (digits.isEmpty()) return false
        var url = "https://api.whatsapp.com/send?phone=$digits"
        if (text != null) url += "&text=${Uri.encode(text)}"
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        whatsappPackage()?.let { intent.setPackage(it) }
        return launchExternalIntent(intent)
    }

    /** Compartir texto: WhatsApp muestra la lista de chats para elegir el destino. */
    private fun shareTextToWhatsApp(whatsapp: String, text: String): Boolean =
        launchExternalIntent(
            Intent(Intent.ACTION_SEND)
                .setType("text/plain")
                .setPackage(whatsapp)
                .putExtra(Intent.EXTRA_TEXT, text)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        )

    private fun launchFamilyWhatsApp() {
        val whatsapp = whatsappPackage()
        if (whatsapp == null) {
            Toast.makeText(this, "WhatsApp no está instalado en este teléfono", Toast.LENGTH_LONG).show()
            return
        }
        val familyPhone = config.familyAlertNumber
        when {
            familyPhone.isNotBlank() -> openWhatsAppChat(familyPhone)
            config.familyGroupName.isNotBlank() ->
                packageManager.getLaunchIntentForPackage(whatsapp)?.let { launchExternalIntent(it) }
            else -> speak("Todavía no hay un WhatsApp de tu familia. Pídele a tu cuidador que lo agregue en Ajustes.")
        }
    }

    // =========================================================================
    // FEATURE 5: CÁMARA Y GALERÍA
    // =========================================================================
    private fun openCamera() {
        val uri = createPhotoUri()
        if (uri == null) {
            Toast.makeText(this, "No se pudo preparar la foto", Toast.LENGTH_LONG).show()
            return
        }
        cameraPhotoUri = uri
        val intent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
            .putExtra(MediaStore.EXTRA_OUTPUT, uri)
            .addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION or Intent.FLAG_GRANT_READ_URI_PERMISSION)
        if (!launchExternalIntentForResult(intent, REQUEST_CODE_CAMERA)) {
            cameraPhotoUri = null
            try { contentResolver.delete(uri, null, null) } catch (e: Exception) {}
        }
    }

    /** Android 10+: en la galería (Imágenes/MIVOR). Android 9 o menos: carpeta privada de la app. */
    private fun createPhotoUri(): Uri? {
        val name = "MIVOR_" + SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date()) + ".jpg"
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val values = ContentValues().apply {
                    put(MediaStore.Images.Media.DISPLAY_NAME, name)
                    put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg")
                    put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/MIVOR")
                }
                contentResolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values)
            } else {
                val dir = File(getExternalFilesDir(Environment.DIRECTORY_PICTURES), "MIVOR").apply { mkdirs() }
                FileProvider.getUriForFile(this, "$packageName.fileprovider", File(dir, name))
            }
        } catch (e: Exception) {
            null
        }
    }

    private fun openGallery() {
        launchExternalIntentForResult(
            Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI),
            REQUEST_CODE_GALLERY
        )
    }

    private fun showPhotoActions(uri: Uri, fromCamera: Boolean) {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_photo_actions, null)
        val dialog = buildDialog(dialogView)

        loadPreview(uri)?.let { dialogView.findViewById<ImageView>(R.id.ivPhotoPreview).setImageBitmap(it) }

        dialogView.findViewById<Button>(R.id.btnPhotoWhatsapp).setOnClickListener {
            dialog.dismiss()
            sharePhotoToWhatsApp(uri)
        }

        val mivorShare = Intent(Intent.ACTION_SEND)
            .setType("image/*")
            .setPackage(MIVOR_PACKAGE_NAME)
            .putExtra(Intent.EXTRA_STREAM, uri)
            .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        val btnMivor = dialogView.findViewById<Button>(R.id.btnPhotoMivor)
        if (mivorShare.resolveActivity(packageManager) != null) {
            btnMivor.setOnClickListener {
                dialog.dismiss()
                launchExternalIntent(mivorShare)
            }
        } else {
            btnMivor.visibility = View.GONE
        }

        dialogView.findViewById<Button>(R.id.btnPhotoDone).apply {
            text = if (fromCamera) "Listo, solo guardar" else "Cerrar"
            setOnClickListener {
                dialog.dismiss()
                if (fromCamera) speak("Foto guardada.")
            }
        }

        dialog.show()
        if (fromCamera) speak("Foto tomada. ¿Quieres enviarla?")
    }

    /** Vista previa reducida para no cargar la foto entera en memoria. */
    private fun loadPreview(uri: Uri, maxSize: Int = 900): Bitmap? = try {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            ImageDecoder.decodeBitmap(ImageDecoder.createSource(contentResolver, uri)) { decoder, info, _ ->
                val scale = maxOf(1, maxOf(info.size.width, info.size.height) / maxSize)
                decoder.setTargetSize(info.size.width / scale, info.size.height / scale)
            }
        } else {
            val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, bounds) }
            var sample = 1
            while (maxOf(bounds.outWidth, bounds.outHeight) / (sample * 2) >= maxSize) sample *= 2
            val options = BitmapFactory.Options().apply { inSampleSize = sample }
            contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, options) }
        }
    } catch (e: Exception) {
        null
    }

    private fun sharePhotoToWhatsApp(uri: Uri) {
        val pkg = whatsappPackage()
        if (pkg == null) {
            Toast.makeText(this, "WhatsApp no está instalado en este teléfono", Toast.LENGTH_LONG).show()
            return
        }
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "image/jpeg"
            setPackage(pkg)
            putExtra(Intent.EXTRA_STREAM, uri)
            clipData = ClipData.newRawUri("", uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            // Abre directamente el chat de la familia (si no, WhatsApp deja elegir a quién)
            val digits = config.toInternationalDigits(config.familyAlertNumber)
            if (digits.isNotEmpty()) putExtra("jid", "$digits@s.whatsapp.net")
        }
        launchExternalIntent(intent)
    }

    // =========================================================================
    // FEATURE 6: AGREGAR OTRA FUNCIÓN (APP ELEGIDA POR EL CUIDADOR)
    // =========================================================================
    private fun openCustomApp() {
        val launchIntent = config.customAppPackage.takeIf { it.isNotEmpty() }
            ?.let { packageManager.getLaunchIntentForPackage(it) }
        if (launchIntent != null) {
            launchExternalIntent(launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        } else {
            requestPin("Agregar otra función") { showAppPicker() }
        }
    }

    private fun showAppPicker() {
        val launcherIntent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
        val apps = packageManager.queryIntentActivities(launcherIntent, 0)
            .map { it.activityInfo.packageName to it.loadLabel(packageManager).toString() }
            .filter { (pkg, _) -> pkg != packageName }
            .distinctBy { it.first }
            .sortedBy { it.second.lowercase(Locale.ROOT) }

        val builder = MaterialAlertDialogBuilder(this)
            .setTitle("Elige una aplicación")
            .setItems(apps.map { it.second }.toTypedArray()) { _, which ->
                config.customAppPackage = apps[which].first
                refreshCustomAppTile()
                Toast.makeText(this, "Añadido: ${apps[which].second}", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Cancelar", null)
        if (config.customAppPackage.isNotEmpty()) {
            builder.setNeutralButton("Quitar") { _, _ ->
                config.customAppPackage = ""
                refreshCustomAppTile()
            }
        }
        builder.show()
    }

    private fun refreshCustomAppTile() {
        val appInfo = config.customAppPackage.takeIf { it.isNotEmpty() }?.let {
            try {
                packageManager.getApplicationInfo(it, 0)
            } catch (e: PackageManager.NameNotFoundException) {
                null
            }
        }

        if (appInfo == null) {
            ivAddIcon.setImageResource(R.drawable.ic_add)
            ImageViewCompat.setImageTintList(ivAddIcon, ColorStateList.valueOf(ContextCompat.getColor(this, R.color.c_gray)))
            ivAddIcon.backgroundTintList = ColorStateList.valueOf(ContextCompat.getColor(this, R.color.circle_gray))
            val pad = resources.getDimensionPixelSize(R.dimen.tile_icon_pad)
            ivAddIcon.setPadding(pad, pad, pad, pad)
            tvAddTitle.text = "Agregar\notra función"
            tvAddSub.text = "Personaliza tu inicio con más opciones"
            return
        }

        ivAddIcon.setImageDrawable(packageManager.getApplicationIcon(appInfo))
        ImageViewCompat.setImageTintList(ivAddIcon, null)
        ivAddIcon.backgroundTintList = ColorStateList.valueOf(Color.WHITE)
        val pad = (4 * resources.displayMetrics.density).toInt()
        ivAddIcon.setPadding(pad, pad, pad, pad)
        tvAddTitle.text = packageManager.getApplicationLabel(appInfo)
        tvAddSub.text = "Toca para abrir"
    }

    // =========================================================================
    // FEATURE 7: CLAVE Y PANEL DEL CUIDADOR
    // =========================================================================
    /** Pide la clave del cuidador y ejecuta [onSuccess] si es correcta. */
    private fun requestPin(title: String, onSuccess: () -> Unit) {
        // Sin clave todavía: lo primero es crearla
        if (!config.hasPin) {
            showPinSetupDialog(firstTime = true, onDone = onSuccess)
            return
        }

        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_pin, null)
        val dialog = buildDialog(dialogView)

        dialogView.findViewById<TextView>(R.id.tvPinTitle).text = title
        dialogView.findViewById<TextView>(R.id.tvPinHint).text = "Escribe la clave del cuidador"

        val etPin = dialogView.findViewById<EditText>(R.id.etPin)

        fun submit() {
            val now = SystemClock.elapsedRealtime()
            if (now < pinLockedUntil) {
                val secs = ((pinLockedUntil - now) / 1000) + 1
                Toast.makeText(this, "Demasiados intentos. Espera $secs segundos.", Toast.LENGTH_SHORT).show()
                return
            }
            if (config.checkPin(etPin.text.toString().trim())) {
                pinFailures = 0
                dialog.dismiss()
                onSuccess()
            } else {
                pinFailures++
                if (pinFailures >= MAX_PIN_ATTEMPTS) {
                    pinFailures = 0
                    pinLockedUntil = now + PIN_LOCKOUT_MS
                    Toast.makeText(this, "Demasiados intentos. Espera ${PIN_LOCKOUT_MS / 1000} segundos.", Toast.LENGTH_LONG).show()
                } else {
                    Toast.makeText(this, "Clave incorrecta. Intenta de nuevo.", Toast.LENGTH_SHORT).show()
                }
                etPin.text.clear()
            }
        }

        etPin.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_DONE) { submit(); true } else false
        }
        dialogView.findViewById<Button>(R.id.btnSubmitPin).setOnClickListener { submit() }
        dialogView.findViewById<Button>(R.id.btnCancelPin).setOnClickListener { dialog.dismiss() }

        dialog.window?.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_STATE_VISIBLE)
        dialog.show()
        etPin.requestFocus()
    }

    private fun showCaregiverSettingsDialog() {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_settings, null)
        val dialog = buildDialog(dialogView)

        dialogView.findViewById<Button>(R.id.btnSettingContacts).setOnClickListener {
            dialog.dismiss()
            showConfigDialog()
        }
        dialogView.findViewById<Button>(R.id.btnSettingSosAuto).apply {
            text = if (SosWhatsAppService.isEnabled(this@MainActivity)) "Aviso SOS automático: activado ✓"
            else "Activar aviso SOS automático"
            setOnClickListener {
                dialog.dismiss()
                showSosAutomationHelp()
            }
        }
        dialogView.findViewById<Button>(R.id.btnSettingSosAlert).apply {
            visibility = if (SosNotification.isFullyAllowed(this@MainActivity)) View.GONE else View.VISIBLE
            setOnClickListener {
                dialog.dismiss()
                MaterialAlertDialogBuilder(this@MainActivity)
                    .setTitle("Aviso de emergencia")
                    .setMessage(
                        "Si WhatsApp se queda bloqueado durante un SOS, MIVOR muestra un aviso a pantalla " +
                            "completa para llamar a emergencias.\n\n" +
                            "Activa las notificaciones de MIVOR y el permiso de \"notificaciones a pantalla completa\"."
                    )
                    .setPositiveButton("Abrir ajustes") { _, _ ->
                        launchExternalIntent(SosNotification.settingsIntent(this@MainActivity))
                    }
                    .setNegativeButton("Cerrar", null)
                    .show()
            }
        }
        dialogView.findViewById<Button>(R.id.btnSettingPin).setOnClickListener {
            showChangePinDialog()
        }
        dialogView.findViewById<Button>(R.id.btnSettingWifi).setOnClickListener {
            launchExternalIntent(Intent(Settings.ACTION_WIFI_SETTINGS))
        }
        dialogView.findViewById<Button>(R.id.btnSettingVolume).setOnClickListener {
            launchExternalIntent(Intent(Settings.ACTION_SOUND_SETTINGS))
        }
        dialogView.findViewById<Button>(R.id.btnSettingExitKiosk).apply {
            text = if (isKioskActive) "Salir del modo kiosko" else "Volver a activar modo kiosko"
            setOnClickListener {
                dialog.dismiss()
                if (isKioskActive) {
                    exitKioskMode()
                } else {
                    isKioskActive = true
                    startKioskLockMode()
                    Toast.makeText(this@MainActivity, "Modo kiosko activado", Toast.LENGTH_SHORT).show()
                }
            }
        }
        dialogView.findViewById<Button>(R.id.btnCloseSettings).setOnClickListener {
            dialog.dismiss()
        }

        dialog.show()
    }

    private fun showSosAutomationHelp() {
        val enabled = SosWhatsAppService.isEnabled(this)
        MaterialAlertDialogBuilder(this)
            .setTitle("Aviso SOS automático")
            .setMessage(
                (if (enabled) "Está activado.\n\n" else "") +
                    "En una emergencia, MIVOR abre el grupo de WhatsApp de la familia, envía el aviso con la ubicación " +
                    "y empieza la llamada grupal, sin que la persona toque nada.\n\n" +
                    "Para activarlo: Accesibilidad > Apps instaladas > \"MIVOR: aviso SOS por WhatsApp\" > Activar.\n\n" +
                    "Escribe también el nombre del grupo en \"Contactos, país y emergencias\"."
            )
            .setPositiveButton(if (enabled) "Abrir accesibilidad" else "Activar ahora") { _, _ ->
                launchExternalIntent(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
            }
            .setNegativeButton("Cerrar", null)
            .show()
    }

    private fun showConfigDialog() {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_config, null)
        val dialog = buildDialog(dialogView)

        val spCountry = dialogView.findViewById<Spinner>(R.id.spCountry)
        val etEmergency = dialogView.findViewById<EditText>(R.id.etEmergency)
        val etNames = listOf(R.id.etName1, R.id.etName2, R.id.etName3).map { dialogView.findViewById<EditText>(it) }
        val etPhones = listOf(R.id.etPhone1, R.id.etPhone2, R.id.etPhone3).map { dialogView.findViewById<EditText>(it) }
        val etWhatsapp = dialogView.findViewById<EditText>(R.id.etWhatsapp)
        val etGroup = dialogView.findViewById<EditText>(R.id.etGroup)
        val etMeds = dialogView.findViewById<EditText>(R.id.etMeds)

        val countries = KioskConfig.COUNTRIES
        spCountry.adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, countries)
        var lastCountry = config.country
        spCountry.setSelection(countries.indexOf(lastCountry))
        spCountry.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                val selected = countries[position]
                // Cambiar el número de emergencias solo si seguía siendo el del país anterior
                val current = etEmergency.text.toString().trim()
                if (current.isEmpty() || current == lastCountry.emergency) {
                    etEmergency.setText(selected.emergency)
                }
                lastCountry = selected
            }

            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }

        etEmergency.setText(config.emergencyNumber)
        config.contacts.forEachIndexed { i, contact ->
            etNames[i].setText(contact.name)
            etPhones[i].setText(contact.phone)
        }
        etWhatsapp.setText(config.whatsappNumber)
        etGroup.setText(config.familyGroupName)
        etMeds.setText(config.medsReminder)

        dialogView.findViewById<Button>(R.id.btnCancelConfig).setOnClickListener { dialog.dismiss() }
        dialogView.findViewById<Button>(R.id.btnSaveConfig).setOnClickListener {
            val country = countries[spCountry.selectedItemPosition]
            config.country = country
            config.emergencyNumber = etEmergency.text.toString().ifBlank { country.emergency }
            etNames.indices.forEach { i ->
                config.setContact(i, Contact(etNames[i].text.toString(), etPhones[i].text.toString()))
            }
            config.whatsappNumber = etWhatsapp.text.toString()
            config.familyGroupName = etGroup.text.toString()
            config.medsReminder = etMeds.text.toString()
            applyVoiceLanguage()
            dialog.dismiss()
            Toast.makeText(this, "Guardado", Toast.LENGTH_SHORT).show()
        }

        dialog.window?.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE)
        dialog.show()
    }

    private fun showChangePinDialog() = showPinSetupDialog(firstTime = false)

    /**
     * Crear (primera vez) o cambiar la clave del cuidador.
     * La primera vez se puede dejar para "Más tarde" para no bloquear el SOS,
     * pero Ajustes y "Salir con clave" no se abren hasta que exista.
     */
    private fun showPinSetupDialog(firstTime: Boolean, onDone: (() -> Unit)? = null) {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_change_pin, null)
        val dialog = buildDialog(dialogView)

        if (firstTime) {
            dialogView.findViewById<TextView>(R.id.tvChangePinTitle).text = "Crea la clave del cuidador"
            dialogView.findViewById<TextView>(R.id.tvChangePinSub).text =
                "De ${KioskConfig.PIN_MIN_LENGTH} a ${KioskConfig.PIN_MAX_LENGTH} números. " +
                    "Protege los Ajustes y la salida del modo kiosko."
        }

        val etNew = dialogView.findViewById<EditText>(R.id.etNewPin)
        val etRepeat = dialogView.findViewById<EditText>(R.id.etNewPin2)

        dialogView.findViewById<Button>(R.id.btnCancelNewPin).apply {
            if (firstTime) text = "Más tarde"
            setOnClickListener { dialog.dismiss() }
        }
        dialogView.findViewById<Button>(R.id.btnSaveNewPin).setOnClickListener {
            val newPin = etNew.text.toString().trim()
            val problem = KioskConfig.pinProblem(newPin)
            when {
                problem != null ->
                    Toast.makeText(this, problem, Toast.LENGTH_SHORT).show()
                newPin != etRepeat.text.toString().trim() ->
                    Toast.makeText(this, "Las claves no coinciden", Toast.LENGTH_SHORT).show()
                else -> {
                    config.setPin(newPin)
                    dialog.dismiss()
                    Toast.makeText(this, if (firstTime) "Clave creada" else "Clave cambiada", Toast.LENGTH_SHORT).show()
                    onDone?.invoke()
                }
            }
        }

        dialog.window?.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_STATE_VISIBLE)
        dialog.show()
        etNew.requestFocus()
    }

    // =========================================================================
    // ABRIR OTRAS APPS (SALIENDO DEL MODO KIOSKO MIENTRAS TANTO)
    // =========================================================================
    private fun launchExternalIntent(intent: Intent): Boolean = launchOutside {
        super.startActivity(intent)
    }

    @Suppress("DEPRECATION")
    private fun launchExternalIntentForResult(intent: Intent, requestCode: Int): Boolean = launchOutside {
        super.startActivityForResult(intent, requestCode)
    }

    private inline fun launchOutside(start: () -> Unit): Boolean {
        try {
            if (isKioskActive) stopLockTask()
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return try {
            start()
            true
        } catch (e: ActivityNotFoundException) {
            Toast.makeText(this, "No hay una aplicación para esto en el teléfono", Toast.LENGTH_LONG).show()
            startKioskLockMode()
            false
        } catch (e: SecurityException) {
            Toast.makeText(this, "El teléfono no permite abrir esto", Toast.LENGTH_LONG).show()
            startKioskLockMode()
            false
        }
    }
}
