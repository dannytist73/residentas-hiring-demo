# Recruiter Dashboard — Airtable Interface Layout

## Overview

The Recruiter Dashboard is an Airtable Interface (not a standard grid/gallery view) built on the Candidates table. It uses the "Record Review" template as a starting point: a list of records on the left, a detail pane on the right.

---

## List view (left panel)

**Source table:** Candidates

**Display fields:** Name, Email, Total Score, Outcome, Status, Submitted At

**Sort:** Submitted At descending (newest first)

**Default filter:** Status is `Pending Review` — this is the recruiter's inbox. Candidates that haven't been scored yet (Pending Scoring) or have already been sent don't appear by default.

**Filter chips at the top of the list (allow switching views):**
- All
- Pending Review
- Sent
- Failed

The filter chips are implemented as Interface filter controls linked to the Status field.

---

## Detail view (right panel)

When a recruiter clicks a row in the list, the right pane shows the full candidate record organized into 5 sections:

### Section 1 — Candidate's original answers (collapsible)

Fields shown: Name, Email, Location, Past Experience, Tools Used, AI Usage Example, Q1 Answer, Q2 Answer, Expected Pay, Hours Per Week.

This section is collapsible so the recruiter can hide it once they've read the answers and focus on the scoring and email sections.

### Section 2 — AI Scoring

Fields shown:
- Total Score (displayed large/prominently)
- Outcome (single-select badge — color-coded: Advance=green, Review=yellow, Reject=red)
- Five score+rationale pairs in vertical order:
  1. Process Thinking Score + Process Thinking Rationale
  2. Practical Automation Score + Practical Automation Rationale
  3. Clarity Communication Score + Clarity Communication Rationale
  4. Execution Logic Score + Execution Logic Rationale
  5. Reliability Awareness Score + Reliability Awareness Rationale

Each rationale is displayed directly below its score so the recruiter can read the AI's reasoning without scrolling to a separate section.

### Section 3 — Drafted Email (editable)

Fields shown:
- Drafted Email Subject — editable text input
- Drafted Email Body — editable text area

Both fields are editable in the Interface. The recruiter can modify the subject or body before clicking Send. WF2 reads the current field values at send time, so edits are preserved.

### Section 4 — Send action

A **Send Email** button with these properties:
- Label: `Send Email`
- Style: primary / filled (blue button)
- Visibility condition: `Status = Pending Review` (button only appears for candidates who haven't been sent yet)
- Action: Update record → set `Send Triggered` to checked

Clicking this button checks the `Send Triggered` checkbox on the record, which triggers the Airtable Automation (`Send Email on Trigger`) that fires WF2 via webhook.

Why two-step (button → checkbox → automation → webhook): Airtable Interface buttons cannot directly POST to webhooks. They can update fields. The checkbox flip is the cleanest bridge to an Airtable Automation trigger, and it gives us a clean audit field.

### Section 5 — Audit info

Fields shown: Status, Submitted At, Sent At, Last Error.

Status shows the current state of the candidate (Pending Scoring / Pending Review / Sent / Failed). Last Error is only populated on failure and helps the recruiter understand what went wrong.

---

## Recreating the Interface from scratch

If the Airtable base template link doesn't preserve Interfaces:

1. In the base, click **Interfaces** → **New interface**.
2. Choose the **Record Review** template.
3. Set source to the **Candidates** table.
4. Configure the list panel per the "List view" section above.
5. Configure the detail panel per the "Detail view" sections above.
6. Add the Send Email button in Section 4 (Buttons → Update record → Send Triggered = checked).
7. Set the button visibility condition to `Status = Pending Review`.
