import { describe, expect, it } from "vitest";
import {
  BROWSER_SESSION_COOKIE,
  CSRF_COOKIE,
  createBrowserSessionMaterial,
  csrfCookie,
  csrfMatches,
  sessionCookie
} from "./browser-session.js";

describe("browser session security", () => {
  it("creates independent opaque session and CSRF tokens", () => {
    const material = createBrowserSessionMaterial();
    expect(material.sessionToken).not.toBe(material.csrfToken);
    expect(material.sessionHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("requires an exact double-submit CSRF match", () => {
    expect(csrfMatches("csrf-a", "csrf-a")).toBe(true);
    expect(csrfMatches("csrf-a", "csrf-b")).toBe(false);
    expect(csrfMatches(undefined, "csrf-a")).toBe(false);
  });

  it("uses strict secure cookie defaults", () => {
    expect(sessionCookie("secret")).toContain(`${BROWSER_SESSION_COOKIE}=secret`);
    expect(sessionCookie("secret")).toContain("HttpOnly");
    expect(sessionCookie("secret")).toContain("SameSite=Strict");
    expect(sessionCookie("secret")).toContain("Secure");
    expect(csrfCookie("csrf")).toContain(`${CSRF_COOKIE}=csrf`);
    expect(csrfCookie("csrf")).not.toContain("HttpOnly");
    expect(csrfCookie("csrf")).toContain("SameSite=Strict");
  });
});
