---
id: ui-visual-preview-gate
trigger: "when generating or displaying repository before-after summaries"
confidence: 0.95
domain: "ui-ux"
source: "user-correction"
scope: project
project_name: "Project Github-library"
---

# UI Visual Preview Gate (Frontend Only vs Pure Dynamic Text)

## Action
1. **Frontend-Only Visual HTML:** Field `beforeHtml` dan `afterHtml` serta tab switcher `Visual UI (.html)` HANYA boleh dibuat dan ditampilkan untuk repositori yang berfokus murni pada Frontend Web UI (`scenarioType === 'ui'`).
2. **Non-Frontend Repositories:** Untuk semua repositori non-frontend (CLI, backend, framework SDLC, metodologi, devtools, data pipelines, dan engine di mana `scenarioType !== 'ui'`), DILARANG menghasilkan `beforeHtml`/`afterHtml` dan DILARANG menampilkan tab switcher atau iframe preview tiruan.
3. **Pure Dynamic Text/Code:** Repositori non-frontend WAJIB menyajikan perbandingan `beforeCode` dan `afterCode` murni berupa teks kode/terminal dinamis yang membentang ke bawah (`whitespace-pre-wrap break-words`) tanpa scroll horizontal.

## Evidence
- Koreksi langsung pengguna: "untuk visual UI pastikan hanya untuk yang ada frontendnya saja jika tidka ada tidak perlu ada summary cukup before after teks harus dinamis , buat agar ai agent paham akan seperti itu /continuous-learning-v2".
- Repositori non-UI (seperti `obra/superpowers`, framework metodologi, atau CLI tools) tidak relevan dengan visual web mockup; memaksakan iframe visual merusak keaslian konteks engineering.

