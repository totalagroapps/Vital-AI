import os

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Define the renderModals function that uses the states
helper_fn = '''
  const renderModals = () => {
    return null; // For now, we will just return null to stop the crashing. 
    // We will extract the full modal safely next.
  };

  if (patientScreen === 'home') {
'''

# Check if renderModals is already defined
if 'const renderModals' not in content:
    content = content.replace("  if (patientScreen === 'home') {", helper_fn)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Injected empty renderModals to fix crash!")
