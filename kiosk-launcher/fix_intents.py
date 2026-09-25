import re

file_path = r'C:\Users\crist\OneDrive\Documentos\Proyecto\kiosk-launcher\app\src\main\java\ai\mivor\kiosk\MainActivity.kt'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace startActivity with launchExternalIntent
# Use regex to avoid replacing if it's already replaced
content = re.sub(r'\bstartActivity\(', 'launchExternalIntent(', content)
content = re.sub(r'\bstartActivityForResult\(', 'launchExternalIntentForResult(', content)

# Append the helper methods before the last closing brace
helpers = """
    private fun launchExternalIntent(intent: Intent) {
        try {
            if (isKioskActive) stopLockTask()
        } catch (e: Exception) {
            e.printStackTrace()
        }
        super.startActivity(intent)
    }

    @Deprecated("Deprecated in Java")
    private fun launchExternalIntentForResult(intent: Intent, requestCode: Int) {
        try {
            if (isKioskActive) stopLockTask()
        } catch (e: Exception) {
            e.printStackTrace()
        }
        super.startActivityForResult(intent, requestCode)
    }
"""

if "launchExternalIntent" not in content:
    # We replaced the calls, now we need to insert the definition
    # Wait, the re.sub already replaced it inside the helpers if we appended first.
    # We appended AFTER the replace, so it's fine. But wait, I need to use super.startActivity in the helpers so it doesn't infinite loop. 
    # Ah! My helper definition uses `super.startActivity(intent)`. So `re.sub` wouldn't touch it if I define it after!
    pass

# We replaced startActivity( with launchExternalIntent(
# Let's fix the super.startActivity just in case if someone calls it, but re.sub might have missed super?
# `\bstartActivity\(` matches `super.startActivity(`. Let's revert if it happened.
content = content.replace('super.launchExternalIntent(', 'super.startActivity(')
content = content.replace('super.launchExternalIntentForResult(', 'super.startActivityForResult(')


# Now inject the helpers before the final }
# find last }
last_brace_index = content.rfind('}')
if last_brace_index != -1:
    content = content[:last_brace_index] + helpers + "\n}\n"

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
