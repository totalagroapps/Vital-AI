import os

file_path = 'frontend/src/views/DoctorOnboarding.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

bad_import = "import { Check, ArrowRight, ArrowLeft, Brain, Users, Lock, HeadphonesIcon, Image as ImageIcon, Video, FileText, MapPin, Phone, Globe, UploadCloud } from 'lucide-react';"
good_import = "import { Check, ArrowRight, ArrowLeft, Brain, Users, Lock, HeadphonesIcon, Image as ImageIcon, Video, FileText, MapPin, Phone, Globe, UploadCloud, Info, User, UserSquare2, Activity } from 'lucide-react';"

content = content.replace(bad_import, good_import)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed missing icon imports")
