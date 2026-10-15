# GitHub Library Hub - Implementation Plan

**Scope**: Pembangunan aplikasi katalog GitHub Library Hub fullstack Next.js 15, Drizzle ORM, Neon PostgreSQL, siap deploy ke Vercel.
**Spesifikasi Desain**: [docs/architecture-design.md](file:///b:/Project/Project%20Github-library/docs/architecture-design.md)

---

## Task Breakdown & Roadmap

### Fase 1: Inisialisasi Proyek & Konfigurasi Lingkungan
- [ ] **Task 1.1: Scaffolding Next.js 15 App Router**
  - Setup Next.js TypeScript, Tailwind CSS, Lucide React, Shadcn primitives / Radix UI.
  - Setup ESLint dan path aliases (`@/*`).
- [ ] **Task 1.2: Konfigurasi Database Neon & Drizzle ORM**
  - Install `@neondatabase/serverless`, `drizzle-orm`, `drizzle-kit`, `dotenv`.
  - Buat file `.env` dengan kredensial Neon DB pooler user.
  - Setup connection pooler di `src/db/index.ts`.
  - Definisi schema tabel `categories`, `sub_categories`, `repositories` di `src/db/schema.ts`.
  - Generate migrasi dan eksekusi push schema ke Neon PostgreSQL.
  - Buat seed script untuk default kategori (LLM, RAG, Video, AI Agent, AI Skill).

### Fase 2: Backend API & Server Actions
- [ ] **Task 2.1: GitHub Metadata Fetcher Service**
  - Buat route handler `/api/github/inspect?url=...` untuk parsing URL repo GitHub (`https://github.com/:owner/:repo`).
  - Ambil metadata via GitHub REST API: owner, repo, description, stargazers_count, forks_count, language, topics.
  - Validasi error jika URL bukan repo publik atau tidak valid.
- [ ] **Task 2.2: Server Actions CRUD Kategori & Sub-Kategori**
  - Action `createCategory(name, icon)` & `deleteCategory(id)`.
  - Action `createSubCategory(categoryId, name)` & `deleteSubCategory(id)`.
  - Action `getCategoriesTree()` dengan hitungan jumlah repo terasosiasi.
- [ ] **Task 2.3: Server Actions CRUD Repository**
  - Action `createRepository(data)`.
  - Action `updateRepository(id, data)`.
  - Action `deleteRepository(id)`.
  - Action `getRepositories({ categoryId, subCategoryId, search, sort })`.

### Fase 3: Frontend UI Components
- [ ] **Task 3.1: Layout & Sidebar Hierarki**
  - Komponen `Sidebar`: menampilkan pohon Kategori -> Sub-kategori dengan counter badge.
  - Fitur expand/collapse kategori, filter active route/state.
  - Dialog / inline form penambahan Kategori & Sub-kategori baru.
- [ ] **Task 3.2: Modal / Dialog Input GitHub Repository**
  - Form input URL dengan debounce / tombol auto-fetch.
  - Live card preview menampilkan info repo yang ditarik dari GitHub.
  - Dropdown dinamis Category & Sub-Category (termasuk opsi "+ Buat Kategori Baru").
- [ ] **Task 3.3: Repository Grid & Filter Bar**
  - Komponen `RepoCard`: badge bintang, fork, bahasa pemrograman, chips topics, link eksternal ke GitHub.
  - Search bar interaktif dengan filter teks dan dropdown sortir (Terbaru, Bintang terbanyak, Nama).
  - Tampilan empty state jika kategori atau hasil pencarian kosong.

### Fase 4: Validasi, Polish & Kesiapan Deploy Vercel
- [ ] **Task 4.1: Pengujian End-to-End Alur Pengguna**
  - Uji penambahan URL repo GitHub baru.
  - Uji pembuatan kategori custom dan pemindahan kategori repo.
  - Uji filter sidebar dan pencarian search bar.
- [ ] **Task 4.2: Konfigurasi Vercel Deployment**
  - Pastikan build production Next.js berjalan tanpa error (`npm run build`).
  - Verifikasi file `vercel.json` atau konfigurasi env deployment.

