@echo off
setlocal enabledelayedexpansion

echo.
echo =======================================
echo   🚀 KMCE ESPORTS - GIT PUSH ASSISTANT
echo =======================================
echo.

:: Detect current branch name
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set BRANCH=%%i

:: Check if origin exists
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Remote 'origin' not found. Adding default...
    git remote add origin https://github.com/varuntejreddy03/kmcesports.git
)

echo [*] Current Branch: !BRANCH!
echo [*] Staging changes...
git add .

set /p msg="Enter commit message (Press Enter for default): "
if "!msg!"=="" set msg=Update: Live Draw UI polish and layout fixes

echo [*] Committing...
git commit -m "!msg!"

echo [*] Pushing to GitHub...
git push origin !BRANCH!

if %errorlevel% equ 0 (
    echo.
    echo =======================================
    echo   ✅ SUCCESS: Changes are now on GitHub!
    echo =======================================
) else (
    echo.
    echo =======================================
    echo   ❌ FAILED: The push did not go through.
    echo   Possible fixes:
    echo   1. Check your internet connection.
    echo   2. Run 'git pull origin !BRANCH!' first.
    echo   3. Ensure you are logged into Git.
    echo =======================================
)

echo.
pause
