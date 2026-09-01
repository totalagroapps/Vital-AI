import os
import re

file_path = 'frontend/src/views/DoctorOnboarding.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add imports if missing
if "useNavigate" not in content:
    content = content.replace("import React, { useState } from 'react';", "import React, { useState } from 'react';\nimport { useNavigate } from 'react-router-dom';")

if "API_URL" not in content:
    # It might not have API_URL. We can just use window.API_URL or hardcode '/api' since vite proxies it. Wait, vite might proxy it, but usually it's import.meta.env.VITE_API_URL. Let's just use empty string or window.location.origin if not set. Actually, the frontend probably has API_URL somewhere. Let's just use const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    content = content.replace("export default function DoctorOnboarding({ onNavigateLogin }) {", "export default function DoctorOnboarding({ onNavigateLogin }) {\n  const navigate = useNavigate();\n  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';\n  const [isSubmitting, setIsSubmitting] = useState(false);\n  const [submitError, setSubmitError] = useState('');")

# 2. Update handleNext
handle_next_target = "const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, 5));"
handle_next_repl = '''const handleNext = async () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
      return;
    }
    
    // Final Step Submission
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      const form = new FormData();
      form.append('username', formData.email);
      form.append('password', formData.password);
      form.append('full_name', formData.fullName);
      form.append('specialty', formData.specialty);
      form.append('license_number', formData.license);
      form.append('experience_years', formData.experience);
      form.append('location', formData.location);
      form.append('languages', formData.languages);
      form.append('bio', formData.bio);
      
      if (formData.diplomaFile) form.append('diploma_file', formData.diplomaFile);
      if (formData.profilePicFile) form.append('profile_pic_file', formData.profilePicFile);

      const res = await fetch(${API_URL}/api/auth/register-doctor, {
        method: 'POST',
        body: form
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Success! Set token and go to success step
        localStorage.setItem('med_token', data.access_token);
        localStorage.setItem('med_role', data.role);
        setCurrentStep(5);
      } else {
        setSubmitError(data.detail || 'Error al registrar el médico');
      }
    } catch (e) {
      setSubmitError('Error de conexión con el servidor');
    }
    
    setIsSubmitting(false);
  };'''

content = content.replace(handle_next_target, handle_next_repl)

# 3. Handle step 5 'Ir al Panel Médico' button
# Right now it says "onClick={onNavigateLogin}". Let's change it to navigate to /medico and reload or something.
# Since token is in localStorage, navigate('/medico') followed by window.location.reload() ensures App.jsx picks up the token.
step5_btn_target = '''<button onClick={onNavigateLogin} className="mt-8 bg-brand-purple hover:bg-purple-600 text-white font-bold py-3 px-8 rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-purple-500/30 flex items-center gap-2 mx-auto">
                Ir al Panel Médico <ArrowRight size={18} />
              </button>'''

step5_btn_repl = '''{submitError && <div className="text-red-500 text-sm mt-4">{submitError}</div>}
              <button onClick={() => { navigate('/medico'); window.location.reload(); }} className="mt-8 bg-brand-purple hover:bg-purple-600 text-white font-bold py-3 px-8 rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-purple-500/30 flex items-center gap-2 mx-auto">
                Ir al Panel Médico <ArrowRight size={18} />
              </button>'''

content = content.replace(step5_btn_target, step5_btn_repl)

# 4. Disable "Continuar" button while submitting
btn_cont_target = '''<button
                onClick={handleNext}
                className="bg-brand-purple hover:bg-purple-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors ml-auto shadow-sm"
              >
                {currentStep === 4 ? 'Finalizar inscripción' : 'Continuar'} <ArrowRight size={16} />
              </button>'''

btn_cont_repl = '''<button
                onClick={handleNext}
                disabled={isSubmitting}
                className="bg-brand-purple hover:bg-purple-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors ml-auto shadow-sm"
              >
                {isSubmitting ? 'Procesando...' : (currentStep === 4 ? 'Finalizar inscripción' : 'Continuar')} <ArrowRight size={16} />
              </button>'''

content = content.replace(btn_cont_target, btn_cont_repl)


with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated DoctorOnboarding logic")
