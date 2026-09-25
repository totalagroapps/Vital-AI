package ai.mivor.kiosk

import android.content.Context
import android.content.SharedPreferences
import android.telephony.TelephonyManager
import android.util.Base64
import java.security.MessageDigest
import java.security.SecureRandom
import java.text.Normalizer
import java.util.Locale
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec

/** País: prefijo internacional, número de emergencias por defecto y voz. */
data class Country(
    val code: String,
    val name: String,
    val dialPrefix: String,
    val emergency: String,
    val language: String
) {
    val locale: Locale get() = Locale.forLanguageTag(language)
    override fun toString() = if (dialPrefix.isEmpty()) name else "$name (+$dialPrefix)"
}

data class Contact(val name: String, val phone: String) {
    val isSet: Boolean get() = phone.isNotBlank()
}

/**
 * Configuración que edita el cuidador desde Ajustes (protegida con PIN).
 * Todo se guarda en SharedPreferences.
 */
class KioskConfig(context: Context) {

    companion object {
        private const val PREFS_NAME = "MivorKioskPrefs"

        // Claves antiguas conservadas para no perder datos ya guardados
        /** Clave en texto plano de versiones anteriores: solo se lee para migrarla al hash. */
        private const val KEY_PIN_LEGACY = "caregiver_pin"
        private const val KEY_PIN_HASH = "caregiver_pin_hash"
        private const val KEY_EMERGENCY_PHONE = "phone_emergency"
        private const val KEY_FAMILY_WPP = "whatsapp_family_phone"
        private const val KEY_FAMILY_GROUP = "whatsapp_family_group"
        private val KEY_PHONES = listOf("phone_contact_1", "phone_contact_2", "phone_contact_3")

        private val KEY_NAMES = listOf("name_contact_1", "name_contact_2", "name_contact_3")
        private const val KEY_COUNTRY = "country_code"
        private const val KEY_MEDS = "meds_reminder"
        private const val KEY_CUSTOM_APP = "custom_app_package"

        /** Clave que traían las versiones anteriores: si sigue puesta, se obliga a crear otra. */
        private const val OLD_DEFAULT_PIN = "1234"
        const val CONTACT_COUNT = 3

        const val PIN_MIN_LENGTH = 4
        const val PIN_MAX_LENGTH = 8
        private const val PIN_HASH_ITERATIONS = 20_000
        private const val PIN_HASH_BITS = 256

        /** Motivo por el que una clave nueva no vale, o null si es válida. */
        fun pinProblem(pin: String): String? = when {
            pin.length !in PIN_MIN_LENGTH..PIN_MAX_LENGTH || !pin.all { it.isDigit() } ->
                "La clave debe tener de $PIN_MIN_LENGTH a $PIN_MAX_LENGTH números"
            pin.toSet().size == 1 -> "Demasiado fácil: no repitas el mismo número"
            "0123456789012".contains(pin) || "9876543210987".contains(pin) ->
                "Demasiado fácil: no uses números seguidos"
            else -> null
        }

        /** PBKDF2 (disponible en todas las versiones de Android que soporta la app). */
        private fun hashPin(pin: String, salt: ByteArray, iterations: Int): ByteArray {
            val spec = PBEKeySpec(pin.toCharArray(), salt, iterations, PIN_HASH_BITS)
            return try {
                SecretKeyFactory.getInstance("PBKDF2WithHmacSHA1").generateSecret(spec).encoded
            } finally {
                spec.clearPassword()
            }
        }

        /** Nombre por defecto de cada contacto y palabras con las que se le llama por voz. */
        val DEFAULT_NAMES = listOf("Hijo", "Hija", "Cuidador")
        val VOICE_KEYWORDS = listOf(
            listOf("hijo"),
            listOf("hija"),
            listOf("cuidador", "cuidadora", "enfermero", "enfermera", "doctor", "doctora")
        )

        // El número de emergencias se puede corregir en Ajustes; aquí solo es el valor inicial.
        val COUNTRIES = listOf(
            Country("CO", "Colombia", "57", "123", "es-CO"),
            Country("MX", "México", "52", "911", "es-MX"),
            Country("ES", "España", "34", "112", "es-ES"),
            Country("AR", "Argentina", "54", "911", "es-AR"),
            Country("CL", "Chile", "56", "131", "es-CL"),
            Country("PE", "Perú", "51", "106", "es-PE"),
            Country("EC", "Ecuador", "593", "911", "es-EC"),
            Country("US", "Estados Unidos", "1", "911", "es-US"),
            Country("OTRO", "Otro país", "", "112", "es-ES")
        )

        fun countryByCode(code: String?): Country? = COUNTRIES.firstOrNull { it.code == code }

        /** Minúsculas y sin tildes, para comparar lo que dice la persona. */
        fun normalize(text: String): String =
            Normalizer.normalize(text.lowercase(Locale.ROOT), Normalizer.Form.NFD)
                .replace(Regex("\\p{Mn}+"), "")
                .trim()
    }

    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    /** País detectado por la SIM / red / idioma del teléfono, si está en la lista. */
    private val detectedCountry: Country = run {
        val tm = context.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager
        val candidates = listOf(tm?.simCountryIso, tm?.networkCountryIso, Locale.getDefault().country)
        candidates.firstNotNullOfOrNull { iso -> countryByCode(iso?.uppercase(Locale.ROOT)) }
            ?: countryByCode("OTRO")!!
    }

    var country: Country
        get() = countryByCode(prefs.getString(KEY_COUNTRY, null)) ?: detectedCountry
        set(value) = prefs.edit().putString(KEY_COUNTRY, value.code).apply()

    var emergencyNumber: String
        get() = prefs.getString(KEY_EMERGENCY_PHONE, null)?.takeIf { it.isNotBlank() } ?: country.emergency
        set(value) = prefs.edit().putString(KEY_EMERGENCY_PHONE, value.trim()).apply()

    var whatsappNumber: String
        get() = prefs.getString(KEY_FAMILY_WPP, "") ?: ""
        set(value) = prefs.edit().putString(KEY_FAMILY_WPP, value.trim()).apply()

    /** Nombre exacto del grupo de WhatsApp de la familia (para el aviso y la llamada grupal SOS). */
    var familyGroupName: String
        get() = prefs.getString(KEY_FAMILY_GROUP, "") ?: ""
        set(value) = prefs.edit().putString(KEY_FAMILY_GROUP, value.trim()).apply()

    init {
        migrateLegacyPin()
    }

    /** Pasa la clave en texto plano de versiones anteriores a hash. La de fábrica (1234) se descarta. */
    private fun migrateLegacyPin() {
        val legacy = prefs.getString(KEY_PIN_LEGACY, null) ?: return
        if (!prefs.contains(KEY_PIN_HASH) && legacy != OLD_DEFAULT_PIN && legacy.isNotBlank()) {
            setPin(legacy)
        }
        prefs.edit().remove(KEY_PIN_LEGACY).apply()
    }

    /** false hasta que el cuidador crea su clave. */
    val hasPin: Boolean get() = prefs.contains(KEY_PIN_HASH)

    /** Se guarda "iteraciones:sal:hash" en Base64; nunca la clave en sí. */
    fun setPin(pin: String) {
        val salt = ByteArray(16).also { SecureRandom().nextBytes(it) }
        val hash = hashPin(pin, salt, PIN_HASH_ITERATIONS)
        val encoded = listOf(
            PIN_HASH_ITERATIONS.toString(),
            Base64.encodeToString(salt, Base64.NO_WRAP),
            Base64.encodeToString(hash, Base64.NO_WRAP)
        ).joinToString(":")
        prefs.edit().putString(KEY_PIN_HASH, encoded).apply()
    }

    fun checkPin(pin: String): Boolean {
        val parts = prefs.getString(KEY_PIN_HASH, null)?.split(":") ?: return false
        if (parts.size != 3) return false
        return try {
            val iterations = parts[0].toInt()
            val salt = Base64.decode(parts[1], Base64.NO_WRAP)
            val expected = Base64.decode(parts[2], Base64.NO_WRAP)
            // Comparación en tiempo constante
            MessageDigest.isEqual(hashPin(pin, salt, iterations), expected)
        } catch (e: IllegalArgumentException) {
            false
        }
    }

    var medsReminder: String
        get() = prefs.getString(KEY_MEDS, "") ?: ""
        set(value) = prefs.edit().putString(KEY_MEDS, value.trim()).apply()

    /** Paquete de la app elegida para la tarjeta "Agregar otra función" (vacío = ninguna). */
    var customAppPackage: String
        get() = prefs.getString(KEY_CUSTOM_APP, "") ?: ""
        set(value) = prefs.edit().putString(KEY_CUSTOM_APP, value).apply()

    fun contact(index: Int): Contact = Contact(
        name = prefs.getString(KEY_NAMES[index], null)?.takeIf { it.isNotBlank() } ?: DEFAULT_NAMES[index],
        phone = prefs.getString(KEY_PHONES[index], "") ?: ""
    )

    fun setContact(index: Int, contact: Contact) {
        prefs.edit()
            .putString(KEY_NAMES[index], contact.name.trim())
            .putString(KEY_PHONES[index], contact.phone.trim())
            .apply()
    }

    val contacts: List<Contact> get() = (0 until CONTACT_COUNT).map { contact(it) }

    /** Número a quien avisar por WhatsApp/SMS: el de WhatsApp familiar o, si falta, el primer contacto. */
    val familyAlertNumber: String
        get() = whatsappNumber.ifBlank { contacts.firstOrNull { it.isSet }?.phone.orEmpty() }

    /**
     * Número en formato internacional solo con dígitos (lo que pide WhatsApp).
     * "+57 300 123 4567" -> "573001234567"; "300 123 4567" en Colombia -> "573001234567".
     */
    fun toInternationalDigits(phone: String): String {
        val trimmed = phone.trim()
        val digits = trimmed.filter { it.isDigit() }
        if (digits.isEmpty()) return ""
        return when {
            trimmed.startsWith("+") -> digits
            trimmed.startsWith("00") -> digits.removePrefix("00")
            country.dialPrefix.isNotEmpty() && !digits.startsWith(country.dialPrefix) ->
                country.dialPrefix + digits.trimStart('0')
            else -> digits
        }
    }

    /**
     * Número para SMS: internacional con "+" cuando se conoce el prefijo;
     * si el país es "Otro" y el número es local, se deja tal cual.
     */
    fun toSmsNumber(phone: String): String {
        val trimmed = phone.trim()
        val isInternational = trimmed.startsWith("+") || trimmed.startsWith("00")
        if (!isInternational && country.dialPrefix.isEmpty()) return trimmed.filter { it.isDigit() }
        val digits = toInternationalDigits(trimmed)
        return if (digits.isEmpty()) "" else "+$digits"
    }
}
