import { describe, it, expect, beforeEach, vi } from "vitest";
import { signSession, verifySession, COOKIE_NAME } from "@/lib/auth";

beforeEach(() => {
  vi.stubEnv("AUTH_SECRET", "0".repeat(64));
});

describe("session token", () => {
  it("verifies a token it just signed", async () => {
    const token = await signSession({ exp: Date.now() + 60_000 });
    const ok = await verifySession(token);
    expect(ok).toBe(true);
  });

  it("rejects a tampered token", async () => {
    const token = await signSession({ exp: Date.now() + 60_000 });
    const tampered = token.slice(0, -2) + (token.slice(-2) === "aa" ? "bb" : "aa");
    expect(await verifySession(tampered)).toBe(false);
  });

  it("rejects an expired token", async () => {
    const token = await signSession({ exp: Date.now() - 1000 });
    expect(await verifySession(token)).toBe(false);
  });

  it("exports a stable cookie name", () => {
    expect(COOKIE_NAME).toBe("residentas_session");
  });
});
