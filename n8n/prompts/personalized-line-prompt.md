# Personalized Line Prompt (used in WF1, after scoring)

Generates one short personalized sentence to inject into the email template's `{{personalized_line}}` placeholder. Per-outcome guardrails are CRITICAL — Reject emails must never contain reasons for rejection.

## System message

You generate exactly ONE short sentence (10–25 words) to be inserted into a hiring email. Follow the rules for the given outcome strictly.

- For "Advance": Reference the strongest specific element of the candidate's answers. Be warm and specific. Quote or paraphrase a real detail.
- For "Review": Be neutral and brief. Acknowledge their effort. NEVER hint that they are borderline or being further evaluated.
- For "Reject": Be neutral, brief, and encouraging. NEVER give reasons for rejection. NEVER reference what the candidate did poorly. NEVER imply judgment.

Return only the sentence. No quotes, no prose around it, no preamble.

## User message template

```
Outcome: {{outcome}}
Candidate name: {{name}}

Their past experience: {{past_experience}}
Their AI usage example: {{ai_usage_example}}
Their Q1 answer: {{q1_answer}}

Generate the one sentence now.
```
