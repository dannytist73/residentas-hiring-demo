import { describe, it, expect } from "vitest";
import { ApplicationFormSchema, CandidateRecordSchema } from "@/lib/schema";

describe("ApplicationFormSchema", () => {
  const valid = {
    name: "Maria Santos",
    email: "maria@example.com",
    dateOfBirth: "1995-03-12",
    gender: "Female",
    location: "Manila, Philippines",
    jobTenure: "5 years",
    pastExperience: "Operations at a fintech",
    crossBorderFinanceExperience: "Yes",
    toolsUsed: "Airtable, n8n, Zapier",
    aiUsageExample: "Used Claude to draft SOPs",
    q1Answer: "I built a candidate scoring pipeline...",
    q2Answer: "n8n, Airtable, Groq...",
    currentlyEmployed: "Yes",
    expectedPay: 1200,
    hoursPerWeek: 40,
    additionalComments: "",
  };

  it("accepts a fully filled valid submission", () => {
    expect(() => ApplicationFormSchema.parse(valid)).not.toThrow();
  });

  it("rejects invalid email", () => {
    expect(() => ApplicationFormSchema.parse({ ...valid, email: "nope" })).toThrow();
  });

  it("coerces expectedPay from string to number", () => {
    const parsed = ApplicationFormSchema.parse({ ...valid, expectedPay: "1500" as unknown as number });
    expect(parsed.expectedPay).toBe(1500);
  });

  it("rejects empty Q1 answer", () => {
    expect(() => ApplicationFormSchema.parse({ ...valid, q1Answer: "" })).toThrow();
  });
});

describe("CandidateRecordSchema", () => {
  it("accepts a row with all AI-filled fields", () => {
    const row = {
      id: "recABC123",
      name: "Maria Santos",
      email: "maria@example.com",
      submittedAt: "2026-05-06T10:00:00Z",
      processThinking: 4,
      practicalAutomation: 5,
      clarityCommunication: 4,
      executionLogic: 5,
      reliabilityAwareness: 4,
      processThinkingRationale: "Cited specific tools.",
      practicalAutomationRationale: "Concrete outcomes.",
      clarityCommunicationRationale: "Clear writing.",
      executionLogicRationale: "Stepwise reasoning.",
      reliabilityAwarenessRationale: "Mentioned monitoring.",
      totalScore: 22,
      outcome: "Advance" as const,
      draftedEmailSubject: "Next steps",
      draftedEmailBody: "Hi Maria,...",
      status: "Pending Review" as const,
      sentAt: null,
      lastError: null,
      q1Answer: "...",
      q2Answer: "...",
      pastExperience: "...",
      toolsUsed: "...",
    };
    expect(() => CandidateRecordSchema.parse(row)).not.toThrow();
  });

  it("accepts a row mid-scoring (no AI fields yet)", () => {
    const row = {
      id: "recXYZ789",
      name: "John Doe",
      email: "john@example.com",
      submittedAt: "2026-05-06T10:00:00Z",
      status: "Pending Scoring" as const,
      q1Answer: "...",
      q2Answer: "...",
      pastExperience: "",
      toolsUsed: "",
    };
    expect(() => CandidateRecordSchema.parse(row)).not.toThrow();
  });
});
