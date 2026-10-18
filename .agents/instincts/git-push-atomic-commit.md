---
id: git-push-atomic-commit
trigger: "when the user requests git push or pushing changes to the repository"
confidence: 0.95
domain: "git-workflow"
source: "user-instruction"
scope: project
project_name: "Project Github-library"
---

# Git Push & Atomic Commit Per Perbaikan

## Action
1. **Periksa Status & Kebersihan File:** Jalankan `git status` dan `git diff` terlebih dahulu. Pastikan file lokal/sensitif (`.env*`, `node_modules`, `.next`, `dist`, file scratch test sementara) tidak ikut masuk staging.
2. **Atomic Commit per Perbaikan/Fitur:** Kelompokkan perubahan berdasarkan domain/fitur dan jalankan `git add` serta `git commit` secara **terpisah per perbaikan/fitur**, bukan menggabungkan seluruh perubahan berbeda dalam satu commit generik.
3. **Pesan Commit Lengkap & Rapi:** Gunakan format Conventional Commits (`<type>(<scope>): <ringkasan>`) diikuti daftar poin perubahan yang jelas dan terstruktur.
4. **Push & Laporan:** Jalankan `git push` ke branch remote aktif dan tampilkan daftar commit yang berhasil di-push.

## Evidence
- Instruksi langsung pengguna: "/continuous-learning-v2 buat agar ketika ada perintah git push maka lakukan git add,commit dengan pesan per perbaikan lengkap dan rapi, dan push catat di workspace rule".
