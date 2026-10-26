import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { SafeUser, Transaction, Account } from "@/lib/types/bank";
import { toSafeUser } from "./user-service";
import { toSafeTransaction } from "./transfer-service";

export const adminService = {
  async getAllUsersWithAccounts(): Promise<SafeUser[]> {
    const users = await db.user.findMany({
      include: { account: true },
      orderBy: { createdAt: "asc" },
    });

    return users.map(toSafeUser);
  },

  async getAllTransactions(): Promise<Transaction[]> {
    const transactions = await db.transaction.findMany({
      orderBy: { timestamp: "desc" },
    });

    return transactions.map(toSafeTransaction);
  },

  async getAdminMetrics(): Promise<{
    totalUsers: number;
    totalLiquidity: number;
    activeUsersCount: number;
    suspendedUsersCount: number;
  }> {
    const [totalUsers, activeUsersCount, suspendedUsersCount, balanceAggregate] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { status: "active" } }),
      db.user.count({ where: { status: "suspended" } }),
      db.account.aggregate({
        _sum: {
          balance: true,
        },
      }),
    ]);

    const totalLiquidity = balanceAggregate._sum.balance
      ? Number(balanceAggregate._sum.balance)
      : 0;

    return {
      totalUsers,
      totalLiquidity,
      activeUsersCount,
      suspendedUsersCount,
    };
  },

  async executeAdminDeposit(params: {
    targetAddress: string;
    amount: number;
    note?: string;
  }): Promise<{
    success: boolean;
    account?: Account;
    transaction?: Transaction;
    error?: string;
  }> {
    try {
      const cleanAddress = params.targetAddress.trim().toUpperCase();
      const depositDecimal = new Prisma.Decimal(params.amount);

      if (depositDecimal.lessThanOrEqualTo(0)) {
        return { success: false, error: "Deposit amount must be greater than zero." };
      }

      const result = await db.$transaction(async (tx) => {
        const targetAccount = await tx.account.findUnique({
          where: { accountAddress: cleanAddress },
          include: { user: true },
        });

        if (!targetAccount) {
          throw new Error(`Target account address "${cleanAddress}" was not found.`);
        }

        // Increment target balance
        const updatedAccount = await tx.account.update({
          where: { id: targetAccount.id },
          data: {
            balance: {
              increment: depositDecimal,
            },
          },
        });

        // Record deposit transaction
        const txRecord = await tx.transaction.create({
          data: {
            senderAddress: "ACCT-0000-0001",
            recipientAddress: cleanAddress,
            senderName: "System Administrator",
            recipientName: targetAccount.user.name,
            amount: depositDecimal,
            type: "deposit",
            status: "completed",
            note: params.note?.trim() || "Administrative treasury deposit",
          },
        });

        const safeAccount: Account = {
          id: updatedAccount.id,
          userId: updatedAccount.userId,
          accountAddress: updatedAccount.accountAddress,
          balance: Number(updatedAccount.balance),
          currency: updatedAccount.currency,
          updatedAt: updatedAccount.updatedAt.toISOString(),
        };

        return {
          account: safeAccount,
          transaction: toSafeTransaction(txRecord),
        };
      });

      return {
        success: true,
        account: result.account,
        transaction: result.transaction,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to process deposit.";
      return { success: false, error: message };
    }
  },

  async toggleUserStatus(
    userId: string,
    status: "active" | "suspended"
  ): Promise<{ success: boolean; user?: SafeUser; error?: string }> {
    const existing = await db.user.findUnique({
      where: { id: userId },
    });

    if (!existing) {
      return { success: false, error: "User not found." };
    }

    if (existing.role === "admin") {
      return { success: false, error: "Administrator account status cannot be modified." };
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: { status },
      include: { account: true },
    });

    return { success: true, user: toSafeUser(updated) };
  },

  async adminDeleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    const existing = await db.user.findUnique({
      where: { id: userId },
    });

    if (!existing) {
      return { success: false, error: "User not found." };
    }

    if (existing.role === "admin") {
      return { success: false, error: "Administrator accounts cannot be deleted." };
    }

    await db.user.delete({
      where: { id: userId },
    });

    return { success: true };
  },
};
