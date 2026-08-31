import os
import re

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add useEffect for history API manipulation
hook_injection = '''  const [patientScreen, setPatientScreen] = useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // History API integration for native back button
  useEffect(() => {
    // Push the initial state if it's the first time
    if (!window.history.state) {
      window.history.replaceState({ screen: 'home' }, '', '');
    }

    const handlePopState = (event) => {
      if (event.state && event.state.screen) {
        setPatientScreen(event.state.screen);
      } else {
        setPatientScreen('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Helper to change screen and update history
  const navigateToScreen = (screen) => {
    if (screen !== patientScreen) {
      window.history.pushState({ screen }, '', '');
      setPatientScreen(screen);
    }
  };'''

content = content.replace("  const [patientScreen, setPatientScreen] = useState('home');\n  const [isSidebarOpen, setIsSidebarOpen] = useState(false);", hook_injection)

# Replace all setPatientScreen with navigateToScreen, EXCEPT the one inside handlePopState
content = re.sub(r'(?<!\b)setPatientScreen\(', 'navigateToScreen(', content)

# But wait, we just replaced the one in handlePopState and the useState setter itself!
# We need to fix the useState and the handlePopState.
content = content.replace("const [patientScreen, navigateToScreen] = useState('home');", "const [patientScreen, setPatientScreen] = useState('home');")
content = content.replace("navigateToScreen(event.state.screen);", "setPatientScreen(event.state.screen);")
content = content.replace("navigateToScreen('home');\n      }", "setPatientScreen('home');\n      }")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Injected History API for back button!")
