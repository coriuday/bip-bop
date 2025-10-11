@echo off
echo ========================================
echo Starting PostgreSQL Database
echo ========================================
echo.

REM Check if Docker is installed
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not in PATH
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
    echo ERROR: Docker is not running
    echo.
    echo Please start Docker Desktop and try again
    echo.
    pause
    exit /b 1
)

echo Checking for existing database container...
docker ps -a --filter "name=video-platform-postgres" --format "{{.Names}}" | findstr "video-platform-postgres" >nul 2>nul

if %errorlevel% equ 0 (
    echo Found existing container. Starting it...
    docker start video-platform-postgres
    if %errorlevel% equ 0 (
        echo.
        echo ========================================
        echo Database started successfully!
        echo ========================================
        echo.
        echo Database is running on: localhost:5433
        echo.
        echo You can now:
        echo 1. Run migrations: migrate.bat
        echo 2. Start dev server: npm run dev
        echo.
    ) else (
        echo ERROR: Failed to start database container
        pause
        exit /b 1
    )
) else (
    echo Creating new database container...
    docker run -d ^
      --name video-platform-postgres ^
      -e POSTGRES_USER=postgres ^
      -e POSTGRES_PASSWORD=password ^
      -e POSTGRES_DB=video-platform ^
      -p 5433:5432 ^
      postgres:latest
    
    if %errorlevel% equ 0 (
        echo.
        echo ========================================
        echo Database created and started!
        echo ========================================
        echo.
        echo Database is running on: localhost:5433
        echo Username: postgres
        echo Password: password
        echo Database: video-platform
        echo.
        echo IMPORTANT: Now run the migration:
        echo   migrate.bat
        echo.
        echo Then start your dev server:
        echo   npm run dev
        echo.
    ) else (
        echo ERROR: Failed to create database container
        pause
        exit /b 1
    )
)

pause
