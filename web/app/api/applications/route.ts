import { NextResponse } from "next/server";
import { ApplicationFormSchema } from "@/lib/schema";
import { createCandidate } from "@/lib/airtable";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  const parsed = ApplicationFormSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", issues: parsed.error.issues }, { status: 400 });
  }
  try {
    const id = await createCandidate(parsed.data);
    return NextResponse.json({ id });
  } catch (e) {
    console.error("createCandidate failed", e);
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }
}
