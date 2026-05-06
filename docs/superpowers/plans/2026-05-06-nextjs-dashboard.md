# Next.js Dashboard & Application Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a branded Next.js application — public application form, passcode-gated recruiter dashboard, and a two-pane candidate detail view with editable letter and Send button — that becomes the primary face of the existing Residentas hiring workflow on top of the unchanged Airtable + n8n backend.

**Architecture:** Single Next.js 15 App Router project deployed to Vercel. All Airtable calls happen server-side through one typed module (`lib/airtable.ts`). Recruiter routes are gated by HMAC-signed cookie set after passcode match. The Send action flips the existing `Send Triggered` checkbox in Airtable; the existing Airtable Automation + WF2 chain takes over from there.

**Tech Stack:** Next.js 15 App Router · TypeScript · Tailwind CSS · shadcn/ui · Zod · Vitest · `next/font` (Cormorant Garamond + Inter) · Web Crypto API for HMAC · Airtable REST API via `fetch`. Spec: `docs/superpowers/specs/2026-05-06-nextjs-dashboard-design.md`.

---

## File structure

The Next.js app lives in a new top-level `web/` directory alongside `airtable/` and `n8n/`:

```
web/
  package.json
  tsconfig.json
  next.config.mjs
  postcss.config.mjs
  tailwind.config.ts
  vitest.config.ts
  .env.example
  middleware.ts
  app/
    layout.tsx                  root layout (fonts, metadata)
    page.tsx                    splash
    apply/
      page.tsx                  public form
      thank-you/page.tsx
    login/page.tsx
    dashboard/
      layout.tsx                wordmark header
      page.tsx                  list view
      [id]/page.tsx             detail view
    api/
      applications/route.ts     POST: form → Airtable insert
      candidates/route.ts       GET: list (polling endpoint)
      candidates/[id]/route.ts  GET / PATCH (subject, body, send trigger)
  components/
    application-form.tsx        client component
    candidate-list.tsx          client component, polls every 30s
    candidate-detail.tsx        client component, two-pane editor + send
    score-bar.tsx
    outcome-chip.tsx
    ui/*                        shadcn primitives
  lib/
    airtable.ts                 Airtable boundary
    auth.ts                     cookie sign/verify (HMAC)
    schema.ts                   Zod schemas
    brand.ts                    color tokens
    fonts.ts                    next/font setup
  styles/globals.css            Tailwind + brand variables
  tests/
    auth.test.ts
    schema.test.ts
    airtable.test.ts
    applications-route.test.ts
    candidates-route.test.ts
```

Files that change together live together. The `lib/airtable.ts` boundary is the only place that talks to Airtable; route handlers and pages call it. Tests for `lib/*` and `api/*` live under `tests/` mirroring the source paths.

---

## Phase 1 — Bootstrap

### Task 1: Scaffold the Next.js project

**Files:**
- Create: `web/` (entire directory tree from `create-next-app`)

- [ ] **Step 1: Create the project**

```bash
cd D:/RESIDENTAS_TEST
npx create-next-app@latest web --typescript --tailwind --app --src-dir=false --eslint --no-import-alias --turbopack
```

When prompted, accept defaults. This creates `web/` with App Router, TypeScript, Tailwind, ESLint preconfigured.

- [ ] **Step 2: Install runtime dependencies**

```bash
cd D:/RESIDENTAS_TEST/web
npm install zod clsx tailwind-merge class-variance-authority lucide-react
```

- [ ] **Step 3: Install dev dependencies**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @types/node
```

- [ ] **Step 4: Verify the dev server starts**

```bash
npm run dev
```

Expected: server starts on `http://localhost:3000`, page renders the create-next-app default. Stop with Ctrl+C.

- [ ] **Step 5: Add Vitest config**

Create `web/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
});
```

Add to `web/package.json` `scripts`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Verify Vitest runs**

```bash
npm test
```

Expected: "No test files found" (exit 0). Vitest is wired up correctly.

- [ ] **Step 7: Commit**

```bash
cd D:/RESIDENTAS_TEST
git add web/
git commit -m "chore: scaffold Next.js app in web/ with Tailwind + Vitest"
```

---

### Task 2: Brand tokens and global styles

**Files:**
- Create: `web/lib/brand.ts`
- Create: `web/lib/fonts.ts`
- Modify: `web/app/globals.css`
- Modify: `web/app/layout.tsx`
- Modify: `web/tailwind.config.ts`

- [ ] **Step 1: Define brand tokens**

Create `web/lib/brand.ts`:

```ts
export const brand = {
  bg: "#fafaf7",
  surface: "#ffffff",
  ink: "#1a1a1a",
  muted: "#888888",
  hairline: "#e5e2dc",
  rejectBorder: "#7a1f1f",
} as const;
```

- [ ] **Step 2: Configure fonts**

Create `web/lib/fonts.ts`:

```ts
import { Cormorant_Garamond, Inter } from "next/font/google";

export const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-display",
});

export const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});
```

- [ ] **Step 3: Wire fonts into the root layout**

Replace `web/app/layout.tsx` content:

```tsx
import "./globals.css";
import type { Metadata } from "next";
import { display, sans } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Residentas — Hiring",
  description: "Two cities. One standard of living.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="bg-bg text-ink font-sans antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Add Tailwind theme tokens**

Replace the `theme` extension in `web/tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";
import { brand } from "./lib/brand";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: brand.bg,
        surface: brand.surface,
        ink: brand.ink,
        muted: brand.muted,
        hairline: brand.hairline,
        "reject-border": brand.rejectBorder,
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 5: Replace globals.css**

Replace `web/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: light;
}

body {
  font-feature-settings: "ss01", "ss02";
}

.label {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: theme("colors.muted");
}

.hairline {
  border-color: theme("colors.hairline");
}
```

- [ ] **Step 6: Verify the theme compiles**

```bash
cd D:/RESIDENTAS_TEST/web
npm run dev
```

Expected: dev server starts without errors. The default page renders with the new background color (warm off-white). Stop with Ctrl+C.

- [ ] **Step 7: Commit**

```bash
cd D:/RESIDENTAS_TEST
git add web/
git commit -m "chore(web): add brand tokens, fonts, and Tailwind theme"
```

---

## Phase 2 — Data layer

### Task 3: Zod schemas

**Files:**
- Create: `web/lib/schema.ts`
- Create: `web/tests/schema.test.ts`

- [ ] **Step 1: Write failing tests**

Create `web/tests/schema.test.ts`:

```ts
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
      sendTriggered: false,
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
      sendTriggered: false,
      q1Answer: "...",
      q2Answer: "...",
      pastExperience: "",
      toolsUsed: "",
    };
    expect(() => CandidateRecordSchema.parse(row)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd D:/RESIDENTAS_TEST/web
npm test
```

Expected: FAIL — module `@/lib/schema` not found. Also need path alias.

- [ ] **Step 3: Configure path alias**

In `web/tsconfig.json`, ensure `compilerOptions.paths` includes:

```json
"paths": { "@/*": ["./*"] }
```

In `web/vitest.config.ts`, add resolve:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
});
```

- [ ] **Step 4: Implement the schemas**

Create `web/lib/schema.ts`:

```ts
import { z } from "zod";

export const ApplicationFormSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
  gender: z.string().min(1),
  location: z.string().min(1).max(120),
  jobTenure: z.string().min(1).max(60),
  pastExperience: z.string().min(1).max(2000),
  crossBorderFinanceExperience: z.string().min(1).max(2000),
  toolsUsed: z.string().min(1).max(500),
  aiUsageExample: z.string().min(1).max(2000),
  q1Answer: z.string().min(1).max(5000),
  q2Answer: z.string().min(1).max(5000),
  currentlyEmployed: z.string().min(1),
  expectedPay: z.coerce.number().nonnegative(),
  hoursPerWeek: z.coerce.number().int().min(1).max(80),
  additionalComments: z.string().max(2000).default(""),
});

export type ApplicationFormInput = z.infer<typeof ApplicationFormSchema>;

export const Outcome = z.enum(["Advance", "Review", "Reject"]);
export type Outcome = z.infer<typeof Outcome>;

export const Status = z.enum(["Pending Scoring", "Pending Review", "Sent", "Failed"]);
export type Status = z.infer<typeof Status>;

export const CandidateRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  submittedAt: z.string(),

  pastExperience: z.string().default(""),
  toolsUsed: z.string().default(""),
  q1Answer: z.string().default(""),
  q2Answer: z.string().default(""),

  processThinking: z.number().min(0).max(5).optional(),
  practicalAutomation: z.number().min(0).max(5).optional(),
  clarityCommunication: z.number().min(0).max(5).optional(),
  executionLogic: z.number().min(0).max(5).optional(),
  reliabilityAwareness: z.number().min(0).max(5).optional(),

  processThinkingRationale: z.string().optional(),
  practicalAutomationRationale: z.string().optional(),
  clarityCommunicationRationale: z.string().optional(),
  executionLogicRationale: z.string().optional(),
  reliabilityAwarenessRationale: z.string().optional(),

  totalScore: z.number().min(0).max(25).optional(),
  outcome: Outcome.optional(),
  draftedEmailSubject: z.string().optional(),
  draftedEmailBody: z.string().optional(),

  status: Status,
  sendTriggered: z.boolean(),
  sentAt: z.string().nullable().optional(),
  lastError: z.string().nullable().optional(),
});

export type CandidateRecord = z.infer<typeof CandidateRecordSchema>;
```

- [ ] **Step 5: Run tests**

```bash
npm test
```

Expected: PASS (all 6 tests).

- [ ] **Step 6: Commit**

```bash
cd D:/RESIDENTAS_TEST
git add web/
git commit -m "feat(web): zod schemas for application form and candidate record"
```

---

### Task 4: Airtable wrapper

**Files:**
- Create: `web/lib/airtable.ts`
- Create: `web/tests/airtable.test.ts`

- [ ] **Step 1: Write failing tests**

Create `web/tests/airtable.test.ts`:

```ts
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
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the wrapper**

Create `web/lib/airtable.ts`:

```ts
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
    pastExperience: (f["Past Experience"] as string) ?? "",
    toolsUsed: (f["Tools Used"] as string) ?? "",
    q1Answer: (f["Q1 Answer"] as string) ?? "",
    q2Answer: (f["Q2 Answer"] as string) ?? "",
    processThinking: f["Process Thinking"] as number | undefined,
    practicalAutomation: f["Practical Automation"] as number | undefined,
    clarityCommunication: f["Clarity & Communication"] as number | undefined,
    executionLogic: f["Execution Logic"] as number | undefined,
    reliabilityAwareness: f["Reliability Awareness"] as number | undefined,
    processThinkingRationale: f["Process Thinking Rationale"] as string | undefined,
    practicalAutomationRationale: f["Practical Automation Rationale"] as string | undefined,
    clarityCommunicationRationale: f["Clarity & Communication Rationale"] as string | undefined,
    executionLogicRationale: f["Execution Logic Rationale"] as string | undefined,
    reliabilityAwarenessRationale: f["Reliability Awareness Rationale"] as string | undefined,
    totalScore: f["Total Score"] as number | undefined,
    outcome: f["Outcome"] as "Advance" | "Review" | "Reject" | undefined,
    draftedEmailSubject: f["Drafted Email Subject"] as string | undefined,
    draftedEmailBody: f["Drafted Email Body"] as string | undefined,
    status: ((f["Status"] as string) ?? "Pending Scoring") as Status,
    sendTriggered: Boolean(f["Send Triggered"]),
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
  const res = await fetch(`${tableUrl()}/${id}`, { headers: authHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Airtable GET ${res.status}`);
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
    "Expected Pay": data.expectedPay,
    "Hours Per Week": data.hoursPerWeek,
    "Additional Comments": data.additionalComments,
    "Status": "Pending Scoring",
    "Send Triggered": false,
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

export async function triggerSend(id: string): Promise<void> {
  await airtable(`${tableUrl()}/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ fields: { "Send Triggered": true } }),
  });
}
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: all airtable tests PASS.

- [ ] **Step 5: Commit**

```bash
cd D:/RESIDENTAS_TEST
git add web/
git commit -m "feat(web): typed Airtable wrapper as the only data boundary"
```

---

## Phase 3 — Auth

### Task 5: Auth cookie helpers

**Files:**
- Create: `web/lib/auth.ts`
- Create: `web/tests/auth.test.ts`

- [ ] **Step 1: Write failing tests**

Create `web/tests/auth.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { signSession, verifySession, COOKIE_NAME } from "@/lib/auth";

beforeEach(() => {
  vi.stubEnv("AUTH_SECRET", "0".repeat(64));
});

describe("session token", () => {
  it("verifies a token it just signed", async () => {
    const token = await signSession({ exp: Date.now() + 60_000 });
    const ok = await verifySession(token);
    expect(ok).toBe(true);
  });

  it("rejects a tampered token", async () => {
    const token = await signSession({ exp: Date.now() + 60_000 });
    const tampered = token.slice(0, -2) + (token.slice(-2) === "aa" ? "bb" : "aa");
    expect(await verifySession(tampered)).toBe(false);
  });

  it("rejects an expired token", async () => {
    const token = await signSession({ exp: Date.now() - 1000 });
    expect(await verifySession(token)).toBe(false);
  });

  it("exports a stable cookie name", () => {
    expect(COOKIE_NAME).toBe("residentas_session");
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the helpers**

Create `web/lib/auth.ts`:

```ts
export const COOKIE_NAME = "residentas_session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type Payload = { exp: number };

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function fromB64url(s: string): Uint8Array {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function key(): Promise<CryptoKey> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Missing AUTH_SECRET");
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signSession(payload: Payload): Promise<string> {
  const body = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", await key(), new TextEncoder().encode(body));
  return `${body}.${b64url(sig)}`;
}

export async function verifySession(token: string): Promise<boolean> {
  const [body, sig] = token.split(".");
  if (!body || !sig) return false;
  let payload: Payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(fromB64url(body)));
  } catch {
    return false;
  }
  if (typeof payload.exp !== "number" || payload.exp < Date.now()) return false;
  const ok = await crypto.subtle.verify(
    "HMAC",
    await key(),
    fromB64url(sig),
    new TextEncoder().encode(body)
  );
  return ok;
}
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: PASS (all auth tests).

- [ ] **Step 5: Commit**

```bash
cd D:/RESIDENTAS_TEST
git add web/
git commit -m "feat(web): HMAC-signed session cookie helpers"
```

---

### Task 6: Login page + server action

**Files:**
- Create: `web/app/login/page.tsx`
- Create: `web/app/login/actions.ts`

- [ ] **Step 1: Server action**

Create `web/app/login/actions.ts`:

```ts
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, SESSION_TTL_MS, signSession } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const passcode = String(formData.get("passcode") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");
  const expected = process.env.DASHBOARD_PASSCODE;
  if (!expected) throw new Error("Missing DASHBOARD_PASSCODE");
  if (passcode !== expected) {
    redirect("/login?error=1" + (next ? `&next=${encodeURIComponent(next)}` : ""));
  }
  const token = await signSession({ exp: Date.now() + SESSION_TTL_MS });
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
  redirect(next || "/dashboard");
}

export async function logoutAction() {
  (await cookies()).delete(COOKIE_NAME);
  redirect("/login");
}
```

- [ ] **Step 2: Login page**

Create `web/app/login/page.tsx`:

```tsx
import { loginAction } from "./actions";

type SearchParams = Promise<{ error?: string; next?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { error, next } = await searchParams;
  return (
    <main className="min-h-screen grid place-items-center px-6">
      <form action={loginAction} className="w-full max-w-sm bg-surface border hairline border p-8 space-y-5">
        <div>
          <div className="label">Residentas · Hiring</div>
          <h1 className="font-display text-2xl mt-1">Recruiter access</h1>
        </div>
        <label className="block">
          <span className="label">Passcode</span>
          <input
            name="passcode"
            type="password"
            required
            autoFocus
            className="mt-1 block w-full border border-hairline px-3 py-2 bg-bg focus:outline-none focus:border-ink"
          />
        </label>
        <input type="hidden" name="next" value={next ?? ""} />
        {error ? <p className="text-sm text-reject-border">Wrong passcode.</p> : null}
        <button type="submit" className="w-full bg-ink text-white py-2 tracking-wider text-sm uppercase">
          Sign in
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 3: Manual smoke test**

Add `DASHBOARD_PASSCODE=test123` and `AUTH_SECRET=0000000000000000000000000000000000000000000000000000000000000000` to `web/.env.local`.

```bash
cd D:/RESIDENTAS_TEST/web
npm run dev
```

Open `http://localhost:3000/login`. Enter `wrong` → expect inline error. Enter `test123` → expect redirect to `/dashboard` (will 404 for now — that's fine, dashboard not built yet). Stop the server.

- [ ] **Step 4: Commit**

```bash
cd D:/RESIDENTAS_TEST
git add web/
git commit -m "feat(web): login page with passcode-based session cookie"
```

---

### Task 7: Middleware

**Files:**
- Create: `web/middleware.ts`

- [ ] **Step 1: Implement middleware**

Create `web/middleware.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifySession } from "@/lib/auth";

export const config = {
  matcher: ["/dashboard/:path*"],
};

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const ok = token ? await verifySession(token) : false;
  if (ok) return NextResponse.next();
  const url = new URL("/login", req.url);
  url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}
```

- [ ] **Step 2: Verify**

```bash
cd D:/RESIDENTAS_TEST/web
npm run dev
```

Visit `http://localhost:3000/dashboard` in a private window → expect redirect to `/login?next=%2Fdashboard`. Sign in → expect redirect back to `/dashboard` (still 404, but middleware now lets you through). Stop.

- [ ] **Step 3: Commit**

```bash
cd D:/RESIDENTAS_TEST
git add web/middleware.ts
git commit -m "feat(web): auth middleware gates /dashboard routes"
```

---

## Phase 4 — Public form

### Task 8: Splash page

**Files:**
- Modify: `web/app/page.tsx`

- [ ] **Step 1: Replace the default page**

Replace `web/app/page.tsx`:

```tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="max-w-xl text-center space-y-5">
        <div className="label">Residentas · Careers</div>
        <h1 className="font-display text-5xl leading-tight">
          Two cities. One standard of living.
        </h1>
        <p className="text-muted">
          We're hiring an Operations Associate to help run our Lisbon and Orlando portfolios.
        </p>
        <div className="pt-4">
          <Link
            href="/apply"
            className="inline-block bg-ink text-white px-6 py-3 tracking-wider text-sm uppercase"
          >
            Apply now
          </Link>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify**

```bash
npm run dev
```

Visit `http://localhost:3000` → see the splash. Stop.

- [ ] **Step 3: Commit**

```bash
git add web/app/page.tsx
git commit -m "feat(web): marketing splash with Apply CTA"
```

---

### Task 9: Application form component & page

**Files:**
- Create: `web/components/application-form.tsx`
- Create: `web/app/apply/page.tsx`
- Create: `web/app/apply/actions.ts`
- Create: `web/app/apply/thank-you/page.tsx`

- [ ] **Step 1: Server action**

Create `web/app/apply/actions.ts`:

```ts
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
  } catch {
    return { ok: false, fieldErrors: { _: "Something went wrong, please try again." } };
  }
  redirect("/apply/thank-you");
}
```

- [ ] **Step 2: Form component**

Create `web/components/application-form.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import { submitApplication, ApplyResult } from "@/app/apply/actions";

const initial: ApplyResult | null = null;

function Field({
  label,
  name,
  type = "text",
  textarea,
  errors,
  required = true,
  rows,
}: {
  label: string;
  name: string;
  type?: string;
  textarea?: boolean;
  errors: Record<string, string>;
  required?: boolean;
  rows?: number;
}) {
  const cls = "mt-1 block w-full border border-hairline px-3 py-2 bg-bg focus:outline-none focus:border-ink";
  return (
    <label className="block">
      <span className="label">{label}</span>
      {textarea ? (
        <textarea name={name} rows={rows ?? 4} required={required} className={cls} />
      ) : (
        <input name={name} type={type} required={required} className={cls} />
      )}
      {errors[name] ? <span className="text-xs text-reject-border mt-1 block">{errors[name]}</span> : null}
    </label>
  );
}

export function ApplicationForm() {
  const [state, action, pending] = useActionState(submitApplication, initial);
  const errors = state && !state.ok ? state.fieldErrors : {};

  return (
    <form action={action} className="space-y-10">
      {errors._ ? <div className="text-sm text-reject-border">{errors._}</div> : null}

      <section className="space-y-4">
        <h2 className="label">About you</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Full name" name="name" errors={errors} />
          <Field label="Email" name="email" type="email" errors={errors} />
          <Field label="Date of birth" name="dateOfBirth" type="date" errors={errors} />
          <Field label="Gender" name="gender" errors={errors} />
          <Field label="Location" name="location" errors={errors} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="label">Experience</h2>
        <Field label="Job tenure" name="jobTenure" errors={errors} />
        <Field label="Past experience" name="pastExperience" textarea errors={errors} />
        <Field label="Cross-border finance experience" name="crossBorderFinanceExperience" textarea errors={errors} rows={3} />
        <Field label="Tools used" name="toolsUsed" errors={errors} />
        <Field label="AI usage example" name="aiUsageExample" textarea errors={errors} rows={3} />
      </section>

      <section className="space-y-4">
        <h2 className="label">Open questions</h2>
        <Field label="Q1. Describe a workflow you automated end-to-end" name="q1Answer" textarea errors={errors} rows={6} />
        <Field label="Q2. What tools did you use, and why?" name="q2Answer" textarea errors={errors} rows={6} />
      </section>

      <section className="space-y-4">
        <h2 className="label">Logistics</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Currently employed" name="currentlyEmployed" errors={errors} />
          <Field label="Expected pay (USD/month)" name="expectedPay" type="number" errors={errors} />
          <Field label="Hours per week" name="hoursPerWeek" type="number" errors={errors} />
        </div>
        <Field label="Additional comments" name="additionalComments" textarea errors={errors} required={false} rows={3} />
      </section>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-ink text-white px-8 py-3 tracking-wider text-sm uppercase disabled:opacity-50"
        >
          {pending ? "Submitting…" : "Submit application"}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Apply page**

Create `web/app/apply/page.tsx`:

```tsx
import { ApplicationForm } from "@/components/application-form";

export default function ApplyPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-10">
        <div className="label">Residentas · Careers</div>
        <h1 className="font-display text-4xl mt-1">Operations Associate Application</h1>
        <p className="text-muted mt-3">
          Tell us about yourself. Most candidates take 15–20 minutes.
        </p>
      </header>
      <ApplicationForm />
    </main>
  );
}
```

- [ ] **Step 4: Thank-you page**

Create `web/app/apply/thank-you/page.tsx`:

```tsx
export default function ThankYouPage() {
  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="max-w-md text-center space-y-3">
        <div className="label">Application received</div>
        <h1 className="font-display text-4xl">Thank you</h1>
        <p className="text-muted">We'll be in touch soon.</p>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Manual smoke test**

```bash
npm run dev
```

Visit `/apply`. Submit with empty fields → see inline errors. Fill out and submit → redirected to `/apply/thank-you`. Verify a new row appeared in the Airtable Candidates table with `Status = Pending Scoring`. Stop.

- [ ] **Step 6: Commit**

```bash
git add web/
git commit -m "feat(web): public application form with server-action submission"
```

---

## Phase 5 — Dashboard

### Task 10: Outcome chip and score bar components

**Files:**
- Create: `web/components/outcome-chip.tsx`
- Create: `web/components/score-bar.tsx`

- [ ] **Step 1: Outcome chip**

Create `web/components/outcome-chip.tsx`:

```tsx
import type { Outcome } from "@/lib/schema";

const styles: Record<Outcome, string> = {
  Advance: "border-ink text-ink",
  Review: "border-muted text-muted",
  Reject: "border-reject-border text-reject-border",
};

const glyph: Record<Outcome, string> = {
  Advance: "◯",
  Review: "◐",
  Reject: "●",
};

export function OutcomeChip({ outcome }: { outcome: Outcome }) {
  return (
    <span className={`inline-flex items-center gap-1.5 border px-2 py-0.5 text-xs tracking-wider uppercase ${styles[outcome]}`}>
      <span aria-hidden>{glyph[outcome]}</span>
      {outcome}
    </span>
  );
}
```

- [ ] **Step 2: Score bar**

Create `web/components/score-bar.tsx`:

```tsx
export function ScoreBar({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex gap-1" aria-label={`Score ${value} out of ${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 ${i < value ? "bg-ink" : "bg-hairline"}`}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add web/components/
git commit -m "feat(web): outcome chip and score bar primitives"
```

---

### Task 11: Candidates list API route

**Files:**
- Create: `web/app/api/candidates/route.ts`
- Create: `web/tests/candidates-route.test.ts`

- [ ] **Step 1: Write failing test**

Create `web/tests/candidates-route.test.ts`:

```ts
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
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test
```

Expected: FAIL — route not found.

- [ ] **Step 3: Implement the route**

Create `web/app/api/candidates/route.ts`:

```ts
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
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/
git commit -m "feat(web): GET /api/candidates returns the list"
```

---

### Task 12: Dashboard layout

**Files:**
- Create: `web/app/dashboard/layout.tsx`
- Modify: `web/app/login/actions.ts` (add export already done)

- [ ] **Step 1: Implement layout**

Create `web/app/dashboard/layout.tsx`:

```tsx
import { logoutAction } from "@/app/login/actions";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-hairline bg-surface">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="label">Residentas · Hiring</div>
            <div className="font-display text-xl">Candidate pipeline</div>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="text-xs tracking-wider uppercase text-muted hover:text-ink">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/app/dashboard/layout.tsx
git commit -m "feat(web): dashboard layout with wordmark header and sign-out"
```

---

### Task 13: Candidate list view

**Files:**
- Create: `web/components/candidate-list.tsx`
- Create: `web/app/dashboard/page.tsx`

- [ ] **Step 1: List client component (with polling)**

Create `web/components/candidate-list.tsx`:

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { CandidateRecord, Status } from "@/lib/schema";
import { OutcomeChip } from "./outcome-chip";

const FILTERS: { label: string; value: Status | "All" }[] = [
  { label: "All", value: "All" },
  { label: "Pending Review", value: "Pending Review" },
  { label: "Sent", value: "Sent" },
  { label: "Failed", value: "Failed" },
];

export function CandidateList({ initial }: { initial: CandidateRecord[] }) {
  const [rows, setRows] = useState(initial);
  const [filter, setFilter] = useState<Status | "All">("Pending Review");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/candidates", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const json = await res.json();
        if (!cancelled) {
          setRows(json.candidates);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Could not load candidates — retrying");
      }
    };
    const id = setInterval(tick, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const counts = useMemo(() => {
    const c = { "Pending Review": 0, "Sent": 0, "Failed": 0, "Pending Scoring": 0 } as Record<Status, number>;
    for (const r of rows) c[r.status]++;
    return c;
  }, [rows]);

  const visible = filter === "All" ? rows : rows.filter((r) => r.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted">
          {counts["Pending Review"]} pending review · {counts["Sent"]} sent · {counts["Failed"]} failed
        </p>
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`text-xs tracking-wider uppercase px-3 py-1 border ${
                filter === f.value ? "border-ink text-ink" : "border-hairline text-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="text-xs text-reject-border mb-3">{error}</p> : null}

      <div className="bg-surface border border-hairline">
        <table className="w-full text-sm">
          <thead className="border-b border-hairline">
            <tr className="text-left">
              <th className="font-normal label py-3 px-4">Name</th>
              <th className="font-normal label py-3 px-4">Submitted</th>
              <th className="font-normal label py-3 px-4">Score</th>
              <th className="font-normal label py-3 px-4">Outcome</th>
              <th className="font-normal label py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted">
                  No candidates in this view.
                </td>
              </tr>
            ) : (
              visible.map((r) => (
                <tr key={r.id} className="border-t border-hairline hover:bg-bg">
                  <td className="py-3 px-4">
                    <Link href={`/dashboard/${r.id}`} className="hover:underline">
                      <div>{r.name}</div>
                      <div className="text-xs text-muted">{r.email}</div>
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-muted">
                    {new Date(r.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    {r.totalScore != null ? `${r.totalScore} / 25` : "—"}
                  </td>
                  <td className="py-3 px-4">{r.outcome ? <OutcomeChip outcome={r.outcome} /> : "—"}</td>
                  <td className="py-3 px-4 text-muted">{r.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Dashboard page (server component)**

Create `web/app/dashboard/page.tsx`:

```tsx
import { listCandidates } from "@/lib/airtable";
import { CandidateList } from "@/components/candidate-list";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const initial = await listCandidates();
  return <CandidateList initial={initial} />;
}
```

- [ ] **Step 3: Manual smoke test**

```bash
npm run dev
```

Sign in at `/login`. Visit `/dashboard`. Submit an application via `/apply` in another tab. Within 30 seconds, the new row should appear in the dashboard list. Stop.

- [ ] **Step 4: Commit**

```bash
git add web/
git commit -m "feat(web): dashboard list view with filter chips and 30s polling"
```

---

### Task 14: Candidate detail API route

**Files:**
- Create: `web/app/api/candidates/[id]/route.ts`

- [ ] **Step 1: Implement GET + PATCH**

Create `web/app/api/candidates/[id]/route.ts`:

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add web/
git commit -m "feat(web): GET/PATCH /api/candidates/[id] — drafts and Send Triggered"
```

---

### Task 15: Candidate detail view (two-pane)

**Files:**
- Create: `web/components/candidate-detail.tsx`
- Create: `web/app/dashboard/[id]/page.tsx`

- [ ] **Step 1: Detail client component**

Create `web/components/candidate-detail.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type { CandidateRecord } from "@/lib/schema";
import { OutcomeChip } from "./outcome-chip";
import { ScoreBar } from "./score-bar";

const CRITERIA = [
  { key: "processThinking", rationaleKey: "processThinkingRationale", label: "Process Thinking" },
  { key: "practicalAutomation", rationaleKey: "practicalAutomationRationale", label: "Practical Automation" },
  { key: "clarityCommunication", rationaleKey: "clarityCommunicationRationale", label: "Clarity & Communication" },
  { key: "executionLogic", rationaleKey: "executionLogicRationale", label: "Execution Logic" },
  { key: "reliabilityAwareness", rationaleKey: "reliabilityAwarenessRationale", label: "Reliability Awareness" },
] as const;

const AUTOSAVE_MS = 1500;
const POLL_MS = 30_000;

async function patchCandidate(id: string, body: { subject?: string; body?: string; send?: true }) {
  const res = await fetch(`/api/candidates/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${res.status}`);
}

export function CandidateDetail({ initial }: { initial: CandidateRecord }) {
  const [record, setRecord] = useState(initial);
  const [subject, setSubject] = useState(initial.draftedEmailSubject ?? "");
  const [body, setBody] = useState(initial.draftedEmailBody ?? "");
  const dirty = useRef({ subject: false, body: false });
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/candidates/${record.id}`, { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        const fresh: CandidateRecord = json.candidate;
        setRecord(fresh);
        if (!dirty.current.subject) setSubject(fresh.draftedEmailSubject ?? "");
        if (!dirty.current.body) setBody(fresh.draftedEmailBody ?? "");
      } catch {}
    };
    const id = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [record.id]);

  useEffect(() => {
    if (!dirty.current.subject) return;
    const t = setTimeout(() => {
      void patchCandidate(record.id, { subject }).catch(() => {});
    }, AUTOSAVE_MS);
    return () => clearTimeout(t);
  }, [subject, record.id]);

  useEffect(() => {
    if (!dirty.current.body) return;
    const t = setTimeout(() => {
      void patchCandidate(record.id, { body }).catch(() => {});
    }, AUTOSAVE_MS);
    return () => clearTimeout(t);
  }, [body, record.id]);

  async function onSend() {
    setSending(true);
    try {
      await patchCandidate(record.id, { subject, body, send: true });
      setToast("Sending — will reflect on next refresh.");
    } catch {
      setToast("Send failed. Please try again.");
    } finally {
      setSending(false);
    }
  }

  const canSend = record.status === "Pending Review" && !sending;
  const showLetter = record.status !== "Pending Scoring";
  const showSent = record.status === "Sent";

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Left pane */}
      <section className="bg-surface border border-hairline p-6 space-y-6">
        <div>
          <div className="flex items-center gap-3">
            {record.outcome ? <OutcomeChip outcome={record.outcome} /> : null}
            {record.totalScore != null ? (
              <span className="label">{record.totalScore} / 25</span>
            ) : null}
          </div>
          <h1 className="font-display text-3xl mt-2">{record.name}</h1>
          <div className="text-sm text-muted">{record.email}</div>
        </div>

        {record.status === "Failed" && record.lastError ? (
          <div className="border border-reject-border p-3 text-sm">
            <div className="label">Scoring failed</div>
            <div className="mt-1">{record.lastError}</div>
          </div>
        ) : null}

        <div className="space-y-3">
          <h2 className="label">Original answers</h2>
          <Answer label="Past experience" value={record.pastExperience} />
          <Answer label="Tools used" value={record.toolsUsed} />
          <Answer label="Q1. Workflow you automated" value={record.q1Answer} />
          <Answer label="Q2. Tools and why" value={record.q2Answer} />
        </div>

        {record.totalScore != null ? (
          <div className="space-y-4">
            <h2 className="label">AI scores</h2>
            {CRITERIA.map(({ key, rationaleKey, label }) => {
              const v = (record as unknown as Record<string, number | undefined>)[key];
              const r = (record as unknown as Record<string, string | undefined>)[rationaleKey];
              if (v == null) return null;
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm">
                    <span>{label}</span>
                    <span className="text-muted">{v} / 5</span>
                  </div>
                  <div className="mt-1.5"><ScoreBar value={v} /></div>
                  {r ? <p className="mt-2 text-sm text-muted">{r}</p> : null}
                </div>
              );
            })}
          </div>
        ) : null}
      </section>

      {/* Right pane */}
      <section className="bg-surface border border-hairline p-6 space-y-4">
        {!showLetter ? (
          <div className="py-16 text-center">
            <div className="label">Pending</div>
            <p className="font-display text-2xl mt-2">AI is still scoring this application…</p>
            <p className="text-muted mt-2 text-sm">This typically takes under a minute.</p>
          </div>
        ) : (
          <>
            <div>
              <h2 className="label">Drafted letter</h2>
              {showSent ? (
                <p className="text-xs text-muted mt-1">
                  Sent {record.sentAt ? new Date(record.sentAt).toLocaleString() : ""}
                </p>
              ) : (
                <p className="text-xs text-muted mt-1">Edits autosave</p>
              )}
            </div>

            <label className="block">
              <span className="label">Subject</span>
              <input
                className="mt-1 block w-full border border-hairline px-3 py-2 bg-bg disabled:opacity-60"
                value={subject}
                disabled={showSent}
                onChange={(e) => {
                  dirty.current.subject = true;
                  setSubject(e.target.value);
                }}
              />
            </label>

            <label className="block">
              <span className="label">Body</span>
              <textarea
                rows={16}
                className="mt-1 block w-full border border-hairline px-3 py-2 bg-bg font-display text-base leading-relaxed disabled:opacity-60"
                value={body}
                disabled={showSent}
                onChange={(e) => {
                  dirty.current.body = true;
                  setBody(e.target.value);
                }}
              />
            </label>

            {!showSent ? (
              <div className="flex justify-end pt-2">
                <button
                  onClick={onSend}
                  disabled={!canSend}
                  className="bg-ink text-white px-6 py-3 tracking-wider text-sm uppercase disabled:opacity-50"
                >
                  {sending ? "Sending…" : "Send email"}
                </button>
              </div>
            ) : null}

            {toast ? <p className="text-xs text-muted">{toast}</p> : null}
          </>
        )}
      </section>
    </div>
  );
}

function Answer({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <div className="label">{label}</div>
      <p className="text-sm whitespace-pre-wrap mt-1">{value}</p>
    </div>
  );
}
```

- [ ] **Step 2: Detail page**

Create `web/app/dashboard/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getCandidate } from "@/lib/airtable";
import { CandidateDetail } from "@/components/candidate-detail";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export default async function DetailPage({ params }: Params) {
  const { id } = await params;
  const candidate = await getCandidate(id);
  if (!candidate) notFound();
  return (
    <div className="space-y-4">
      <Link href="/dashboard" className="text-xs tracking-wider uppercase text-muted hover:text-ink">
        ← All candidates
      </Link>
      <CandidateDetail initial={candidate} />
    </div>
  );
}
```

- [ ] **Step 3: Manual smoke test**

```bash
npm run dev
```

In `/dashboard`, click a Pending Review candidate. Verify both panes render: scores + rationales on the left, editable subject/body + Send button on the right. Edit the body — the change should persist after a 30s reload (autosave). Click Send. Within 30s, the row's status should flip to Sent in the database, the right pane becomes read-only, and the back button shows "Sent" in the list. Stop.

- [ ] **Step 4: Commit**

```bash
git add web/
git commit -m "feat(web): two-pane candidate detail view with autosave + Send"
```

---

## Phase 6 — Polish & deploy

### Task 16: Apply form validation hardening

**Files:**
- Create: `web/tests/applications-route.test.ts`
- Modify: `web/app/api/applications/route.ts` *(create — duplicates the server action path for completeness)*

Note: the form already submits via server action. This task adds an `/api/applications` JSON endpoint for parity, used by tests and any future external client.

- [ ] **Step 1: Failing test**

Create `web/tests/applications-route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/airtable", () => ({
  createCandidate: vi.fn(),
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
```

- [ ] **Step 2: Implement**

Create `web/app/api/applications/route.ts`:

```ts
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
```

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add web/
git commit -m "feat(web): POST /api/applications JSON endpoint for parity"
```

---

### Task 17: Environment + Vercel deploy

**Files:**
- Create: `web/.env.example`
- Modify: `README.md`

- [ ] **Step 1: Document required env vars**

Create `web/.env.example`:

```
# Airtable — server-side only
AIRTABLE_API_KEY=
AIRTABLE_BASE_ID=

# Recruiter login
DASHBOARD_PASSCODE=
AUTH_SECRET=

# Public — visible in client; non-secret
NEXT_PUBLIC_BRAND_ROLE_TITLE=Operations Associate
```

- [ ] **Step 2: Update root README**

Append to `D:/RESIDENTAS_TEST/README.md`:

```markdown

---

## Web app (Next.js dashboard & form)

The branded recruiter dashboard and public application form live in `web/`.

### Local development

```bash
cd web
cp .env.example .env.local   # then fill in the values
npm install
npm run dev                  # http://localhost:3000
npm test                     # run unit tests
```

### Environment variables

| Variable | Notes |
|---|---|
| `AIRTABLE_API_KEY` | Personal Access Token with read+write on the Candidates table |
| `AIRTABLE_BASE_ID` | The same base used by WF1/WF2 |
| `DASHBOARD_PASSCODE` | The single shared passcode for `/login` |
| `AUTH_SECRET` | 64-char random hex; `openssl rand -hex 32` |
| `NEXT_PUBLIC_BRAND_ROLE_TITLE` | Role title shown on `/apply` |

### Deploy to Vercel

```bash
cd web
npx vercel link              # link the directory to a Vercel project
npx vercel env pull          # populate .env.local from Vercel
npx vercel deploy --prod     # production deploy
```

The dashboard URL will be the Vercel project URL. Add the production domain (e.g. `hire.residentas.com`) in the Vercel project settings if desired.
```

- [ ] **Step 3: Run all tests one more time**

```bash
cd D:/RESIDENTAS_TEST/web
npm test
```

Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
cd D:/RESIDENTAS_TEST
git add web/.env.example README.md
git commit -m "docs: web app setup, env vars, and Vercel deploy instructions"
```

- [ ] **Step 5: Deploy**

Follow the README steps to deploy to Vercel. Set the same env vars in the Vercel project. After first deploy, do an end-to-end check:

1. Open the production `/apply` URL.
2. Submit a real application.
3. Wait for WF1 to score the row in Airtable.
4. Sign into `/dashboard` with the production passcode.
5. Open the candidate, verify scores + drafted letter render.
6. Edit the letter. Wait 30s and refresh — the edit should persist.
7. Click Send. Verify the candidate receives the email and the row's `Status` flips to `Sent` in Airtable, then in the dashboard.

Record findings; if anything fails, file a follow-up task per finding rather than amending this plan.

---

## Self-review (already performed)

**Spec coverage:**

| Spec section | Tasks |
|---|---|
| Architecture diagram, decisions 1–4 | Tasks 1, 4 |
| Decisions 5–7 (auth, polling, send chain) | Tasks 5, 6, 7, 14, 15 |
| Decisions 8–11 (autosave, form layout, two-pane, brand) | Tasks 2, 9, 15 |
| Routes `/`, `/apply`, `/apply/thank-you` | Tasks 8, 9 |
| Routes `/login`, `/dashboard`, `/dashboard/[id]` | Tasks 6, 12, 13, 15 |
| API routes `/api/applications`, `/api/candidates`, `/api/candidates/[id]` | Tasks 11, 14, 16 |
| Components (form, list, detail, score-bar, outcome-chip) | Tasks 9, 10, 13, 15 |
| Data layer (`lib/airtable.ts`, `lib/schema.ts`) | Tasks 3, 4 |
| Auth (`lib/auth.ts`, middleware) | Tasks 5, 7 |
| Brand tokens, fonts | Task 2 |
| Error handling — Failed status, Pending Scoring, autosave race | Task 15 |
| Env vars, deploy | Task 17 |

**Placeholder scan:** none. Every code block is complete; every command is exact.

**Type consistency:** `CandidateRecord`, `Status`, `Outcome`, `ApplicationFormInput` are defined once in `lib/schema.ts` and imported everywhere; field name strings are used consistently between `lib/airtable.ts` (Airtable-side) and components (record-side).
