#!/usr/bin/env bash

# ==============================================================================
# Mini Bank - Complete System Startup Script
# (Database [PostgreSQL 16 in Docker] + Backend APIs + Frontend UI)
# ==============================================================================

set -e

# Terminal Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}=================================================================${NC}"
echo -e "${BOLD}  🏦  MINI BANK • UNIFIED STARTUP (DB + BACKEND + FRONTEND)     ${NC}"
echo -e "${BOLD}=================================================================${NC}"

# 1. Check prerequisites
echo -e "\n${BLUE}[1/5] Checking environment prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed or not in PATH.${NC}"
    echo "Please install and start Docker Desktop: https://www.docker.com/products/docker-desktop"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker daemon is not running.${NC}"
    echo "Please start Docker Desktop and run this script again."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed or not in PATH.${NC}"
    echo "Please install Node.js (v18+ or v20+ recommended): https://nodejs.org"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed or not in PATH.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker engine is active.${NC}"
echo -e "${GREEN}✓ Node.js ($(node -v)) & npm ($(npm -v)) detected.${NC}"

# 2. Check / Setup .env file
echo -e "\n${BLUE}[2/5] Verifying environment configuration (.env)...${NC}"
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo -e "${YELLOW}ℹ .env not found. Copying from .env.example...${NC}"
        cp .env.example .env
    else
        echo -e "${YELLOW}ℹ Creating default .env configuration...${NC}"
        cat <<EOF > .env
DATABASE_URL="postgresql://postgres:password123@localhost:5432/minibank?schema=public"
NODE_ENV="development"
EOF
    fi
    echo -e "${GREEN}✓ .env configuration initialized.${NC}"
else
    echo -e "${GREEN}✓ .env file found.${NC}"
fi

# 3. Check node_modules dependencies
echo -e "\n${BLUE}[3/5] Checking project dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}ℹ Installing dependencies via npm install...${NC}"
    npm install
    echo -e "${GREEN}✓ Dependencies installed.${NC}"
else
    echo -e "${GREEN}✓ node_modules already installed.${NC}"
fi

# 4. Start PostgreSQL container & wait for health check
echo -e "\n${BLUE}[4/5] Starting containerized PostgreSQL database...${NC}"
docker compose up -d

echo -e "Waiting for PostgreSQL to be ready and healthy..."
RETRIES=30
until docker exec minibank-postgres pg_isready -U postgres -d minibank &> /dev/null || [ $RETRIES -eq 0 ]; do
    echo -n "."
    sleep 1
    RETRIES=$((RETRIES-1))
done
echo ""

if [ $RETRIES -eq 0 ]; then
    echo -e "${RED}❌ PostgreSQL container failed to start within 30 seconds.${NC}"
    docker compose logs postgres
    exit 1
fi
echo -e "${GREEN}✓ PostgreSQL database is healthy and accepting connections on port 5432.${NC}"

# Synchronize Prisma schema & seed if needed
echo -e "\nSynchronizing database schema and generating Prisma client..."
npx prisma generate

# Apply pending migrations
npx prisma migrate deploy 2>/dev/null || npx prisma db push

# Ensure database is seeded with initial demo data
USER_COUNT=$(docker exec -i minibank-postgres psql -U postgres -d minibank -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ' || echo "0")
if [ "$USER_COUNT" = "0" ] || [ -z "$USER_COUNT" ]; then
    echo -e "${YELLOW}ℹ Database is empty. Seeding demo accounts (Admin, Alex, Jordan, Sam)...${NC}"
    npx prisma db seed
    echo -e "${GREEN}✓ Database seeded successfully.${NC}"
else
    echo -e "${GREEN}✓ Database already contains data ($USER_COUNT accounts).${NC}"
fi

# 5. Launch Application (Frontend + Backend)
APP_PORT="${PORT:-3000}"
echo -e "\n${BOLD}${GREEN}=================================================================${NC}"
echo -e "${BOLD}${GREEN}  🚀  MINI BANK IS READY!                                        ${NC}"
echo -e "${BOLD}${GREEN}=================================================================${NC}"
echo -e "  • ${BOLD}Web App (Frontend + Backend):${NC}  http://localhost:${APP_PORT}"
echo -e "  • ${BOLD}PostgreSQL Database:${NC}          localhost:5432 (minibank)"
echo -e "  • ${BOLD}Admin Account:${NC}                admin@bank.com / admin123"
echo -e "  • ${BOLD}User Account:${NC}                 alex@bank.com  / password123"
echo -e "  • ${BOLD}User Account:${NC}                 jordan@bank.com / password123"
echo -e "=================================================================\n"
echo -e "Starting Next.js server on port ${APP_PORT} (Press Ctrl+C to stop)...\n"

# Start the Next.js development server
npx next dev -p "${APP_PORT}"
