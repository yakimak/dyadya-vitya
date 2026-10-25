@echo off
chcp 65001 >nul
cd /d "%~dp0"

where py >nul 2>nul
if not errorlevel 1 (
  set "PY=py -3"
) else (
  where python >nul 2>nul
  if errorlevel 1 (
    echo Python 3 not found. Install Python or open the game through any local web server.
    pause
    exit /b
  )
  set "PY=python"
)

echo.
echo   Дядя Витя и тихий берег
echo   Запускаем локальный сервер на http://localhost:8000/
echo   Не закрывайте это окно, пока играете.
echo.

start "Vitya Server" cmd /k "%PY% -m http.server 8000"
timeout /t 1 >nul
start "" "http://localhost:8000/"
exit /b
