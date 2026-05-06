# Residentas Next.js Dashboard & Application Form — Design

**Date:** 2026-05-06
**Status:** Draft (pending user review)
**Owner:** Danny Ngipol
**Builds on:** `docs/superpowers/specs/2026-05-06-residentas-mvp-design.md` (Phase 2 — Custom Next.js dashboard)

---

## What this is

A branded Next.js application that becomes the **primary face** of the Residentas hiring workflow. It hosts:

1. A **public application form** at `/apply` — replaces the Airtable form view as the candidate-facing intake.
2. A **passcode-gated recruiter dashboard** at `/dashboard` — replaces the Airtable Interface as the recruiter-facing review tool.
3. A **per-candidate detail view** with a two-pane layout: AI analysis on the left, an editable drafted letter and Send button on the right.

The Airtable base, the n8n workflows (WF1 scoring, WF2 send), and the Airtable Automation that bridges the dashboard's Send action to WF2 — all unchanged. This app is a polished new front end on the existing backend.

---

## Why we're building it

The original MVP spec listed "Phase 2 — Custom Next.js dashboard" as a planned addition. The drivers:

- The Airtable Interface is functional but generic. A branded dashboard makes the demo feel like a real product, not an internal tool.
- A Next.js public form aligns with `residentas.com` (luxury rentals, sophisticated/minimal aesthetic) — Airtable's stock form view does not.
- The detail page becomes the "wow" screen: the recruiter sees the candidate's answers, the AI's per-criterion reasoning, and the drafted letter side by side. That's the visible payoff of the whole pipeline.

---

## How it fits together

```
                  ┌─────────────────────────────────────┐
                  │  Next.js app on Vercel              │
                  │  ─────────────────────────────────  │
   public ────►   │  /apply        public form         │
                  │  /login        passcode gate       │
   recruiter ──►  │  /dashboard    list + detail+send  │
                  └──────┬──────────────┬──────────────┘
                         │              │
              POST       │              │  GET / PATCH (server-side, with API key)
        new candidate    │              │
                         ▼              ▼
                  ┌─────────────────────────────────────┐
                  │  Airtable (existing base)           │
                  │  Candidates · Templates             │
                  │  Send Triggered checkbox            │
                  └──────┬──────────────────────────────┘
                         │  (existing chain — unchanged)
                         ▼
                  WF1 scoring → drafted email →
                  Automation watches `Send Triggered` → WF2 → Gmail
```

**The Send chain is unchanged.** Per `airtable/automation.md`, an Airtable Automation already watches the `Send Triggered = checked AND Status = Pending Review` condition and POSTs to WF2. The Next.js dashboard simply flips that checkbox via the Airtable API instead of via the Airtable Interface button.

---

## Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **Next.js is the primary face; Airtable surfaces are unused.** | Cleanest demo story. One branded experience end-to-end. The Airtable Interface still exists as an "engineer's view" if needed. |
| 2 | **Hosting on Vercel.** | Free tier, instant preview URLs, aligns with the project's existing Vercel-first tooling. |
| 3 | **Stack: Next.js 15 App Router · TypeScript · Tailwind · shadcn/ui.** | Standard modern Next.js. Server components for data, client components only where needed (form, polling list, letter editor). |
| 4 | **All Airtable calls are server-side.** | The Airtable API token never touches the browser. One module (`lib/airtable.ts`) is the only place that talks to Airtable — easy to swap, easy to test. |
| 5 | **Single shared passcode for the dashboard, not real auth.** | Demo-grade. The original MVP spec already lists real auth as a future improvement. A passcode adds the right amount of "real product" feel without making the reviewer create accounts. |
| 6 | **Server components fetch on every request + 30-second client polling on the list view.** | A hiring pipeline sees a few applications per day at most; polling is cheap and feels live. Webhooks-into-Vercel are not worth the infra. |
| 7 | **Send button → server PATCH `Send Triggered = true` in Airtable.** | Matches the existing automation chain exactly. The dashboard never directly POSTs to WF2 — Airtable owns the trigger logic. |
| 8 | **Letter edits autosave to Airtable (debounced PATCH on subject and body).** | If the recruiter steps away mid-edit, their work isn't lost. WF2 reads whatever's in Airtable at send time, so edits are honored automatically. |
| 9 | **Public form is single-page, sectioned (not a multi-step wizard).** | Matches the editorial / luxury brand of `residentas.com`. Wizards feel "tech survey." Candidates see the scope upfront. |
| 10 | **Detail page is two-pane (analysis left, letter right).** | The recruiter keeps the candidate's answers visible while reading or editing the letter. Best matches the "review and approve" workflow a real recruiter does. |
| 11 | **Brand: match `residentas.com`** — warm off-white background, ink-on-paper feel, restrained serif headings, sans-serif UI. | The site's aesthetic is luxury/minimalist. The dashboard inherits that, not generic SaaS blue. |

---

## Routes & screens

```
/                     marketing splash with "Apply now" CTA
/apply                public application form (single page, sectioned)
/apply/thank-you      confirmation screen after submit
/login                passcode gate
/dashboard            candidate list (auth-gated)
/dashboard/[id]       candidate detail, two-pane (auth-gated)
```

### `/apply` — public application form

Single scrollable page. Header is a quiet `RESIDENTAS · CAREERS` wordmark and the role title. Sections, each with an uppercase quiet label and serif body type:

1. **About you** — name, email, date of birth, gender, location
2. **Experience** — job tenure, past experience, cross-border finance experience, tools used, AI usage example
3. **Open questions** — Q1 and Q2 (long-form textareas, the answers that the AI scores against the rubric)
4. **Logistics** — currently employed, expected pay, hours per week, additional comments

Sticky **Submit** button at the bottom. Inline validation on blur (Zod schema on the server is the source of truth; the client mirrors a subset for UX). On submit: server action writes to Airtable (`Status = Pending Scoring`, all `From the form` fields populated), redirects to `/apply/thank-you` which says "We'll be in touch soon." Scoring runs silently in the background — the candidate doesn't see status.

### `/dashboard` — list view

- Top: `Residentas · Hiring` wordmark, total counts (`12 pending review · 4 sent · 1 failed`), filter chips (`All / Pending Review / Sent / Failed`).
- Editorial table: **Name · Submitted · Score · Outcome · Status**. Score formatted `22 / 25`. Outcome chip: ◯ Advance (ink border) · ◐ Review (muted gray) · ● Reject (thin red border, no fill).
- Default sort: newest first.
- Clicking a row navigates to `/dashboard/[id]`.
- Polling: a client component refetches the list every 30 seconds via `/api/candidates` so new applications appear without manual refresh.

### `/dashboard/[id]` — detail (two-pane)

**Left pane:**
- Header: candidate name, total score, outcome chip.
- *Original answers* section, all form fields rendered with quiet labels. Long answers expandable.
- *AI scores* section: 5 score rows. Each row = criterion name, the 0–5 number, a five-segment bar, and the AI's 1–2 sentence rationale beneath.

**Right pane:**
- *Drafted letter* with two editable inputs:
  - Subject (single-line input)
  - Body (multi-line textarea, monospaced-but-warm or serif body)
- Below the textarea: a small "Edits autosave" affordance. Keystrokes debounce 1.5s and PATCH to Airtable `Drafted Email Subject` / `Drafted Email Body`.
- Big **Send Email** button. Disabled when `Status !== Pending Review`. On click: PATCH `Send Triggered = true` (server-side); the existing Airtable Automation + WF2 chain takes over. UI shows "Sending…", then transitions to "Sent" once the next 30s poll picks up Airtable's status update.

**State variants** (same page, different render):
- `Status = Pending Scoring` — right pane hidden; shows "AI is still scoring this application…" with the original answers visible.
- `Status = Failed` — banner at the top with `Last Error`, plus a "Retry scoring" affordance (toggles a re-trigger field; small WF1 extension to be wired during implementation).
- `Status = Sent` — right pane is read-only; shows the sent letter, the `Sent At` timestamp, and a quiet "This email was sent on …" line.

### `/login` — passcode gate

Center-aligned card. Single passcode input. Sets a signed httpOnly cookie via server action. Redirects to `/dashboard` (or `next` query param if present). Wrong passcode → inline error. Session lasts 7 days.

---

## Components & data layer

```
app/
  page.tsx                     splash
  apply/page.tsx               public form (server component shell)
  apply/thank-you/page.tsx
  login/page.tsx
  dashboard/
    layout.tsx                 wordmark header, auth-gated
    page.tsx                   list view (server component + client polling)
    [id]/page.tsx              detail view
  api/
    applications/route.ts      POST: form → Airtable insert
    candidates/route.ts        GET: list (used by polling)
    candidates/[id]/route.ts   GET / PATCH (subject, body, send trigger)
middleware.ts                  protects /dashboard/*
lib/
  airtable.ts                  typed wrapper, single Airtable boundary
  auth.ts                      cookie sign / verify (HMAC)
  schema.ts                    Zod schemas for form + record shape
  brand.ts                     color tokens, font references
components/
  application-form.tsx
  candidate-list.tsx           polls every 30s
  candidate-detail.tsx         two-pane editor + send
  score-bar.tsx
  outcome-chip.tsx
  ui/*                         shadcn primitives
styles/
  globals.css                  Tailwind + brand tokens
```

### `lib/airtable.ts`

The only file that talks to the Airtable API. Exposes:
- `listCandidates(opts?: { status?: Status })` → `CandidateRecord[]`
- `getCandidate(id: string)` → `CandidateRecord | null`
- `createCandidate(data: ApplicationFormInput)` → `{ id: string }`
- `updateCandidateDraft(id, { subject?, body? })` → void
- `triggerSend(id: string)` → void  *(sets `Send Triggered = true`)*

Token is read from `AIRTABLE_API_KEY`; base ID from `AIRTABLE_BASE_ID`. All errors propagate as typed exceptions; route handlers map them to HTTP status codes.

### `lib/schema.ts` — Zod

- `ApplicationFormSchema`: shape of the public form, with sensible coercion (e.g., `expectedPay` is a number).
- `CandidateRecord`: shape of an Airtable row including AI-filled fields.
- All TypeScript types are inferred from these schemas — single source of truth.

### `middleware.ts`

Runs on every `/dashboard/*` request. Reads the `residentas_session` cookie, verifies HMAC against `AUTH_SECRET`, redirects to `/login?next=...` if missing or invalid. Cookie is httpOnly, secure, sameSite=lax, 7-day expiry.

### Brand tokens

Defined in `lib/brand.ts` and surfaced as Tailwind theme extensions:

| Token | Value |
|---|---|
| `bg` | `#fafaf7` (warm off-white) |
| `surface` | `#ffffff` |
| `ink` | `#1a1a1a` |
| `muted` | `#888888` |
| `hairline` | `#e5e2dc` |
| `accent-reject` | `#7a1f1f` (thin border only, no fill) |

Display type: a serif via `next/font` (Cormorant Garamond or similar) for headings and the letter body. UI labels and form fields: Inter (sans-serif).

---

## Error handling and edge cases

### Form submission

| Case | Behavior |
|---|---|
| Validation fails (server-side Zod) | 400 with field errors → form re-renders with inline messages |
| Airtable insert fails | 500 → generic "Something went wrong, please try again" message; full error logged server-side; no infra details leak to the candidate |
| Insert succeeds | Redirect to `/apply/thank-you`; scoring happens silently; candidate sees no "Pending Scoring" |

### Dashboard data

| Case | Behavior |
|---|---|
| Airtable read fails (list) | Quiet "Could not load candidates — retrying" banner; polling keeps trying |
| Airtable read fails (detail) | Inline error in the affected pane; no full-page crash |
| Row exists but `Status = Pending Scoring` | Detail page shows "AI is still scoring…" with original answers visible; right pane hidden |
| Row has `Status = Failed` | Banner with `Last Error`; "Retry scoring" affordance |
| Polling pulls fresher row while user is mid-edit | Local textarea is "dirty" — poll updates everything *except* subject and body while dirty; on save (autosave or Send), local edits PATCH up |

### Send safety

- Button disabled when `Status !== Pending Review`.
- Optimistic UI: button shows "Sending…" instantly; PATCH failure reverts and toasts.
- No client-side double-fire risk: `Send Triggered` already acts as a server-side lock per existing automation.

### Auth edges

- Wrong passcode → 401, inline error.
- Cookie tampered or expired → redirect to `/login?next=...` so recruiter returns to the page they wanted.
- Logout link in header clears the cookie.

---

## Deliberately out of scope (and why)

- **Multi-user accounts / roles** — single passcode is enough for the demo. Real auth is in the original MVP spec's "production improvements."
- **Real-time via webhooks/SSE** — 30-second polling is plenty for a low-volume hiring pipeline.
- **Resume uploads (PDF/DOCX)** — the rubric scores written answers, not resumes.
- **Bulk actions on candidates** — defeats the human-in-the-loop value proposition.
- **Server-side analytics dashboards / charts** — not what the brief grades.
- **HTML email previews in the dashboard** — emails are plain-text; rendering them as plain-text in a `<pre>`-like element matches reality.
- **Translations** — English-only for the MVP; flagged in the original MVP spec's improvements list.

---

## Production improvements (deferred)

- **Real auth** via Clerk (Vercel Marketplace) — replaces the passcode.
- **Rate-limit the `/login` POST** to defeat brute-force passcode attempts.
- **Replace polling with Airtable webhooks → Next.js route → cache revalidation** for instant updates.
- **Audit log** — every Send click recorded with timestamp, recruiter (once real auth lands), and IP.
- **`Settings` table in Airtable** — outcome thresholds, dashboard branding, role copy editable without a redeploy.
- **Multi-job support** — `Jobs` table, each with its own rubric, fields, and templates; `/apply/[job-slug]` routes.
- **Accessibility audit** — keyboard nav, screen readers, contrast — particularly on `/apply`.
- **Tagalog translations** — given the candidate base hinted at in the original spec.

---

## Environment variables

| Variable | Purpose |
|---|---|
| `AIRTABLE_API_KEY` | Server-side Airtable token (Personal Access Token with Candidates and Templates table scopes) |
| `AIRTABLE_BASE_ID` | The same base used by WF1 and WF2 |
| `DASHBOARD_PASSCODE` | The single shared passcode for `/login` |
| `AUTH_SECRET` | HMAC secret for the session cookie (64-char random) |
| `NEXT_PUBLIC_BRAND_ROLE_TITLE` | Role title shown on `/apply` (e.g., "Operations Associate") — non-secret, readable in client |

All set in Vercel project env (Production + Preview). `.env.local` for local dev.

---

## Delivery

| Artifact | Location |
|---|---|
| This spec | `docs/superpowers/specs/2026-05-06-nextjs-dashboard-design.md` |
| Implementation plan | `docs/superpowers/plans/2026-05-06-nextjs-dashboard.md` (next step) |
| Source code | new top-level `web/` directory in the same repo (alongside `airtable/`, `n8n/`) |
| Production URL | Vercel deployment, linked in `README.md` after first deploy |
| Demo video | extends the existing `demo/walkthrough.mp4` to include the Next.js front end |
