import os
import re

file_path = 'frontend/src/DoctorDashboard.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_imports = "import { Download, FolderOpen, User, Activity, FileText, Send, Bot, Clock, ChevronRight, Users, LogOut, Search, Loader2, Calendar, Printer, Heart, ShieldCheck, Sparkles } from 'lucide-react';"

content = re.sub(r"import \{.*?\} from 'lucide-react';", new_imports, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Imports updated!")
