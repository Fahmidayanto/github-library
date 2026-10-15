---
name: system-architecture-canvas
description: Enterprise standard for building interactive, single-file HTML5/SVG multi-stage system architecture diagrams with dynamic codebase blueprint scanning, collision-free vector highway routing, precision port alignment, and end-to-end dataflow auto-glow.
---

# System Architecture Canvas (`system-architecture-canvas`)

Standar resmi pembuatan **Interactive System Architecture Canvas** berbasis file mandiri (`.html`) yang memvisualisasikan arsitektur sistem perangkat lunak secara hidup (*interactive*), presisi, dan berestetika *luxury dark glassmorphism*.

Diagram ini menggantikan gambar statis/PNG dengan antarmuka web interaktif yang memiliki kemampuan **pan & zoom**, **inspektor detail per layanan**, **routing kabel bebas tabrakan (*collision-free*)**, dan **penelusuran alur data end-to-end (*hover auto-glow*)**.

---

## 1. Fase 1: Codebase Blueprint Scanner (Pemindaian Otomatis Topologi)

Sebelum menggambar satu baris kode HTML pun, jalankan pemindaian otomatis terhadap repository target untuk mengekstrak peta layanan nyata:

### Langkah Ekstraksi Topologi:
1. **Pindai Entitas Monorepo / Services:**
   - Periksa `package.json` (workspaces), `docker-compose.yml`, `pnpm-workspace.yaml`, `Cargo.toml`, atau subdirektori `apps/` & `packages/`.
   - Identifikasi role masing-masing: *Frontend (Web/Mobile)*, *Backend API Hub*, *Worker/Queue*, *Admin*, *Storage Adapter*, *Shared Contracts*.
2. **Pindai Integrasi Layanan Eksternal & Cloud:**
   - Periksa `.env.example`, config file, dan modul client API untuk mendeteksi database (PostgreSQL, Redis, MySQL), AI Inference Gateways (OpenAI, Anthropic, TokenHub, Ollama), CMS (Directus, Strapi), Auth Providers, Payment Gateways, dan Monitoring/Telemetry (Grafana, Prometheus, Sentry).
3. **Pindai Titik Masuk (*Entry Points*) & Port Lokal:**
   - Ekstrak port dev lokal (misal `:5173`, `:3011`, `:9465`, `:8080`) dan URL domain produksi/staging.
4. **Petakan Alur Data Bisnis Utama (*Dataflow Chains*):**
   - Petakan bagaimana aksi pengguna mengalir dari UI -> BFF/API Gateway -> Microservices/Cloud Services -> Database / Third-Party APIs.

---

## 2. Fase 2: Partisi Multi-Stage & Matriks Grid Presisi

Kelompokkan seluruh komponen ke dalam 4 hingga 5 panggung (*stages*) horizontal yang merepresentasikan boundary arsitektur dari kiri ke kanan:

```text
[Stage 0: Fitur/Client] ──60px──> [Stage 1: Local / Compute] ──60px──> [Stage 2: Core Services / Cloud AI] ──60px──> [Stage 3: Data, Ops & Infra]
```

### Aturan Baku Tata Letak (Grid Matrix Precision):

1. **Universal Top Baseline:** Seluruh kotak panggung (`.stage-box`) dan kartu baris pertama (`Row 1`) wajib dimulai pada koordinat vertikal yang sama:
   - Kotak Panggung: `top: 120px`
   - Baris Pertama (`Row 1`): `top: 170px`
2. **Sinkronisasi Baris Horizontal Antar Panggung:**
   Semua kartu pada baris yang sama di panggung berbeda wajib memiliki koordinat `top` yang identik:
   - **Row 1:** `top: 170px` (Entry Fitur Utama | Web Client | Cloud AI Service 1 | Primary Database)
   - **Row 2:** `top: 490px` (Secondary Feature | Backend Core Hub | Cloud Service 2 | Operational Portal)
   - **Row 3:** `top: 810px` (Tertiary Feature | Worker Service | Dynamic CMS | Superadmin Portal)
   - **Row 4:** `top: 1130px` (Monitoring, Observability & Alerting 24/7)
3. **Interval & Spasi Vertikal Seragam (*Vertical Rhythm*):**
   - Tinggi standar kartu `.node-card`: `~265px` s.d. `280px`.
   - Jarak lompatan antar baris (*row step*): `320px` (`170 -> 490 -> 810 -> 1130`).
   - **Visual Gap Bebas Bersih:** Tepat **`50px s.d. 60px`** di antara setiap kartu vertikal (100% bebas tumpang tindih!).
4. **Lebar Koridor Antar Panggung (*Corridor Width*):**
   - Jarak horizontal antar panggung ditetapkan tepat **`60px`** (`Stage 0 (ends 410px)` -> `Stage 1 (left 470px)` = `60px`).
   - Koridor 60px ini berfungsi sebagai jalan tol (*highway conduit*) untuk garis SVG yang berbelok tanpa menabrak kartu.
5. **Kalkulasi Tinggi Kotak Panggung (*Stage Box Auto-Height*):**
   - Rumus: `height = (lastCard.top + lastCard.height + paddingBottom) - stageBox.top`
   - Bungkus setiap panggung dengan *bottom padding* rapi `40-55px` tanpa ekor kosong berlebih.

---

## 3. Fase 3: Standar Desain Visual (Luxury Dark Glassmorphism)

Terapkan palet warna harmonis bertema cyber/cloud premium dengan kontras tinggi:

```css
:root {
    --bg-dark: #07090e;
    --card-bg: rgba(13, 20, 36, 0.88);
    --card-border: rgba(56, 189, 248, 0.22);
    --text-main: #f8fafc;
    --text-muted: #94a3b8;
    
    /* Semantic Colors per Layer */
    --color-feature: #38bdf8;    /* Neon Sky Blue */
    --color-local: #00f0ff;      /* Cyber Cyan */
    --color-backend: #10b981;    /* Emerald Green */
    --color-ai: #f59e0b;         /* Amber AI Engine */
    --color-bifrost: #fbbf24;    /* Gold Audit */
    --color-cms: #ec4899;        /* Rose Content */
    --color-db: #6366f1;         /* Indigo Database */
    --color-finops: #14b8a6;     /* Teal Finance */
    --color-admin: #a855f7;      /* Purple Superadmin */
    --color-grafana: #f97316;    /* Orange Telemetry */
}
```

### Karakteristik Visual Card:
- **Glassmorphism Backdrop:** `backdrop-filter: blur(16px);` dengan border halus `1px solid rgba(255,255,255,0.08)`.
- **Card Hierarchy:**
  1. **Header:** Ikon berbingkai 44px + Judul Layanan + Subjudul Teknis + Badge Status (Port running lokal / Cloud pill).
  2. **Human Summary:** Paragraf penjelasan bahasa manusia (apa fungsi layanan ini bagi bisnis).
  3. **Feature List:** Checklist bullet (`✔`) berisi 2-3 kapabilitas teknis inti.
  4. **Footer Hint:** Indikator status live + CTA interaktif (`Klik detail ->`).

---

## 4. Fase 4: Collision-Free Vector Highway Routing & Precision Port Alignment

Garis alur data (*SVG Flow Edges*) **HARAM** melintasi di atas kartu (*overlapping*) atau tersembunyi tertutup di belakang kartu.

### A. Precision Port Snapping & Vertical Axis Alignment
Untuk koneksi antara komponen bertingkat (atas-ke-bawah):

1. **Aturan Port Vertikal Induk ke Anak:**
   - Jika Node Induk berada di atas Node Anak, jalur koneksi **WAJIB** keluar dari port bawah (`fromPort: "bottom"`) dan masuk ke port atas (`toPort: "top"`).
   - Dilarang keras menggunakan port samping (`left`/`right`) jika kedua kartu tersusun secara vertikal.
2. **Sinkronisasi Sumbu X (Strict Center-X Synchronization):**
   - Titik tengah horizontal (`centerX = left + width / 2`) antara kartu induk dan kartu anak wajib bernilai identik (100% sejajar pada sumbu X).
   - Rumus alinyemen child card dalam container:
     `child.dx = parent.centerX - container.left - (child.width / 2)`
3. **Pembersihan Koridor Alur Vertikal (*Corridor Clearance*):**
   - Card informasi pembantu (seperti data transfer info / filter parameter) tidak boleh ditempatkan melintang di atas sumbu `centerX` aliran vertikal.
   - Posisikan card info di samping koridor (misalnya digeser ke kanan atau kiri dengan offset bebas `dx >= 150px`) agar jalur vertikal bersih dari rintangan (*collision-free*).
4. **Layout Versioning & Cache Invalidation:**
   - Saat mengubah definisi koneksi pada `defaultConnections` atau koordinat di `defaultLayoutState` / `diagram_layout.json`, nilai `LAYOUT_VERSION` wajib dinaikkan (`LAYOUT_VERSION = N + 1`).
   - Hal ini memastikan browser klien yang menyimpan state di `localStorage` otomatis memperbarui cache dan me-render tata letak presisi yang baru.
5. **Strict Layering Z-Index (Anti-Overlap):**
   - Layer SVG kabel (`.flow-line-svg`) WAJIB memiliki `z-index: 2` (atau lebih rendah dari kartu).
   - Seluruh kartu (`.node-card`, `.agent-card`) WAJIB memiliki `z-index: 10` (atau lebih tinggi), sehingga garis SVG tidak akan pernah menutupi teks/permukaan kartu.
6. **Smart Flexible Port Resolution (`resolveSmartPort`):**
   - Garis penghubung harus fleksibel memilih port keluar-masuk paling alami berdasarkan orientasi spasial antar dua kartu (misal kartu B di kanan -> port `right -> left`, kartu B di bawah -> port `bottom -> top`).
   - Algoritma routing (`findCollisionFreeRoute`) wajib memeriksa segmen menengah terhadap seluruh kartu rintangan agar kabel tidak pernah memotong badan kartu mana pun.

### B. Rumus Matematika 5 Rute Bebas Hambatan:

#### 1. Rute Vertikal Satu Panggung (`straight-v`):
```javascript
// Menghubungkan kartu atas ke kartu bawah dalam 1 kolom secara lurus presisi
const startX = r1.centerX;
const startY = r1.bottom;
const endX = r2.centerX;
const endY = r2.top;
pathD = `M ${startX} ${startY} L ${endX} ${endY}`;
```

#### 2. Rute Koridor Antar Kolom Bertetangga (`corridor-bezier`):
```javascript
// Melintasi koridor bebas 60px di antara Stage 1 dan Stage 2
const startX = r1.right;
const startY = r1.top + offset;
const endX = r2.left;
const endY = r2.centerY;
const midX = (startX + endX) / 2; // tepat di tengah koridor 60px
pathD = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX - 6} ${endY} L ${endX} ${endY}`;
```

#### 3. Rute Jalur Langit Atas (`upper-bypass`):
```javascript
// Melintas dari Backend ke Database di panggung ujung lewat langit atas
const upperY = 70; // 100px di atas kartu baris pertama
pathD = `M ${startX} ${startY} ` +
        `C ${corridor12} ${startY}, ${corridor12} 130, ${corridor12} ${upperY + 60} ` +
        `C ${corridor12} ${upperY}, ${corridor12 + 40} ${upperY}, ${corridor12 + 80} ${upperY} ` +
        `L ${corridor23 - 80} ${upperY} ` +
        `C ${corridor23 - 20} ${upperY}, ${corridor23} 100, ${corridor23} 150 ` +
        `L ${corridor23} ${endY - 35} ` +
        `C ${corridor23} ${endY}, ${corridor23 + 20} ${endY}, ${endX - 6} ${endY} ` +
        `L ${endX} ${endY}`;
```

#### 4. Rute Celah Horizontal Antar Baris (`gap-bypass`):
```javascript
// Melintas dari Admin (Stage 3) kembali ke Backend (Stage 1) lewat celah kosong Row 2 & 3
const gapY = (row2.bottom + row3.top) / 2; // misal: y = 782px
pathD = `M ${startX} ${startY} ` +
        `C ${corridor23 + 20} ${startY}, ${corridor23} ${gapY}, ${corridor23 - 25} ${gapY} ` +
        `L ${corridor12 + 25} ${gapY} ` +
        `C ${corridor12} ${gapY}, ${corridor12} ${endY}, ${endX + 6} ${endY} ` +
        `L ${endX} ${endY}`;
```

#### 5. Rute Kolong Bawah Adaptif (`lower-bypass`):
```javascript
// Melintas dari Backend ke Grafana Monitoring lewat ruang terbuka di bawah kartu panggung tengah
const underStage_Y = lastIntermediateCard.bottom + 25; // misal: y = 1100px
pathD = `M ${startX} ${startY} ` +
        `C ${corridor12} ${startY}, ${corridor12} ${startY + 60}, ${corridor12} 1060 ` +
        `C ${corridor12} ${underStage_Y}, ${corridor12 + 40} ${underStage_Y}, ${corridor12 + 100} ${underStage_Y} ` +
        `C ${endX - 160} ${underStage_Y}, ${endX - 60} ${endY}, ${endX - 6} ${endY} ` +
        `L ${endX} ${endY}`;
```

---

## 5. Fase 5: Presisi Vektor Marker & Tangen Murni 0 Derajat / 90 Derajat

Untuk memastikan **kepala panah segitiga 100% tegak lurus, tajam, dan tidak miring/janky**:

1. **Definisi Marker SVG Stabil:**
   ```html
   <marker id="arrow-feature" viewBox="0 0 12 12" refX="9" refY="6" 
           markerWidth="11" markerHeight="11" orient="auto" markerUnits="userSpaceOnUse">
       <path d="M 1.5 2.2 L 10 6 L 1.5 9.8 L 3.8 6 Z" fill="#38bdf8" />
   </marker>
   ```
2. **Kunci Tangen Murni Kedatangan:**
   Setiap path bezier horizontal wajib diakhiri dengan micro-step linier 6px:
   `... C ... ${endX - 6} ${endY} L ${endX} ${endY}`.
   Dengan demikian turunan tangen dy/dx pada titik kedatangan tepat bernilai 0, mengunci kepala panah pada sudut sempurna 0 derajat (horizontal) atau 90 derajat (vertikal).

---

## 6. Fase 6: Engine Interaktif, Wiring Dinamis & End-to-End Auto-Glow

Sertakan JavaScript engine interaktif mandiri:

1. **Pan & Zoom Canvas:**
   - Dukung mouse drag pan pada `#pan-container` dan mouse wheel zoom dengan skala `0.4` s.d. `2.0`.
   - Berikan floating control panel (Zoom In `+`, Zoom Out `-`, Fit Screen `[ ]`, Reset `1:1`).

2. **End-to-End Hover Auto-Glow:**
   - Definisikan `NODE_HOVER_FLOW_MAP` yang memetakan setiap kartu ke seluruh jalur alur data yang relevan.
   - Saat kursor masuk (`mouseenter`) ke sebuah kartu:
     - Aktifkan kelas CSS `.flow-active` pada edge yang terlibat (kecepatan animasi stroke `4s`, glow neon terang).
     - Redupkan kartu dan kabel yang tidak relevan dengan kelas `.dimmed` (`opacity: 0.2`).
     - Perbarui teks banner notifikasi dinamis di bagian atas layar.

3. **Inspector Drawer Detail:**
   - Klik kartu membuka side drawer yang menyajikan deskripsi arsitektur, port lokal, URL staging/prod, entry file, library stack, dan checklist konektivitas.

4. **Radar Mini-Map:**
   - Preview viewport radar di pojok kanan bawah yang mencerminkan posisi kamera saat canvas digeser/di-zoom.

5. **Multi-Port Omnidirectional Node Architecture (4 Sisi):**
   - Setiap kartu mengekspos 4 titik port interaktif (`top`, `bottom`, `left`, `right`) yang diinjeksi secara otomatis:
     ```html
     <div class="card-port port-top" data-port="top" data-card-id="card-id"></div>
     <div class="card-port port-bottom" data-port="bottom" data-card-id="card-id"></div>
     <div class="card-port port-left" data-port="left" data-card-id="card-id"></div>
     <div class="card-port port-right" data-port="right" data-card-id="card-id"></div>
     ```
   - **Kalkulasi Koordinat Port Berbasis World-Space:**
     Perhitungan koordinat port wajib dinamis menggunakan bounding rect relatif terhadap container `#world` dan faktor `scale`:
     ```javascript
     const elRect = el.getBoundingClientRect();
     const worldRect = world.getBoundingClientRect();
     const left = (elRect.left - worldRect.left) / scale;
     const top = (elRect.top - worldRect.top) / scale;
     ```
     Hal ini menjamin port tetap akurat 100% saat canvas di-pan, di-zoom, atau saat kartu/panggung digeser ke mana pun.

6. **Interactive Cable Wiring & Re-Connection Engine:**
   - Fitur tarik-lepas (*drag & drop connect*) dari port mana pun:
     - Saat port di-drag (`mousedown`), muncul garis preview bezier putus-putus (`#wiring-preview`) yang mengikuti pergerakan kursor mouse secara realtime.
     - Saat dilepas (`mouseup`) di atas port kartu lain yang valid, buat entri koneksi baru pada array `customConnections` dan simpan ke `localStorage` (`sc_user_connections`).
     - Validasi sambungan: larang koneksi ke kartu yang sama (*self-loop*) dan cegah duplikasi edge yang identik.

7. **Wide Invisible Hitbox for Line Deletion (24px - 28px):**
   - Garis alur SVG tipis (2.5px - 3.5px) sangat sulit ditargetkan dengan mouse.
   - Setiap koneksi dirender sebagai **dual-path**:
     1. Garis visual (`.flow-line`): beranimasi stroke-dash, tipis, glow neon.
     2. Garis interaksi transparan (`.flow-hitbox`): `stroke: transparent; stroke-width: 26; cursor: pointer;`.
   - Event `click` pada garis hitbox memicu konfirmasi atau penghapusan instan koneksi tersebut dari state.
   - Event `mouseenter` / `mouseleave` pada garis hitbox memicu efek glow/highlight pada garis visual pasangannya.

8. **Strict Drag Event Isolation:**
   - Wajib memisahkan event penarikan kartu dari penarikan port kabel:
     ```javascript
     // Pada card dragging mousedown:
     if (isWiring || e.target.closest(".card-port")) return;
     // Pada window mousemove:
     if (isWiring || !isDraggingCard || !activeDragCard) return;
     ```
   - Event klik pada port wajib memanggil `e.stopPropagation()` agar kartu tidak ikut berpindah saat pengguna sedang menarik kabel.

9. **Draggable Stages & Container Hierarchy:**
   - Wadah panggung (`.stage-box`, `.page2-stage`) wajib didaftarkan di `DRAGGABLE_SELECTOR`.
   - Setiap panggung wajib memiliki ID unik (misal `stage-p1-0`, `stage-p2-3`) agar pergeserannya tersimpan di `localStorage` (`sc_card_positions`).
   - Berikan `pointer-events: auto` dan styling kursor `cursor: grab` (`cursor: grabbing` saat aktif drag) pada header panggung.
   - Hirarki event bubbling: Klik pada kartu anak menggeser kartu anak; klik pada header/area panggung menggeser seluruh panggung beserta elemen di dalamnya; seluruh garis SVG terhubung diperbarui 60 FPS secara real-time.

---

## 7. Quality Assurance & Verification Checklist

Sebelum menyerahkan hasil canvas arsitektur kepada pengguna, verifikasi poin-poin berikut:

- [ ] **Top Row Alignment:** Apakah seluruh kartu baris pertama (`Row 1`) sejajar rata di `top: 170px`?
- [ ] **Matrix Grid Symmetry:** Apakah baris `Row 2`, `Row 3`, dan `Row 4` terkunci pada koordinat vertikal yang sama di setiap panggung?
- [ ] **Visual Gap Rhythm:** Apakah jarak antar kartu vertikal konsisten `50px - 60px` tanpa tumpang tindih?
- [ ] **Vertical Port Snapping:** Apakah hubungan komponen bertingkat atas-bawah menggunakan `fromPort: "bottom"` dan `toPort: "top"` tanpa memutar ke port samping?
- [ ] **Center-X Synchronization:** Apakah titik tengah horizontal (`centerX`) kartu atas dan kartu bawah sejajar sempurna?
- [ ] **Corridor Clearance:** Apakah koridor garis vertikal bebas dari obstacle atau card info yang menghalangi?
- [ ] **4-Port Omnidirectional:** Apakah setiap kartu memiliki titik port interaktif di 4 sisi (top, bottom, left, right)?
- [ ] **Wide Hitbox (26px):** Apakah garis penghubung dilengkapi path hitbox transparan lebar untuk memudahkan klik penghapusan koneksi?
- [ ] **Drag vs Wiring Isolation:** Apakah saat menarik kabel dari port, kartu di bawahnya tidak ikut bergerak?
- [ ] **Draggable Stages:** Apakah kontainer panggung dapat digeser bebas dengan kursor grab dan koordinatnya tersimpan di localStorage?
- [ ] **Live Reconnection:** Apakah pengguna dapat menyambung ulang antar node dengan feedback preview bezier?
- [ ] **Layout Version Invalidation:** Apakah nilai `LAYOUT_VERSION` dinaikkan saat default koneksi diubah?
- [ ] **No Collision / No Hidden Edges:** Apakah tidak ada satu pun garis alur yang menimpa di atas kartu atau tertutup di belakang kartu?
- [ ] **Precision Chevron Tangents:** Apakah seluruh kepala panah menancap 100% lurus tanpa kemiringan miring/diagonal?
- [ ] **Hover Auto-Glow:** Apakah saat kursor menyentuh kartu, rantai alur end-to-end langsung menyala terang dan banner deskripsi terupdate?
- [ ] **Responsive Pan/Zoom:** Apakah navigasi drag pan, wheel zoom, dan klik inspector drawer berfungsi mulus 60 FPS?
