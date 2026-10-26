import { NextResponse } from "next/server";
import { userService } from "@/lib/services/user-service";
import { setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const authResult = await userService.authenticate(email, password);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || "Invalid email address or password." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: authResult.user,
    });

    const cookieOptions = setSessionCookie(authResult.user.id);
    response.cookies.set(cookieOptions);

    return response;
  } catch {
    return NextResponse.json(
      { error: "Internal server error occurred." },
      { status: 500 }
    );
  }
}
