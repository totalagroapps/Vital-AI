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
import android.view.LayoutInflater
import android.view.View
import android.widget.Button
import android.widget.EditText
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

class MainActivity : AppCompatActivity() {

    private lateinit var prefs: SharedPreferences
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private val clockHandler = Handler(Looper.getMainLooper())

    private lateinit var tvClock: TextView
    private lateinit var tvDate: TextView

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
        private const val PERMISSION_REQUEST_CALL = 101
        private const val PERMISSION_REQUEST_LOCATION = 102
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
        requestInitialPermissions()
        startKioskLockMode()
    }

    override fun onResume() {
        super.onResume()
        clockHandler.post(clockRunnable)
        startKioskLockMode()
    }

    override fun onPause() {
        super.onPause()
        clockHandler.removeCallbacks(clockRunnable)
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        // Prevent back press from exiting Kiosk
        Toast.makeText(this, "Para salir use Ajustes de Cuidador con PIN", Toast.LENGTH_SHORT).show()
    }

    private fun initViews() {
        tvClock = findViewById(R.id.tvClock)
        tvDate = findViewById(R.id.tvDate)

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

    private fun requestInitialPermissions() {
        val permissions = mutableListOf<String>()
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
            ActivityCompat.requestPermissions(this, permissions.toTypedArray(), 100)
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
            // App is not installed yet on this phone
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
            makeDirectCall(phone1)
        }

        dialogView.findViewById<CardView>(R.id.cardContact2).setOnClickListener {
            dialog.dismiss()
            makeDirectCall(phone2)
        }

        dialogView.findViewById<CardView>(R.id.cardContact3).setOnClickListener {
            dialog.dismiss()
            makeDirectCall(phone3)
        }

        dialogView.findViewById<Button>(R.id.btnCloseContacts).setOnClickListener {
            dialog.dismiss()
        }

        dialog.show()
    }

    private fun makeDirectCall(phoneNumber: String) {
        val cleanNumber = phoneNumber.replace(" ", "").trim()
        val intent = Intent(Intent.ACTION_CALL, Uri.parse("tel:$cleanNumber"))
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CALL_PHONE) == PackageManager.PERMISSION_GRANTED) {
            startActivity(intent)
        } else {
            // Fallback to dialer if direct call permission not yet granted
            val dialIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$cleanNumber"))
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
