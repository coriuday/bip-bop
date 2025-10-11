# Scripts Folder

This folder contains utility scripts for database management and setup.

## Database Scripts

### start-database.bat (Windows)

Starts the PostgreSQL database using Docker.

**Usage**:

```bash
.\scripts\start-database.bat
```

**What it does**:

- Starts PostgreSQL container on port 5433
- Uses credentials from .env file
- Creates database if it doesn't exist

### start-database.sh (Linux/Mac)

Same as above but for Unix-based systems.

**Usage**:

```bash
./scripts/start-database.sh
```

## Migration Scripts

### migrate.bat

Applies Prisma migrations to the database.

**Usage**:

```bash
.\scripts\migrate.bat
```

**What it does**:

- Runs `npx prisma migrate dev`
- Applies pending migrations
- Generates Prisma client

### apply-messaging-migration.bat

**Status**: ⚠️ Deprecated - Already applied
Applies the messaging system migration.

### apply-profile-fixes.bat

**Status**: ⚠️ Deprecated - Already applied
Applies profile-related migrations.

## Setup Scripts

### setup-everything.bat

**Status**: ⚠️ Deprecated - Use manual setup
One-time setup script for initial project configuration.

### fix-and-restart.bat

**Status**: ⚠️ Deprecated - Not needed
Quick fix and restart script.

## Recommended Usage

### Daily Development

1. Start database: `.\scripts\start-database.bat`
2. Run dev server: `npm run dev`

### After Schema Changes

1. Create migration: `npx prisma migrate dev --name your_migration_name`
2. Or use: `.\scripts\migrate.bat`

### Fresh Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env`
3. Start database: `.\scripts\start-database.bat`
4. Run migrations: `npx prisma migrate dev`
5. Start dev server: `npm run dev`

## Notes

- Most migration scripts are deprecated as migrations have been applied
- Keep `start-database.bat/sh` for daily use
- Keep `migrate.bat` for applying new migrations
- Other scripts can be deleted if not needed

## Cleanup

If you want to clean up deprecated scripts:

```bash
# Keep these:
- start-database.bat
- start-database.sh
- migrate.bat

# Can delete these (already applied):
- apply-messaging-migration.bat
- apply-profile-fixes.bat
- setup-everything.bat
- fix-and-restart.bat
```
