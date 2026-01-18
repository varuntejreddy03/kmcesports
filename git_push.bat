@echo off
setlocal enabledelayedexpansion

echo.
echo ============================================================
echo   🏆 KMCE SPORTS PORTAL - GitHub Deployment Sync
echo ============================================================
echo.

:: Stage all changes
echo [1/4] Scanning for new features and fixes...
git add .

:: Default commit message reflecting recent major updates
set "DEFAULT_MSG=feat: landing page schedule, mobile UI overhaul and theme sync"

:: Ask for custom message
echo.
echo Recent Updates: 
echo - Added dynamic Match Schedule with Real-time sync
echo - Premium Mobile UI Overhaul (Admin & Dashboard)
echo - Performance and Layout optimizations
echo.
set /p "commit_msg=Enter your commit message (Leave blank for default): "

:: Commit changes
if "!commit_msg!"=="" (
    git commit -m "!DEFAULT_MSG!"
) else (
    git commit -m "!commit_msg!"
)

:: Ensure we are on main branch
echo.
echo [3/4] Switching to Main Branch...
git branch -M main

:: Push to GitHub
echo.
echo [4/4] Deploying to GitHub (origin/main)...
echo.

:: Try to push
git push origin main

:: Handle potential sync conflicts
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ⚠️ Sync Conflict Detected! Fetching latest changes from GitHub...
    git pull origin main --rebase
    echo.
    echo [RETRY] Resubmitting to GitHub...
    git push origin main
)

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================================
    echo   ✅ SUCCESS: KMCE Portal is now deployed to GitHub!
    echo   Repository: https://github.com/varuntejreddy03/kmcesports
    echo ============================================================
) else (
    echo.
    echo   ❌ ERROR: Deployment failed. Check your internet or Git credentials.
)

echo.
pause
