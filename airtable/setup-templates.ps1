# airtable/setup-templates.ps1
# Creates (or reuses) the Templates table and seeds the 3 template rows.
#
# Requirements:
#   - A Personal Access Token with scopes:
#       schema.bases:write   (to create table + fields if missing)
#       data.records:write   (to create/update template rows)
#       data.records:read    (to check existing rows by Name)
#   - An existing Airtable base
#
# Usage:
#   .\airtable\setup-templates.ps1

param(
    [string]$Token  = $env:AIRTABLE_TOKEN,
    [string]$BaseId = $env:AIRTABLE_BASE_ID
)

$ErrorActionPreference = "Stop"

# --- 1. Credentials -----------------------------------------------------------

if (-not $Token) {
    $secure = Read-Host "Airtable PAT (schema.bases:write + data.records:read/write)" -AsSecureString
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

function Invoke-MetaAT ($Method, $Path, $Body = $null) {
    $params = @{
        Method  = $Method
        Uri     = "https://api.airtable.com/v0/meta/bases/$BaseId/$Path"
        Headers = $headers
    }
    if ($Body) { $params.Body = ($Body | ConvertTo-Json -Depth 20) }
    try {
        return Invoke-RestMethod @params
    } catch {
        Write-Host "Meta API error on $Method $Path`: $($_.ErrorDetails.Message)" -ForegroundColor Red
        throw
    }
}

function Invoke-DataAT ($Method, $Path, $Body = $null) {
    $params = @{
        Method  = $Method
        Uri     = "https://api.airtable.com/v0/$BaseId/$Path"
        Headers = $headers
    }
    if ($Body) { $params.Body = ($Body | ConvertTo-Json -Depth 20) }
    try {
        return Invoke-RestMethod @params
    } catch {
        Write-Host "Data API error on $Method $Path`: $($_.ErrorDetails.Message)" -ForegroundColor Red
        throw
    }
}

function Add-Field ($TableId, $FieldDef) {
    Invoke-MetaAT "POST" "tables/$TableId/fields" $FieldDef | Out-Null
}

# --- 2. Ensure Templates table exists ----------------------------------------

Write-Host "Ensuring Templates table exists..." -ForegroundColor Cyan
$tablesResp = Invoke-MetaAT "GET" "tables"
$templatesTable = $tablesResp.tables | Where-Object { $_.name -eq "Templates" } | Select-Object -First 1

if (-not $templatesTable) {
    Write-Host "Templates table not found. Creating..." -ForegroundColor DarkGray
    $createResp = Invoke-MetaAT "POST" "tables" @{
        name   = "Templates"
        fields = @(
            @{ name = "Name"; type = "singleLineText" }
        )
    }
    $tplId = $createResp.id
} else {
    $tplId = $templatesTable.id
    Write-Host "Templates table found: $tplId" -ForegroundColor Green
}

# Ensure Subject + Body fields exist
$tablesResp = Invoke-MetaAT "GET" "tables"
$templatesTable = $tablesResp.tables | Where-Object { $_.id -eq $tplId } | Select-Object -First 1
$fieldNames = @($templatesTable.fields.name)

if ($fieldNames -notcontains "Subject") {
    Write-Host "  + Adding missing field: Subject" -ForegroundColor DarkGray
    Add-Field $tplId @{ name = "Subject"; type = "singleLineText" }
}
if ($fieldNames -notcontains "Body") {
    Write-Host "  + Adding missing field: Body" -ForegroundColor DarkGray
    Add-Field $tplId @{ name = "Body"; type = "multilineText" }
}

# --- 3. Upsert template rows --------------------------------------------------

Write-Host "Seeding/updating Templates rows..." -ForegroundColor Cyan

$ab = "Hi {{name}},`n`nThank you for your application.`n`n{{personalized_line}}`n`nWe were impressed with your responses and would like to move you forward to the next stage. Someone from our team will be in touch shortly with scheduling details.`n`nBest regards,`nResidentas Hiring"
$rb = "Hi {{name}},`n`nThank you for your application.`n`n{{personalized_line}}`n`nWe're reviewing your profile further and will get back to you with a decision shortly.`n`nBest regards,`nResidentas Hiring"
$xb = "Hi {{name}},`n`nThank you for your application.`n`n{{personalized_line}}`n`nAfter review, we will not be moving forward at this stage. We wish you well in your search.`n`nBest regards,`nResidentas Hiring"

$desiredRows = @(
    @{ Name = "advance"; Subject = "Next steps with your application - Residentas"; Body = $ab }
    @{ Name = "review";  Subject = "Update on your application - Residentas";       Body = $rb }
    @{ Name = "reject";  Subject = "Update on your application - Residentas";       Body = $xb }
)

foreach ($row in $desiredRows) {
    $name = $row.Name
    $formula = "LOWER({Name}) = LOWER('$name')"
    $existing = Invoke-DataAT "GET" "${tplId}?filterByFormula=$([uri]::EscapeDataString($formula))&maxRecords=1"

    if ($existing.records.Count -gt 0) {
        $recordId = $existing.records[0].id
        Write-Host "  ~ Updating existing row: $name" -ForegroundColor DarkGray
        Invoke-DataAT "PATCH" "$tplId/$recordId" @{ fields = $row } | Out-Null
    } else {
        Write-Host "  + Creating row: $name" -ForegroundColor DarkGray
        Invoke-DataAT "POST" "$tplId" @{ fields = $row } | Out-Null
    }
}

# --- 4. Done ------------------------------------------------------------------

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host " TEMPLATES SETUP COMPLETE" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host " Base ID : $BaseId"
Write-Host " URL     : https://airtable.com/$BaseId"
Write-Host ""
Write-Host "If needed, manually add 'Updated At' as Last modified time in Templates." -ForegroundColor Yellow
