# Send Button → Webhook Chain

## Overview

The Send flow is a two-step chain:

1. **Recruiter clicks "Send Email"** in the Recruiter Dashboard Interface.
2. **The button updates the record**: sets `Send Triggered` = checked.
3. **Airtable Automation fires**: watches for `Send Triggered = checked AND Status = Pending Review`.
4. **Automation sends a webhook POST** to WF2 (n8n) with the record ID.
5. **WF2 sends the email** via Gmail SMTP and updates `Status` → `Sent`.

---

## Airtable Automation: "Send Email on Trigger"

**Trigger:** When record matches conditions
- Table: Candidates
- Conditions:
  - `Send Triggered` = checked
  - `Status` = `Pending Review`

**Action:** Send webhook
- Method: `POST`
- URL: `https://<your-trycloudflare-domain>/webhook/send-email`
  *(Replace with your actual trycloudflare.com URL — see "How to start the tunnel" below)*
- Headers:
  - `X-Webhook-Token`: `<your-webhook-token>` (same value as in n8n WF2's webhook credential)
  - `Content-Type`: `application/json`
- Body:
  ```json
  { "recordId": "{{recordId}}" }
  ```
  where `{{recordId}}` is the triggering record's Airtable record ID (input variable).

**Input variable:** `recordId` = the triggering record's ID (set up in the automation's Input Variables tab).

---

## Why the two-step pattern

Airtable Interface buttons can update fields but cannot directly POST to external webhooks. The checkbox flip bridges the button to an Airtable Automation, which can POST to webhooks. The `Send Triggered` field also acts as a send-lock: WF2 resets it to unchecked after a successful send, and the automation's condition (`Status = Pending Review`) prevents double-fires if something flips the checkbox on an already-Sent row.

---

## How to start the tunnel

The WF2 webhook runs on your local n8n instance (localhost:5678). Airtable's automation servers can't reach localhost. We use `cloudflared` to expose a temporary public URL.

### Prerequisites

Install cloudflared on Windows:
```powershell
winget install --id Cloudflare.cloudflared
```

Verify:
```powershell
cloudflared --version
```

### Starting the tunnel

In a separate PowerShell window (keep it running for the entire demo session):
```powershell
cloudflared tunnel --url http://localhost:5678
```

Look for output like:
```
Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):
https://random-words-here.trycloudflare.com
```

Copy the full `https://...trycloudflare.com` URL.

**Important:** This URL changes every time you restart the tunnel. After restarting:
1. Copy the new URL.
2. Open the `Send Email on Trigger` Automation in Airtable.
3. Update the webhook URL to `<new-url>/webhook/send-email`.

### For production

Replace the ephemeral tunnel with a named Cloudflare Tunnel (requires a Cloudflare account) for a stable URL. See Cloudflare Tunnel docs for setup. Alternatively, deploy n8n to a cloud host (Railway, Render, or Hetzner) to eliminate the tunnel entirely.

---

## Webhook authentication

The n8n WF2 webhook node uses HTTP Header Auth (`X-Webhook-Token`). The token is set in n8n's Credential: `Residentas Webhook Auth`. The Airtable Automation must send the same token in the `X-Webhook-Token` header, otherwise n8n returns 401 and the automation logs a failure.

To generate a token: `openssl rand -hex 32` or any 64-character random string.

---

## Recreating the Automation from scratch

If the Airtable base template link doesn't preserve Automations:

1. In the base, click **Automations** → **Create automation**.
2. Name it `Send Email on Trigger`.
3. **Trigger:** "When record matches conditions" → Table: Candidates → Conditions: Send Triggered = checked AND Status = Pending Review.
4. **Action:** "Send Webhook" → fill in URL, headers, and body per the specification above.
5. **Input variables:** Add `recordId` mapped to the triggering record's ID.
6. **Activate** the automation.
