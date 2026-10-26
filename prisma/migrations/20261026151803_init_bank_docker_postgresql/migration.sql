-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('active', 'suspended');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('transfer', 'deposit');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('completed', 'failed');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'user',
    "status" "AccountStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountAddress" TEXT NOT NULL,
    "balance" DECIMAL(14,2) NOT NULL DEFAULT 100.00,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "senderAddress" TEXT NOT NULL,
    "recipientAddress" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "type" "TransactionType" NOT NULL DEFAULT 'transfer',
    "status" "TransactionStatus" NOT NULL DEFAULT 'completed',
    "note" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_userId_key" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_accountAddress_key" ON "accounts"("accountAddress");

-- CreateIndex
CREATE INDEX "accounts_accountAddress_idx" ON "accounts"("accountAddress");

-- CreateIndex
CREATE INDEX "transactions_senderAddress_idx" ON "transactions"("senderAddress");

-- CreateIndex
CREATE INDEX "transactions_recipientAddress_idx" ON "transactions"("recipientAddress");

-- CreateIndex
CREATE INDEX "transactions_timestamp_idx" ON "transactions"("timestamp");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
