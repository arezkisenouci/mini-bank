import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { userService } from "@/lib/services/user-service";

export async function PATCH(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const { name, currentPassword, newPassword } = await request.json();

    const result = await userService.updateUserProfile(currentUser.id, {
      name,
      currentPassword,
      newPassword,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: result.user,
    });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred while updating profile." },
      { status: 500 }
    );
  }
}
