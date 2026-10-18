# GitHub Library Hub

Platform katalog dan kurasi repositori GitHub berbasis **AI-Native Intelligence** dan visualisasi **3D Galaxy Knowledge Graph** interaktif. Dirancang dengan arsitektur monorepo (`pnpm workspace`) yang memadukan **Next.js 16 (React 19 + Three.js + GSAP)** pada sisi frontend serta **Express + Drizzle ORM + Neon Serverless PostgreSQL** pada sisi backend.

---

## Fitur Utama

1. **Auto-Inspect Metadata & AI Repository Summary**
   - Mengambil metadata repositori langsung dari GitHub REST API (`stars`, `forks`, `language`, `topics`, `license`, `avatar`, dan `README`) melalui proxy backend aman.
   - Menghasilkan ringkasan arsitektur terstruktur, analisis *Before vs After*, skenario implementasi, dan panduan instalasi otomatis menggunakan LLM (Gemini / Groq).
2. **Hierarki Kategori 2-Level & Klasifikasi Cerdas**
   - Pengelompokan repositori ke dalam **Kategori Utama** dan **Sub-Kategori** secara dinamis.
   - Filter instan lintas kategori, sub-kategori, dan pencarian kata kunci *real-time*.
3. **Interactive 3D Galaxy Knowledge Graph (`Three.js` + `GSAP`)**
   - Visualisasi spasial 3D yang memetakan klaster Kategori, Sub-Kategori, Repositori, Bahasa Pemrograman, dan Topik.
   - **Cross-Cluster Semantic Bridges**: Jembatan kurva parabolik Bezier 3D yang menghubungkan repositori lintas sub-kategori berdasarkan kemiripan fungsi dan arsitektur.
   - Navigasi kamera presisi (*fly-to* & *pan without zoom*), *raycasting hover/click*, serta panel kontrol klaster interaktif.
4. **AI Library Advisor & Semantic Response Cache (CAG)**
   - Asisten pencarian berbasis **AI-Native Intent Parsing** (memahami maksud pertanyaan alami, *slang*, dan koreksi *typo* secara semantik tanpa daftar *stopword* statis).
   - **Cache-Augmented Generation (CAG)** melalui tabel `advisor_qa_cache` di PostgreSQL untuk menyajikan rekomendasi instan pada kueri berulang.
5. **Terjemahan README Bahasa Indonesia Terintegrasi**
   - Penerjemahan otomatis dokumentasi `README.md` repositori ke Bahasa Indonesia dengan tata letak HTML bersih yang disimpan ke tabel cache database (`translations_cache`).

---

## Arsitektur Sistem & Pemetaan Port

```mermaid
flowchart TB
    subgraph Client["Frontend Web UI — Next.js 16 (Port :3055)"]
        UI["Catalog Grid & Live Filter\n(page.tsx, Sidebar, RepoCard)"]
        GALAXY["3D Galaxy Knowledge Graph\n(Three.js + GSAP, Semantic Bridges)"]
        MODAL["Repo Detail & Add Repo Modals\n(Before/After, AI Summary, ID README)"]
        ADVISOR["AI Library Advisor\n(Server Actions — actions.ts)"]
    end

    subgraph Server["Backend API Service — Express 4 + TypeScript ESM (Port :4000)"]
        HEALTH["GET /api/health\n(Service & DB Status)"]
        CAT_API["GET / POST / DELETE /api/categories\n(2-Level Category & Sub-Category CRUD)"]
        REPO_API["GET / POST / PATCH / DELETE /api/repositories\n(Repository Catalog & Semantic Bridges)"]
        INSPECT["GET /api/github/inspect\n(Secure GitHub API Proxy)"]
        TRANS_API["GET / POST /api/translations\n(README Translation Cache)"]
    end

    subgraph Persistence["Database Layer — Neon Serverless PostgreSQL (Drizzle ORM)"]
        DB_CAT[("categories &\nsub_categories")]
        DB_REPO[("repositories\n(ai_summary + semanticBridges JSONB)")]
        DB_TRANS[("translations_cache")]
        DB_CAG[("advisor_qa_cache\n(Semantic QA Cache / CAG)")]
    end

    subgraph External["External APIs & AI Providers"]
        GH_API["GitHub REST API\n(api.github.com/repos/:owner/:repo)"]
        LLM_API["AI Inference Providers\n(Google Gemini Flash / Groq LLM)"]
    end

    UI -->|"HTTP REST (/api/*)"| CAT_API
    UI -->|"HTTP REST (/api/*)"| REPO_API
    GALAXY -->|"Render Nodes & Bridges"| REPO_API
    MODAL -->|"Inspect & Translate"| INSPECT
    MODAL -->|"Read/Write Translation"| TRANS_API
    ADVISOR -->|"Drizzle Serverless Query"| DB_CAG
    ADVISOR -->|"Intent Parsing & RAG Synthesis"| LLM_API

    CAT_API -->|"Drizzle ORM"| DB_CAT
    REPO_API -->|"Drizzle ORM"| DB_REPO
    TRANS_API -->|"Drizzle ORM"| DB_TRANS
    INSPECT -->|"Bearer GITHUB_TOKEN"| GH_API
    REPO_API -->|"AI Summary Generation"| LLM_API
```

### Rincian Komponen & Alur Data

| Lapisan | Modul / Direktori | Port / Protokol | Tanggung Jawab Utama |
| :--- | :--- | :--- | :--- |
| **Frontend Web UI** | `fe/` (Next.js 16, React 19, Tailwind CSS v4) | `http://localhost:3055` | Antarmuka katalog, kanvas 3D Galaxy Graph (`Three.js`), modal detail repositori, dan Server Actions AI Advisor. |
| **Backend REST API** | `be/` (Express 4, TypeScript ESM, `tsx`) | `http://localhost:4000` | Penyedia endpoint CRUD kategori/repositori, proxy inspeksi GitHub API, generator ringkasan AI, dan manajemen cache. |
| **ORM & Database** | `be/src/db/` & `fe/src/db/` (Drizzle ORM) | PostgreSQL Serverless (HTTPS/WSS) | Skema terpadu (`categories`, `sub_categories`, `repositories`, `translations_cache`, `advisor_qa_cache`) di Neon PostgreSQL. |
| **AI & External Proxy** | Gemini API, Groq API, GitHub REST API | HTTPS (`REST JSON`) | Ekstraksi metadata repositori, pembuatan *semantic bridges*, analisis *intent* pencarian, dan penerjemahan README. |

---

## Struktur Monorepo

```text
project-github-library/
├── fe/                                 # Frontend Web Application (Next.js 16 App Router)
│   ├── src/
│   │   ├── app/                        # Halaman utama (page.tsx), layout, globals.css, Server Actions (actions.ts)
│   │   ├── components/                 # Komponen UI & 3D (GalaxyGraphView, Sidebar, RepoCard, Modals, ThreeBackdrop)
│   │   ├── db/                         # Drizzle ORM client & schema untuk Server Actions
│   │   └── lib/                        # Helper utilitas & formatter
│   └── package.json
├── be/                                 # Backend REST API Server (Express + Drizzle ORM)
│   ├── src/
│   │   ├── db/                         # Drizzle ORM schema (schema.ts) & koneksi Neon (index.ts)
│   │   ├── scripts/                    # Utilitas CLI & generator (generate-semantic-bridges.ts)
│   │   └── server.ts                   # Entrypoint Express API (:4000)
│   ├── drizzle.config.ts               # Konfigurasi migrasi Drizzle Kit
│   └── package.json
├── pnpm-workspace.yaml                 # Konfigurasi workspace pnpm (fe, be)
└── package.json                        # Skrip orkestrasi root monorepo
```

---

## Prasyarat & Instalasi

### 1. Prasyarat Sistem
- **Node.js** `>= 20.x`
- **pnpm** `>= 9.x` (direkomendasikan sesuai `pnpm-workspace.yaml`)
- **Database PostgreSQL** (Neon Serverless PostgreSQL direkomendasikan)

### 2. Instalasi Dependency
Jalankan perintah berikut dari direktori root proyek:

```bash
pnpm install
```

### 3. Konfigurasi Environment Variables
Buat file `.env` di dalam folder `be/` dan `.env.local` di dalam folder `fe/`:

#### `be/.env`
```env
PORT=4000
DATABASE_URL="postgresql://<user>:<password>@<neon-host>/<dbname>?sslmode=require"
GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
GEMINI_API_KEY="AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
GROQ_API_KEY="gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

#### `fe/.env.local`
```env
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
DATABASE_URL="postgresql://<user>:<password>@<neon-host>/<dbname>?sslmode=require"
GEMINI_API_KEY="AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
GROQ_API_KEY="gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 4. Sinkronisasi Skema Database (Drizzle Kit)
Dorong skema tabel (`categories`, `sub_categories`, `repositories`, `translations_cache`, `advisor_qa_cache`) ke database PostgreSQL:

```bash
pnpm --filter be db:push
```

---

## Menjalankan Aplikasi

| Perintah | Deskripsi | URL / Port |
| :--- | :--- | :--- |
| `pnpm dev` | Menjalankan server **Frontend** dan **Backend** secara paralel | FE: `http://localhost:3055`<br>BE: `http://localhost:4000` |
| `pnpm dev:fe` | Menjalankan hanya server **Frontend Next.js** | `http://localhost:3055` |
| `pnpm dev:be` | Menjalankan hanya server **Backend Express** | `http://localhost:4000` |
| `pnpm build` | Mem-build produksi **Backend** (`tsc`) lalu **Frontend** (`next build`) | — |
| `pnpm --filter be db:studio` | Membuka antarmuka visual **Drizzle Studio** | `https://local.drizzle.studio` |

---

## Daftar Endpoint REST API (`http://localhost:4000`)

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Memeriksa status layanan backend dan konektivitas database PostgreSQL. |
| `GET` | `/api/categories` | Mengambil seluruh daftar kategori utama beserta sub-kategori di bawahnya. |
| `POST` | `/api/categories` | Membuat kategori utama baru atau menambahkan sub-kategori ke kategori yang ada. |
| `GET` | `/api/repositories` | Mengambil daftar repositori (mendukung query filter `categoryId`, `subCategoryId`, `search`). |
| `POST` | `/api/repositories` | Menyimpan repositori baru ke database beserta metadata GitHub dan ringkasan AI. |
| `PATCH` | `/api/repositories/:id` | Memperbarui kategori, sub-kategori, atau ringkasan AI pada repositori. |
| `DELETE` | `/api/repositories/:id` | Menghapus repositori dari database berdasarkan ID. |
| `GET` | `/api/github/inspect?url=<repo_url>` | Menginspeksi metadata repositori langsung dari GitHub REST API. |
| `GET` | `/api/translations/:owner/:repo` | Mengambil terjemahan README Bahasa Indonesia dari cache database. |
