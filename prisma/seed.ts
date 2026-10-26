import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Only seed if the database is empty (safe for production deployments)
  const existingCount = await prisma.user.count();
  if (existingCount > 0) {
    console.log(`✓ Database already contains ${existingCount} users. Skipping seed.`);
    return;
  }

  const userPasswordHash = await bcrypt.hash("password123", 10);
  const adminPasswordHash = await bcrypt.hash("admin123", 10);

  // 1. Seed System Administrator
  const adminUser = await prisma.user.create({
    data: {
      name: "System Administrator",
      email: "admin@bank.com",
      passwordHash: adminPasswordHash,
      role: "admin",
      status: "active",
      account: {
        create: {
          accountAddress: "ACCT-0000-0001",
          balance: new Prisma.Decimal(100000.0),
          currency: "USD",
        },
      },
    },
    include: { account: true },
  });
  console.log(`✓ Seeded Admin: ${adminUser.email} (${adminUser.account?.accountAddress})`);

  // 2. Seed Alex Rivera
  const alexUser = await prisma.user.create({
    data: {
      name: "Alex Rivera",
      email: "alex@bank.com",
      passwordHash: userPasswordHash,
      role: "user",
      status: "active",
      account: {
        create: {
          accountAddress: "ACCT-4821-9302",
          balance: new Prisma.Decimal(2450.0),
          currency: "USD",
        },
      },
    },
    include: { account: true },
  });
  console.log(`✓ Seeded User: ${alexUser.email} (${alexUser.account?.accountAddress}) - $${alexUser.account?.balance}`);

  // 3. Seed Jordan Lee
  const jordanUser = await prisma.user.create({
    data: {
      name: "Jordan Lee",
      email: "jordan@bank.com",
      passwordHash: userPasswordHash,
      role: "user",
      status: "active",
      account: {
        create: {
          accountAddress: "ACCT-5912-8473",
          balance: new Prisma.Decimal(720.5),
          currency: "USD",
        },
      },
    },
    include: { account: true },
  });
  console.log(`✓ Seeded User: ${jordanUser.email} (${jordanUser.account?.accountAddress}) - $${jordanUser.account?.balance}`);

  // 4. Seed Sam Morgan (Suspended for testing)
  const samUser = await prisma.user.create({
    data: {
      name: "Sam Morgan",
      email: "sam@bank.com",
      passwordHash: userPasswordHash,
      role: "user",
      status: "suspended",
      account: {
        create: {
          accountAddress: "ACCT-1204-6731",
          balance: new Prisma.Decimal(150.0),
          currency: "USD",
        },
      },
    },
    include: { account: true },
  });
  console.log(`✓ Seeded Suspended User: ${samUser.email} (${samUser.account?.accountAddress}) - $${samUser.account?.balance}`);

  // 5. Seed Initial Ledger Transactions
  const tx1 = await prisma.transaction.create({
    data: {
      senderAddress: "ACCT-0000-0001",
      recipientAddress: "ACCT-4821-9302",
      senderName: "System Administrator",
      recipientName: "Alex Rivera",
      amount: new Prisma.Decimal(2000.0),
      type: "deposit",
      status: "completed",
      note: "Initial account opening deposit",
      timestamp: new Date("2026-02-16T10:00:00Z"),
    },
  });

  const tx2 = await prisma.transaction.create({
    data: {
      senderAddress: "ACCT-4821-9302",
      recipientAddress: "ACCT-5912-8473",
      senderName: "Alex Rivera",
      recipientName: "Jordan Lee",
      amount: new Prisma.Decimal(50.0),
      type: "transfer",
      status: "completed",
      note: "Dinner split reimbursement",
      timestamp: new Date("2026-03-02T16:20:00Z"),
    },
  });

  console.log(`✓ Seeded 2 Transactions (${tx1.id}, ${tx2.id})`);
  console.log("🚀 Database seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
