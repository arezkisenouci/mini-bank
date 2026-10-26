export type UserRole = "user" | "admin";
export type AccountStatus = "active" | "suspended";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // Mock password check
  role: UserRole;
  status: AccountStatus;
  createdAt: string;
}

export interface Account {
  id: string;
  userId: string;
  accountAddress: string; // e.g. "ACCT-8492-1204"
  balance: number;
  currency: string; // "USD"
  updatedAt: string;
}

export type TransactionType = "transfer" | "deposit";
export type TransactionStatus = "completed" | "failed";

export interface Transaction {
  id: string;
  senderAddress: string;
  recipientAddress: string;
  senderName: string;
  recipientName: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  timestamp: string;
  note?: string;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  createdAt: string;
  account?: Account;
}

export interface AuthSession {
  user: SafeUser;
  token: string;
}
