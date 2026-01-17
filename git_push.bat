@echo off
echo 📤 Preparing to push changes to GitHub...

:: Ensure .env files are not tracked
git rm --cached .env.local 2>nul
git rm --cached .env 2>nul

:: Stage all changed files
git add .

:: Ask for a commit message, or use a default one
set /p commit_msg="Enter commit message (or press Enter for default): "
if "%commit_msg%"=="" set commit_msg="fix: resolve netlify build and secrets scanning errors"

:: Create the commit
git commit -m "%commit_msg%"

:: Push to the main branch
echo 🚀 Pushing to origin main...
git push origin main

echo.
echo ✅ Changes synced successfully!
pause
