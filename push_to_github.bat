@echo off
echo 🚀 Initializing Git and Pushing to KMCE SportsPortol...

:: Check if .git exists, if not initialize
if not exist .git (
    echo [1/5] Initializing new Git repository...
    git init
) else (
    echo [1/5] Git already initialized.
)

:: Add remote if not exists
git remote remove origin >nul 2>&1
echo [2/5] Setting remote origin to https://github.com/varuntejreddy03/kmcesports.git...
git remote add origin https://github.com/varuntejreddy03/kmcesports.git

:: Stage all files
echo [3/5] Staging changes...
git add .

:: Commit changes
echo [4/5] Creating commit...
git commit -m "feat: Redesign Premium UI for KMCESportsPortol and add Netlify config"

:: Push to main
echo [5/5] Pushing to GitHub main branch...
git branch -M main
git push -u origin main --force

echo.
echo ✅ Build pushed successfully! Your site is ready for Netlify.
pause
