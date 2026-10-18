---
id: database-first-no-localstorage
trigger: "when handling persistence, data storage, CRUD, repository state, or category mutations"
confidence: 0.95
domain: "architecture-database"
source: "user-correction"
scope: project
project_name: "Project Github-library"
---

# Database-First: No Local Storage Rule

## Action
1. **DILARANG MENGGUNAKAN LOCAL STORAGE:** Jangan pernah menggunakan browser `localStorage`, `sessionStorage`, maupun file JSON mock lokal (`library-store.json`) untuk menyimpan, menambah, mengubah, atau menghapus data aplikasi (kategori, sub-kategori, repositori, semantic bridges, dsb.).
2. **SELALU PAKAI DATABASE:** Semua operasi CRUD data, relasi graf, dan persistensi state WAJIB selalu diproses melalui **DATABASE (PostgreSQL Neon via Drizzle ORM / REST API Backend)**.
3. **Kepatuhan Endpoints:** Seluruh operasi data di frontend harus memanggil API backend (`/api/categories`, `/api/repositories`, dsb.) yang terhubung ke database Neon.

## Evidence
- Koreksi langsung pengguna: "pastikan di workspcase rule ada informasi jangan pernah pakai local storage lagi selalu pakai database /continuous-learning-v2".
- Penggunaan local storage atau mock file lokal menyebabkan inkonsistensi data antar-sesi, data desinkronisasi dengan database PostgreSQL Neon, dan melanggar prinsip single source of truth.
