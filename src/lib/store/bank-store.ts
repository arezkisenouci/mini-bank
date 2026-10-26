import { Account, Transaction, User, SafeUser } from "../types/bank";

function generateAccountAddress(): string {
  const segment1 = Math.floor(1000 + Math.random() * 9000);
  const segment2 = Math.floor(1000 + Math.random() * 9000);
  return `ACCT-${segment1}-${segment2}`;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

class BankStore {
  private users: Map<string, User> = new Map();
  private accounts: Map<string, Account> = new Map(); // key is userId
  private transactions: Transaction[] = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // 1. Admin User
    const adminUser: User = {
      id: "usr_admin",
      name: "System Administrator",
      email: "admin@bank.com",
      passwordHash: "admin123",
      role: "admin",
      status: "active",
      createdAt: new Date("2026-01-01T00:00:00Z").toISOString(),
    };
    const adminAccount: Account = {
      id: "acc_admin",
      userId: adminUser.id,
      accountAddress: "ACCT-0000-0001",
      balance: 100000.0,
      currency: "USD",
      updatedAt: new Date().toISOString(),
    };
    this.users.set(adminUser.id, adminUser);
    this.accounts.set(adminUser.id, adminAccount);

    // 2. Regular User: Alex Rivera
    const userAlex: User = {
      id: "usr_alex",
      name: "Alex Rivera",
      email: "alex@bank.com",
      passwordHash: "password123",
      role: "user",
      status: "active",
      createdAt: new Date("2026-02-15T09:30:00Z").toISOString(),
    };
    const accountAlex: Account = {
      id: "acc_alex",
      userId: userAlex.id,
      accountAddress: "ACCT-4821-9302",
      balance: 2450.0,
      currency: "USD",
      updatedAt: new Date().toISOString(),
    };
    this.users.set(userAlex.id, userAlex);
    this.accounts.set(userAlex.id, accountAlex);

    // 3. Regular User: Jordan Lee
    const userJordan: User = {
      id: "usr_jordan",
      name: "Jordan Lee",
      email: "jordan@bank.com",
      passwordHash: "password123",
      role: "user",
      status: "active",
      createdAt: new Date("2026-03-01T14:15:00Z").toISOString(),
    };
    const accountJordan: Account = {
      id: "acc_jordan",
      userId: userJordan.id,
      accountAddress: "ACCT-5912-8473",
      balance: 720.5,
      currency: "USD",
      updatedAt: new Date().toISOString(),
    };
    this.users.set(userJordan.id, userJordan);
    this.accounts.set(userJordan.id, accountJordan);

    // 4. Regular User: Sam Morgan (Suspended for testing)
    const userSam: User = {
      id: "usr_sam",
      name: "Sam Morgan",
      email: "sam@bank.com",
      passwordHash: "password123",
      role: "user",
      status: "suspended",
      createdAt: new Date("2026-03-10T11:00:00Z").toISOString(),
    };
    const accountSam: Account = {
      id: "acc_sam",
      userId: userSam.id,
      accountAddress: "ACCT-1204-6731",
      balance: 150.0,
      currency: "USD",
      updatedAt: new Date().toISOString(),
    };
    this.users.set(userSam.id, userSam);
    this.accounts.set(userSam.id, accountSam);

    // Seed sample transactions
    this.transactions.push({
      id: "tx_init_1",
      senderAddress: "ACCT-0000-0001",
      recipientAddress: "ACCT-4821-9302",
      senderName: "System Administrator",
      recipientName: "Alex Rivera",
      amount: 2000.0,
      type: "deposit",
      status: "completed",
      timestamp: new Date("2026-02-16T10:00:00Z").toISOString(),
      note: "Initial account opening deposit",
    });

    this.transactions.push({
      id: "tx_init_2",
      senderAddress: "ACCT-4821-9302",
      recipientAddress: "ACCT-5912-8473",
      senderName: "Alex Rivera",
      recipientName: "Jordan Lee",
      amount: 50.0,
      type: "transfer",
      status: "completed",
      timestamp: new Date("2026-03-02T16:20:00Z").toISOString(),
      note: "Dinner split reimbursement",
    });
  }

  public toSafeUser(user: User): SafeUser {
    const account = this.accounts.get(user.id);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      account,
    };
  }

  // User queries
  public getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  public getUserByEmail(email: string): User | undefined {
    const lower = email.trim().toLowerCase();
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === lower) {
        return user;
      }
    }
    return undefined;
  }

  public getUserByAccountAddress(address: string): User | undefined {
    const normAddress = address.trim().toUpperCase();
    for (const [userId, account] of this.accounts.entries()) {
      if (account.accountAddress.toUpperCase() === normAddress) {
        return this.users.get(userId);
      }
    }
    return undefined;
  }

  public getAccountByUserId(userId: string): Account | undefined {
    return this.accounts.get(userId);
  }

  public getAccountByAddress(address: string): Account | undefined {
    const normAddress = address.trim().toUpperCase();
    for (const account of this.accounts.values()) {
      if (account.accountAddress.toUpperCase() === normAddress) {
        return account;
      }
    }
    return undefined;
  }

  public getAllUsersWithAccounts(): SafeUser[] {
    return Array.from(this.users.values()).map((user) => this.toSafeUser(user));
  }

  public getTransactionsForUser(accountAddress: string): Transaction[] {
    const normAddress = accountAddress.trim().toUpperCase();
    return this.transactions
      .filter(
        (tx) =>
          tx.senderAddress.toUpperCase() === normAddress ||
          tx.recipientAddress.toUpperCase() === normAddress
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public getAllTransactions(): Transaction[] {
    return [...this.transactions].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // Create User
  public createUser(params: {
    name: string;
    email: string;
    password: string;
    role?: "user" | "admin";
  }): { success: boolean; user?: SafeUser; error?: string } {
    const existing = this.getUserByEmail(params.email);
    if (existing) {
      return { success: false, error: "An account with this email already exists." };
    }

    const userId = "usr_" + generateId();
    const newUser: User = {
      id: userId,
      name: params.name.trim(),
      email: params.email.trim().toLowerCase(),
      passwordHash: params.password,
      role: params.role || "user",
      status: "active",
      createdAt: new Date().toISOString(),
    };

    let address = generateAccountAddress();
    while (this.getAccountByAddress(address)) {
      address = generateAccountAddress();
    }

    const newAccount: Account = {
      id: "acc_" + generateId(),
      userId: newUser.id,
      accountAddress: address,
      balance: 100.0, // Welcome bonus credit
      currency: "USD",
      updatedAt: new Date().toISOString(),
    };

    this.users.set(newUser.id, newUser);
    this.accounts.set(newUser.id, newAccount);

    // Add welcome transaction
    this.transactions.push({
      id: "tx_" + generateId(),
      senderAddress: "ACCT-0000-0001",
      recipientAddress: address,
      senderName: "System Bank",
      recipientName: newUser.name,
      amount: 100.0,
      type: "deposit",
      status: "completed",
      timestamp: new Date().toISOString(),
      note: "Welcome bonus funds",
    });

    return { success: true, user: this.toSafeUser(newUser) };
  }

  // Transfer Money (Peer-to-Peer)
  public transferMoney(params: {
    senderUserId: string;
    recipientAddress: string;
    amount: number;
    note?: string;
  }): { success: boolean; transaction?: Transaction; error?: string; remainingBalance?: number } {
    const sender = this.users.get(params.senderUserId);
    if (!sender) {
      return { success: false, error: "Sender profile not found." };
    }

    if (sender.status === "suspended") {
      return {
        success: false,
        error: "Your account is suspended. Transfers and withdrawals are disabled.",
      };
    }

    const senderAccount = this.accounts.get(sender.id);
    if (!senderAccount) {
      return { success: false, error: "Sender account details not found." };
    }

    const recipientAccount = this.getAccountByAddress(params.recipientAddress);
    if (!recipientAccount) {
      return {
        success: false,
        error: "The recipient account address does not exist. Please check the address.",
      };
    }

    const recipientUser = this.users.get(recipientAccount.userId);
    if (!recipientUser) {
      return { success: false, error: "Recipient user profile could not be resolved." };
    }

    if (senderAccount.accountAddress.toUpperCase() === recipientAccount.accountAddress.toUpperCase()) {
      return { success: false, error: "You cannot transfer money to your own account address." };
    }

    const amount = Number(params.amount);
    if (isNaN(amount) || amount <= 0) {
      return { success: false, error: "Transfer amount must be greater than zero." };
    }

    // Two decimal places rounding
    const roundedAmount = Math.round(amount * 100) / 100;

    // Check sufficiency
    if (senderAccount.balance < roundedAmount) {
      return {
        success: false,
        error: `Insufficient funds. Your available balance is $${senderAccount.balance.toFixed(2)}.`,
      };
    }

    // Atomic Transfer
    senderAccount.balance = Math.round((senderAccount.balance - roundedAmount) * 100) / 100;
    senderAccount.updatedAt = new Date().toISOString();

    recipientAccount.balance = Math.round((recipientAccount.balance + roundedAmount) * 100) / 100;
    recipientAccount.updatedAt = new Date().toISOString();

    const tx: Transaction = {
      id: "tx_" + generateId(),
      senderAddress: senderAccount.accountAddress,
      recipientAddress: recipientAccount.accountAddress,
      senderName: sender.name,
      recipientName: recipientUser.name,
      amount: roundedAmount,
      type: "transfer",
      status: "completed",
      timestamp: new Date().toISOString(),
      note: params.note?.trim() || "Peer-to-peer transfer",
    };

    this.transactions.push(tx);

    return {
      success: true,
      transaction: tx,
      remainingBalance: senderAccount.balance,
    };
  }

  // Admin: Deposit Money
  public adminDeposit(params: {
    targetAddress: string;
    amount: number;
    note?: string;
  }): { success: boolean; account?: Account; transaction?: Transaction; error?: string } {
    const targetAccount = this.getAccountByAddress(params.targetAddress);
    if (!targetAccount) {
      return { success: false, error: "Target account address was not found." };
    }

    const targetUser = this.users.get(targetAccount.userId);
    if (!targetUser) {
      return { success: false, error: "Target user could not be found." };
    }

    const amount = Number(params.amount);
    if (isNaN(amount) || amount <= 0) {
      return { success: false, error: "Deposit amount must be greater than zero." };
    }

    const roundedAmount = Math.round(amount * 100) / 100;
    targetAccount.balance = Math.round((targetAccount.balance + roundedAmount) * 100) / 100;
    targetAccount.updatedAt = new Date().toISOString();

    const tx: Transaction = {
      id: "tx_" + generateId(),
      senderAddress: "ACCT-0000-0001",
      recipientAddress: targetAccount.accountAddress,
      senderName: "System Administrator",
      recipientName: targetUser.name,
      amount: roundedAmount,
      type: "deposit",
      status: "completed",
      timestamp: new Date().toISOString(),
      note: params.note?.trim() || "Administrative deposit",
    };

    this.transactions.push(tx);

    return { success: true, account: targetAccount, transaction: tx };
  }

  // Admin: Toggle User Status (Active <-> Suspended)
  public setUserStatus(
    userId: string,
    status: "active" | "suspended"
  ): { success: boolean; user?: SafeUser; error?: string } {
    const user = this.users.get(userId);
    if (!user) {
      return { success: false, error: "User not found." };
    }

    if (user.role === "admin") {
      return { success: false, error: "Cannot suspend administrator account." };
    }

    user.status = status;
    return { success: true, user: this.toSafeUser(user) };
  }

  // Update Profile (Name and/or Password)
  public updateUserProfile(
    userId: string,
    params: { name?: string; currentPassword?: string; newPassword?: string }
  ): { success: boolean; user?: SafeUser; error?: string } {
    const user = this.users.get(userId);
    if (!user) {
      return { success: false, error: "User not found." };
    }

    if (params.name !== undefined) {
      const trimmedName = params.name.trim();
      if (!trimmedName) {
        return { success: false, error: "Name cannot be empty." };
      }
      user.name = trimmedName;
    }

    if (params.newPassword) {
      if (!params.currentPassword) {
        return { success: false, error: "Current password is required to change password." };
      }
      if (user.passwordHash !== params.currentPassword) {
        return { success: false, error: "Current password is incorrect." };
      }
      if (params.newPassword.length < 6) {
        return { success: false, error: "New password must be at least 6 characters long." };
      }
      user.passwordHash = params.newPassword;
    }

    return { success: true, user: this.toSafeUser(user) };
  }

  // Delete Account (User self-deletion or Admin deletion)
  public deleteUser(userId: string): { success: boolean; error?: string } {
    const user = this.users.get(userId);
    if (!user) {
      return { success: false, error: "User not found." };
    }

    if (user.role === "admin") {
      return { success: false, error: "Cannot delete administrator account." };
    }

    this.users.delete(userId);
    this.accounts.delete(userId);

    return { success: true };
  }
}

// Global singleton pattern for Next.js
const globalForBank = globalThis as unknown as { bankStore?: BankStore };

export const bankStore = globalForBank.bankStore ?? new BankStore();

if (process.env.NODE_ENV !== "production") {
  globalForBank.bankStore = bankStore;
}
