"use server";

import { redirect } from "next/navigation";
import { ApplicationFormSchema } from "@/lib/schema";
import { createCandidate } from "@/lib/airtable";

export type ApplyResult =
  | { ok: true }
  | { ok: false; fieldErrors: Record<string, string> };

export async function submitApplication(_prev: ApplyResult | null, formData: FormData): Promise<ApplyResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = ApplicationFormSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0]?.toString() ?? "_";
      if (!fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    return { ok: false, fieldErrors };
  }
  try {
    await createCandidate(parsed.data);
  } catch (e) {
    console.error("[apply] createCandidate failed:", e instanceof Error ? e.message : e);
    return { ok: false, fieldErrors: { _: "Something went wrong, please try again." } };
  }
  redirect("/apply/thank-you");
}
