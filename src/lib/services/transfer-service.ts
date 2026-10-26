import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { Transaction, TransactionType, TransactionStatus } from "@/lib/types/bank";

export type DbTransaction = Prisma.TransactionGetPayload<{}>;

export function toSafeTransaction(tx: DbTransaction): Transaction {
  return {
    id: tx.id,
    senderAddress: tx.senderAddress,
    recipientAddress: tx.recipientAddress,
    senderName: tx.senderName,
    recipientName: tx.recipientName,
    amount: Number(tx.amount),
    type: tx.type as TransactionType,
    status: tx.status as TransactionStatus,
    timestamp: tx.timestamp.toISOString(),
    note: tx.note ?? undefined,
  };
}

export const transferService = {
  async executeTransfer(params: {
    senderUserId: string;
    recipientAddress: string;
    amount: number;
    note?: string;
  }): Promise<{
    success: boolean;
    transaction?: Transaction;
    remainingBalance?: number;
    error?: string;
  }> {
    try {
      const cleanAddress = params.recipientAddress.trim().toUpperCase();
      const transferDecimal = new Prisma.Decimal(params.amount);

      if (transferDecimal.lessThanOrEqualTo(0)) {
        return { success: false, error: "Transfer amount must be greater than zero." };
      }

      // Execute atomic transaction
      const result = await db.$transaction(async (tx) => {
        // 1. Fetch sender user and account
        const sender = await tx.user.findUnique({
          where: { id: params.senderUserId },
          include: { account: true },
        });

        if (!sender || !sender.account) {
          throw new Error("Sender bank account was not found.");
        }

        if (sender.status === "suspended") {
          throw new Error("Your account is suspended. Transactions are currently restricted.");
        }

        // 2. Fetch recipient account and user
        const recipientAccount = await tx.account.findUnique({
          where: { accountAddress: cleanAddress },
          include: { user: true },
        });

        if (!recipientAccount) {
          throw new Error(`Recipient account "${cleanAddress}" was not found.`);
        }

        if (sender.account.accountAddress === recipientAccount.accountAddress) {
          throw new Error("Cannot transfer funds to your own account address.");
        }

        // 3. Balance sufficiency check
        if (sender.account.balance.lessThan(transferDecimal)) {
          throw new Error(
            `Insufficient funds. Available: $${Number(sender.account.balance).toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}`
          );
        }

        // 4. Atomic balance debit from sender
        const updatedSenderAccount = await tx.account.update({
          where: { id: sender.account.id },
          data: {
            balance: {
              decrement: transferDecimal,
            },
          },
        });

        // 5. Atomic balance credit to recipient
        await tx.account.update({
          where: { id: recipientAccount.id },
          data: {
            balance: {
              increment: transferDecimal,
            },
          },
        });

        // 6. Record financial transaction in ledger
        const transactionRecord = await tx.transaction.create({
          data: {
            senderAddress: sender.account.accountAddress,
            recipientAddress: recipientAccount.accountAddress,
            senderName: sender.name,
            recipientName: recipientAccount.user.name,
            amount: transferDecimal,
            type: "transfer",
            status: "completed",
            note: params.note?.trim() || "Peer-to-peer transfer",
          },
        });

        return {
          transaction: toSafeTransaction(transactionRecord),
          remainingBalance: Number(updatedSenderAccount.balance),
        };
      });

      return {
        success: true,
        transaction: result.transaction,
        remainingBalance: result.remainingBalance,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to execute transfer.";
      return { success: false, error: message };
    }
  },

  async getTransactionsForUser(accountAddress: string): Promise<Transaction[]> {
    const cleanAddress = accountAddress.trim().toUpperCase();
    const records = await db.transaction.findMany({
      where: {
        OR: [{ senderAddress: cleanAddress }, { recipientAddress: cleanAddress }],
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    return records.map(toSafeTransaction);
  },
};
