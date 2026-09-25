package ai.mivor.kiosk

import android.accessibilityservice.AccessibilityService
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.provider.Settings
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

/**
 * Alerta SOS en curso que el servicio de accesibilidad ejecuta dentro de WhatsApp.
 * Vive en memoria: MainActivity la crea y el servicio la avanza paso a paso.
 */
object SosAutomation {

    enum class Step { OPEN_CHAT, SEND, CALL, CONFIRM_CALL, IN_CALL }

    sealed class Target {
        /** Grupo de WhatsApp, buscado por su nombre exacto. */
        data class Group(val name: String) : Target()
        /** Una persona: el chat ya se abre con el mensaje escrito (enlace api.whatsapp.com). */
        object OpenedChat : Target()
    }

    class Job(val target: Target, val message: String, val whatsappPackage: String) {
        val startedAt = SystemClock.elapsedRealtime()
        var step = if (target is Target.Group) Step.OPEN_CHAT else Step.SEND
        var stepStartedAt = startedAt
        var sawCallScreen = false

        fun moveTo(next: Step) {
            step = next
            stepStartedAt = SystemClock.elapsedRealtime()
        }
    }

    @Volatile
    var current: Job? = null
        private set

    fun start(job: Job) {
        current = job
    }

    fun cancel() {
        current = null
    }
}

/**
 * Servicio de accesibilidad que, durante una alerta SOS, toca los botones de WhatsApp por la
 * persona mayor: abre el grupo de la familia, envía el mensaje con la ubicación y empieza la
 * llamada grupal. Fuera de una alerta no hace nada.
 *
 * El cuidador lo activa una vez en Ajustes > Accesibilidad > MIVOR Kiosk.
 */
class SosWhatsAppService : AccessibilityService() {

    companion object {
        /** Si en este tiempo no se ha empezado la llamada, se abandona y se pasa a emergencias. */
        private const val TIMEOUT_MS = 60_000L
        private const val TICK_MS = 700L

        private val SEARCH_LABELS = listOf("buscar", "search")
        private val SEND_LABELS = listOf("enviar", "send")
        private val CALL_LABELS = listOf(
            "llamada de voz", "voice call", "llamada", "call", "llamar",
            "llamada de audio", "audio call", "llamada grupal", "group call"
        )
        private val CONFIRM_LABELS = listOf(
            "llamar", "call", "iniciar llamada", "start call", "llamar al grupo", "call group",
            "llamada de voz", "voice call", "iniciar", "start"
        )

        fun isEnabled(context: Context): Boolean {
            val enabled = Settings.Secure.getString(
                context.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            ) ?: return false
            val me = ComponentName(context, SosWhatsAppService::class.java)
            return enabled.split(':').any { ComponentName.unflattenFromString(it) == me }
        }
    }

    private val handler = Handler(Looper.getMainLooper())
    private var ticking = false
    private var lastWindowClass = ""

    private val tick = object : Runnable {
        override fun run() {
            step()
            if (SosAutomation.current != null) {
                handler.postDelayed(this, TICK_MS)
            } else {
                ticking = false
            }
        }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        val job = SosAutomation.current ?: return
        if (event.packageName?.toString() != job.whatsappPackage) return
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            lastWindowClass = event.className?.toString().orEmpty()
        }
        if (!ticking) {
            ticking = true
            handler.post(tick)
        }
    }

    override fun onInterrupt() {}

    override fun onDestroy() {
        handler.removeCallbacksAndMessages(null)
        super.onDestroy()
    }

    // ------------------------------------------------------------------ pasos

    private fun step() {
        val job = SosAutomation.current ?: return
        val now = SystemClock.elapsedRealtime()
        if (job.step != SosAutomation.Step.IN_CALL && now - job.startedAt > TIMEOUT_MS) {
            finish()
            return
        }

        val root = rootInActiveWindow ?: return
        if (root.packageName?.toString() != job.whatsappPackage) return

        when (job.step) {
            SosAutomation.Step.OPEN_CHAT -> openGroupChat(job, root)
            SosAutomation.Step.SEND -> sendMessage(job, root)
            SosAutomation.Step.CALL -> startCall(job, root, now)
            SosAutomation.Step.CONFIRM_CALL -> confirmCall(job, root, now)
            SosAutomation.Step.IN_CALL -> waitForCallEnd(job, now)
        }
    }

    /** Pantalla principal de WhatsApp -> buscar el grupo -> abrir su chat. */
    private fun openGroupChat(job: SosAutomation.Job, root: AccessibilityNodeInfo) {
        val groupName = (job.target as SosAutomation.Target.Group).name

        // ¿Ya estamos dentro del chat del grupo?
        val title = findById(root, job, "conversation_contact_name")
        if (findEntry(root, job) != null && (title == null || matches(title.text, groupName))) {
            job.moveTo(SosAutomation.Step.SEND)
            return
        }

        // El grupo aparece en la lista (de chats o de resultados): tocarlo
        val row = allNodes(root).firstOrNull { node ->
            node.className?.toString() != "android.widget.EditText" && matches(node.text, groupName)
        }
        if (row != null) {
            click(row)
            return
        }

        // Campo de búsqueda abierto: escribir el nombre del grupo
        val searchField = allNodes(root).firstOrNull { it.className?.toString() == "android.widget.EditText" }
        if (searchField != null) {
            if (!matches(searchField.text, groupName)) setText(searchField, groupName)
            return
        }

        // Abrir la búsqueda
        val searchButton = findById(root, job, "menuitem_search")
            ?: findById(root, job, "my_search_bar")
            ?: findById(root, job, "search_bar")
            ?: allNodes(root).firstOrNull { labelIn(it, SEARCH_LABELS) || textStartsWithSearch(it) }
        searchButton?.let { click(it) }
    }

    /** Dentro del chat: escribir el mensaje (si no está ya) y tocar Enviar. */
    private fun sendMessage(job: SosAutomation.Job, root: AccessibilityNodeInfo) {
        val entry = findEntry(root, job) ?: return
        if (entry.text?.toString()?.contains("ALERTA SOS") != true) {
            setText(entry, job.message)
            return
        }
        val send = findById(root, job, "send")
            ?: allNodes(root).firstOrNull { labelIn(it, SEND_LABELS) }
            ?: return
        if (click(send)) job.moveTo(SosAutomation.Step.CALL)
    }

    /** Tocar el botón de llamada de voz de la barra superior del chat. */
    private fun startCall(job: SosAutomation.Job, root: AccessibilityNodeInfo, now: Long) {
        if (now - job.stepStartedAt < 1200) return // dejar que el mensaje salga
        val callButton = findById(root, job, "voice_call")
            ?: findById(root, job, "menuitem_call")
            ?: allNodes(root).firstOrNull { labelIn(it, CALL_LABELS, useText = false) }
        if (callButton != null && click(callButton)) {
            job.moveTo(SosAutomation.Step.CONFIRM_CALL)
        }
    }

    /** WhatsApp suele preguntar "¿Llamar al grupo?": tocar el botón de confirmar. */
    private fun confirmCall(job: SosAutomation.Job, root: AccessibilityNodeInfo, now: Long) {
        if (isCallScreen()) {
            job.sawCallScreen = true
            job.moveTo(SosAutomation.Step.IN_CALL)
            return
        }
        if (now - job.stepStartedAt < 600) return
        // Solo botones con texto (los iconos de la barra no tienen texto), para no volver a tocarlos
        val confirm = allNodes(root).firstOrNull { node ->
            node.className?.toString()?.endsWith("Button") == true && labelIn(node, CONFIRM_LABELS, useDescription = false)
        }
        if (confirm != null) {
            click(confirm)
            job.moveTo(SosAutomation.Step.IN_CALL)
        } else if (now - job.stepStartedAt > 5000) {
            // Algunas versiones empiezan la llamada sin preguntar
            job.moveTo(SosAutomation.Step.IN_CALL)
        }
    }

    /** Esperar a que termine la llamada grupal para volver a MIVOR (y abrir emergencias). */
    private fun waitForCallEnd(job: SosAutomation.Job, now: Long) {
        if (isCallScreen()) {
            job.sawCallScreen = true
            return
        }
        val callEnded = job.sawCallScreen
        val callNeverStarted = !job.sawCallScreen && now - job.stepStartedAt > 15_000
        if (callEnded || callNeverStarted) finish()
    }

    /** Pantalla de llamada de WhatsApp (VoipActivity…); no cuenta diálogos ni hojas de "¿Llamar?". */
    private fun isCallScreen(): Boolean {
        val cls = lastWindowClass.lowercase()
        if (cls.contains("dialog") || cls.contains("sheet")) return false
        return cls.contains("voip") || (cls.contains("call") && cls.contains("activity"))
    }

    /** Termina la alerta y vuelve a MIVOR, que abrirá la llamada a emergencias. */
    private fun finish() {
        SosAutomation.cancel()
        startActivity(
            Intent(this, MainActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
        )
    }

    // ------------------------------------------------------------------ utilidades

    private fun findById(root: AccessibilityNodeInfo, job: SosAutomation.Job, id: String): AccessibilityNodeInfo? =
        root.findAccessibilityNodeInfosByViewId("${job.whatsappPackage}:id/$id").firstOrNull()

    private fun findEntry(root: AccessibilityNodeInfo, job: SosAutomation.Job): AccessibilityNodeInfo? =
        findById(root, job, "entry")

    private fun allNodes(root: AccessibilityNodeInfo): Sequence<AccessibilityNodeInfo> = sequence {
        val queue = ArrayDeque<AccessibilityNodeInfo>()
        queue.add(root)
        while (queue.isNotEmpty()) {
            val node = queue.removeFirst()
            yield(node)
            for (i in 0 until node.childCount) node.getChild(i)?.let { queue.add(it) }
        }
    }

    private fun matches(text: CharSequence?, expected: String): Boolean =
        text != null && KioskConfig.normalize(text.toString()) == KioskConfig.normalize(expected)

    private fun labelIn(
        node: AccessibilityNodeInfo,
        labels: List<String>,
        useText: Boolean = true,
        useDescription: Boolean = true
    ): Boolean {
        val candidates = listOfNotNull(
            node.text?.takeIf { useText },
            node.contentDescription?.takeIf { useDescription }
        )
        return candidates.any { KioskConfig.normalize(it.toString()) in labels }
    }

    /** Barra de búsqueda nueva de WhatsApp ("Preguntar a Meta AI o buscar"). */
    private fun textStartsWithSearch(node: AccessibilityNodeInfo): Boolean {
        val text = KioskConfig.normalize((node.text ?: node.contentDescription ?: "").toString())
        return text.endsWith("buscar") || text.endsWith("search")
    }

    /** Toca el nodo o, si no es tocable, el primer contenedor tocable que lo incluya. */
    private fun click(node: AccessibilityNodeInfo): Boolean {
        var current: AccessibilityNodeInfo? = node
        while (current != null) {
            if (current.isClickable) return current.performAction(AccessibilityNodeInfo.ACTION_CLICK)
            current = current.parent
        }
        return false
    }

    private fun setText(node: AccessibilityNodeInfo, text: String) {
        node.performAction(AccessibilityNodeInfo.ACTION_FOCUS)
        node.performAction(
            AccessibilityNodeInfo.ACTION_SET_TEXT,
            Bundle().apply {
                putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text)
            }
        )
    }
}
