import os
import re

file_path = 'frontend/src/views/DoctorOnboarding.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = "const DoctorOnboarding = ({ onNavigateLogin }) => {\n  const [currentStep, setCurrentStep] = useState(1);\n  const [formData, setFormData] = useState({});"
repl = "const DoctorOnboarding = ({ onNavigateLogin }) => {\n  const navigate = useNavigate();\n  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';\n  const [isSubmitting, setIsSubmitting] = useState(false);\n  const [submitError, setSubmitError] = useState('');\n  const [currentStep, setCurrentStep] = useState(1);\n  const [formData, setFormData] = useState({});"

content = content.replace(target, repl)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Injected variables into DoctorOnboarding")
