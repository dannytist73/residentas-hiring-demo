import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/airtable", () => ({
  createCandidate: vi.fn(),
  listCandidates: vi.fn(),
  getCandidate: vi.fn(),
  updateCandidateDraft: vi.fn(),
  triggerSend: vi.fn(),
}));

import { POST } from "@/app/api/applications/route";
import { createCandidate } from "@/lib/airtable";

const valid = {
  name: "Maria",
  email: "m@e.com",
  dateOfBirth: "1990-01-01",
  gender: "Female",
  location: "Manila",
  jobTenure: "3 years",
  pastExperience: "X",
  crossBorderFinanceExperience: "No",
  toolsUsed: "Y",
  aiUsageExample: "Z",
  q1Answer: "A",
  q2Answer: "B",
  currentlyEmployed: "Yes",
  expectedPay: 1000,
  hoursPerWeek: 40,
  additionalComments: "",
};

beforeEach(() => vi.mocked(createCandidate).mockResolvedValue("recNEW"));
afterEach(() => vi.resetAllMocks());

describe("POST /api/applications", () => {
  it("creates a candidate and returns the id", async () => {
    const req = new Request("http://x/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(valid),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "recNEW" });
  });

  it("returns 400 on validation failure", async () => {
    const req = new Request("http://x/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...valid, email: "nope" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
