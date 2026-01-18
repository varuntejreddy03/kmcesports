@echo off
setlocal enabledelayedexpansion

echo.
echo ============================================================
echo   KMCE SportsPortal - Secure GitHub Push
echo ============================================================
echo.

:: Stage all changes
echo [1/4] Detecting changes...
git add .

:: Default commit message (no special characters or quotes inside the string)
set "DEFAULT_MSG=fix: resolve team creation errors and schema mismatch"

:: Ask for custom message
echo.
set /p "commit_msg=Enter commit message (Enter for default): "

:: Handle quotes carefully for Windows batch
if "!commit_msg!"=="" (
    git commit -m "!DEFAULT_MSG!"
) else (
    git commit -m "!commit_msg!"
)

:: Ensure we are on main branch
echo.
echo [3/4] Ensuring branch is 'main'...
git branch -M main

:: Push to GitHub
echo.
echo [4/4] Syncing with GitHub (origin main)...
echo.

:: Try to push
git push origin main

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Push failed! Trying to pull first...
    git pull origin main --rebase
    echo.
    echo Retrying push...
    git push origin main
)

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================================
    echo   SUCCESS: Your code is now live on GitHub!
    echo ============================================================
) else (
    echo.
    echo   ERROR: Could not push changes.
)

echo.
pause
