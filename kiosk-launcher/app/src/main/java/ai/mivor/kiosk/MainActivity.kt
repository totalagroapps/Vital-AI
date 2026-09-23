package ai.mivor.kiosk

import android.Manifest
import android.app.ActivityManager
import android.app.AlertDialog
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.location.Location
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.view.LayoutInflater
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.cardview.widget.CardView
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

class MainActivity : AppCompatActivity(), TextToSpeech.OnInitListener {

    private lateinit var prefs: SharedPreferences
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private val clockHandler = Handler(Looper.getMainLooper())
    private val voiceRestartHandler = Handler(Looper.getMainLooper())

    private lateinit var tvClock: TextView
    private lateinit var tvDate: TextView
    private lateinit var tvVoiceStatus: TextView
    private lateinit var pillVoice: LinearLayout

    // Voice & TTS Engine
    private var tts: TextToSpeech? = null
    private var isTtsReady = false
    private var speechRecognizer: SpeechRecognizer? = null
    private var speechIntent: Intent? = null
    private var isListening = false
    private var isKioskActive = true

    // Default configuration constants
    companion object {
        private const val PREFS_NAME = "MivorKioskPrefs"
        private const val KEY_PIN = "caregiver_pin"
        private const val DEFAULT_PIN = "1234"
        
        private const val KEY_PHONE_1 = "phone_contact_1"
        private const val KEY_PHONE_2 = "phone_contact_2"
        private const val KEY_PHONE_3 = "phone_contact_3"
        private const val KEY_EMERGENCY_PHONE = "phone_emergency"
        private const val KEY_FAMILY_WPP = "whatsapp_family_phone"

        private const val DEFAULT_PHONE_1 = "+34600111222"
        private const val DEFAULT_PHONE_2 = "+34600333444"
        private const val DEFAULT_PHONE_3 = "+34600555666"
        private const val DEFAULT_EMERGENCY = "112"
        private const val DEFAULT_WPP = "+34600111222"

        private const val MIVOR_PACKAGE_NAME = "com.vitalai.app"
        private const val PERMISSION_REQUEST_ALL = 100
    }

    private val clockRunnable = object : Runnable {
        override fun run() {
            updateClockAndDate()
            clockHandler.postDelayed(this, 1000)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)

        initViews()
        initTextToSpeech()
        requestInitialPermissions()
        startKioskLockMode()
    }

    override fun onResume() {
        super.onResume()
        clockHandler.post(clockRunnable)
        startKioskLockMode()
        if (isVoicePermissionGranted()) {
            startVoiceEngine()
        }
    }

    override fun onPause() {
        super.onPause()
        clockHandler.removeCallbacks(clockRunnable)
        stopVoiceEngine()
    }

    override fun onDestroy() {
        super.onDestroy()
        tts?.stop()
        tts?.shutdown()
        speechRecognizer?.destroy()
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        // Prevent back press from exiting Kiosk
        Toast.makeText(this, "Para salir use Ajustes de Cuidador con PIN", Toast.LENGTH_SHORT).show()
    }

    private fun initViews() {
        tvClock = findViewById(R.id.tvClock)
        tvDate = findViewById(R.id.tvDate)
        tvVoiceStatus = findViewById(R.id.tvVoiceStatus)
        pillVoice = findViewById(R.id.pillVoice)

        // Pill Voice Click: Manual trigger or speech instructions
        pillVoice.setOnClickListener {
            speak("Te escucho atentamente. ¿Qué necesitas?")
            restartVoiceListeningWithDelay(600)
        }

        // 1. MIVOR Salud
        findViewById<CardView>(R.id.cardMivor).setOnClickListener {
            launchMivorApp()
        }

        // 2. Foto-Llamadas Familia
        findViewById<CardView>(R.id.cardCall).setOnClickListener {
            showFamilyContactsDialog()
        }

        // 3. SOS Emergencia
        findViewById<CardView>(R.id.cardSos).setOnClickListener {
            showSosConfirmationDialog()
        }

        // 4. WhatsApp Familiar
        findViewById<CardView>(R.id.cardWhatsapp).setOnClickListener {
            launchFamilyWhatsApp()
        }

        // 5. Álbum Familiar
        findViewById<CardView>(R.id.cardPhotos).setOnClickListener {
            showFamilyPhotosDialog()
        }

        // 6. Modo Cuidador (PIN)
        findViewById<CardView>(R.id.cardSettings).setOnClickListener {
            showPinDialog()
        }
    }

    private fun updateClockAndDate() {
        val calendar = Calendar.getInstance()
        val timeFormat = SimpleDateFormat("hh:mm a", Locale.getDefault())
        val dateFormat = SimpleDateFormat("EEEE, d 'de' MMMM", Locale("es", "ES"))

        tvClock.text = timeFormat.format(calendar.time).uppercase(Locale.getDefault())
        val dateString = dateFormat.format(calendar.time)
        tvDate.text = dateString.replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale("es", "ES")) else it.toString() }
    }

    private fun startKioskLockMode() {
        if (!isKioskActive) return
        try {
            val activityManager = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (activityManager.lockTaskModeState == ActivityManager.LOCK_TASK_MODE_NONE) {
                    startLockTask()
                }
            } else {
                startLockTask()
            }
        } catch (e: Exception) {
            // Handled safely if not set as device owner yet
        }
    }

    // =========================================================================
    // PERMISSIONS MANAGEMENT
    // =========================================================================
    private fun isVoicePermissionGranted(): Boolean {
        return ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
    }

    private fun requestInitialPermissions() {
        val permissions = mutableListOf<String>()
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.RECORD_AUDIO)
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CALL_PHONE) != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.CALL_PHONE)
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.ACCESS_FINE_LOCATION)
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.ACCESS_COARSE_LOCATION)
        }

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
    // TEXT TO SPEECH (VOICE SPREAKER)
    // =========================================================================
    private fun initTextToSpeech() {
        tts = TextToSpeech(this, this)
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            val result = tts?.setLanguage(Locale("es", "ES"))
            if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                tts?.setLanguage(Locale.getDefault())
            }
            tts?.setSpeechRate(0.92f) // Cadencia pausada y clara para adulto mayor
            tts?.setPitch(1.0f)
            isTtsReady = true
        }
    }

    private fun speak(text: String) {
        if (!isTtsReady) return
        tvVoiceStatus.text = "🔊 $text"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "MIVOR_VOICE_UTTERANCE")
        } else {
            @Suppress("DEPRECATION")
            tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null)
        }
    }

    // =========================================================================
    // CONTINUOUS VOICE ENGINE & WAKE-WORD DETECTION
    // =========================================================================
    private fun startVoiceEngine() {
        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            tvVoiceStatus.text = "Micrófono no soportado"
            return
        }

        if (speechRecognizer == null) {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this)
            speechIntent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, "es-ES")
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
                    // Automatically restart listening to maintain continuous hands-free operation
                    restartVoiceListeningWithDelay(1500)
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
                        val spoken = partial[0].lowercase(Locale.ROOT)
                        // Immediate fast-path trigger for urgent emergency words
                        if (spoken.contains("ayuda") || spoken.contains("emergencia") || spoken.contains("socorro") || spoken.contains("me caí") || spoken.contains("me cai")) {
                            speechRecognizer?.stopListening()
                            processVoiceCommand(spoken)
                        }
                    }
                }

                override fun onEvent(eventType: Int, params: Bundle?) {}
            })
        }

        startListeningSafe()
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
            if (isVoicePermissionGranted()) {
                startListeningSafe()
            }
        }, delayMs)
    }

    // =========================================================================
    // VOICE COMMAND PARSER (ZERO-TOUCH SENIOR ACCESSIBILITY)
    // =========================================================================
    private fun processVoiceCommand(rawText: String) {
        val cmd = rawText.lowercase(Locale.ROOT).trim()

        // 1. SOS EMERGENCY / FALL DETECTION (Highest Priority)
        if (cmd.contains("ayuda") || cmd.contains("emergencia") || cmd.contains("socorro") ||
            cmd.contains("me cai") || cmd.contains("me caí") || cmd.contains("auxilio") || cmd.contains("urgencia")) {
            speak("Activando alerta de socorro y llamando a emergencias de inmediato.")
            triggerSosEmergency()
            return
        }

        // 2. CALL SON / CARLOS
        if (cmd.contains("hijo") || cmd.contains("carlos") || cmd.contains("llamar a mi hijo") || cmd.contains("llama a mi hijo")) {
            val phone1 = prefs.getString(KEY_PHONE_1, DEFAULT_PHONE_1) ?: DEFAULT_PHONE_1
            speak("Llamando a tu hijo.")
            makeDirectCall(phone1)
            return
        }

        // 3. CALL DAUGHTER / MARIA
        if (cmd.contains("hija") || cmd.contains("maría") || cmd.contains("maria") || cmd.contains("llamar a mi hija") || cmd.contains("llama a mi hija")) {
            val phone2 = prefs.getString(KEY_PHONE_2, DEFAULT_PHONE_2) ?: DEFAULT_PHONE_2
            speak("Llamando a tu hija.")
            makeDirectCall(phone2)
            return
        }

        // 4. CALL CAREGIVER / NURSE / DOCTOR
        if (cmd.contains("cuidador") || cmd.contains("enfermero") || cmd.contains("enfermera") || cmd.contains("doctor")) {
            val phone3 = prefs.getString(KEY_PHONE_3, DEFAULT_PHONE_3) ?: DEFAULT_PHONE_3
            speak("Llamando a tu cuidador.")
            makeDirectCall(phone3)
            return
        }

        // 5. OPEN MIVOR SALUD
        if (cmd.contains("abrir mivor") || cmd.contains("mivor salud") || cmd.contains("mivor") && (cmd.contains("abrir") || cmd.contains("salud") || cmd.contains("medico") || cmd.contains("cita"))) {
            speak("Abriendo MIVOR Salud.")
            launchMivorApp()
            return
        }

        // 6. WHATSAPP
        if (cmd.contains("whatsapp") || cmd.contains("mensajes") || cmd.contains("mensaje") || cmd.contains("grupo")) {
            speak("Abriendo WhatsApp familiar.")
            launchFamilyWhatsApp()
            return
        }

        // 7. FAMILY PHOTOS ALBUM
        if (cmd.contains("foto") || cmd.contains("fotos") || cmd.contains("album") || cmd.contains("álbum") || cmd.contains("recuerdo") || cmd.contains("recuerdos")) {
            speak("Abriendo el álbum de fotos de la familia.")
            showFamilyPhotosDialog()
            return
        }

        // 8. CLOCK & DATE INQUIRY
        if (cmd.contains("que hora es") || cmd.contains("qué hora es") || cmd.contains("hora") || cmd.contains("dia") || cmd.contains("día") || cmd.contains("fecha")) {
            val calendar = Calendar.getInstance()
            val timeFmt = SimpleDateFormat("h y m a", Locale("es", "ES"))
            val dateFmt = SimpleDateFormat("EEEE d 'de' MMMM", Locale("es", "ES"))
            val timeStr = timeFmt.format(calendar.time)
            val dateStr = dateFmt.format(calendar.time)
            speak("Son las $timeStr del $dateStr.")
            return
        }

        // 9. MEDICATIONS / PILLS INQUIRY
        if (cmd.contains("pastilla") || cmd.contains("pastillas") || cmd.contains("medicamento") || cmd.contains("remedio") || cmd.contains("medicina")) {
            speak("Recuerda tomar tu Losartán de 50 miligramos con un vaso de agua.")
            return
        }

        // 10. GENERAL WAKE-WORD: "Hola MIVOR" / "MIVOR"
        if (cmd.contains("hola mivor") || cmd.contains("oye mivor") || cmd == "mivor") {
            speak("¡Hola! Te escucho con atención. Puedes decirme: llamar a mi hijo, fotos, o ayuda.")
            return
        }
    }

    // =========================================================================
    // FEATURE 1: MIVOR SALUD (HOSTED APP)
    // =========================================================================
    private fun launchMivorApp() {
        val launchIntent = packageManager.getLaunchIntentForPackage(MIVOR_PACKAGE_NAME)
        if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            startActivity(launchIntent)
        } else {
            AlertDialog.Builder(this)
                .setTitle("MIVOR Salud")
                .setMessage("La aplicación médica MIVOR (com.vitalai.app) no se encuentra instalada aún en este dispositivo.\n\n¿Deseas abrir la versión web en línea o instalar el APK?")
                .setPositiveButton("Abrir MIVOR Web") { _, _ ->
                    val webIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://vitalai.up.railway.app"))
                    startActivity(webIntent)
                }
                .setNegativeButton("Cerrar", null)
                .show()
        }
    }

    // =========================================================================
    // FEATURE 2: 1-TOUCH FAMILY CALLS
    // =========================================================================
    private fun showFamilyContactsDialog() {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_contacts, null)
        val dialog = AlertDialog.Builder(this)
            .setView(dialogView)
            .create()

        val phone1 = prefs.getString(KEY_PHONE_1, DEFAULT_PHONE_1) ?: DEFAULT_PHONE_1
        val phone2 = prefs.getString(KEY_PHONE_2, DEFAULT_PHONE_2) ?: DEFAULT_PHONE_2
        val phone3 = prefs.getString(KEY_PHONE_3, DEFAULT_PHONE_3) ?: DEFAULT_PHONE_3

        dialogView.findViewById<CardView>(R.id.cardContact1).setOnClickListener {
            dialog.dismiss()
            speak("Llamando a tu hijo.")
            makeDirectCall(phone1)
        }

        dialogView.findViewById<CardView>(R.id.cardContact2).setOnClickListener {
            dialog.dismiss()
            speak("Llamando a tu hija.")
            makeDirectCall(phone2)
        }

        dialogView.findViewById<CardView>(R.id.cardContact3).setOnClickListener {
            dialog.dismiss()
            speak("Llamando a tu cuidador.")
            makeDirectCall(phone3)
        }

        dialogView.findViewById<Button>(R.id.btnCloseContacts).setOnClickListener {
            dialog.dismiss()
        }

        dialog.show()
    }

    private fun makeDirectCall(phoneNumber: String) {
        val cleanNumber = phoneNumber.replace(" ", "").trim()
        val intent = Intent(Intent.ACTION_CALL, Uri.parse("tel:$cleanNumber")).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CALL_PHONE) == PackageManager.PERMISSION_GRANTED) {
            startActivity(intent)
        } else {
            val dialIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$cleanNumber")).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            startActivity(dialIntent)
        }
    }

    // =========================================================================
    // FEATURE 3: SOS EMERGENCY BUTTON
    // =========================================================================
    private fun showSosConfirmationDialog() {
        AlertDialog.Builder(this)
            .setTitle(R.string.sos_confirm_title)
            .setMessage(R.string.sos_confirm_message)
            .setIcon(R.drawable.ic_sos_emergency)
            .setPositiveButton(R.string.sos_action_call) { _, _ ->
                speak("Activando alerta de socorro y llamando a emergencias.")
                triggerSosEmergency()
            }
            .setNegativeButton(R.string.cancel, null)
            .show()
    }

    private fun triggerSosEmergency() {
        // 1. Fetch current GPS location and dispatch WhatsApp alert
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            fusedLocationClient.lastLocation.addOnSuccessListener { location: Location? ->
                val emergencyPhone = prefs.getString(KEY_FAMILY_WPP, DEFAULT_WPP) ?: DEFAULT_WPP
                val mapsLink = if (location != null) {
                    "https://maps.google.com/?q=${location.latitude},${location.longitude}"
                } else {
                    "(Ubicación GPS no disponible en este momento)"
                }

                val emergencyMsg = "🚨 *ALERTA SOS MIVOR*: Necesito asistencia de emergencia inmediata.\n\n📍 Mi ubicación en el mapa: $mapsLink"
                sendEmergencyWhatsApp(emergencyPhone, emergencyMsg)
            }.addOnFailureListener {
                val emergencyPhone = prefs.getString(KEY_FAMILY_WPP, DEFAULT_WPP) ?: DEFAULT_WPP
                sendEmergencyWhatsApp(emergencyPhone, "🚨 *ALERTA SOS MIVOR*: Necesito asistencia de emergencia inmediata.")
            }
        }

        // 2. Direct Call to Emergency (112 / 911)
        val emergencyNumber = prefs.getString(KEY_EMERGENCY_PHONE, DEFAULT_EMERGENCY) ?: DEFAULT_EMERGENCY
        makeDirectCall(emergencyNumber)
    }

    private fun sendEmergencyWhatsApp(phone: String, text: String) {
        try {
            val cleanPhone = phone.replace("+", "").replace(" ", "").trim()
            val intent = Intent(Intent.ACTION_VIEW).apply {
                data = Uri.parse("https://api.whatsapp.com/send?phone=$cleanPhone&text=${Uri.encode(text)}")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            startActivity(intent)
        } catch (e: Exception) {
            Toast.makeText(this, "Enviando alerta de socorro...", Toast.LENGTH_SHORT).show()
        }
    }

    // =========================================================================
    // FEATURE 4: DIRECT WHATSAPP
    // =========================================================================
    private fun launchFamilyWhatsApp() {
        val familyPhone = prefs.getString(KEY_FAMILY_WPP, DEFAULT_WPP) ?: DEFAULT_WPP
        try {
            val cleanPhone = familyPhone.replace("+", "").replace(" ", "").trim()
            val uri = Uri.parse("https://api.whatsapp.com/send?phone=$cleanPhone")
            val intent = Intent(Intent.ACTION_VIEW, uri).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            startActivity(intent)
        } catch (e: Exception) {
            Toast.makeText(this, "Abriendo WhatsApp...", Toast.LENGTH_SHORT).show()
            val fallback = packageManager.getLaunchIntentForPackage("com.whatsapp")
            if (fallback != null) {
                startActivity(fallback)
            } else {
                Toast.makeText(this, "WhatsApp no está instalado en este dispositivo", Toast.LENGTH_LONG).show()
            }
        }
    }

    // =========================================================================
    // FEATURE 5: FAMILY PHOTOS ALBUM
    // =========================================================================
    private fun showFamilyPhotosDialog() {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_photos, null)
        val dialog = AlertDialog.Builder(this)
            .setView(dialogView)
            .create()

        val photos = listOf(
            Triple("👨‍👩‍👧‍👦", "Cumpleaños en Familia", "¡Todos reunidos celebrando juntos con alegría!"),
            Triple("🏖️", "Vacaciones de Verano", "Paseo por el mar y tarde de helados."),
            Triple("👶", "El Primer Año de la Nieta", "Sonrisas y primeros pasos en el jardín."),
            Triple("🎂", "Celebración del Abuelo", "Un pastel delicioso preparado con mucho amor.")
        )
        var currentIndex = 0

        val tvEmoji = dialogView.findViewById<TextView>(R.id.tvPhotoEmoji)
        val tvTitle = dialogView.findViewById<TextView>(R.id.tvPhotoTitle)
        val tvDesc = dialogView.findViewById<TextView>(R.id.tvPhotoDesc)

        fun updateCard(index: Int) {
            val photo = photos[index]
            tvEmoji.text = photo.first
            tvTitle.text = photo.second
            tvDesc.text = photo.third
        }

        updateCard(currentIndex)

        dialogView.findViewById<Button>(R.id.btnPrevPhoto).setOnClickListener {
            if (currentIndex > 0) currentIndex-- else currentIndex = photos.size - 1
            updateCard(currentIndex)
        }

        dialogView.findViewById<Button>(R.id.btnNextPhoto).setOnClickListener {
            if (currentIndex < photos.size - 1) currentIndex++ else currentIndex = 0
            updateCard(currentIndex)
        }

        dialogView.findViewById<Button>(R.id.btnClosePhotos).setOnClickListener {
            dialog.dismiss()
        }

        dialog.show()
    }

    // =========================================================================
    // FEATURE 6: CAREGIVER SETTINGS (PROTECTED BY PIN)
    // =========================================================================
    private fun showPinDialog() {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_pin, null)
        val dialog = AlertDialog.Builder(this)
            .setView(dialogView)
            .create()

        val etPin = dialogView.findViewById<EditText>(R.id.etPin)
        val btnCancel = dialogView.findViewById<Button>(R.id.btnCancelPin)
        val btnSubmit = dialogView.findViewById<Button>(R.id.btnSubmitPin)

        val currentPin = prefs.getString(KEY_PIN, DEFAULT_PIN) ?: DEFAULT_PIN

        btnCancel.setOnClickListener {
            dialog.dismiss()
        }

        btnSubmit.setOnClickListener {
            val entered = etPin.text.toString().trim()
            if (entered == currentPin) {
                dialog.dismiss()
                showCaregiverSettingsDialog()
            } else {
                Toast.makeText(this, "PIN incorrecto. Intenta de nuevo.", Toast.LENGTH_SHORT).show()
                etPin.text.clear()
            }
        }

        dialog.show()
    }

    private fun showCaregiverSettingsDialog() {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_settings, null)
        val dialog = AlertDialog.Builder(this)
            .setView(dialogView)
            .create()

        // 1. Open Android Wi-Fi Settings
        dialogView.findViewById<Button>(R.id.btnSettingWifi).setOnClickListener {
            startActivity(Intent(Settings.ACTION_WIFI_SETTINGS))
        }

        // 2. Open Sound & Volume Settings
        dialogView.findViewById<Button>(R.id.btnSettingVolume).setOnClickListener {
            startActivity(Intent(Settings.ACTION_SOUND_SETTINGS))
        }

        // 3. Exit Kiosk Lock Task Mode (Unlocks Phone for Caregiver)
        dialogView.findViewById<Button>(R.id.btnSettingExitKiosk).setOnClickListener {
            try {
                isKioskActive = false
                stopLockTask()
                Toast.makeText(this, "Modo Kiosko Desactivado. El teléfono está libre.", Toast.LENGTH_LONG).show()
                dialog.dismiss()
            } catch (e: Exception) {
                Toast.makeText(this, "Error liberando modo kiosko: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }

        dialogView.findViewById<Button>(R.id.btnCloseSettings).setOnClickListener {
            dialog.dismiss()
        }

        dialog.show()
    }
}
