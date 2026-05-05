# Airtable Schema Reference — Residentas Candidate Pipeline

## How columns are populated

**Form fills in**: Name, Email, Location, Past Experience, Tools Used, AI Usage Example, Q1 Answer, Q2 Answer, Expected Pay, Hours Per Week. Submitted At is auto-populated by Airtable (Created time field) when the row is created.

**WF1 (n8n Score & Draft workflow) fills in**: Process Thinking Score, Practical Automation Score, Clarity Communication Score, Execution Logic Score, Reliability Awareness Score, Process Thinking Rationale, Practical Automation Rationale, Clarity Communication Rationale, Execution Logic Rationale, Reliability Awareness Rationale, Outcome, Drafted Email Subject, Drafted Email Body, and updates Status from `Pending Scoring` to `Pending Review` (or `Failed` on error).

**WF2 (n8n Send Email workflow) fills in**: Status (→ `Sent`), Sent At, and resets Send Triggered to unchecked. Sets Status to `Failed` and Last Error on error.

**Recruiter action fills in**: Send Triggered (via the dashboard's Send button), and optionally edits Drafted Email Subject and Drafted Email Body before sending.

---

## Candidates table

| Field name | Type | Notes |
|---|---|---|
| Name | Single line text | Primary field |
| Email | Email | |
| Submitted At | Created time | Auto-populated |
| Location | Single line text | |
| Past Experience | Long text | |
| Tools Used | Long text | |
| AI Usage Example | Long text | |
| Q1 Answer | Long text | |
| Q2 Answer | Long text | |
| Expected Pay | Single line text | |
| Hours Per Week | Single line text | |
| Process Thinking Score | Number (integer, precision 1) | Filled by WF1 |
| Practical Automation Score | Number (integer, precision 1) | Filled by WF1 |
| Clarity Communication Score | Number (integer, precision 1) | Filled by WF1 |
| Execution Logic Score | Number (integer, precision 1) | Filled by WF1 |
| Reliability Awareness Score | Number (integer, precision 1) | Filled by WF1 |
| Total Score | Formula | Formula: `{Process Thinking Score} + {Practical Automation Score} + {Clarity Communication Score} + {Execution Logic Score} + {Reliability Awareness Score}` |
| Process Thinking Rationale | Long text | Filled by WF1 |
| Practical Automation Rationale | Long text | Filled by WF1 |
| Clarity Communication Rationale | Long text | Filled by WF1 |
| Execution Logic Rationale | Long text | Filled by WF1 |
| Reliability Awareness Rationale | Long text | Filled by WF1 |
| Outcome | Single select | Options: `Advance`, `Review`, `Reject` |
| Drafted Email Subject | Single line text | Filled by WF1 |
| Drafted Email Body | Long text | Filled by WF1 |
| Status | Single select | Options: `Pending Scoring`, `Pending Review`, `Sent`, `Failed`. Default: `Pending Scoring` |
| Sent At | Date & time | Filled by WF2 |
| Last Error | Long text | Filled by WF1 or WF2 only on failure |
| Send Triggered | Checkbox | Used by the dashboard's Send button |

### Field setup notes

- **Status** default value must be set to `Pending Scoring` so new rows (from form submissions and manual entry) start in the correct state.
- **Total Score** is a Formula field — Airtable computes it automatically from the five score fields.
- **Submitted At** is a Created time field — Airtable populates it automatically; it is not editable.

---

## Templates table

| Field name | Type | Notes |
|---|---|---|
| Name | Single select | Primary field. Options: `advance`, `review`, `reject` |
| Subject | Single line text | |
| Body | Long text | Contains `{{name}}` and `{{personalized_line}}` placeholders |
| Updated At | Last modified time | |

### Seeded rows

The Templates table must have exactly three rows — one per outcome. WF1 looks up the row matching the candidate's outcome (lowercased) to render the email.

**Row: advance**
- Subject: `Next steps with your application — Residentas`
- Body:
```
Hi {{name}},

Thank you for your application.

{{personalized_line}}

We were impressed with your responses and would like to move you forward to the next stage. Someone from our team will be in touch shortly with scheduling details.

Best regards,
Residentas Hiring
```

**Row: review**
- Subject: `Update on your application — Residentas`
- Body:
```
Hi {{name}},

Thank you for your application.

{{personalized_line}}

We're reviewing your profile further and will get back to you with a decision shortly.

Best regards,
Residentas Hiring
```

**Row: reject**
- Subject: `Update on your application — Residentas`
- Body:
```
Hi {{name}},

Thank you for your application.

{{personalized_line}}

After review, we will not be moving forward at this stage. We wish you well in your search.

Best regards,
Residentas Hiring
```

**Verification:** Each body must contain exactly `{{name}}` and `{{personalized_line}}` (double curly braces, no spaces inside). WF1's `Render Email` code node does a literal `.replaceAll()` on these strings — typos will result in unreplaced placeholders in the sent email.
