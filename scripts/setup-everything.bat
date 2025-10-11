@echo off
echo ╔════════════════════════════════════════════════════════════════╗
echo ║           COMPLETE SETUP - Database + Migration               ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Check if Docker is installed
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ ERROR: Docker is not installed
    echo.
    echo Please install Docker Desktop from:
    echo https://docs.docker.com/desktop/install/windows-install/
    echo.
    pause
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ ERROR: Docker is not running
    echo.
    echo Please start Docker Desktop and run this script again
    echo.
    pause
    exit /b 1
)

echo ========================================
echo STEP 1: Starting Database
echo ========================================
echo.

REM Check for existing container
docker ps -a --filter "name=video-platform-postgres" --format "{{.Names}}" | findstr "video-platform-postgres" >nul 2>nul

if %errorlevel% equ 0 (
    echo Found existing container. Starting it...
    docker start video-platform-postgres
) else (
    echo Creating new database container...
    docker run -d ^
      --name video-platform-postgres ^
      -e POSTGRES_USER=postgres ^
      -e POSTGRES_PASSWORD=password ^
      -e POSTGRES_DB=video-platform ^
      -p 5433:5432 ^
      postgres:latest
)

if %errorlevel% neq 0 (
    echo ❌ Failed to start database
    pause
    exit /b 1
)

echo ✅ Database is running!
echo.
echo Waiting 3 seconds for database to be ready...
timeout /t 3 /nobreak >nul
echo.

echo ========================================
echo STEP 2: Generating Prisma Client
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
echo STEP 3: Running Database Migration
echo ========================================
echo.

call npx prisma migrate dev --name add-follow-and-bookmark
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
echo Your database is running and migrations are applied!
echo.
echo Next steps:
echo 1. Start your dev server: npm run dev
echo 2. Test the new features:
echo    - Follow button
echo    - Bookmark button
echo    - Comment counts
echo.
echo Database Info:
echo - Host: localhost:5433
echo - User: postgres
echo - Password: password
echo - Database: video-platform
echo.
echo To stop the database:
echo   docker stop video-platform-postgres
echo.
echo To start it again later:
echo   start-database.bat
echo.
pause
