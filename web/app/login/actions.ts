"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, SESSION_TTL_MS, signSession } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const passcode = String(formData.get("passcode") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");
  const expected = process.env.DASHBOARD_PASSCODE;
  if (!expected) throw new Error("Missing DASHBOARD_PASSCODE");
  if (passcode !== expected) {
    redirect("/login?error=1" + (next ? `&next=${encodeURIComponent(next)}` : ""));
  }
  const token = await signSession({ exp: Date.now() + SESSION_TTL_MS });
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
  redirect(next || "/dashboard");
}

export async function logoutAction() {
  (await cookies()).delete(COOKIE_NAME);
  redirect("/login");
}
