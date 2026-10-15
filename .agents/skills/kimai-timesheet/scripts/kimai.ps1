<#
.SYNOPSIS
    Kimai Timesheet PowerShell Helper Script for CodeID Kimai API
#>

$global:KimaiBaseUrl = "https://timesheet.codeoffice.net/api"
$global:KimaiToken   = "d71478869727ff86a92d45a26"
$global:KimaiHeaders = @{
    "Authorization" = "Bearer $global:KimaiToken"
    "Content-Type"  = "application/json"
}

function Kimai-CreateEntry {
    param (
        [Parameter(Mandatory=$true)][string]$Begin,
        [Parameter(Mandatory=$true)][string]$End,
        [Parameter(Mandatory=$false)][int]$Project = 193,
        [Parameter(Mandatory=$false)][int]$Activity = 8,
        [Parameter(Mandatory=$false)][string]$Description = "",
        [Parameter(Mandatory=$false)][string]$Tags = "Internal"
    )
    $body = @{
        begin       = $Begin
        end         = $End
        project     = $Project
        activity    = $Activity
        description = $Description
        tags        = $Tags
    } | ConvertTo-Json

    Invoke-RestMethod -Uri "$global:KimaiBaseUrl/timesheets" -Method Post -Headers $global:KimaiHeaders -Body $body
}

function Kimai-GetRecent {
    param (
        [int]$Size = 5
    )
    Invoke-RestMethod -Uri "$global:KimaiBaseUrl/timesheets?order=DESC&orderBy=begin&size=$Size" -Method Get -Headers $global:KimaiHeaders
}

function Kimai-GetEntry {
    param (
        [Parameter(Mandatory=$true)][int]$Id
    )
    Invoke-RestMethod -Uri "$global:KimaiBaseUrl/timesheets/$Id" -Method Get -Headers $global:KimaiHeaders
}

function Kimai-EditEntry {
    param (
        [Parameter(Mandatory=$true)][int]$Id,
        [string]$Begin,
        [string]$End,
        [string]$Description,
        [int]$Project,
        [int]$Activity,
        [string]$Tags
    )
    $body = @{}
    if ($Begin) { $body["begin"] = $Begin }
    if ($End) { $body["end"] = $End }
    if ($Description) { $body["description"] = $Description }
    if ($Project) { $body["project"] = $Project }
    if ($Activity) { $body["activity"] = $Activity }
    if ($Tags) { $body["tags"] = $Tags }
    $jsonBody = $body | ConvertTo-Json

    Invoke-RestMethod -Uri "$global:KimaiBaseUrl/timesheets/$Id" -Method Patch -Headers $global:KimaiHeaders -Body $jsonBody
}

function Kimai-ListCustomers {
    Invoke-RestMethod -Uri "$global:KimaiBaseUrl/customers" -Method Get -Headers $global:KimaiHeaders
}

function Kimai-ListProjects {
    param (
        [int]$CustomerId
    )
    $uri = "$global:KimaiBaseUrl/projects"
    if ($CustomerId) { $uri += "?customer=$CustomerId" }
    Invoke-RestMethod -Uri $uri -Method Get -Headers $global:KimaiHeaders
}

function Kimai-ListActivities {
    param (
        [int]$ProjectId
    )
    $uri = "$global:KimaiBaseUrl/activities"
    if ($ProjectId) { $uri += "?project=$ProjectId" }
    Invoke-RestMethod -Uri $uri -Method Get -Headers $global:KimaiHeaders
}
