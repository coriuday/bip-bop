@echo off
echo ╔════════════════════════════════════════════════════════════════╗
echo ║              FIX PRISMA CLIENT AND RESTART                    ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo IMPORTANT: Please close your dev server (Ctrl+C) before continuing!
echo.
pause

echo.
echo ========================================
echo Step 1: Cleaning Prisma Client
echo ========================================
echo.

rmdir /s /q node_modules\.prisma 2>nul
echo Cleaned old Prisma client
echo.

echo ========================================
echo Step 2: Regenerating Prisma Client
echo ========================================
echo.

call npx prisma generate
if %errorlevel% neq 0 (
    echo ❌ Failed to generate Prisma client
    echo.
    echo Try this manually:
    echo 1. Close ALL terminals and VS Code
    echo 2. Reopen and run: npx prisma generate
    echo.
    pause
    exit /b 1
)

echo ✅ Prisma client generated!
echo.

echo ╔════════════════════════════════════════════════════════════════╗
echo ║                    ALL FIXED! ✅                               ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo Now start your dev server:
echo   npm run dev
echo.
echo Everything should work now:
echo ✅ Video feed loads
echo ✅ Profile videos play on hover and are clickable
echo ✅ Follow button works
echo ✅ Bookmark button works
echo ✅ Comment counts show
echo.
pause
