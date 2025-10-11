@echo off
echo ╔════════════════════════════════════════════════════════════════╗
echo ║         APPLY MESSAGING & SEARCH FEATURES                     ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo This will add:
echo ✅ Messaging system (conversations, messages)
echo ✅ Search/Discover page (search users and videos)
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

echo ========================================
echo Step 2: Running Database Migration
echo ========================================
echo.

call npx prisma migrate dev --name add-messaging-system
if %errorlevel% neq 0 (
    echo ❌ Failed to run migration
    pause
    exit /b 1
)

echo ✅ Migration completed!
echo.

echo ╔════════════════════════════════════════════════════════════════╗
echo ║                    SETUP COMPLETE! ✅                          ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo New features added:
echo.
echo 1. SEARCH/DISCOVER PAGE
echo    - Search for users and videos
echo    - View trending content
echo    - Suggested accounts
echo.
echo 2. MESSAGING SYSTEM
echo    - Send and receive messages
echo    - Conversation list
echo    - Real-time chat interface
echo.
echo Next steps:
echo 1. Restart your dev server: npm run dev
echo 2. Test the new features:
echo    - Click "Search" in bottom nav
echo    - Click "Inbox" to see messages
echo.
pause
