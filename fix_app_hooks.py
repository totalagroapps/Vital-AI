import os

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = "export default function App() {\n  const { t, language } = useLanguage();"
repl = "export default function App() {\n  const navigate = useNavigate();\n  const location = useLocation();\n  const { t, language } = useLanguage();"

# normalize line endings
content = content.replace('\r\n', '\n')
content = content.replace(target, repl)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Added useNavigate and useLocation to App.jsx")
