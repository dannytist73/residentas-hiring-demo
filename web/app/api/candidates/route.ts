import { NextResponse } from "next/server";
import { listCandidates } from "@/lib/airtable";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const candidates = await listCandidates();
    return NextResponse.json({ candidates });
  } catch (e) {
    console.error("listCandidates failed", e);
    return NextResponse.json({ error: "list_failed" }, { status: 500 });
  }
}
