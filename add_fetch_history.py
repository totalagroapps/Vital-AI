import os
import re

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_fetch = '''
  const fetchHistory = async () => {
    if (!token) return;
    try {
      const res = await fetch(${API_URL}/api/patients/me/history, {
        headers: authHeaders
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (e) {
      console.error("Error fetching history:", e);
    }
  };
'''

content = content.replace("  const fetchPatientProfile = async () => {", new_fetch + "\n  const fetchPatientProfile = async () => {")

# Add fetchHistory inside fetchPatientProfile so they are fetched together, or inside the useEffect
if "fetchPatientProfile();" in content:
    content = content.replace("fetchPatientProfile();", "fetchPatientProfile();\n      fetchHistory();")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Added fetchHistory to App.jsx")
