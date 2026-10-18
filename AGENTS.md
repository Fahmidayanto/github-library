# Workspace Active Skills & Rules - Github-library (OpenMontage & Multi-Engine)

> Instruksi aktif untuk workspace lokal `B:\Project\Project Jadi Bisa`.
> Terdiri dari orkestrator multi-engine video: OpenMontage, OpenShorts, MoneyPrinterTurbo, ViMax, Antigravity Dashboard, dan Vault Obsidian.

## INSTRUKSI TIDAK BOLEH DILANGGAR !!!!!

contoh percakapan agent jawab sendiri percakapan !!!!! :
"Codebase Memory tersedia. Saya cek apakah workspace sudah memiliki konfigurasi/integrasi Headroom agar panduan tidak menduplikasi setup yang ada.
&#x20; Search code
Project `AI-video` belum terindeks di Codebase Memory, jadi kanal itu tidak dapat dipakai tanpa membuat indeks baru. Saya lanjut memakai repo dan dokumentasi resmi Headroom; tidak akan mengindeks atau mengubah workspace."

(TIDAK PERLU PERCAKAPAN INTERNAL !!!!!!!, CUKUP BERIKAN HASIL INFORMASI!!!!!)

## PROTOKOL OUTPUT WAJIB

- Jangan pernah menampilkan proses berpikir, rencana internal, status tool, nama skill, Codebase Memory, atau narasi investigasi kepada pengguna.
- Jangan mengirim pesan progres sebelum hasil tersedia.
- Untuk tugas teknis: kerjakan investigasi, perubahan, dan validasi secara internal; kirim satu jawaban final setelah selesai.
- Jawaban final hanya boleh berisi:
  1. Hasil perubahan
  2. File yang berubah
  3. Validasi yang dijalankan
  4. Error atau blocker nyata
- Jika pengguna hanya memberi file/path, jangan langsung mengedit. Baca dan validasi dulu.
- Jangan mengarang hasil, path, command, atau status berhasil.
- Jika command dibatalkan atau gagal, laporkan sebagai gagal. Jangan menyebutnya selesai.
- Jangan mengulang pertanyaan yang sudah terjawab di percakapan.
- Selalu gunakan Bahasa Indonesia.


## Instruksi Dasar (Wajib Turn 1)

CRITICAL BLOCKING GATE:
Pada pesan PERTAMA di setiap sesi baru, SEBELUM menghasilkan teks respon apa pun (termasuk menjawab pertanyaan `?`, menganalisis error log, atau investigasi), AI WAJIB membaca file `.agents/AGENTS.md` ini dari disk, lalu membaca 3 file skill dasar berikut secara paralel menggunakan tool baca file yang tersedia (`view_file`, `Get-Content`, atau setara):

1. **caveman**: `B:\Project\Project Github-library\.agents\skills\caveman\SKILL.md`
2. **ponytail**: `B:\Project\Project Github-library\.agents\skills\ponytail\SKILL.md`
3. **i-have-adhd**: `B:\Project\Project Github-library\.agents\skills\i-have-adhd\SKILL.md`

Dilarang keras mengirimkan respon teks ke pengguna sebelum tool call membaca 3 skill di atas dipanggil pada giliran pertama sesi.

Gunakan `B:\Project\Project Github-library\.agents\skills\<nama-skill>\SKILL.md` untuk pencarian dan pembacaan skill workspace. Jangan menggantinya dengan salinan global `.gemini` atau `.codex`. Jika skill yang diperlukan tidak ditemukan, laporkan path yang hilang; jangan diam-diam memakai salinan lain. Baca ulang instruksi dan skill dasar pada setiap sesi baru; ingatan sesi sebelumnya tidak menggantikan pembacaan file.

Aturan komunikasi:

1. Selalu gunakan Bahasa Indonesia untuk percakapan, temuan, ringkasan, dan pertanyaan.
2. Gunakan gaya ringkas dan presisi sesuai `caveman`.
3. Gunakan solusi paling sederhana yang benar sesuai `ponytail`: utamakan pola repository, fitur native, dan dependency yang sudah terpasang.
4. Terapkan prinsip `i-have-adhd`: tindakan langsung (*action first*), batasi list maksimal 5 item, langkah bernomor, tanpa basa-basi (*zero fluff*), dan estimasi waktu nyata.
5. Jangan mengurangi validasi input, keamanan, aksesibilitas, penanganan error, atau perlindungan data demi menghemat kode.
6. **Standar Diagram & Alur:** Dilarang memberikan diagram flow teks/Mermaid yang terlalu sederhana atau polos tanpa konteks visual yang jelas. Diagram harus disajikan secara terstruktur, rapi, jelas, memiliki pemetaan endpoint/port yang presisi, serta diutamakan memiliki representasi visual/UI yang komprehensif (seperti diagram interaktif atau breakdown tabel tahapan yang kaya konteks).
7. **Aturan Before vs After & Visual UI Gate (Continuous Learning):** Tab switcher dan preview "Visual UI (.html)" HANYA boleh dibuat dan ditampilkan untuk repositori yang benar-benar berfokus pada Frontend Web UI (`scenarioType === 'ui'`). Untuk repositori non-frontend (CLI, backend, framework SDLC, devtools, metodologi, dan engine), DILARANG memunculkan tab Visual UI atau membuat mockup iframe buatan; Before vs After wajib murni disajikan dalam teks kode/terminal dinamis yang membentang ke bawah tanpa scroll horizontal.
8. **Aturan Persistensi Data (Database-First — Continuous Learning):** DILARANG KERAS menggunakan browser `localStorage`, `sessionStorage`, maupun file JSON mock/store lokal (`library-store.json`) untuk menyimpan, menambah, mengubah, atau mengupdate data repositori, kategori, dan state aplikasi. SEMUA mutasi, query, dan persistensi data WAJIB selalu melalui DATABASE (PostgreSQL Neon via Drizzle ORM / REST API Backend).
9. **Aturan AI-Native Intent & Zero Hardcoded Rules (Continuous Learning):** DILARANG KERAS menggunakan daftar stopword statis, kamus sinonim hardcoded, atau scoring poin manual untuk membedah query pencarian atau RAG. Seluruh parsing maksud pencarian, slang/typo recovery, out-of-domain detection, dan scoring relevansi WAJIB murni berbasis AI / LLM (Gemini / Groq / Vector Embedding).
10. **Aturan Git Push & Atomic Commit (Continuous Learning):** Saat ada perintah `git push`, WAJIB jalankan urutan lengkap: (a) periksa `git status` dan `git diff` serta pastikan file sensitif/lokal (`.env*`, `node_modules`, `.next`, `dist`, cache) tidak ikut masuk; (b) kelompokkan perubahan lalu jalankan `git add` dan `git commit` secara **terpisah per perbaikan/fitur (atomic commit)** dengan pesan commit lengkap, rapi, dan terstruktur (format Conventional Commits `<type>(<scope>): <ringkasan>` beserta rincian poin perubahan); (c) jalankan `git push` ke branch remote aktif dan laporkan daftar commit yang berhasil di-push.


## Persetujuan Sebelum Eksekusi & Proteksi Penghapusan

Jangan otomatis menjalankan command, script, pipeline, instalasi, migrasi, deployment, mutasi database, pembersihan container, atau perubahan file.

**ATURAN KERAS PROTEKSI PENGHAPUSAN:**
- **DILARANG KERAS** menggunakan perintah pembersihan massal/wildcard (seperti `docker rm -f (docker ps -aq)`, `docker system prune -a`, `rm -rf *`).
- HANYA hentikan atau hapus container/resource spesifik yang ditargetkan setelah pengecekan teliti.

Sebelum tindakan tersebut:

1. **Jelaskan Dampak Before & After (Bahasa Manusiawi):**
   - **Before (Kondisi Saat Ini):** Sebutkan container/resource apa saja yang sedang aktif dan terkena dampak.
   - **After (Dampak Setelah Eksekusi):** Jelaskan secara bahasa manusia sederhana apa yang akan terjadi (apa yang berhenti/berubah, jaminan keamanan data volume, dan cara pemulihan).
2. **Minta Konfirmasi Eksplisit:** Tanyakan persetujuan spesifik kepada pengguna.
3. **Tunggu Persetujuan:** Jangan lakukan eksekusi sebelum ada kalimat persetujuan eksplisit dari pengguna.
4. **Jalankan Tindakan Minimum:** Jalankan hanya tindakan spesifik yang sudah dijelaskan.

Operasi baca saja seperti membaca file, mencari simbol, melihat status Git, dan query Codebase Memory boleh dilakukan untuk investigasi awal. Jangan meminta secret, token, password, atau API key melalui chat; minta pengguna memasukkannya langsung melalui mekanisme aman.

Jika pesan pengguna mengandung tanda tanya (`?`), jawab pertanyaannya terlebih dahulu. Jangan melakukan mutasi sebelum penjelasan dan persetujuan.

## Alur Dev, Bugfix, dan Refactor

Untuk bugfix, fitur, enhancement, atau refactor:

1. Investigasi akar masalah atau jalur implementasi terlebih dahulu.
2. Jelaskan temuan, hipotesis, dampak, dan validasi termurah yang relevan.
3. Rekomendasikan 2-3 skill dengan format icon murni `❌ [nama-skill]` saat memulai task/domain baru (format ini adalah transparansi rencana internal AI, bukan instruksi agar pengguna mengetik slash command).
4. Minta konfirmasi sebelum perubahan file atau eksekusi command.
5. Setelah disetujui, buat perubahan minimum pada owning module.
6. Jalankan validasi terfokus setelah perubahan, lalu validasi lebih luas sesuai risiko.
7. Ubah status skill yang benar-benar dipakai menjadi `✅ [nama-skill]`.
8. Tawarkan pencatatan ke Obsidian hanya jika hasilnya bernilai sebagai dokumentasi project atau knowledge reusable.

Catatan siklus hidup skill:
- Skill yang sudah aktif/dibaca dalam sesi ini otomatis tetap diingat dan berlaku.
- Jangan mengulang rekomendasi skill yang sama pada perbaikan lanjutan (follow-up/iterasi) dalam domain yang sama.
- Tidak perlu rekomendasi skill untuk percakapan casual, tanya-jawab penjelasan, navigasi sederhana, atau perbaikan minor lanjutan.

## Project dan Arsitektur

Workspace `B:\Project\Project Github-library` adalah monorepo platform **GitHub Library Hub** — katalog repositori GitHub terkurasi dengan auto-fetch metadata, kategorisasi hierarki 2-level, live filter, visualisasi 3D Three.js, dan persistensi database PostgreSQL Neon (Drizzle ORM) dengan in-memory fallback.

```text
B:\Project\Project Github-library/
  fe/                      Frontend Web UI (Next.js 16, React 19, Tailwind CSS v4, Lucide React, Three.js)
    src/app/               Next.js App Router (page.tsx, layout.tsx, globals.css, actions.ts)
    src/components/        Komponen UI (Sidebar, RepoCard, AddRepoModal, AddCategoryModal, RepoDetailModal, ThreeBackdrop)
    src/lib/               Utility helper (cn, formatters)
  be/                      Backend API Service (TypeScript ESM, Express 4, Drizzle ORM, Neon Serverless PostgreSQL)
    src/server.ts          Express server entrypoint & REST API handlers
    src/db/                Drizzle ORM schema & client (schema.ts, index.ts)
    drizzle.config.ts      Konfigurasi migrasi Drizzle Kit
  docs/                    Dokumentasi arsitektur, UI/UX design spec, dan implementation plan
  start_github-library.bat Script launcher workspace (membuka VS Code & info port)
  start_mcp.bat            Boot daemon codebase-memory-mcp dengan UI 3D Graph (:9749)
  pnpm-workspace.yaml      Konfigurasi pnpm monorepo (packages: fe, be)
  package.json             Root scripts monorepo (dev, dev:fe, dev:be, build, build:fe, build:be)
```

Prinsip ownership & arsitektur:

- **fe (Frontend - Next.js 16):** Port `3055` (`http://localhost:3055`). Menyajikan antarmuka katalog repositori GitHub, sidebar navigasi hierarki kategori & sub-kategori, modal Tambah Repo dengan fitur auto-inspect metadata, modal kelola kategori, search & filter realtime, serta 3D particle backdrop interaktif Three.js. Berkomunikasi dengan backend via REST API (`http://localhost:4000/api`).
- **be (Backend API - Express & Drizzle):** Port `4000` (`http://localhost:4000`). REST API service yang menangani:
  - `GET /api/health`: Healthcheck service dan status konektivitas database.
  - `GET & POST /api/categories`: CRUD kategori dan sub-kategori 2-level.
  - `GET & POST /api/repositories`: Filter dan penyimpanan repositori (filter `categoryId`, `subCategoryId`, `search`).
  - `GET /api/github/inspect`: Proxy GitHub REST API (`api.github.com/repos/:owner/:repo`) untuk auto-fetch metadata (stars, forks, description, topics, language, avatar, license) aman tanpa membocorkan token di browser.
  - **Database & Fallback:** Menggunakan Drizzle ORM ke Neon Serverless PostgreSQL (`DATABASE_URL`). Bila environment DB belum aktif (`isDbConfigured === false`), backend otomatis menggunakan fallback memory aktif sehingga tetap berjalan tanpa error koneksi.
- **Service Ports Map:**
  - `3055`: Frontend Next.js Web UI (`fe`)
  - `4000`: Backend Express REST API Server (`be`)
  - `9749`: codebase-memory-mcp Daemon 3D UI
- **Workflow & Monorepo:** Dikelola menggunakan pnpm workspace. Jalankan server melalui `pnpm dev` (paralel fe + be), `pnpm dev:fe`, atau `pnpm dev:be`.
- **Kebersihan Repo:** Jangan commit file `.env`, folder `node_modules`, folder build (`dist`, `.next`), atau file cache lokal.

## Codebase Memory & MCP

> **ATURAN KERAS — TIDAK BOLEH DILANGGAR:**
> - **DILARANG** menggunakan PowerShell `Get-Content | Select-String`, `grep`, `Grep`, `Glob`, atau file-search untuk mencari simbol kode, function, class, route, atau variable di dalam source code `.py`, `.ts`, `.tsx`, `.jsx`, `.js`.
> - **WAJIB** selalu gunakan Codebase Memory MCP (`search_graph`, `trace_path`, `get_code_snippet`) sebagai alat pencarian utama untuk semua kode.
> - PowerShell/grep **hanya boleh** digunakan untuk: string literal, config values, log messages, file Markdown, YAML, Dockerfile, dan file non-code lainnya.
> - Setiap investigasi simbol kode wajib menerapkan **iterative-retrieval pattern**: mulai broad, evaluate relevansi, refine, maksimal 3 siklus.

Gunakan project Codebase Memory `Project-Github-library` sebagai engine utama eksplorasi kode.

Urutan prioritas (wajib diikuti secara berurutan):

1. `search_graph`: cari function, class, route, type, dan variable.
2. `trace_path`: petakan caller, callee, dan data flow.
3. `get_code_snippet`: baca implementasi simbol secara terarah.
4. `query_graph`: analisis dependency atau pola multi-hop.
5. `get_architecture`: lihat topologi tingkat tinggi jika diperlukan.
6. **Fallback terakhir**: text search/grep hanya untuk string literal, config key, log message, Markdown, YAML, Dockerfile.

**Iterative-Retrieval Pattern (wajib untuk investigasi kode):**
- Cycle 1: `search_graph` broad → evaluate relevansi setiap simbol (skor 0–1)
- Cycle 2: `trace_path` + `get_code_snippet` untuk simbol relevan → identify gaps
- Cycle 3: `query_graph` untuk pola multi-hop jika masih ada gap
- Stop saat konteks cukup (≥3 simbol relevan, confidence ≥0.7)

Sebelum mengubah signature, route contract, shared type, atau utility bersama, jalankan impact analysis inbound.

**MCP Servers Aktif:**
- `openshorts`: Terdaftar di global `mcp_config.json` via stdio proxy `b:\Project AI video\openshorts\mcp_stdio_proxy.py` (menghubungkan tool `process_video`, `get_job_status`, `list_clips`, dll. langsung ke backend Docker `:8001`).
- `codebase-memory-mcp`: Knowledge graph codebase.
- `obsidian` & `obsidian-vault`: Akses vault catatan di `B:\Project AURA\AURAIndexBrain` dan `Secbrain/AI-video`.

## Skill Matrix & Dynamic Skill Discovery

Seluruh perbendaharaan skill tersimpan di direktori lokal workspace (sumber utama):
`B:\Project\Project Github-library\.agents\skills\`

Setiap kali pengguna meminta pengerjaan tugas baru (fitur, bugfix, refactor, perancangan sistem, optimasi visual, atau audit):
1. **Dynamic Skill Search:** Pindai dan temukan skill paling relevan di `B:\Project\Project Github-library\.agents\skills\` secara dinamis berdasarkan deskripsi `SKILL.md` dan domain tugas yang dihadapi.
2. **Suggest 2-3 Skill ke User:** Tampilkan 2-3 rekomendasi skill terbaik dengan format `❌ [nama-skill]` sebagai deklarasi standar yang akan dipegang AI.
3. **Session Persistence:** Skill yang sudah dimuat dalam sesi aktif tetap berlaku di memori tanpa perlu dipanggil ulang di setiap giliran pesan.
4. **Baca SKILL.md:** Baca file `SKILL.md` dari skill yang dipilih sebelum menulis kode atau menjalankan perubahan jika belum ada di memori sesi.
5. **Update Status Pasca-Eksekusi:** Ubah status skill yang benar-benar diterapkan menjadi `✅ [nama-skill]`.

### Skill Dasar (Selalu Aktif)
- `caveman`: `B:\Project\Project Github-library\.agents\skills\caveman\SKILL.md` (Komunikasi padat, ringkas, dan presisi Bahasa Indonesia)
- `ponytail`: `B:\Project\Project Github-library\.agents\skills\ponytail\SKILL.md` (Solusi paling sederhana yang benar: utamakan native dan pola existing)
- `i-have-adhd`: `B:\Project\Project Github-library\.agents\skills\i-have-adhd\SKILL.md` (Action first, langkah bernomor, batasi list max 5, zero fluff)
- `iterative-retrieval`: `B:\Project\Project Github-library\.agents\skills\iterative-retrieval\SKILL.md` (Wajib untuk investigasi simbol kode: broad → evaluate → refine, max 3 siklus, selalu via Codebase Memory MCP)
- `continuous-learning-v2`: `B:\Project\Project Github-library\.agents\skills\continuous-learning-v2\SKILL.md` (Catat pattern baru dari sesi sebagai instinct untuk dipakai di sesi berikutnya)

<!-- ### Katalog Domain Relevan (Workspace Skills)
- **Video, Motion & 3D:** `remotion-video-creation`, `motion`, `motion-patterns`, `threejs-skills`, `threejs-animation`, `threejs-fundamentals`, `threejs-geometry`, `blender-motion-state-inspection`, `cast`, `paint`
- **Arsitektur & System Canvas:** `system-architecture-canvas`, `api-design`, `contract-first`, `mcp-server-patterns`
- **Discovery, Graph & Refactor:** `codegraph`, `search-first`, `orch-refine-code`, `orch-fix-defect`, `iterative-retrieval`, `workspace-surface-audit`
- **Backend, Python & Runtime:** `python-patterns`, `python-testing`, `bun-runtime`, `backend-patterns`
- **Quality, Testing & Verification:** `verification-before-completion`, `verification-loop`, `tdd-workflow`, `e2e-testing`
- **Knowledge, Ops & Rules:** `prompt-optimizer`, `rules-distill`, `graphify`, `ecc-guide` -->
<!-- 
## Command Guide

Semua command dijalankan dari folder terkait setelah persetujuan pengguna.

```powershell
# ==========================================
# 1. OpenMontage (Python 3.10+ di OpenMontage/.venv)
# ==========================================
cd "B:\Project AI video\OpenMontage"
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m pytest tests/ -v
.\.venv\Scripts\python.exe render_demo.py --list
.\.venv\Scripts\python.exe -m backlot serve

# Remotion Composer Studio (:3000)
cd "B:\Project AI video\OpenMontage\remotion-composer"
npm install
npm start

# ==========================================
# 2. OpenShorts (Docker Stack & MCP)
# ==========================================
cd "B:\Project AI video\openshorts"
# Jalankan container lengkap (Backend :8000, Frontend :5175, Renderer :3100)
docker compose up -d
# Cek status container
docker ps
# Test bridge MCP lokal Antigravity
python -c "import subprocess, json; p = subprocess.Popen(['python', 'mcp_stdio_proxy.py'], stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True, encoding='utf-8'); out, _ = p.communicate(json.dumps({'jsonrpc': '2.0', 'id': 1, 'method': 'tools/list'}) + '\n'); print(out)"

# ==========================================
# 3. MoneyPrinterTurbo (Streamlit WebUI :8501)
# ==========================================
cd "B:\Project AI video\MoneyPrinterTurbo"
python main.py
# Atau jalankan webui.bat

# ==========================================
# 4. ViMax (Multi-Agent Simulation)
# ==========================================
cd "B:\Project AI video\ViMax"
python main_idea2video.py
python main_script2video.py

# ==========================================
# 5. Antigravity Dashboard (Bun :4120)
# ==========================================
cd "B:\Project AI video\antigravity-dashboard"
bun run dev
``` -->

<!-- ## Environment dan Infrastruktur

- **Python Runtimes:** Python 3.10+ via virtualenv di `OpenMontage/.venv`, `ViMax/.venv`, dan sistem lokal.
- **Node.js / Bun:** Node.js untuk Remotion Composer studio/render; Bun untuk `antigravity-dashboard`.
- **Docker Engine:** Menjalankan stack multi-container OpenShorts (backend, frontend, renderer).
- **FFmpeg:** Wajib terinstal dan terdaftar di PATH sistem untuk seluruh proses assembly, encoding NVENC/x264, dan audio mixing.
- **Service Ports Map:**
  - `3000`: Remotion Studio (OpenMontage Composer)
  - `3100`: OpenShorts Remotion Renderer Container
  - `4120`: Antigravity Dashboard
  - `4750`: Backlot Web UI & Simulation (OpenMontage)
  - `5175`: OpenShorts Frontend Web UI
  - `8001`: OpenShorts / ShortsCraft FastAPI Backend & MCP Server
  - `8501`: MoneyPrinterTurbo WebUI (Streamlit)

## Git Tracking

- `B:\Project AI video` adalah workspace induk lokal.
- Repository git aktif utama berada di `B:\Project AI video\OpenMontage`. Sub-modul `openshorts`, `MoneyPrinterTurbo`, dan `ViMax` memiliki tracking `.git` independen masing-masing.
- Jalankan command Git dari folder modul terkait.
- Branch utama adalah `main`.
- Jangan commit file `.env`, file cache (`.venv`, `node_modules`, `__pycache__`), maupun render video binary besar di folder output.
- Jangan mengubah, menghapus, atau mengembalikan perubahan pengguna yang tidak terkait. -->

## Obsidian Vault

Vault aktif: `B:\Project\Project Github-library\brain\github-library`

Saat membuat catatan baru, gunakan struktur PARA:

- `00_Inbox/`: draft ide, catatan prompt mentah, scratchpad konsep.
- `10_Projects/`: catatan development aktif JadiBisa, guide, evaluasi arsitektur.
- `20_Knowledge/`: dokumentasi reusable (Flowise, Bifrost, Drizzle, arsitektur dual-schema).
- `30_Archive/`: project yang selesai, post-mortem.

Setiap note baru harus memiliki YAML frontmatter minimal `title`, `tags`, `type`, `created`, dan `updated`. Gunakan heading terstruktur dan wikilink `[[Nama_Catatan]]` jika ada hubungan nyata. Jangan otomatis membuat note; usulkan path dan nama note, lalu tunggu persetujuan pengguna.

Format usulan pasca-eksekusi:

- Folder: `10_Projects/` atau `20_Knowledge/`
- Note: `[[Nama_Catatan]]`
- Status: `[STATUS: MENUNGGU PERSETUJUAN]` atau `[STATUS: SUDAH TERJEKSEKUSI]`

## Definition of Done

Pekerjaan hanya boleh dinyatakan selesai jika:

1. Perubahan sesuai permintaan dan scope repository.
2. Tidak ada file lokal workspace yang ikut masuk tracking project.
3. Validasi fresh yang relevan sudah dijalankan setelah persetujuan.
4. Hasil validasi dibaca dan kegagalan dilaporkan apa adanya.
5. Dokumentasi diperbarui hanya bila perilaku atau workflow memang berubah.