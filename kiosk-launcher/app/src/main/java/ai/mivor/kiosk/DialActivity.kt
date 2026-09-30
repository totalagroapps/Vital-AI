package ai.mivor.kiosk

import android.Manifest
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.telecom.TelecomManager
import android.text.InputType
import android.view.Gravity
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.google.android.material.button.MaterialButton

/**
 * Marcador mínimo. Android exige que la app de teléfono predeterminada atienda ACTION_DIAL;
 * en el kiosko las llamadas se hacen desde las tarjetas de contactos, así que basta con esto.
 */
class DialActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val pad = (24 * resources.displayMetrics.density).toInt()
        val number = EditText(this).apply {
            inputType = InputType.TYPE_CLASS_PHONE
            textSize = 34f
            gravity = Gravity.CENTER
            hint = "Número"
            setText(intent?.data?.schemeSpecificPart.orEmpty())
        }
        val call = MaterialButton(this).apply {
            text = "Llamar"
            textSize = 28f
            setBackgroundColor(ContextCompat.getColor(this@DialActivity, R.color.c_green))
            setOnClickListener { placeCall(number.text.toString()) }
        }
        val cancel = MaterialButton(this).apply {
            text = "Cancelar"
            textSize = 22f
            setOnClickListener { finish() }
        }
        setContentView(LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(pad, pad, pad, pad)
            addView(number, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT))
            addView(call, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, (96 * resources.displayMetrics.density).toInt()).apply { topMargin = pad })
            addView(cancel, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply { topMargin = pad / 2 })
        })
    }

    private fun placeCall(raw: String) {
        val digits = raw.filter { it.isDigit() || it == '+' || it == '*' || it == '#' }
        if (digits.isEmpty()) return
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CALL_PHONE) != PackageManager.PERMISSION_GRANTED) {
            Toast.makeText(this, "Falta el permiso de llamadas", Toast.LENGTH_LONG).show()
            return
        }
        getSystemService(TelecomManager::class.java)?.placeCall(Uri.fromParts("tel", digits, null), null)
        finish()
    }
}
