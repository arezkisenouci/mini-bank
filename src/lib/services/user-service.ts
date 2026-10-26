import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SafeUser, UserRole, AccountStatus } from "@/lib/types/bank";

export type DbUserWithAccount = Prisma.UserGetPayload<{
  include: { account: true };
}>;

export function toSafeUser(user: DbUserWithAccount): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
    status: user.status as AccountStatus,
    createdAt: user.createdAt.toISOString(),
    account: user.account
      ? {
          id: user.account.id,
          userId: user.account.userId,
          accountAddress: user.account.accountAddress,
          balance: Number(user.account.balance),
          currency: user.account.currency,
          updatedAt: user.account.updatedAt.toISOString(),
        }
      : undefined,
  };
}

async function generateUniqueAccountAddress(): Promise<string> {
  let address = "";
  let exists = true;
  let attempts = 0;

  while (exists && attempts < 10) {
    attempts++;
    const seg1 = Math.floor(1000 + Math.random() * 9000);
    const seg2 = Math.floor(1000 + Math.random() * 9000);
    address = `ACCT-${seg1}-${seg2}`;

    const existing = await db.account.findUnique({
      where: { accountAddress: address },
      select: { id: true },
    });
    if (!existing) {
      exists = false;
    }
  }

  return address;
}

export const userService = {
  async getUserById(id: string): Promise<SafeUser | null> {
    const user = await db.user.findUnique({
      where: { id },
      include: { account: true },
    });

    if (!user) return null;
    return toSafeUser(user);
  },

  async getUserByEmail(email: string): Promise<SafeUser | null> {
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { account: true },
    });

    if (!user) return null;
    return toSafeUser(user);
  },

  async authenticate(email: string, password: string): Promise<{ success: boolean; user?: SafeUser; error?: string }> {
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { account: true },
    });

    if (!user) {
      return { success: false, error: "Invalid email address or password." };
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return { success: false, error: "Invalid email address or password." };
    }

    if (user.status === "suspended") {
      return { success: false, error: "Your account has been suspended. Please contact customer support." };
    }

    return { success: true, user: toSafeUser(user) };
  },

  async createUser(params: {
    name: string;
    email: string;
    password: string;
    role?: "user" | "admin";
  }): Promise<{ success: boolean; user?: SafeUser; error?: string }> {
    const email = params.email.toLowerCase().trim();

    const existing = await db.user.findUnique({
      where: { email },
    });

    if (existing) {
      return { success: false, error: "An account with this email address already exists." };
    }

    const passwordHash = await bcrypt.hash(params.password, 10);
    const accountAddress = await generateUniqueAccountAddress();

    const newUser = await db.user.create({
      data: {
        name: params.name.trim(),
        email,
        passwordHash,
        role: params.role || "user",
        status: "active",
        account: {
          create: {
            accountAddress,
            balance: new Prisma.Decimal(100.0), // $100 welcome bonus
            currency: "USD",
          },
        },
      },
      include: { account: true },
    });

    return { success: true, user: toSafeUser(newUser) };
  },

  async updateUserProfile(
    userId: string,
    params: {
      name?: string;
      currentPassword?: string;
      newPassword?: string;
    }
  ): Promise<{ success: boolean; user?: SafeUser; error?: string }> {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { account: true },
    });

    if (!user) {
      return { success: false, error: "User not found." };
    }

    const dataToUpdate: Prisma.UserUpdateInput = {};

    if (params.name && params.name.trim() !== "") {
      dataToUpdate.name = params.name.trim();
    }

    if (params.newPassword) {
      if (!params.currentPassword) {
        return { success: false, error: "Current password is required to set a new password." };
      }

      const isMatch = await bcrypt.compare(params.currentPassword, user.passwordHash);
      if (!isMatch) {
        return { success: false, error: "Current password does not match our records." };
      }

      if (params.newPassword.length < 6) {
        return { success: false, error: "New password must be at least 6 characters long." };
      }

      dataToUpdate.passwordHash = await bcrypt.hash(params.newPassword, 10);
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: dataToUpdate,
      include: { account: true },
    });

    return { success: true, user: toSafeUser(updatedUser) };
  },

  async deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: "User not found." };
    }

    if (user.role === "admin") {
      return { success: false, error: "Administrative accounts cannot be deleted." };
    }

    await db.user.delete({
      where: { id: userId },
    });

    return { success: true };
  },
};
