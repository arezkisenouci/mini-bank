import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { transferService } from "@/lib/services/transfer-service";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const transactions = user.account?.accountAddress
      ? await transferService.getTransactionsForUser(user.account.accountAddress)
      : [];

    return NextResponse.json({
      authenticated: true,
      user,
      transactions,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch user session." }, { status: 500 });
  }
}
