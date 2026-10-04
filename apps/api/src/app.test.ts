import { describe, expect, it } from "vitest";
import { buildApp } from "./app.js";

describe("SentinelOS API foundation", () => {
  it("reports health without fabricated dependency state", async () => {
    const app = await buildApp();
    const response = await app.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok", service: "sentinelos-api" });
    await app.close();
  });

  it("returns structured errors for unknown routes", async () => {
    const app = await buildApp();
    const response = await app.inject({ method: "GET", url: "/does-not-exist" });
    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe("NOT_FOUND");
    expect(response.json().error.requestId).toBeTruthy();
    await app.close();
  });
});
