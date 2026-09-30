package ai.mivor.kiosk

import android.os.Build
import android.telecom.Call

/**
 * Llamada en curso compartida entre MivorInCallService (la recibe del sistema) y CallActivity
 * (la pantalla con botones grandes). Solo se gestiona una llamada a la vez.
 */
object CallManager {

    var call: Call? = null
        private set

    /** El servicio activo: es el único que puede cambiar el audio (altavoz / auricular). */
    var service: MivorInCallService? = null

    /** Nombre del contacto del kiosko que llama, si coincide; si no, el número. */
    var displayName: String = ""
        private set

    private val listeners = mutableSetOf<() -> Unit>()

    private val callback = object : Call.Callback() {
        override fun onStateChanged(call: Call, state: Int) = notifyListeners()
    }

    fun onCallAdded(newCall: Call, name: String) {
        call?.unregisterCallback(callback)
        call = newCall
        displayName = name
        newCall.registerCallback(callback)
        notifyListeners()
    }

    fun onCallRemoved(removed: Call) {
        removed.unregisterCallback(callback)
        if (call == removed) {
            call = null
            notifyListeners()
        }
    }

    fun addListener(listener: () -> Unit) { listeners += listener }
    fun removeListener(listener: () -> Unit) { listeners -= listener }
    private fun notifyListeners() = listeners.toList().forEach { it() }

    fun stateOf(call: Call?): Int = when {
        call == null -> Call.STATE_DISCONNECTED
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> call.details.state
        else -> @Suppress("DEPRECATION") call.state
    }

    fun numberOf(call: Call): String = call.details.handle?.schemeSpecificPart.orEmpty()
}
