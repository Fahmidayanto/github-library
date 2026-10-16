# 3D Galaxy Grouping Separation & Cosmic Flow Streams Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menata ulang seluruh layout spasial 3D Galaxy Graph menjadi Multi-System Galaxy Islands dengan kepulauan tata surya terpisah berjarak lebar, orbit lokal bertingkat tanpa tumpang tindih, jalur konektor melengkung (Curved 3D Arcs), dan fitur kamera fly-to interaktif.

**Architecture:** Memisahkan koordinat pusat setiap Category (Matahari) menjadi kepulauan seluas radius 500-650px. Setiap SubCategory (Planet) mengorbit Matahari di bidang orbit lokal (140-220px), dan Repositori (Bulan) mengorbit Planet (60-80px). Garis konektor lintas-kelompok (Topik/Bahasa) diubah menjadi busur lengkung kuadratik 3D (Quadratic Bezier Curve) yang membumbung di atas pulau kosmik sehingga alur data terlihat jelas tanpa memotong tata surya lain. Klik pada node memicu animasi halus kamera GSAP fly-to ke tata surya target.

**Tech Stack:** Next.js 16 (App Router), React 19, Three.js (WebGL, OrbitControls, QuadraticBezierCurve3, LineSegments), GSAP (Fly-to Camera Tweens, Elastic Node Hover), Tailwind CSS v4, Playwright.

---

## Global Constraints
- Tidak merusak fungsionalitas auto-inspect, modal detail, live filter, atau koneksi API backend.
- Kompatibel 100% baik pada mode `★ Universe Prototype (32)` maupun `📦 Database Live (88+)`.
- Menggunakan zero-dependency eksternal baru (hanya Three.js, GSAP, Lucide React yang sudah terpasang).
- Semua perubahan visual wajib diverifikasi menggunakan Playwright visual test script dan diinspeksi secara nyata.

---

## Task Structure

### Task 1: Spasial Layout Multi-System Galaxy Islands
**Files:**
- Modify: `fe/src/components/GalaxyGraphView.tsx:825-1250`
- Test: `scripts/verify-galaxy-playwright.cjs`

**Interfaces:**
- Consumes: `PROTOTYPE_GALAXY_DATA`, `categories`, `repositories`.
- Produces: `GalaxyNode` dengan `targetPosition` kepulauan terisolasi (radius 550px, orbit planet 160-220px, orbit bulan 65-85px).

- [ ] **Step 1:** Hitung koordinat pusat Kepulauan Tata Surya untuk setiap Category (Matahari) dengan radius ekspansif `catRadius = 520` dan elevasi ketinggian Y bervariasi (`±65px`).
- [ ] **Step 2:** Posisikan SubCategory (Planet) di dalam sistem koordinat lokal relatif terhadap Matahari pemiliknya dengan radius orbit lokal `150 - 210px` dan sudut rotasi elips yang tidak berbenturan antar-planet.
- [ ] **Step 3:** Posisikan Repository (Bulan) di sekitar Planet pemiliknya dengan radius lokal `65 - 85px` pada bidang inklinasi orbit `±25°`.
- [ ] **Step 4:** Posisikan Komet Bahasa & Meteor Topik pada Transit Belt terluar (`dist = 780 - 920px`) mengelilingi seluruh kepulauan tata surya.
- [ ] **Step 5:** Perbarui algoritma physics relaxation `resolveNodeCollisions` dengan `padding = 36` dan bobot hierarkis agar node tidak pernah bertumpuk (zero overlap guarantee).

---

### Task 2: Jalur Konektor Melengkung 3D (Curved Cosmic Stream Arcs)
**Files:**
- Modify: `fe/src/components/GalaxyGraphView.tsx:1270-1310` & `fe/src/components/GalaxyGraphView.tsx:690-725`
- Test: `scripts/verify-galaxy-playwright.cjs`

**Interfaces:**
- Consumes: `edgeObjects`, `nodeObjects`.
- Produces: Dual Edge Meshes: Garis lurus pekat untuk intra-group (Matahari -> Planet -> Bulan) dan Busur Kuadratik 3D (`THREE.QuadraticBezierCurve3`) yang melengkung anggun di atas sumbu Y/Z untuk relasi lintas-kelompok (Bahasa/Topik -> Repo).

- [ ] **Step 1:** Pisahkan rendering edge menjadi 2 kelompok: `intraGroupEdges` (koneksi di dalam 1 kepulauan) dan `crossGroupEdges` (koneksi antar-pulau atau dari transit belt).
- [ ] **Step 2:** Render `intraGroupEdges` menggunakan `THREE.LineSegments` beropasitas solid `0.65` dengan warna tema masing-masing grup.
- [ ] **Step 3:** Render `crossGroupEdges` menggunakan kurva `THREE.QuadraticBezierCurve3` di mana titik kontrol tengah dinaikkan ke sumbu Y (`midY += Math.min(220, dist * 0.35)`) sehingga garis melengkung melompati kepulauan tata surya lain tanpa memotongnya.
- [ ] **Step 4:** Saat node di-hover atau di-klik, perbarui visual highlight agar kurva lengkung aktif menyala pekat dengan core cyan (`0x00ffff`) dan aura warna kategori.

---

### Task 3: Kamera Interaktif Smooth Fly-To Solar System
**Files:**
- Modify: `fe/src/components/GalaxyGraphView.tsx:550-680` & `fe/src/components/GalaxyGraphView.tsx:2490-2540`
- Test: `scripts/verify-galaxy-playwright.cjs`

**Interfaces:**
- Consumes: Event klik raycaster pada node Category / SubCategory.
- Produces: Animasi kamera GSAP smooth tweening ke posisi kepulauan, tombol "Galactic Overview / Reset Zoom", dan indikator nama kepulauan yang sedang aktif.

- [ ] **Step 1:** Buat fungsi helper `flyToNode(camera, controls, targetNode, distance)` menggunakan GSAP untuk memindahkan `camera.position` dan `controls.target` secara halus (durasi 1.2 detik, easing `power3.out`).
- [ ] **Step 2:** Integrasikan trigger klik: jika user mengklik Matahari (Category), kamera terbang ke orbit kepulauan tersebut (jarak 420 unit); jika user mengklik latar belakang kosong, kembali ke sudut makro galaksi.
- [ ] **Step 3:** Tambahkan tombol navigasi "Macro Galactic View" di top bar untuk memudahkan user kembali ke peta galaksi penuh kapan saja.

---

### Task 4: Verifikasi & Validasi Visual Playwright
**Files:**
- Modify: `scripts/verify-galaxy-playwright.cjs`
- Output: Screenshots di artifacts folder

- [ ] **Step 1:** Jalankan `pnpm --filter fe build` untuk menjamin zero type/build error.
- [ ] **Step 2:** Jalankan `node scripts/verify-galaxy-playwright.cjs` untuk mengambil tangkapan layar kanvas awal yang terpisah rapi, alur konektor melengkung, dan status fly-to.
- [ ] **Step 3:** Lakukan inspeksi visual file gambar menggunakan tool `view_file` untuk mengonfirmasi bahwa tidak ada lagi node yang bertumpuk dan aliran konektor dapat ditelusuri dengan jelas 100%.

