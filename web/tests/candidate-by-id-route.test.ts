import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/airtable", () => ({
  getCandidate: vi.fn(),
  updateCandidateDraft: vi.fn(),
  markReadyToSend: vi.fn(),
}));

import { PATCH } from "@/app/api/candidates/[id]/route";
import { markReadyToSend } from "@/lib/airtable";

describe("PATCH /api/candidates/[id]", () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(() => vi.resetAllMocks());

  it("marks candidate as Ready to Send", async () => {
    const req = new Request("http://localhost/api/candidates/rec123", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ readyToSend: true }),
    });
    const res = await PATCH(req as never, { params: Promise.resolve({ id: "rec123" }) });
    expect(res.status).toBe(200);
    expect(vi.mocked(markReadyToSend)).toHaveBeenCalledWith("rec123");
  });
});
