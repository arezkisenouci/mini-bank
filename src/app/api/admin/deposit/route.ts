import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { adminService } from "@/lib/services/admin-service";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access: Admin role required." }, { status: 403 });
    }

    const { targetAddress, amount, note } = await request.json();

    if (!targetAddress || amount === undefined) {
      return NextResponse.json(
        { error: "Target account address and deposit amount are required." },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Deposit amount must be a positive number." },
        { status: 400 }
      );
    }

    const result = await adminService.executeAdminDeposit({
      targetAddress,
      amount: parsedAmount,
      note,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      account: result.account,
      transaction: result.transaction,
    });
  } catch {
    return NextResponse.json({ error: "Failed to process administrative deposit." }, { status: 500 });
  }
}
