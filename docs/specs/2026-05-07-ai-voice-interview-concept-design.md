# AI Voice Interview Concept — Design Spec

**Date:** 2026-05-07
**Status:** Concept / Demo-only
**Scope:** Static concept section added to `web/app/apply/thank-you/page.tsx`

---

## Summary

After the thank-you page confirms an application has been submitted, a static concept section shows the Residentas team (demo audience) what an AI-assisted voice interview step could look like in the hiring pipeline. No functionality is wired — this is a visual mockup and written spec embedded in the page itself.

---

## Context

The application form at `/apply` collects candidate information and writes to Airtable. The thank-you page (`/apply/thank-you`) currently shows three lines: "Application received", "Thank you", "We'll be in touch soon."

This spec adds a concept section below that text, visible to anyone who completes the demo form — primarily the Residentas team evaluating the hiring workflow.

---

## What the section communicates

The section is framed as **"What comes next · Concept"** — an innovation preview, not a live feature. It tells the Residentas team:

1. **The idea:** Shortlisted candidates complete a structured async voice interview before any human review. ElevenLabs voices the questions; candidates respond by speaking in the browser. No scheduling needed.

2. **The stack:** ElevenLabs (TTS for questions) · Claude (scores transcribed answers by dimension) · Airtable (scores sync back to candidate record) · n8n optional (orchestration).

3. **What the hiring team receives:** Score per dimension (Autonomy, Tool Fluency, Communication Clarity), AI-generated transcript and summary, hire/skip flag.

4. **The flow:** Shortlisted → invite sent → ElevenLabs voices question → candidate speaks (browser mic, recorded) → Claude scores + summarises → Airtable record updated.

5. **Sample questions** to make the concept concrete:
   - Q1 · Automation: "Walk me through a workflow you automated end-to-end. What broke first, and how did you fix it?"
   - Q2 · Cross-border ops: "You're handling an urgent payment for a client in a different timezone. Walk me through your process."
   - Q3 · AI usage: "Tell me about the last time you used AI to solve a real work problem. What was your prompt strategy?"
   - Q4 · Judgement: "A client asks you to do something that feels slightly off. How do you handle it without burning the relationship?"

---

## Layout

### Page structure (after existing Thank You content)

```
[Thank You — existing]
  "Application received"
  "Thank you"
  "We'll be in touch soon."

[Divider: "What comes next · Concept"]

[Three-panel spec card]
  Header: "AI-Assisted Voice Interview"  [Concept badge]  "ElevenLabs · Claude · Airtable"
  ┌─────────────┬─────────────┬─────────────┐
  │  Concept    │   Stack     │   Output    │
  │  (prose)    │  (bullets)  │  (scores)   │
  └─────────────┴─────────────┴─────────────┘
  [Flow diagram SVG: 5 steps, full width]

[Sample questions panel]
  2×2 grid: Q1 Automation · Q2 Cross-border · Q3 AI usage · Q4 Judgement
```

### Visual style

Matches the existing app dark theme: `#080808` background, `#e8e0d0` primary text, `#c8a26e` accent (gold), hairline borders `#2a2a2a`. All SVG diagrams inline. No external dependencies.

---

## Implementation notes

- **File to edit:** `web/app/apply/thank-you/page.tsx`
- **No new routes, no new components needed** — the entire section is self-contained JSX in the thank-you page.
- The flow diagram and any voice UI mockup illustrations are inline SVG.
- The "Concept" badge uses the existing accent color to signal this is a preview, not live.
- No interactivity, no API calls, no props — purely presentational.
- The section is visually separated from the thank-you text with a centered label divider so it reads as a distinct section.

---

## Out of scope

- Actual ElevenLabs integration
- Recording, transcription, or scoring logic
- Any Airtable writes from this page
- Candidate-facing copy (this is a team demo, not a live hiring flow)
