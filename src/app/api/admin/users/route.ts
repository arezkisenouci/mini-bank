import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { adminService } from "@/lib/services/admin-service";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access: Admin role required." }, { status: 403 });
    }

    const [allUsers, transactions, metrics] = await Promise.all([
      adminService.getAllUsersWithAccounts(),
      adminService.getAllTransactions(),
      adminService.getAdminMetrics(),
    ]);

    return NextResponse.json({
      users: allUsers,
      transactions,
      metrics,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch admin users data." }, { status: 500 });
  }
}
