---
name: kimai-timesheet
description: "Manage Kimai timesheet entries — create, edit, list, and retrieve time tracking records via the Kimai REST API. Use this skill when the user asks to log time, fill timesheets, check recent entries, or edit existing timesheet records."
metadata:
  openclaw:
    requires:
      bins: ["curl.exe"]
---

# Kimai Timesheet Skill

This skill lets you manage timesheet entries on the Kimai time-tracking system at `https://timesheet.codeoffice.net`.

## When to Use

Activate this skill when the user asks to:
- Fill / log / create / input timesheet or absen entries
- View recent timesheet entries
- Edit or update existing timesheet entries
- Check what they logged today or on a specific date
- List available customers, projects, activities, or tags

## Authentication

All API calls use Bearer token auth. Include this header in every request:
```
Authorization: Bearer d71478869727ff86a92d45a26
```

## API Base URL

```
https://timesheet.codeoffice.net/api
```

## DateTime Format

**CRITICAL**: The API expects HTML5 local datetime format: `YYYY-MM-DDTHH:mm:ss`
- Example: `2026-03-31T08:00:00`
- Do NOT include timezone offset when sending data
- The API returns ISO 8601 with timezone (e.g., `2026-03-31T08:00:00+0700`)

## User's Default Values

When the user doesn't specify details, use these defaults:
- **Customer**: CODE.ID (id: 1)
- **Project**: Product - AURA (id: 193)
- **Activity**: 31_DEV_FEATURE (id: 8)
- **Tag**: Internal
- **Duration**: 2 hours per entry
- **Timezone**: Asia/Jakarta (UTC+7)

## Reference Data

### Frequently Used Customers
| ID | Name |
|----|------|
| 1 | CODE.ID |
| 55 | CODE NEXT DIGITAL |

### Projects (Customer: CODE.ID)
| ID | Name |
|----|------|
| 193 | Product - AURA |
| 192 | Product - eKlaim |
| 197 | Product - Activo |
| 205 | Product - P2P |
| 28 | Product - JadiBisa |
| 135 | RnD - AI Initiative |
| 117 | RnD - Technical |
| 136 | DEV - Weekly Meeting |
| 182 | MNTC - Weekly Meeting |
| 190 | CUTI TAHUNAN / BERSAMA / KHUSUS |
| 154 | Design - Project |
| 118 | Design - RnD |
| 191 | Event / Gathering |
| 139 | INTERVIEW |
| 109 | Proposal - Revamped Website CODE.ID (2025) |
| 129 | TENDER & POC |

### Activities (commonly used)
| ID | Name |
|----|------|
| 8 | 31_DEV_FEATURE |
| 11 | 32_DEV_INTEGRATION |
| 16 | 33_DEV_BUGFIX |
| 9 | 41_TEST_FEATURE |
| 12 | 42_TEST_SIT |
| 15 | 43_TEST_UAT |
| 20 | 25_WRITE_DOCUMENTATION |
| 25 | 12_PROJECT_MEETING |
| 24 | 11_PROJECT_MANAGEMENT |
| 3 | 21_REQ_GATHERING |
| 31 | 22_REQ_ANALYST |
| 5 | 23_DESIGN_ARCHITECTURE |
| 6 | 24_DESIGN_UIUX |
| 4 | 99_LEARN_TECHNOLOGY |
| 21 | 99_KNOWLEDGE_TRANSFER |
| 13 | 44_TEST_PERFORMANCE |
| 14 | 45_TEST_SECURITY |
| 17 | 51_DEPLOY_SOFTWARE |
| 30 | 50_DEPLOY_PREPARATION |
| 28 | 00_ANNUAL_LEAVE |

### Available Tags
`Internal`, `Overtime`, `Overtime-Reported`, `activo`, `cimb`, `Squad 5`, `BIB Academy`, `UGems University`, `MiniApp - Keuangan`, `MiniApp - Loyalty`, `MiniApp - Reward`, `MiniApp-Utility`

## Operations

### 1. Create a Timesheet Entry

Use the helper script:
```powershell
. "C:\Users\fahmi\.gemini\config\skills\kimai-timesheet\scripts\kimai.ps1"; Kimai-CreateEntry -Begin "2026-03-31T08:00:00" -End "2026-03-31T10:00:00" -Project 193 -Activity 8 -Description "description here" -Tags "Internal"
```

Or use curl directly:
```powershell
curl.exe -s -X POST "https://timesheet.codeoffice.net/api/timesheets" -H "Authorization: Bearer d71478869727ff86a92d45a26" -H "Content-Type: application/json" -d "{\"begin\":\"2026-03-31T08:00:00\",\"end\":\"2026-03-31T10:00:00\",\"project\":193,\"activity\":8,\"description\":\"description here\",\"tags\":\"Internal\"}"
```

**Required fields**: `begin`, `end`, `project`, `activity`
**Optional fields**: `description`, `tags` (comma-separated string)

### 2. Get Recent Entries

```powershell
. "C:\Users\fahmi\.gemini\config\skills\kimai-timesheet\scripts\kimai.ps1"; Kimai-GetRecent -Size 5
```

Or:
```powershell
curl.exe -s -H "Authorization: Bearer d71478869727ff86a92d45a26" "https://timesheet.codeoffice.net/api/timesheets?order=DESC&orderBy=begin&size=5"
```

### 3. Get a Specific Entry

```powershell
. "C:\Users\fahmi\.gemini\config\skills\kimai-timesheet\scripts\kimai.ps1"; Kimai-GetEntry -Id 12345
```

Or:
```powershell
curl.exe -s -H "Authorization: Bearer d71478869727ff86a92d45a26" "https://timesheet.codeoffice.net/api/timesheets/12345"
```

### 4. Edit an Existing Entry

```powershell
. "C:\Users\fahmi\.gemini\config\skills\kimai-timesheet\scripts\kimai.ps1"; Kimai-EditEntry -Id 12345 -Begin "2026-03-31T09:00:00" -End "2026-03-31T11:00:00" -Description "updated description"
```

Or use curl PATCH:
```powershell
curl.exe -s -X PATCH "https://timesheet.codeoffice.net/api/timesheets/12345" -H "Authorization: Bearer d71478869727ff86a92d45a26" -H "Content-Type: application/json" -d "{\"begin\":\"2026-03-31T09:00:00\",\"end\":\"2026-03-31T11:00:00\",\"description\":\"updated description\"}"
```

### 5. Delete an Entry

```powershell
curl.exe -s -X DELETE "https://timesheet.codeoffice.net/api/timesheets/12345" -H "Authorization: Bearer d71478869727ff86a92d45a26"
```

**IMPORTANT**: Always confirm with the user before deleting.

### 6. List Customers

```powershell
. "C:\Users\fahmi\.gemini\config\skills\kimai-timesheet\scripts\kimai.ps1"; Kimai-ListCustomers
```

### 7. List Projects (for a customer)

```powershell
. "C:\Users\fahmi\.gemini\config\skills\kimai-timesheet\scripts\kimai.ps1"; Kimai-ListProjects -CustomerId 1
```

### 8. List Activities (for a project)

```powershell
. "C:\Users\fahmi\.gemini\config\skills\kimai-timesheet\scripts\kimai.ps1"; Kimai-ListActivities -ProjectId 193
```

### 9. Get Entries by Date Range

```powershell
curl.exe -s -H "Authorization: Bearer d71478869727ff86a92d45a26" "https://timesheet.codeoffice.net/api/timesheets?begin=2026-03-31T00:00:00&end=2026-03-31T23:59:59&order=ASC&orderBy=begin"
```

## Workflow for Creating Multiple Entries (Typical Day)

When the user asks to "fill timesheet for today" or similar:

1. Ask what date (default: today)
2. Ask for time slots — the user typically works in 2-hour blocks:
   - e.g., 08:00-10:00, 10:00-12:00, 13:00-15:00, 15:00-17:00
3. For each slot, ask which project/activity (default: AURA / DEV_FEATURE)
4. Create each entry using the script or curl
5. Confirm all entries were created successfully
6. Show a summary of what was logged

## Important Notes

- The user's name is **Fahmi Dayanto** (user id: 209)
- Always use `curl.exe` (not `curl`) on Windows PowerShell to avoid alias conflict with `Invoke-WebRequest`
- When creating entries, calculate `end` from `begin` + duration if user provides duration instead of end time
- Response from POST will include the created entry's `id` — save this to report back
- If user says "isi absen" or "log timesheet", they mean creating timesheet entries
- Always show what you're about to create before executing, unless user gives explicit instructions
- Parse flexible time inputs: "jam 8", "8 pagi", "08:00" all mean 08:00:00
