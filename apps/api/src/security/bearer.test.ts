import { describe, expect, it } from "vitest";
import { readBearerToken } from "./bearer.js";

describe("bearer authentication parsing", () => {
  it("extracts a bearer token", () => {
    expect(readBearerToken("Bearer abc123")).toBe("abc123");
  });

  it("rejects missing and malformed credentials", () => {
    expect(() => readBearerToken(undefined)).toThrow("Authentication required");
    expect(() => readBearerToken("Basic abc")).toThrow("Invalid authorization header");
    expect(() => readBearerToken("Bearer a b")).toThrow("Invalid authorization header");
  });
});
