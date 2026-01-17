@echo off
echo 📤 Preparing to push changes to GitHub...

:: Stage all changed files
git add .

:: Ask for a commit message, or use a default one
set /p commit_msg="Enter commit message (or press Enter for default): "
if "%commit_msg%"=="" set commit_msg="fix: resolve TypeScript build errors and polish UI"

:: Create the commit
git commit -m "%commit_msg%"

:: Push to the main branch
echo 🚀 Pushing to origin main...
git push origin main

echo.
echo ✅ Changes synced successfully!
pause
