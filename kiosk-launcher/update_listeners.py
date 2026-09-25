import re

with open('app/src/main/java/ai/mivor/kiosk/MainActivity.kt', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace all findViewById<CardView> with findViewById<View>
code = code.replace('findViewById<CardView>', 'findViewById<View>')

# Insert the new listeners safely. Let's find where cardSettings is set up.
settings_pattern = r'findViewById<View>\(R\.id\.cardSettings\)\.setOnClickListener\s*\{\s*showPinDialog\(\)\s*\}'

new_listeners = '''findViewById<View>(R.id.cardSettings).setOnClickListener {
            showPinDialog()
        }
        findViewById<View>(R.id.cardFamily).setOnClickListener {
            Toast.makeText(this, "Abriendo Familia y amigos...", Toast.LENGTH_SHORT).show()
        }
        findViewById<View>(R.id.cardMeds).setOnClickListener {
            Toast.makeText(this, "Abriendo Mis medicamentos...", Toast.LENGTH_SHORT).show()
        }
        findViewById<View>(R.id.cardAppts).setOnClickListener {
            Toast.makeText(this, "Abriendo Mis citas médicas...", Toast.LENGTH_SHORT).show()
        }'''

code = re.sub(settings_pattern, new_listeners, code)

with open('app/src/main/java/ai/mivor/kiosk/MainActivity.kt', 'w', encoding='utf-8') as f:
    f.write(code)
print("Updated listeners")
