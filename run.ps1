# ==============================================================================
# Mini Bank - PowerShell Startup Script
# (Database [PostgreSQL 16 in Docker] + Backend APIs + Frontend UI)
# ==============================================================================

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  🏦  MINI BANK • UNIFIED STARTUP (DB + BACKEND + FRONTEND)     " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Check Docker
Write-Host "`n[1/5] Checking Docker engine..." -ForegroundColor Yellow
try {
    $null = docker info 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Docker daemon is not running." }
    Write-Host "✓ Docker engine is running." -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop and run this script again." -ForegroundColor Red
    exit 1
}

# 2. Check Node & npm
Write-Host "`n[2/5] Checking Node.js and npm..." -ForegroundColor Yellow
try {
    $nodeVer = node -v
    $npmVer = npm.cmd -v
    Write-Host "✓ Node.js ($nodeVer) & npm ($npmVer) detected." -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js or npm is missing in PATH." -ForegroundColor Red
    exit 1
}

# 3. Verify .env
Write-Host "`n[3/5] Verifying environment configuration (.env)..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✓ Copied .env from .env.example" -ForegroundColor Green
    } else {
        Set-Content -Path ".env" -Value 'DATABASE_URL="postgresql://postgres:password123@localhost:5432/minibank?schema=public"`nNODE_ENV="development"'
        Write-Host "✓ Created default .env" -ForegroundColor Green
    }
} else {
    Write-Host "✓ .env file found." -ForegroundColor Green
}

# 4. Check dependencies
if (-not (Test-Path "node_modules")) {
    Write-Host "`nInstalling dependencies via npm install..." -ForegroundColor Yellow
    npm.cmd install
}

# 5. Start Docker PostgreSQL
Write-Host "`n[4/5] Starting containerized PostgreSQL database..." -ForegroundColor Yellow
npm.cmd run docker:up

Write-Host "Waiting for PostgreSQL database to be healthy..." -ForegroundColor Yellow
$retries = 30
$ready = $false
while ($retries -gt 0 -and -not $ready) {
    $status = docker exec minibank-postgres pg_isready -U postgres -d minibank 2>&1
    if ($LASTEXITCODE -eq 0) {
        $ready = $true
    } else {
        Start-Sleep -Seconds 1
        $retries--
        Write-Host -NoNewline "."
    }
}
Write-Host ""

if (-not $ready) {
    Write-Host "❌ PostgreSQL container failed to start in time." -ForegroundColor Red
    docker compose logs postgres
    exit 1
}
Write-Host "✓ PostgreSQL database is healthy on port 5432." -ForegroundColor Green

# Prisma synchronization
Write-Host "`nSynchronizing Prisma schema..." -ForegroundColor Yellow
npx.cmd prisma generate
npx.cmd prisma migrate deploy 2>$null

# 6. Launch Application
$port = if ($env:PORT) { $env:PORT } else { "3000" }

Write-Host "`n=================================================================" -ForegroundColor Green
Write-Host "  🚀  MINI BANK IS READY!                                        " -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green
Write-Host "  • Web App (Frontend + Backend): http://localhost:$port"
Write-Host "  • PostgreSQL Database:          localhost:5432 (minibank)"
Write-Host "  • Admin Account:                admin@bank.com / admin123"
Write-Host "  • User Account:                 alex@bank.com  / password123"
Write-Host "  • User Account:                 jordan@bank.com / password123"
Write-Host "=================================================================`n"
Write-Host "Starting Next.js development server on port $port...`n" -ForegroundColor Cyan

npm.cmd run dev -- -p $port
