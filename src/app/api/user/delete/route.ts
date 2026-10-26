import { NextResponse } from "next/server";
import { getCurrentUser, clearSessionCookie } from "@/lib/auth";
import { userService } from "@/lib/services/user-service";

export async function POST() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (currentUser.role === "admin") {
      return NextResponse.json(
        { error: "Admin accounts cannot be deleted through this endpoint." },
        { status: 403 }
      );
    }

    const result = await userService.deleteUser(currentUser.id);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to delete account." }, { status: 400 });
    }

    const response = NextResponse.json({ success: true, message: "Account deleted successfully." });
    response.cookies.set(clearSessionCookie());
    return response;
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
