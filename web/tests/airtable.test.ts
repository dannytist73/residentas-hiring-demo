import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { listCandidates, getCandidate, createCandidate, updateCandidateDraft, triggerSend } from "@/lib/airtable";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("AIRTABLE_API_KEY", "key-test");
  vi.stubEnv("AIRTABLE_BASE_ID", "appTEST");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  fetchMock.mockReset();
});

function airtableRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "recABC",
    createdTime: "2026-05-06T10:00:00Z",
    fields: {
      "Name": "Maria",
      "Email": "maria@example.com",
      "Status": "Pending Review",
      "Send Triggered": false,
      "Q1 Answer": "",
      "Q2 Answer": "",
      "Past Experience": "",
      "Tools Used": "",
      ...overrides,
    },
  };
}

describe("listCandidates", () => {
  it("returns parsed candidate records", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ records: [airtableRow()] }), { status: 200 })
    );

    const result = await listCandidates();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("recABC");
    expect(result[0].name).toBe("Maria");
  });

  it("throws on Airtable error response", async () => {
    fetchMock.mockResolvedValueOnce(new Response("nope", { status: 500 }));
    await expect(listCandidates()).rejects.toThrow();
  });
});

describe("getCandidate", () => {
  it("returns null on 404", async () => {
    fetchMock.mockResolvedValueOnce(new Response("", { status: 404 }));
    expect(await getCandidate("recX")).toBeNull();
  });

  it("returns parsed record on 200", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(airtableRow()), { status: 200 }));
    const r = await getCandidate("recABC");
    expect(r?.name).toBe("Maria");
  });
});

describe("createCandidate", () => {
  it("POSTs the form data and returns the new id", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "recNEW", fields: {} }), { status: 200 })
    );

    const id = await createCandidate({
      name: "John",
      email: "j@e.com",
      dateOfBirth: "1990-01-01",
      gender: "Male",
      location: "Cebu",
      jobTenure: "3 years",
      pastExperience: "X",
      crossBorderFinanceExperience: "No",
      toolsUsed: "Y",
      aiUsageExample: "Z",
      q1Answer: "A",
      q2Answer: "B",
      currentlyEmployed: "No",
      expectedPay: 800,
      hoursPerWeek: 40,
      additionalComments: "",
    });

    expect(id).toBe("recNEW");
    const [, init] = fetchMock.mock.calls[0];
    expect(init?.method).toBe("POST");
    const body = JSON.parse((init?.body as string) ?? "{}");
    expect(body.fields.Name).toBe("John");
    expect(body.fields.Status).toBe("Pending Scoring");
  });
});

describe("updateCandidateDraft", () => {
  it("PATCHes only provided fields", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ id: "recABC" }), { status: 200 }));
    await updateCandidateDraft("recABC", { subject: "New subject" });
    const [, init] = fetchMock.mock.calls[0];
    expect(init?.method).toBe("PATCH");
    const body = JSON.parse((init?.body as string) ?? "{}");
    expect(body.fields["Drafted Email Subject"]).toBe("New subject");
    expect(body.fields["Drafted Email Body"]).toBeUndefined();
  });
});

describe("triggerSend", () => {
  it("PATCHes Send Triggered=true", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ id: "recABC" }), { status: 200 }));
    await triggerSend("recABC");
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse((init?.body as string) ?? "{}");
    expect(body.fields["Send Triggered"]).toBe(true);
  });
});
