import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { transferService } from "@/lib/services/transfer-service";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const { recipientAddress, amount, note } = await request.json();

    if (!recipientAddress || amount === undefined || amount === null) {
      return NextResponse.json(
        { error: "Recipient account address and amount are required." },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a valid positive number." },
        { status: 400 }
      );
    }

    const result = await transferService.executeTransfer({
      senderUserId: currentUser.id,
      recipientAddress,
      amount: parsedAmount,
      note,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      transaction: result.transaction,
      remainingBalance: result.remainingBalance,
    });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred during transfer." },
      { status: 500 }
    );
  }
}
