import { cookies } from "next/headers";
import { userService } from "./services/user-service";
import { SafeUser } from "./types/bank";

const SESSION_COOKIE_NAME = "mini_bank_session_user_id";

export async function getCurrentUser(): Promise<SafeUser | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!userId) {
    return null;
  }

  const user = await userService.getUserById(userId);
  if (!user) {
    return null;
  }

  return user;
}

export function setSessionCookie(userId: string) {
  return {
    name: SESSION_COOKIE_NAME,
    value: userId,
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };
}

export function clearSessionCookie() {
  return {
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    maxAge: 0,
  };
}
