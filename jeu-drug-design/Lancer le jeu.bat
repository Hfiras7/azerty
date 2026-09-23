@echo off
REM ---------------------------------------------------------------
REM  EPOS - Initiation au Drug Design
REM  Ouvre le jeu dans le navigateur par defaut de Windows.
REM  Aucune installation n'est necessaire.
REM ---------------------------------------------------------------
setlocal
cd /d "%~dp0"

REM  Un fichier .bat ne peut pas porter d'icone personnalisee : Windows
REM  lui impose la sienne. On depose donc a cote un raccourci, qui lui
REM  accepte le logo du jeu. Il est recree a chaque lancement, de sorte
REM  qu'il reste juste si le dossier est copie ou deplace (cle USB).
REM  PowerShell est fourni avec Windows : aucune installation.
set "RACCOURCI=%~dp0EPOS - Initiation au Drug Design.lnk"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$r=(New-Object -ComObject WScript.Shell).CreateShortcut('%RACCOURCI%');" ^
 "$r.TargetPath='%~dp0index.html';" ^
 "$r.WorkingDirectory='%~dp0';" ^
 "$r.IconLocation='%~dp0images\epos.ico,0';" ^
 "$r.Description='EPOS - Initiation au Drug Design';" ^
 "$r.Save()" >nul 2>&1

start "" "%~dp0index.html"
