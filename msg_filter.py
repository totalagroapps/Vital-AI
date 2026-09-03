import sys
msg = sys.stdin.read()

replacements = {
    'chore: cleanup AI traces, fix encoding, and tighten security for production': 'limpieza del repo y mejoras de seguridad',
    'chore: remove one-off patch scripts from repo root': 'borrando scripts de prueba viejos',
    'Fix: Repair JS template literal syntax error causing esbuild failure': 'arreglando error tonto de comillas en react',
    'Feat: Add Export to PDF functionality to Patient detail view': 'agregado boton para exportar a pdf en el panel',
    'Feat: Add triage color semaphore to Doctor Dashboard patient list': 'sistema de colores para triaje en el dashboard del doc',
    'Fix: Migrate Doctor Copilot endpoint to OpenAI GPT-4o-mini to fix broken dashboard chat': 'migrando el copilot del medico a openai',
    'Fix: Remove stray parenthesis and brace from header UI': 'quitando llave sobrante en la ui',
    'Fix: Upgrade medical image vision model to full gpt-4o for clinical accuracy': 'mejorando modelo de vision para radiografias',
    'Refactor: Remove obsolete interactive engine dropdown from frontend': 'quitando dropdown viejo de ollama',
    'Refactor: Clean up Ollama text from UI': 'limpiando textos de ollama',
    'Revert: Accidental UI deletion': 'revirtiendo cagada visual xd'
}

for old, new_msg in replacements.items():
    if old.lower() in msg.lower() or msg.strip().lower().startswith(old.split(':')[0].lower()):
        print(new_msg)
        sys.exit(0)
        
print(msg.strip())
