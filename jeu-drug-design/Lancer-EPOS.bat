@echo off
REM ---------------------------------------------------------------
REM  EPOS - Initiation au Drug Design
REM  Demarre le service d'enregistrement des resultats, sert le jeu
REM  et ouvre le navigateur. Fermez cette fenetre pour tout arreter.
REM ---------------------------------------------------------------
setlocal
cd /d "%~dp0"

set PY=
where py >nul 2>nul && set PY=py -3
if "%PY%"=="" ( where python >nul 2>nul && set PY=python )
if "%PY%"=="" (
  echo.
  echo   Python 3 est introuvable sur ce poste.
  echo   Installez-le depuis https://www.python.org/downloads/windows/
  echo   en cochant "Add python.exe to PATH", puis relancez ce fichier.
  echo.
  pause
  exit /b 1
)

echo Demarrage du service d'enregistrement des resultats...
start "EPOS - enregistrement des resultats" %PY% "tools\serveur-resultats.py"

echo Demarrage du serveur local du jeu...
start "EPOS - jeu" %PY% -m http.server 8778 --bind 127.0.0.1

REM laisse aux deux services le temps de s'ouvrir
ping -n 3 127.0.0.1 >nul
start "" http://127.0.0.1:8778/index.html

echo.
echo   Le jeu est ouvert dans votre navigateur.
echo   Les resultats sont enregistres dans C:\Users\Public\Resultats_Jeu_Pharmacie.xlsx
echo.
echo   Fermez cette fenetre pour arreter le jeu.
echo.
pause
endlocal
