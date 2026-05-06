# airtable/setup.ps1
# Builds the Residentas Candidate Pipeline tables inside an existing Airtable base.
#
# Requirements:
#   - A Personal Access Token with scopes:
#       schema.bases:write   (to create tables + fields)
#       data.records:write   (to seed the Templates rows)
#   - An existing empty Airtable base (create one manually, then run this script)
#
# Usage:
#   .\airtable\setup.ps1

param(
    [string]$Token  = $env:AIRTABLE_TOKEN,
    [string]$BaseId = $env:AIRTABLE_BASE_ID
)

$ErrorActionPreference = "Stop"

# --- 1. Credentials -----------------------------------------------------------

if (-not $Token) {
    $secure = Read-Host "Airtable PAT (schema.bases:write + data.records:write)" -AsSecureString
    $Token  = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
                  [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
}

if (-not $BaseId) {
    Write-Host ""
    Write-Host "Open your Airtable base - the URL looks like:" -ForegroundColor DarkGray
    Write-Host "  https://airtable.com/appXXXXXXXXXXXXXX/..." -ForegroundColor DarkGray
    Write-Host "Copy the 'appXXXXXXXXXXXXXX' part." -ForegroundColor DarkGray
    Write-Host ""
    $BaseId = Read-Host "Base ID (starts with 'app')"
}

$headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type"  = "application/json"
}

function Invoke-AT ($Method, $Path, $Body = $null) {
    $params = @{
        Method  = $Method
        Uri     = "https://api.airtable.com/v0/meta/bases/$BaseId/$Path"
        Headers = $headers
    }
    if ($Body) { $params.Body = ($Body | ConvertTo-Json -Depth 20) }
    try {
        return Invoke-RestMethod @params
    } catch {
        Write-Host "API error on $Method $Path`: $($_.ErrorDetails.Message)" -ForegroundColor Red
        throw
    }
}

function Add-Field ($TableId, $FieldDef) {
    Invoke-AT "POST" "tables/$TableId/fields" $FieldDef | Out-Null
}

# --- 2. Shared options --------------------------------------------------------

$dt = @{
    dateFormat = @{ name = "local" }
    timeFormat = @{ name = "12hour" }
    timeZone   = "client"
}

# --- 3. Create Candidates table (no formula fields yet) -----------------------

Write-Host "Creating Candidates table..." -ForegroundColor Cyan

$candidatesResp = Invoke-AT "POST" "tables" @{
    name   = "Candidates"
    fields = @(
        @{ name = "Name";  type = "singleLineText" }
    )
}
$candId = $candidatesResp.id
Write-Host "  Candidates table: $candId" -ForegroundColor Green

# Add fields one by one (avoids formula-at-creation restriction)
$candidateFields = @(
    @{ name = "Email";                           type = "email" }
    # Submitted At (createdTime) must be added manually in Airtable UI
    @{ name = "Location";                        type = "singleLineText" }
    @{ name = "Past Experience";                 type = "multilineText" }
    @{ name = "Tools Used";                      type = "multilineText" }
    @{ name = "AI Usage Example";                type = "multilineText" }
    @{ name = "Q1 Answer";                       type = "multilineText" }
    @{ name = "Q2 Answer";                       type = "multilineText" }
    @{ name = "Expected Pay";                    type = "singleLineText" }
    @{ name = "Hours Per Week";                  type = "singleLineText" }
    @{ name = "Process Thinking Score";          type = "number"; options = @{ precision = 0 } }
    @{ name = "Practical Automation Score";      type = "number"; options = @{ precision = 0 } }
    @{ name = "Clarity Communication Score";     type = "number"; options = @{ precision = 0 } }
    @{ name = "Execution Logic Score";           type = "number"; options = @{ precision = 0 } }
    @{ name = "Reliability Awareness Score";     type = "number"; options = @{ precision = 0 } }
    @{ name = "Process Thinking Rationale";      type = "multilineText" }
    @{ name = "Practical Automation Rationale";  type = "multilineText" }
    @{ name = "Clarity Communication Rationale"; type = "multilineText" }
    @{ name = "Execution Logic Rationale";       type = "multilineText" }
    @{ name = "Reliability Awareness Rationale"; type = "multilineText" }
    @{ name = "Outcome"; type = "singleSelect";
       options = @{ choices = @(@{ name = "Advance" }, @{ name = "Review" }, @{ name = "Reject" }) } }
    @{ name = "Drafted Email Subject";           type = "singleLineText" }
    @{ name = "Drafted Email Body";              type = "multilineText" }
    @{ name = "Status"; type = "singleSelect";
       options = @{ choices = @(
           @{ name = "Pending Scoring" }
           @{ name = "Pending Review" }
           @{ name = "Sent" }
           @{ name = "Failed" }
       )}}
    @{ name = "Sent At";        type = "dateTime";      options = $dt }
    @{ name = "Last Error";     type = "multilineText" }
    @{ name = "Send Triggered"; type = "checkbox";
       options = @{ icon = "check"; color = "greenBright" } }
)

foreach ($f in $candidateFields) {
    Write-Host "  + $($f.name)" -ForegroundColor DarkGray
    Add-Field $candId $f
}

# Add Total Score formula last (all score fields must exist first)
Write-Host "  + Total Score (formula)" -ForegroundColor DarkGray
Add-Field $candId @{
    name    = "Total Score"
    type    = "formula"
    options = @{
        formula = "{Process Thinking Score}+{Practical Automation Score}+{Clarity Communication Score}+{Execution Logic Score}+{Reliability Awareness Score}"
    }
}

Write-Host "Candidates table complete." -ForegroundColor Green

# --- 4. Create Templates table ------------------------------------------------

Write-Host "Creating Templates table..." -ForegroundColor Cyan

$templatesResp = Invoke-AT "POST" "tables" @{
    name   = "Templates"
    fields = @(
        @{ name = "Name"; type = "singleLineText" }
    )
}
$tplId = $templatesResp.id
Write-Host "  Templates table: $tplId" -ForegroundColor Green

$templateFields = @(
    @{ name = "Subject";    type = "singleLineText" }
    @{ name = "Body";       type = "multilineText" }
    # Updated At (lastModifiedTime) must be added manually in Airtable UI
)

foreach ($f in $templateFields) {
    Write-Host "  + $($f.name)" -ForegroundColor DarkGray
    Add-Field $tplId $f
}

Write-Host "Templates table complete." -ForegroundColor Green

# --- 5. Seed Templates --------------------------------------------------------

Write-Host "Seeding Templates rows..." -ForegroundColor Cyan

$ab = "Hi {{name}},`n`nThank you for your application.`n`n{{personalized_line}}`n`nWe were impressed with your responses and would like to move you forward to the next stage. Someone from our team will be in touch shortly with scheduling details.`n`nBest regards,`nResidentas Hiring"
$rb = "Hi {{name}},`n`nThank you for your application.`n`n{{personalized_line}}`n`nWe're reviewing your profile further and will get back to you with a decision shortly.`n`nBest regards,`nResidentas Hiring"
$xb = "Hi {{name}},`n`nThank you for your application.`n`n{{personalized_line}}`n`nAfter review, we will not be moving forward at this stage. We wish you well in your search.`n`nBest regards,`nResidentas Hiring"

$seedPayload = @{
    records = @(
        @{ fields = @{ Name = "advance"; Subject = "Next steps with your application - Residentas"; Body = $ab } }
        @{ fields = @{ Name = "review";  Subject = "Update on your application - Residentas";       Body = $rb } }
        @{ fields = @{ Name = "reject";  Subject = "Update on your application - Residentas";       Body = $xb } }
    )
} | ConvertTo-Json -Depth 10

try {
    $seed = Invoke-RestMethod -Method Post `
        -Uri "https://api.airtable.com/v0/$BaseId/$tplId" `
        -Headers $headers -Body $seedPayload
    Write-Host "Seeded $($seed.records.Count) template rows." -ForegroundColor Green
} catch {
    Write-Host "Seeding failed: $($_.ErrorDetails.Message)" -ForegroundColor Red
    Write-Host "Add the 3 template rows manually in Airtable." -ForegroundColor Yellow
}

# --- 6. Done ------------------------------------------------------------------

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host " DONE" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host " Base ID : $BaseId"
Write-Host " URL     : https://airtable.com/$BaseId"
Write-Host ""
Write-Host "MANUAL STEPS STILL NEEDED:" -ForegroundColor Yellow
Write-Host "  1. Candidates table -> '+' Add field -> 'Created time' -> name it 'Submitted At' -> Save"
Write-Host "  2. Templates table  -> '+' Add field -> 'Last modified time' -> name it 'Updated At' -> Save"
Write-Host "  3. Candidates -> Status field -> Edit field -> set Default value to 'Pending Scoring'"
Write-Host "  4. Create a Form view on Candidates and hide all AI/score/status fields"
Write-Host "  5. Save the Base ID above - you will need it in n8n"
