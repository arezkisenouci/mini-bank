import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { adminService } from "@/lib/services/admin-service";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access: Admin role required." }, { status: 403 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    const result = await adminService.adminDeleteUser(userId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch {
    return NextResponse.json({ error: "Failed to delete user." }, { status: 500 });
  }
}
