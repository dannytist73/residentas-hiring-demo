# Residentas Candidate Evaluation Workflow

A workflow that takes job applications, scores them with AI against a fixed rubric, drafts an outcome-appropriate email, and lets a recruiter send it from a dashboard with one click.

Built as the deliverable for the Residentas VA Automation Test.

## What you're looking at

- **Spec:** `docs/superpowers/specs/2026-05-06-residentas-mvp-design.md` — full design rationale.
- **Plan:** `docs/superpowers/plans/2026-05-06-residentas-mvp.md` — step-by-step implementation plan.
- **Demo video:** `demo/walkthrough.mp4` — 3–5 minute walkthrough.
- **n8n workflows:** `n8n/workflows/*.json` — importable into any n8n instance.
- **Airtable base template:** `airtable/base-template-link.txt` — shareable duplicate-base URL.
- **Sample candidates:** `samples/candidate-*.json` — three fixtures, one per outcome band.
- **Prompts:** `n8n/prompts/*.md` — the rubric scoring prompt and the personalized-line prompt, in plain English.

## How to reproduce

Estimated setup time: ~30 minutes if you have Airtable, Groq, and a Gmail account ready.

### Prerequisites
- Node.js 18+
- Airtable account (free tier is enough)
- Groq API key (free tier — `https://console.groq.com/keys`)
- Gmail account with 2FA enabled and an app password (`https://myaccount.google.com/apppasswords`)
- `cloudflared` installed (`winget install --id Cloudflare.cloudflared` on Windows; or any equivalent tunnel tool)

### Steps

1. **Duplicate the Airtable base** using the link in `airtable/base-template-link.txt`. If Automations/Interfaces did not copy over, follow `airtable/interface.md` and `airtable/automation.md` to recreate them.
2. **Generate an Airtable Personal Access Token** scoped to the duplicated base with read/write permissions.
3. **Start n8n locally:** `npx n8n` and open `http://localhost:5678`.
4. **Import the two workflow JSON files** from `n8n/workflows/` (Workflow → Import).
5. **Set up credentials in n8n** — Airtable token, Groq API key (HTTP Header Auth: `Bearer <key>`), Gmail SMTP (host `smtp.gmail.com`, port 587, app password). Wire them onto the imported workflows.
6. **Update the Airtable base ID** in both workflows' Airtable nodes to match your duplicated base.
7. **Start cloudflared:** `cloudflared tunnel --url http://localhost:5678`. Copy the `*.trycloudflare.com` URL.
8. **In Airtable**, open the `Send Email on Trigger` Automation and update the webhook URL to `<trycloudflare-url>/webhook/send-email`. Set the `X-Webhook-Token` header to match the token in your n8n WF2 webhook credential.
9. **Activate both n8n workflows** and the Airtable Automation.
10. **Submit a test application** through the form. Watch the row populate, open the dashboard, click Send, see the email arrive.

### Verifying it works

Submit each of the three sample candidates from `samples/`. Expected outcomes:
- `candidate-strong.json` → score 20–25, Advance email
- `candidate-borderline.json` → score 15–19, Review email
- `candidate-weak.json` → score 0–14, Reject email

## Reusing this for a different role or rubric

| You want to change... | You change... |
|---|---|
| The rubric | Edit the system prompt in WF1's `Groq - Score` node and rename/add columns in the Candidates table |
| Form fields | Add a field to the Airtable form view, drag/drop |
| Email wording | Edit the row directly in the Templates table |
| Score thresholds | Edit the `Parse Scores` Code node in WF1 |
| AI provider | Change the URL and credential on the two HTTP Request nodes — works with any OpenAI-compatible API |
| Email channel | Swap the n8n `Send Email` node for Outlook/SendGrid/etc. |
| Dashboard layout | Edit the Airtable Interface |

## Improvements for production

See `docs/superpowers/specs/2026-05-06-residentas-mvp-design.md` → "Improvements for production" for the full list. The biggest gaps are: queue-backed form submissions, an AI follow-up interview for borderline candidates, calibration set + drift monitoring on the rubric, and a custom Next.js dashboard with edit-before-send (Phase 2).

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