import re

with open('app/src/main/java/ai/mivor/kiosk/MainActivity.kt', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace cardPhotos click
code = code.replace('showFamilyPhotosDialog()', 'showMedicalQrDialog()')

# Replace cardCall click to Intent.ACTION_DIAL
call_pattern = r'findViewById<CardView>\(R\.id\.cardCall\)\.setOnClickListener\s*\{\s*showFamilyContactsDialog\(\)\s*\}'
new_call = 'findViewById<CardView>(R.id.cardCall).setOnClickListener {\n            startActivity(Intent(Intent.ACTION_DIAL))\n        }'
code = re.sub(call_pattern, new_call, code)

# Replace showFamilyPhotosDialog body with showMedicalQrDialog
old_def = r'private fun showFamilyPhotosDialog\(\)\s*\{.*?dialog\.show\(\)\s*\}'
new_def = '''private fun showMedicalQrDialog() {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_qr, null)
        val dialog = AlertDialog.Builder(this).setView(dialogView).create()
        dialogView.findViewById<Button>(R.id.btnCloseQr).setOnClickListener { dialog.dismiss() }
        dialog.show()
    }'''
code = re.sub(old_def, new_def, code, flags=re.DOTALL)

# Replace voice command
old_voice = r'if \(cmd\.contains\("foto"\).*?return\s*\}'
new_voice = '''if (cmd.contains("qr") || cmd.contains("historial") || cmd.contains("sangre") || cmd.contains("código")) {
            speak("Abriendo tu código QR médico.")
            showMedicalQrDialog()
            return
        }'''
code = re.sub(old_voice, new_voice, code, flags=re.DOTALL)

with open('app/src/main/java/ai/mivor/kiosk/MainActivity.kt', 'w', encoding='utf-8') as f:
    f.write(code)
print("Updated successfully")
