import { ApplicationFormInput, CandidateRecord, CandidateRecordSchema, Status } from "./schema";

const AIRTABLE_API = "https://api.airtable.com/v0";
const TABLE = "Candidates";

function env(name: "AIRTABLE_API_KEY" | "AIRTABLE_BASE_ID") {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function authHeaders() {
  return {
    Authorization: `Bearer ${env("AIRTABLE_API_KEY")}`,
    "Content-Type": "application/json",
  };
}

function tableUrl() {
  return `${AIRTABLE_API}/${env("AIRTABLE_BASE_ID")}/${encodeURIComponent(TABLE)}`;
}

type AirtableRow = {
  id: string;
  createdTime: string;
  fields: Record<string, unknown>;
};

function rowToRecord(row: AirtableRow): CandidateRecord {
  const f = row.fields;
  const raw = {
    id: row.id,
    name: (f["Name"] as string) ?? "",
    email: (f["Email"] as string) ?? "",
    submittedAt: (f["Submitted At"] as string) ?? row.createdTime,
    jobTitle: (f["Job Title"] as string) ?? "",
    jobDescription: (f["Job Description"] as string) ?? "",
    pastExperience: (f["Past Experience"] as string) ?? "",
    toolsUsed: (f["Tools Used"] as string) ?? "",
    q1Answer: (f["Q1 Answer"] as string) ?? "",
    q2Answer: (f["Q2 Answer"] as string) ?? "",
    processThinking: f["Process Thinking Score"] as number | undefined,
    practicalAutomation: f["Practical Automation Score"] as number | undefined,
    clarityCommunication: f["Clarity Communication Score"] as number | undefined,
    executionLogic: f["Execution Logic Score"] as number | undefined,
    reliabilityAwareness: f["Reliability Awareness Score"] as number | undefined,
    processThinkingRationale: f["Process Thinking Rationale"] as string | undefined,
    practicalAutomationRationale: f["Practical Automation Rationale"] as string | undefined,
    clarityCommunicationRationale: f["Clarity Communication Rationale"] as string | undefined,
    executionLogicRationale: f["Execution Logic Rationale"] as string | undefined,
    reliabilityAwarenessRationale: f["Reliability Awareness Rationale"] as string | undefined,
    totalScore: f["Total Score"] as number | undefined,
    outcome: f["Outcome"] as "Advance" | "Review" | "Reject" | undefined,
    draftedEmailSubject: f["Drafted Email Subject"] as string | undefined,
    draftedEmailBody: f["Drafted Email Body"] as string | undefined,
    status: ((f["Status"] as string) ?? "Pending Scoring") as Status,
    sentAt: (f["Sent At"] as string | null | undefined) ?? null,
    lastError: (f["Last Error"] as string | null | undefined) ?? null,
  };
  return CandidateRecordSchema.parse(raw);
}

async function airtable<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { ...authHeaders(), ...(init?.headers ?? {}) } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Airtable ${init?.method ?? "GET"} ${url} ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export async function listCandidates(): Promise<CandidateRecord[]> {
  const url = `${tableUrl()}?pageSize=100&sort[0][field]=Submitted At&sort[0][direction]=desc`;
  const json = await airtable<{ records: AirtableRow[] }>(url);
  return json.records.map(rowToRecord);
}

export async function getCandidate(id: string): Promise<CandidateRecord | null> {
  const url = `${tableUrl()}/${id}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Airtable GET ${url} ${res.status}: ${body}`);
  }
  const row = (await res.json()) as AirtableRow;
  return rowToRecord(row);
}

export async function createCandidate(data: ApplicationFormInput): Promise<string> {
  const fields: Record<string, unknown> = {
    "Name": data.name,
    "Email": data.email,
    "Date of Birth": data.dateOfBirth,
    "Gender": data.gender,
    "Location": data.location,
    "Job Tenure": data.jobTenure,
    "Past Experience": data.pastExperience,
    "Cross-border Finance Experience": data.crossBorderFinanceExperience,
    "Tools Used": data.toolsUsed,
    "AI Usage Example": data.aiUsageExample,
    "Q1 Answer": data.q1Answer,
    "Q2 Answer": data.q2Answer,
    "Currently Employed": data.currentlyEmployed,
    "Expected Pay": Math.round(data.expectedPay),
    "Hours Per Week": Math.round(data.hoursPerWeek),
    "Additional Comments": data.additionalComments,
    "Status": "Pending Scoring",
  };
  const json = await airtable<{ id: string }>(tableUrl(), {
    method: "POST",
    body: JSON.stringify({ fields }),
  });
  return json.id;
}

export async function updateCandidateDraft(
  id: string,
  patch: { subject?: string; body?: string }
): Promise<void> {
  const fields: Record<string, unknown> = {};
  if (patch.subject !== undefined) fields["Drafted Email Subject"] = patch.subject;
  if (patch.body !== undefined) fields["Drafted Email Body"] = patch.body;
  if (Object.keys(fields).length === 0) return;
  await airtable(`${tableUrl()}/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ fields }),
  });
}

export async function markReadyToSend(id: string): Promise<void> {
  await airtable(`${tableUrl()}/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ fields: { "Status": "Ready to Send" } }),
  });
}
