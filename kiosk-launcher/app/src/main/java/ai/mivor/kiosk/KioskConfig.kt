package ai.mivor.kiosk

import android.content.Context
import android.content.SharedPreferences
import android.telephony.TelephonyManager
import java.text.Normalizer
import java.util.Locale

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
        private const val KEY_PIN = "caregiver_pin"
        private const val KEY_EMERGENCY_PHONE = "phone_emergency"
        private const val KEY_FAMILY_WPP = "whatsapp_family_phone"
        private const val KEY_FAMILY_GROUP = "whatsapp_family_group"
        private val KEY_PHONES = listOf("phone_contact_1", "phone_contact_2", "phone_contact_3")

        private val KEY_NAMES = listOf("name_contact_1", "name_contact_2", "name_contact_3")
        private const val KEY_COUNTRY = "country_code"
        private const val KEY_MEDS = "meds_reminder"
        private const val KEY_CUSTOM_APP = "custom_app_package"

        const val DEFAULT_PIN = "1234"
        const val CONTACT_COUNT = 3

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

    var pin: String
        get() = prefs.getString(KEY_PIN, DEFAULT_PIN) ?: DEFAULT_PIN
        set(value) = prefs.edit().putString(KEY_PIN, value).apply()

    val isDefaultPin: Boolean get() = pin == DEFAULT_PIN

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
}
