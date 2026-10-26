# PostgreSQL (Docker) Database Architecture & Integration Plan
## Mini Bank Web Application (Next.js App Router • Docker • Prisma ORM • PostgreSQL 16)

---

## 1. Executive Summary & Architectural Overview

This document outlines the end-to-end integration plan for transitioning the **Mini Bank** application from its current in-memory storage layer to a production-grade, relational **PostgreSQL 16** database containerized with **Docker Compose** and managed via **Prisma ORM**.

### Core Infrastructure & Architecture Decisions:
1. **Containerized PostgreSQL via Docker Compose**:
   - Standardized `postgres:16-alpine` container with persistent volume storage (`pgdata`).
   - Automated health checks using `pg_isready` to guarantee database readiness before migrations run.
   - Standardized local port mapping (`5432:5432`).
2. **Guaranteed Financial Consistency (ACID Transactions)**:
   - Peer-to-peer transfers are strictly atomic. Debiting the sender, crediting the recipient, and recording the transaction in the ledger execute in an isolated database transaction (`prisma.$transaction`).
3. **Prevent Overdrafts & Race Conditions**:
   - Database-level check constraints (`CHECK (balance >= 0)`) and row-locking ensure rapid or simultaneous transfers cannot produce negative balances.
4. **Exact Currency Precision**:
   - All monetary balances and transaction amounts use `Decimal(14, 2)` to eliminate JavaScript floating-point rounding errors.
5. **Zero Frontend Regression**:
   - The existing shadcn/ui mobile-first frontend, layout, and API route interfaces will be maintained without breaking changes.
6. **Real Password Security**:
   - Replace mock passwords with industry-standard `bcryptjs` salt-hashing (10 rounds).

---

## 2. Docker Architecture & Container Topology

```mermaid
flowchart TD
    subgraph Host["Developer Host Machine"]
        APP["Next.js App Router (Node.js)\nlocalhost:3000 / localhost:3005"]
        PRISMA["Prisma Client & Migration Engine"]
    end

    subgraph Docker["Docker Engine"]
        subgraph Container["Container: minibank-postgres"]
            PG["PostgreSQL 16 Engine\nPort 5432"]
            DB[("Database: minibank")]
        end
        VOL[("Named Volume: minibank_pgdata\n(Persistent on Disk)")]
    end

    APP -->|TCP / Prisma Driver| PG
    PRISMA -->|Migrate & Seed| PG
    PG --> DB
    PG --> VOL
```

### Complete `docker-compose.yml` Specification:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: minibank-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password123
      POSTGRES_DB: minibank
    ports:
      - "5432:5432"
    volumes:
      - minibank_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d minibank"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  minibank_pgdata:
    name: minibank_pgdata
```

---

## 3. Entity-Relationship (ER) Diagram & Schema Design

```mermaid
erDiagram
    USER ||--|| ACCOUNT : owns
    USER {
        string id PK "uuid"
        string name
        string email UK
        string passwordHash
        string role "user | admin"
        string status "active | suspended"
        datetime createdAt
        datetime updatedAt
    }

    ACCOUNT {
        string id PK "uuid"
        string userId FK, UK
        string accountAddress UK "ACCT-XXXX-XXXX"
        decimal balance "14, 2, CHECK >= 0"
        string currency "USD"
        datetime createdAt
        datetime updatedAt
    }

    TRANSACTION {
        string id PK "uuid"
        string senderAddress "indexed"
        string recipientAddress "indexed"
        string senderName
        string recipientName
        decimal amount "14, 2"
        string type "transfer | deposit"
        string status "completed | failed"
        string note
        datetime timestamp
    }
```

### Complete `prisma/schema.prisma` Specification:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  user
  admin
}

enum AccountStatus {
  active
  suspended
}

enum TransactionType {
  transfer
  deposit
}

enum TransactionStatus {
  completed
  failed
}

model User {
  id           String        @id @default(uuid())
  name         String
  email        String        @unique
  passwordHash String
  role         Role          @default(user)
  status       AccountStatus @default(active)
  account      Account?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  @@map("users")
}

model Account {
  id             String   @id @default(uuid())
  userId         String   @unique
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  accountAddress String   @unique // e.g. "ACCT-4821-9302"
  balance        Decimal  @default(100.00) @db.Decimal(14, 2)
  currency       String   @default("USD")
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([accountAddress])
  @@map("accounts")
}

model Transaction {
  id               String            @id @default(uuid())
  senderAddress    String
  recipientAddress String
  senderName       String
  recipientName    String
  amount           Decimal           @db.Decimal(14, 2)
  type             TransactionType   @default(transfer)
  status           TransactionStatus @default(completed)
  note             String?
  timestamp        DateTime          @default(now())

  @@index([senderAddress])
  @@index([recipientAddress])
  @@index([timestamp])
  @@map("transactions")
}
```

---

## 4. Comprehensive Phases Implementation Plan

```mermaid
flowchart LR
    P1["Phase 1\nDocker & Tooling"] --> P2["Phase 2\nSchema & Migrations"]
    P2 --> P3["Phase 3\nDatabase Seeding"]
    P3 --> P4["Phase 4\nACID Service Layer"]
    P4 --> P5["Phase 5\nAPI Integration"]
    P5 --> P6["Phase 6\nStress & Concurrency QA"]
```

---

### Phase 1: Docker Containerization & Prisma Tooling Setup
**Goal**: Launch the Docker PostgreSQL service, configure npm management scripts, install Prisma, and establish the Next.js database singleton client.

- [x] **1.1 Docker Compose Configuration**
  - Create `docker-compose.yml` in workspace root.
  - Configure PostgreSQL 16 Alpine container with credentials:
    - User: `postgres`
    - Password: `password123`
    - Database: `minibank`
    - Port: `5432`
    - Persistent volume: `minibank_pgdata`
  - Add convenient Docker commands to `package.json` scripts:
    ```json
    "docker:up": "docker compose up -d",
    "docker:down": "docker compose down",
    "docker:logs": "docker compose logs -f postgres"
    ```
- [x] **1.2 Launch Docker Container & Verify Health**
  - Run `docker compose up -d`
  - Verify container status: `docker compose ps` (should show `healthy`)
- [x] **1.3 Install Database & Cryptography Dependencies**
  - Install Prisma CLI: `npm install -D prisma`
  - Install Prisma Client runtime: `npm install @prisma/client`
  - Install secure password hashing: `npm install bcryptjs` and `@types/bcryptjs`
  - Install `tsx` for TypeScript seed execution: `npm install -D tsx`
- [x] **1.4 Configure Environment Variables**
  - Set `DATABASE_URL` in `.env` and `.env.local`:
    ```env
    DATABASE_URL="postgresql://postgres:password123@localhost:5432/minibank?schema=public"
    ```
  - Create `.env.example` documenting the connection string.
- [x] **1.5 Singleton Prisma Client (`src/lib/db.ts`)**
  - Implement the recommended Next.js singleton pattern on `globalThis` to prevent connection exhaustion during development hot reloading:
  ```typescript
  import { PrismaClient } from "@prisma/client";

  const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

  export const db =
    globalForPrisma.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });

  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
  ```

---

### Phase 2: Schema Migration & Database Constraints
**Goal**: Apply schema migrations to the Docker PostgreSQL container and enforce database-level integrity constraints.

- [x] **2.1 Configure `prisma/schema.prisma`**
  - Implement models: `User`, `Account`, `Transaction` with enums, indexes, and relations.
  - Set `onDelete: Cascade` on the `User <-> Account` relationship so deleting a user cleanly cascades to their bank account.
- [x] **2.2 Run Initial Prisma Migration**
  - Execute: `npx prisma migrate dev --name init_bank_docker_postgresql`
  - Generate TypeScript client types: `npx prisma generate`
- [x] **2.3 Database-Level Check Constraint for Balances**
  - Add an atomic check constraint to the generated SQL migration:
    ```sql
    ALTER TABLE "accounts" ADD CONSTRAINT "check_balance_positive" CHECK ("balance" >= 0.00);
    ```
  - This ensures that under no circumstances can an account balance drop below $0.00.

---

### Phase 3: Database Seeding & Mock Data Migration
**Goal**: Populate the Docker PostgreSQL database with pre-seeded administrative and demo testing accounts.

- [x] **3.1 Create Database Seeder (`prisma/seed.ts`)**
  - Hash default passwords using `bcrypt.hash("password123", 10)`:
    - **Admin Account**: `admin@bank.com` (`admin123`, role: `admin`, address: `ACCT-0000-0001`, balance: `$100,000.00`)
    - **User 1 (Alex Rivera)**: `alex@bank.com` (`password123`, address: `ACCT-4821-9302`, balance: `$2,450.00`)
    - **User 2 (Jordan Lee)**: `jordan@bank.com` (`password123`, address: `ACCT-5912-8473`, balance: `$720.50`)
    - **User 3 (Sam Morgan)**: `sam@bank.com` (`password123`, address: `ACCT-1204-6731`, balance: `$150.00`, status: `suspended`)
  - Seed initial transaction history ledger entries.
- [x] **3.2 Configure Seeding Command in `package.json`**
  - Add to `package.json`:
    ```json
    "prisma": {
      "seed": "tsx prisma/seed.ts"
    }
    ```
  - Run `npx prisma db seed` and verify data in the Docker PostgreSQL container.

---

### Phase 4: Atomic Service Layer (Replacing In-Memory Store)
**Goal**: Create robust, type-safe database services implementing atomic transactions and locking.

- [x] **4.1 User Service (`src/lib/services/user-service.ts`)**
  - `getUserById(id)`: Retrieve user with account info.
  - `getUserByEmail(email)`: Authenticate user during login.
  - `createUser({ name, email, password })`:
    - Hashes password with bcrypt.
    - Generates unique `ACCT-XXXX-XXXX` address.
    - Creates `User` and `Account` with $100.00 initial balance in a single transaction.
  - `updateUserProfile(userId, { name, currentPassword, newPassword })`:
    - Validates old password hash with `bcrypt.compare`.
    - Updates name and/or hashes new password.
  - `deleteUser(userId)`: Cascades deletion of user, account, and associated session.
- [x] **4.2 Transfer Service with ACID Transactions (`src/lib/services/transfer-service.ts`)**
  - Implement atomic peer-to-peer transfer via `db.$transaction`:
    ```typescript
    export async function executeTransfer(params: {
      senderUserId: string;
      recipientAddress: string;
      amount: number;
      note?: string;
    }) {
      return await db.$transaction(async (tx) => {
        // 1. Fetch sender and account
        const sender = await tx.user.findUnique({
          where: { id: params.senderUserId },
          include: { account: true },
        });

        if (!sender || !sender.account) throw new Error("Sender account not found.");
        if (sender.status === "suspended") throw new Error("Your account is suspended.");

        // 2. Fetch recipient account and user
        const recipientAccount = await tx.account.findUnique({
          where: { accountAddress: params.recipientAddress.toUpperCase() },
          include: { user: true },
        });

        if (!recipientAccount) throw new Error("Recipient account address does not exist.");
        if (sender.account.accountAddress === recipientAccount.accountAddress) {
          throw new Error("Cannot transfer money to your own address.");
        }

        const transferDecimal = new Prisma.Decimal(params.amount);
        if (transferDecimal.lessThanOrEqualTo(0)) throw new Error("Amount must be greater than zero.");
        if (sender.account.balance.lessThan(transferDecimal)) {
          throw new Error(`Insufficient funds. Available: $${sender.account.balance.toString()}`);
        }

        // 3. Atomic Debit from sender
        const updatedSenderAccount = await tx.account.update({
          where: { id: sender.account.id },
          data: { balance: { decrement: transferDecimal } },
        });

        // 4. Atomic Credit to recipient
        await tx.account.update({
          where: { id: recipientAccount.id },
          data: { balance: { increment: transferDecimal } },
        });

        // 5. Append Ledger Entry
        const record = await tx.transaction.create({
          data: {
            senderAddress: sender.account.accountAddress,
            recipientAddress: recipientAccount.accountAddress,
            senderName: sender.name,
            recipientName: recipientAccount.user.name,
            amount: transferDecimal,
            type: "transfer",
            status: "completed",
            note: params.note || "Peer-to-peer transfer",
          },
        });

        return { transaction: record, remainingBalance: updatedSenderAccount.balance.toNumber() };
      });
    }
    ```
- [x] **4.3 Admin Service (`src/lib/services/admin-service.ts`)**
  - `getAllUsersWithAccounts()`: Paginated/filtered account directory with balances.
  - `executeAdminDeposit({ targetAddress, amount, note })`:
    - Atomic balance increment via `data: { balance: { increment: amount } }`.
    - Creates a deposit transaction in ledger.
  - `toggleUserStatus(userId, status)`: Suspends or reactivates account.
  - `getAdminMetrics()`: Aggregates total liquidity (`_sum.balance`), total accounts, active/suspended metrics.
  - `getSystemTransactions()`: Retrieves audit log of all system activity.

---

### Phase 5: API Route Handlers Integration
**Goal**: Wire existing Next.js App Router API endpoints to the database services with zero breaking changes to the UI.

- [x] **5.1 Auth Route Handlers**
  - `src/app/api/auth/login/route.ts`: Validate password using `bcrypt.compare`.
  - `src/app/api/auth/register/route.ts`: Call `userService.createUser`.
  - `src/app/api/auth/me/route.ts`: Query user, balance, and transaction history from PostgreSQL.
- [x] **5.2 User Operations**
  - `src/app/api/transfer/route.ts`: Call `transferService.executeTransfer`.
  - `src/app/api/user/profile/route.ts`: Call `userService.updateUserProfile`.
  - `src/app/api/user/delete/route.ts`: Call `userService.deleteUser`.
- [x] **5.3 Admin Operations**
  - `src/app/api/admin/users/route.ts`: Return database accounts and aggregated liquidity.
  - `src/app/api/admin/deposit/route.ts`: Call `adminService.executeAdminDeposit`.
  - `src/app/api/admin/status/route.ts`: Call `adminService.toggleUserStatus`.
  - `src/app/api/admin/delete/route.ts`: Call `adminService.adminDeleteUser`.

---

### Phase 6: Edge Cases, Stress Testing & Concurrency Verification
**Goal**: Rigorously test financial invariants, race conditions, and error recovery against the Docker database.

- [x] **6.1 Concurrency & Race Condition Verification**
  - Test simultaneous parallel requests: User with $100 sends two concurrent $70 transfers.
  - Verify that exactly one succeeds and the other fails with "Insufficient funds" (no overdraft).
- [x] **6.2 Database Invariant Verification**
  - Verify that attempting to manually update an account to a negative balance triggers the PostgreSQL `check_balance_positive` constraint and rejects the write.
- [x] **6.3 Decimal Precision Verification**
  - Execute multiple fractional transactions (`$0.10`, `$0.20`, `$0.70`).
  - Verify exact decimal balance calculations without floating-point artifacts.
- [x] **6.4 Full End-to-End Walkthrough**
  - Customer registration -> Transfer execution -> Admin deposit -> Account suspension -> Account deletion.
  - Verify all transactions reflect accurately across browser sessions and survive server restarts.

---

## 5. Docker PostgreSQL Operations Cheat Sheet

| Command | Action |
| :--- | :--- |
| `docker compose up -d` | Start PostgreSQL in the background |
| `docker compose ps` | Check container status and health |
| `docker compose logs -f postgres` | View live PostgreSQL query and connection logs |
| `docker exec -it minibank-postgres psql -U postgres -d minibank` | Open interactive SQL terminal inside PostgreSQL |
| `docker compose down` | Stop PostgreSQL container safely (data is preserved in volume) |
| `docker compose down -v` | Factory reset: Stop container and delete all database data |

---

## 6. Risk Assessment & Mitigations

| Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Race Conditions / Double-Spending** | High | Wrap debit, credit, and ledger creation in `prisma.$transaction`. Enforce `CHECK (balance >= 0)` in PostgreSQL. |
| **Docker Container Unready at App Startup** | Medium | Docker healthcheck (`pg_isready`) + Prisma retry logic on startup. |
| **Float Rounding Anomalies** | High | Use `Decimal(14, 2)` everywhere in Prisma and database schemas; avoid JavaScript primitive `number` for currency calculations. |
| **Frontend Disruption** | Medium | Maintain the exact JSON payload shapes returned by the current API routes so shadcn/ui components require zero changes. |
