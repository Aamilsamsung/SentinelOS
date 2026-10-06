import { createOpaqueToken, hashToken } from "./session.js";

export const BROWSER_SESSION_COOKIE = "sentinelos_session";
export const BROWSER_ORGANIZATION_COOKIE = "sentinelos_organization";
export const CSRF_COOKIE = "sentinelos_csrf";

export function createBrowserSessionMaterial() {
  const sessionToken = createOpaqueToken();
  const csrfToken = createOpaqueToken();
  return { sessionToken, sessionHash: hashToken(sessionToken), csrfToken };
}

export function csrfMatches(cookieToken: string | undefined, headerToken: string | undefined): boolean {
  if (!cookieToken || !headerToken) return false;
  return cookieToken === headerToken;
}

export function sessionCookie(token: string, secure = true): string {
  return `${BROWSER_SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800${secure ? "; Secure" : ""}`;
}

export function organizationCookie(organizationId: string, secure = true): string {
  return `${BROWSER_ORGANIZATION_COOKIE}=${organizationId}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800${secure ? "; Secure" : ""}`;
}

export function csrfCookie(token: string, secure = true): string {
  return `${CSRF_COOKIE}=${token}; Path=/; SameSite=Strict; Max-Age=28800${secure ? "; Secure" : ""}`;
}
