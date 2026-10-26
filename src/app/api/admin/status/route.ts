import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { adminService } from "@/lib/services/admin-service";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access: Admin role required." }, { status: 403 });
    }

    const { userId, status } = await request.json();

    if (!userId || !["active", "suspended"].includes(status)) {
      return NextResponse.json(
        { error: "Valid userId and status ('active' | 'suspended') are required." },
        { status: 400 }
      );
    }

    const result = await adminService.toggleUserStatus(userId, status);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: result.user,
    });
  } catch {
    return NextResponse.json({ error: "Failed to update user status." }, { status: 500 });
  }
}
