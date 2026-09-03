import os
import re

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# First, find the initial useState declaration for patientScreen to change its default value
content = re.sub(
    r"const \[patientScreen, setPatientScreen\] = useState\('home'\);",
    "const [patientScreen, setPatientScreen] = useState(() => {\n    const path = window.location.pathname.replace('/', '');\n    return path || 'home';\n  });",
    content
)

# Second, update navigateToScreen to change the URL
old_navigate = '''  const navigateToScreen = (screen) => {
    if (screen !== patientScreen) {
      window.history.pushState({ screen }, '', '');
      setPatientScreen(screen);
    }
  };'''

new_navigate = '''  const navigateToScreen = (screen) => {
    if (screen !== patientScreen) {
      const url = screen === 'home' ? '/' : '/' + screen;
      window.history.pushState({ screen }, '', url);
      setPatientScreen(screen);
    }
  };'''
content = content.replace(old_navigate, new_navigate)

# Third, update the initial replaceState to include the current path
old_replace = "window.history.replaceState({ screen: 'home' }, '', '');"
new_replace = "const initialScreen = window.location.pathname.replace('/', '') || 'home';\n      window.history.replaceState({ screen: initialScreen }, '', window.location.pathname);"
content = content.replace(old_replace, new_replace)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated History API to use real URL paths!")
