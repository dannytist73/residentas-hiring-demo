# airtable/setup.ps1
# Creates the full Residentas Candidate Pipeline base in Airtable via the REST API.
#
# Requirements:
#   - A Personal Access Token with scopes:
#       schema.bases:write   (to create the base + tables + fields)
#       data.records:write   (to seed the Templates rows)
#
# Usage:
#   .\airtable\setup.ps1
#
# The script will prompt for your token (hidden input) and workspace ID,
# then print the new base ID and URL when done.

param(
    [string]$Token = $env:AIRTABLE_TOKEN,
    [string]$WorkspaceId = $env:AIRTABLE_WORKSPACE_ID
)

$ErrorActionPreference = "Stop"

# ── 1. Credentials ────────────────────────────────────────────────────────────

if (-not $Token) {
    $secure = Read-Host "Airtable PAT (schema.bases:write + data.records:write)" -AsSecureString
    $Token  = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
                  [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
}

if (-not $WorkspaceId) {
    Write-Host ""
    Write-Host "Workspace ID: open airtable.com, click your workspace name," -ForegroundColor DarkGray
    Write-Host "then read the URL: https://airtable.com/wsXXXXXXXX" -ForegroundColor DarkGray
    Write-Host ""
    $WorkspaceId = Read-Host "Workspace ID (starts with 'ws')"
}

$headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type"  = "application/json"
}

# ── 2. Field definitions ───────────────────────────────────────────────────────

$dtOptions = @{
    dateFormat = @{ name = "local" }
    timeFormat = @{ name = "12hour" }
    timeZone   = "client"
}

$candidatesFields = @(
    @{ name = "Name";                         type = "singleLineText" }
    @{ name = "Email";                        type = "email" }
    @{ name = "Submitted At";                 type = "createdTime";
       options = @{ result = @{ type = "dateTime"; options = $dtOptions } } }
    @{ name = "Location";                     type = "singleLineText" }
    @{ name = "Past Experience";              type = "multilineText" }
    @{ name = "Tools Used";                   type = "multilineText" }
    @{ name = "AI Usage Example";             type = "multilineText" }
    @{ name = "Q1 Answer";                    type = "multilineText" }
    @{ name = "Q2 Answer";                    type = "multilineText" }
    @{ name = "Expected Pay";                 type = "singleLineText" }
    @{ name = "Hours Per Week";               type = "singleLineText" }
    @{ name = "Process Thinking Score";       type = "number"; options = @{ precision = 0 } }
    @{ name = "Practical Automation Score";   type = "number"; options = @{ precision = 0 } }
    @{ name = "Clarity Communication Score";  type = "number"; options = @{ precision = 0 } }
    @{ name = "Execution Logic Score";        type = "number"; options = @{ precision = 0 } }
    @{ name = "Reliability Awareness Score";  type = "number"; options = @{ precision = 0 } }
    @{ name = "Total Score";                  type = "formula";
       options = @{ formula = "{Process Thinking Score}+{Practical Automation Score}+{Clarity Communication Score}+{Execution Logic Score}+{Reliability Awareness Score}" } }
    @{ name = "Process Thinking Rationale";   type = "multilineText" }
    @{ name = "Practical Automation Rationale"; type = "multilineText" }
    @{ name = "Clarity Communication Rationale"; type = "multilineText" }
    @{ name = "Execution Logic Rationale";    type = "multilineText" }
    @{ name = "Reliability Awareness Rationale"; type = "multilineText" }
    @{ name = "Outcome";    type = "singleSelect";
       options = @{ choices = @(@{ name = "Advance" }, @{ name = "Review" }, @{ name = "Reject" }) } }
    @{ name = "Drafted Email Subject";        type = "singleLineText" }
    @{ name = "Drafted Email Body";           type = "multilineText" }
    @{ name = "Status";     type = "singleSelect";
       options = @{ choices = @(
           @{ name = "Pending Scoring" }
           @{ name = "Pending Review" }
           @{ name = "Sent" }
           @{ name = "Failed" }
       )}}
    @{ name = "Sent At";    type = "dateTime"; options = $dtOptions }
    @{ name = "Last Error"; type = "multilineText" }
    @{ name = "Send Triggered"; type = "checkbox";
       options = @{ icon = "check"; color = "greenBright" } }
)

$templatesFields = @(
    @{ name = "Name";       type = "singleLineText" }
    @{ name = "Subject";    type = "singleLineText" }
    @{ name = "Body";       type = "multilineText" }
    @{ name = "Updated At"; type = "lastModifiedTime";
       options = @{
           isValid            = $true
           referencedFieldIds = $null
           result             = @{ type = "dateTime"; options = $dtOptions }
       }}
)

# ── 3. Create base ─────────────────────────────────────────────────────────────

Write-Host "Creating base 'Residentas Candidate Pipeline'..." -ForegroundColor Cyan

$basePayload = @{
    name        = "Residentas Candidate Pipeline"
    workspaceId = $WorkspaceId
    tables      = @(
        @{ name = "Candidates"; fields = $candidatesFields }
        @{ name = "Templates";  fields = $templatesFields  }
    )
} | ConvertTo-Json -Depth 20

try {
    $base = Invoke-RestMethod -Method Post `
        -Uri "https://api.airtable.com/v0/meta/bases" `
        -Headers $headers -Body $basePayload
} catch {
    Write-Host "Base creation failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
    exit 1
}

$baseId         = $base.id
$templatesTable = $base.tables | Where-Object { $_.name -eq "Templates" }
$templatesId    = $templatesTable.id

Write-Host "Base created: $baseId" -ForegroundColor Green

# ── 4. Seed Templates ──────────────────────────────────────────────────────────

Write-Host "Seeding Templates table..." -ForegroundColor Cyan

$advanceBody = "Hi {{name}},`n`nThank you for your application.`n`n{{personalized_line}}`n`nWe were impressed with your responses and would like to move you forward to the next stage. Someone from our team will be in touch shortly with scheduling details.`n`nBest regards,`nResidentas Hiring"
$reviewBody  = "Hi {{name}},`n`nThank you for your application.`n`n{{personalized_line}}`n`nWe're reviewing your profile further and will get back to you with a decision shortly.`n`nBest regards,`nResidentas Hiring"
$rejectBody  = "Hi {{name}},`n`nThank you for your application.`n`n{{personalized_line}}`n`nAfter review, we will not be moving forward at this stage. We wish you well in your search.`n`nBest regards,`nResidentas Hiring"

$seedPayload = @{
    records = @(
        @{ fields = @{ Name = "advance"; Subject = "Next steps with your application — Residentas"; Body = $advanceBody } }
        @{ fields = @{ Name = "review";  Subject = "Update on your application — Residentas";       Body = $reviewBody  } }
        @{ fields = @{ Name = "reject";  Subject = "Update on your application — Residentas";       Body = $rejectBody  } }
    )
} | ConvertTo-Json -Depth 10

try {
    $seed = Invoke-RestMethod -Method Post `
        -Uri "https://api.airtable.com/v0/$baseId/$templatesId" `
        -Headers $headers -Body $seedPayload
    Write-Host "Templates seeded: $($seed.records.Count) rows" -ForegroundColor Green
} catch {
    Write-Host "Seeding failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
    Write-Host "Base was created — seed the Templates table manually." -ForegroundColor Yellow
}

# ── 5. Done ────────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "════════════════════════════════════" -ForegroundColor Green
Write-Host " DONE" -ForegroundColor Green
Write-Host "════════════════════════════════════" -ForegroundColor Green
Write-Host " Base ID : $baseId"
Write-Host " URL     : https://airtable.com/$baseId"
Write-Host ""
Write-Host "NEXT: Set the Status field default to 'Pending Scoring'" -ForegroundColor Yellow
Write-Host "  Candidates table → Status field → click gear icon → Default value → Pending Scoring" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Save the Base ID — you will need it when configuring n8n." -ForegroundColor Cyan
