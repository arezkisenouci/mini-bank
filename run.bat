@echo off
setlocal enabledelayedexpansion

echo =================================================================
echo   MINI BANK - UNIFIED STARTUP (DB + BACKEND + FRONTEND)
echo =================================================================

REM 1. Check Docker
echo [1/5] Checking Docker...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker daemon is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)

REM 2. Check Node & npm
echo [2/5] Checking Node.js and npm...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in PATH.
    pause
    exit /b 1
)

REM 3. Verify .env
echo [3/5] Checking configuration (.env)...
if not exist .env (
    if exist .env.example (
        copy .env.example .env >nul
        echo Created .env from .env.example
    ) else (
        echo DATABASE_URL="postgresql://postgres:password123@localhost:5432/minibank?schema=public" > .env
        echo NODE_ENV="development" >> .env
        echo Created default .env
    )
)

REM 4. Dependencies
if not exist node_modules (
    echo Installing dependencies via npm install...
    call npm.cmd install
)

REM 5. Start Docker PostgreSQL
echo [4/5] Starting PostgreSQL 16 container...
call npm.cmd run docker:up

echo Waiting for database to be healthy...
set RETRIES=30
:wait_loop
docker exec minibank-postgres pg_isready -U postgres -d minibank >nul 2>&1
if %errorlevel% equ 0 goto db_ready
timeout /t 1 /nobreak >nul
set /a RETRIES-=1
if %RETRIES% leq 0 goto db_timeout
goto wait_loop

:db_timeout
echo [ERROR] PostgreSQL container did not become ready in time.
pause
exit /b 1

:db_ready
echo PostgreSQL is healthy on port 5432.

echo Generating Prisma client...
call npx.cmd prisma generate >nul

echo Applying schema migrations...
call npx.cmd prisma migrate deploy >nul 2>&1

echo =================================================================
echo   MINI BANK IS READY!
echo =================================================================
echo   * Web App (Frontend + Backend): http://localhost:3000
echo   * PostgreSQL Database:         localhost:5432 (minibank)
echo   * Admin Account:               admin@bank.com / admin123
echo   * User Account:                alex@bank.com  / password123
echo   * User Account:                jordan@bank.com / password123
echo =================================================================
echo Starting Next.js development server...

call npm.cmd run dev
