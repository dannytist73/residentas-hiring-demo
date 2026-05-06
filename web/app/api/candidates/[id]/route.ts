import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCandidate, updateCandidateDraft, triggerSend } from "@/lib/airtable";

export const dynamic = "force-dynamic";

const PatchBody = z.object({
  subject: z.string().max(500).optional(),
  body: z.string().max(20000).optional(),
  send: z.literal(true).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const candidate = await getCandidate(id);
    if (!candidate) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ candidate });
  } catch (e) {
    console.error("getCandidate failed", e);
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  let body: z.infer<typeof PatchBody>;
  try {
    body = PatchBody.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  try {
    if (body.subject !== undefined || body.body !== undefined) {
      await updateCandidateDraft(id, { subject: body.subject, body: body.body });
    }
    if (body.send) {
      await triggerSend(id);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("PATCH /api/candidates failed", e);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
}
