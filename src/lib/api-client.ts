// src/lib/api-client.ts

/**
 * Base URL for the backend API.
 * Configurable via NEXT_PUBLIC_API_URL or NEXT_PUBLIC_BACKEND_URL.
 * If empty or undefined, defaults to same-origin relative paths (e.g. "/api/...").
 *
 * Example in .env or deployment settings:
 *   NEXT_PUBLIC_API_URL=https://your-backend-api.railway.app
 */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  ""
).replace(/\/+$/, "");

/**
 * Resolves a given API endpoint path to a fully qualified URL
 * or a relative path depending on whether API_BASE_URL is configured.
 *
 * @param path The endpoint path, e.g. "/api/auth/me"
 */
export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (!API_BASE_URL) {
    return cleanPath;
  }
  return `${API_BASE_URL}${cleanPath}`;
}

/**
 * Centralized fetch wrapper for all frontend API calls.
 * - Automatically prepends API_BASE_URL when deployed to a standalone backend.
 * - Forwards credentials (session cookies) for both same-origin and cross-origin calls.
 * - Sets default Content-Type: application/json for requests with a payload.
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = getApiUrl(path);

  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, {
    ...init,
    headers,
    credentials: init?.credentials ?? "include",
  });
}
