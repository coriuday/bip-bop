@echo off
echo ========================================
echo Running Database Migration
echo ========================================
echo.

echo Step 1: Generating Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo Error generating Prisma client!
    pause
    exit /b %errorlevel%
)
echo.

echo Step 2: Creating and applying migration...
call npx prisma migrate dev --name add-follow-and-bookmark
if %errorlevel% neq 0 (
    echo Error applying migration!
    pause
    exit /b %errorlevel%
)
echo.

echo ========================================
echo Migration completed successfully!
echo ========================================
echo.
echo You can now restart your development server with: npm run dev
echo.
pause
