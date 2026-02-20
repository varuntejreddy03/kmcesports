@echo off
setlocal enabledelayedexpansion

echo [🚀 KMCE ESPORTS - GIT PUSH ASSISTANT]
echo =======================================

:: 1. Check if git is initialized
if not exist ".git" (
    echo [!] Git not found. Initializing...
    git init
    git remote add origin https://github.com/varuntejreddy03/kmcesports.git
)

:: 2. Check for remote origin
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Remote origin not set. Adding...
    git remote add origin https://github.com/varuntejreddy03/kmcesports.git
)

:: 3. Stage changes
echo [*] Staging all changes...
git add .

:: 4. Prompt for commit message
set /p commit_msg="Enter commit message (default: 'update live draw ui and fixes'): "
if "!commit_msg!"=="" set commit_msg=update live draw ui and fixes

:: 5. Commit
echo [*] Committing changes: %commit_msg%
git commit -m "%commit_msg%"

:: 6. Push to GitHub
echo [*] Pushing to GitHub (main branch)...
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo [!] Push failed. Possible reasons:
    echo     - Branch name might be 'master' instead of 'main'
    echo     - You need to login (git credentials)
    echo     - There are remote changes to pull first
    echo.
    set /p retry="Try pushing to 'master' instead? (y/n): "
    if "!retry!"=="y" (
        git push -u origin master
    )
)

echo =======================================
echo [✅] Done! 
pause
