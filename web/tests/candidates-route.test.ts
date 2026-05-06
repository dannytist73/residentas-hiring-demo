import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/airtable", () => ({
  listCandidates: vi.fn(),
  getCandidate: vi.fn(),
  updateCandidateDraft: vi.fn(),
  triggerSend: vi.fn(),
}));

import { GET } from "@/app/api/candidates/route";
import { listCandidates } from "@/lib/airtable";

beforeEach(() => {
  vi.mocked(listCandidates).mockResolvedValue([
    {
      id: "rec1", name: "Maria", email: "m@e.com", submittedAt: "2026-05-06T10:00:00Z",
      pastExperience: "", toolsUsed: "", q1Answer: "", q2Answer: "",
      status: "Pending Review", sendTriggered: false,
    },
  ]);
});
afterEach(() => vi.resetAllMocks());

describe("GET /api/candidates", () => {
  it("returns the candidate list", async () => {
    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.candidates).toHaveLength(1);
    expect(json.candidates[0].id).toBe("rec1");
  });

  it("returns 500 if Airtable throws", async () => {
    vi.mocked(listCandidates).mockRejectedValueOnce(new Error("boom"));
    const res = await GET();
    expect(res.status).toBe(500);
  });
});
