import { NextResponse } from "next/server";
import { userService } from "@/lib/services/user-service";
import { setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const result = await userService.createUser({
      name,
      email,
      password,
      role: "user",
    });

    if (!result.success || !result.user) {
      return NextResponse.json(
        { error: result.error || "Failed to create user account." },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: result.user,
    });

    const cookieOptions = setSessionCookie(result.user.id);
    response.cookies.set(cookieOptions);

    return response;
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error occurred." },
      { status: 500 }
    );
  }
}
