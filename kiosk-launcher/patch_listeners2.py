import re

with open('app/src/main/java/ai/mivor/kiosk/MainActivity.kt', 'r', encoding='utf-8') as f:
    code = f.read()

# Make sure all findViewById are findViewById<View>
code = code.replace('findViewById<CardView>', 'findViewById<View>')

# Add new click listeners safely
pattern = r'findViewById<View>\(R\.id\.cardSettings\)\.setOnClickListener\s*\{\s*showPinDialog\(\)\s*\}'

listeners = '''findViewById<View>(R.id.cardSettings).setOnClickListener {
            showPinDialog()
        }
        findViewById<View>(R.id.cardCamera).setOnClickListener {
            val intent = android.content.Intent(android.provider.MediaStore.ACTION_IMAGE_CAPTURE)
            if (intent.resolveActivity(packageManager) != null) startActivity(intent)
        }
        findViewById<View>(R.id.cardGallery).setOnClickListener {
            val intent = android.content.Intent(android.content.Intent.ACTION_PICK, android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI)
            if (intent.resolveActivity(packageManager) != null) startActivity(intent)
        }
        findViewById<View>(R.id.cardAdd).setOnClickListener {
            Toast.makeText(this, "Agregar otra función próximamente...", Toast.LENGTH_SHORT).show()
        }
        findViewById<View>(R.id.cardLogout).setOnClickListener {
            Toast.makeText(this, "Cerrando sesión de Kiosko...", Toast.LENGTH_SHORT).show()
        }'''

code = re.sub(pattern, listeners, code)

with open('app/src/main/java/ai/mivor/kiosk/MainActivity.kt', 'w', encoding='utf-8') as f:
    f.write(code)
print("Listeners patched!")
