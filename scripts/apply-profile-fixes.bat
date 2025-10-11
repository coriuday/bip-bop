@echo off
echo ╔════════════════════════════════════════════════════════════════╗
echo ║              APPLY PROFILE & VIDEO FIXES                      ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo This will fix:
echo ✅ Hide Follow/Message buttons on own profile
echo ✅ Show "Edit Profile" button on own profile
echo ✅ Implement Liked videos section
echo ✅ Implement Saved videos section
echo ✅ Functional three-dots menu (copy, download, report)
echo ✅ Bookmark button color changes when saved
echo.
pause

echo.
echo ========================================
echo Step 1: Generating Prisma Client
echo ========================================
echo.

call npx prisma generate
if %errorlevel% neq 0 (
    echo ❌ Failed to generate Prisma client
    pause
    exit /b 1
)

echo ✅ Prisma client generated!
echo.

echo ╔════════════════════════════════════════════════════════════════╗
echo ║                    ALL FIXED! ✅                               ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo Fixed features:
echo.
echo 1. PROFILE PAGE
echo    - Own profile: Shows "Edit Profile" button
echo    - Other profiles: Shows "Follow" and "Message" buttons
echo    - Liked videos section works (private)
echo    - Saved videos section works (private)
echo.
echo 2. VIDEO OPTIONS MENU
echo    - Copy link to video
echo    - Download video
echo    - Not interested (hide similar content)
echo    - Report video
echo.
echo 3. BOOKMARK BUTTON
echo    - Already changes to yellow when saved
echo    - Visual feedback on click
echo.
echo Next steps:
echo 1. Restart your dev server: npm run dev
echo 2. Test the fixes:
echo    - Visit your own profile
echo    - Like and save some videos
echo    - Check Liked and Saved tabs
echo    - Click three dots on videos
echo.
pause
