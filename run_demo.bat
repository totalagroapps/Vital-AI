@echo off
color 0B
echo Iniciando Demo de MedIA Hub...
SET BASEDIR=%~dp0
start "Ollama" cmd /k "ollama serve"
start "Backend" cmd /k "cd /d ""%BASEDIR%backend"" && call venv\Scripts\activate.bat && uvicorn main:app --reload"
start "Frontend" cmd /k "cd /d ""%BASEDIR%frontend"" && npm run dev"
echo Todo listo.
pause
