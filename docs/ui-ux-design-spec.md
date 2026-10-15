# UI/UX Design System Specification: GitHub Library Hub

Spesifikasi desain visual dan interaktif untuk antarmuka **GitHub Library Hub** berbasis panduan `ui-ux-pro-max`.

---

## 1. Design Persona, Mood & Style (Emil Kowalski Craft Philosophy)
- **Primary Archetype**: Craft-level Design Engineering with **Physical Glassmorphism** (bukan flat dark biasa, melainkan gradasi dinamis kaya kedalaman).
- **Aesthetic Direction**: Permukaan kaca fisik nyata dengan *specular highlights* (cahaya pantul pada tepi atas `border-top: rgba(255,255,255,0.28)` dan bayangan bawah `border-bottom: rgba(255,255,255,0.06)`), *backdrop blur & saturation boost* (blur 24px + saturate 190%), serta micro-interaction taktil (`:active transform: scale(0.96-0.98)`).
- **Prinsip Utama Emil**: *"Unseen details compound"* — detail pembiasan kaca dan animasi pegas halus bekerja bersama menciptakan rasa antarmuka yang mewah dan responsif.

---

## 2. 3 Rekomendasi Palet Gradasi Kaca (Gradient Color Schemes)

### Opsi 1: Aurora Borealis (Recommended - Deep & Electric)
- **Karakter**: Misterius, fokus tinggi, pendaran neon elegan.
- **Gradasi Background**: Radial gradient mesh antara Deep Indigo (`#1e1b4b`), Emerald Teal (`#064e3b`), Midnight Blue (`#0f172a`), dan Dark Charcoal (`#090d16`).
- **Aksen Kaca & Cahaya**: Sky Blue (`#38bdf8`) & Electric Violet (`#818cf8`).

### Opsi 2: Sunset Velvet (Warm & Luxurious)
- **Karakter**: Hangat, premium, artistik, kontras tinggi.
- **Gradasi Background**: Radial gradient mesh Rose Ruby (`#881337`), Royal Purple (`#4c1d95`), Wine Crimson (`#be123c`), dan Black Plum (`#180914`).
- **Aksen Kaca & Cahaya**: Coral Rose (`#fb7185`) & Bright Amber (`#f59e0b`).

### Opsi 3: Ethereal Frost (Light Mode Iridescent Glass)
- **Karakter**: Cerah, bersih, modern Apple/macOS Sequoia glass style.
- **Gradasi Background**: Soft pastel mesh Sky Ice (`#bae6fd`), Rose Petal (`#fbcfe8`), Lavender Mist (`#ddd6fe`), dan Milk White (`#f8fafc`).
- **Aksen Kaca & Cahaya**: Deep Ocean (`#0284c7`) & Sharp Slate (`#0f172a`).

---

## 2b. Tabel Review Fisik Kaca (Emil Design Engineering Standard)

| Elemen Kaca Biasa (Flat) | Physical Glass (Emil Standard) | Alasan & Dampak Fisik |
|---|---|---|
| `border: 1px solid rgba(255,255,255,0.1)` | `border-top: 1.5px rgba(255,255,255,0.45)`, `border-bottom: 0.08` | Kaca di dunia nyata memiliki *specular edge* yang menangkap pantulan cahaya langsung dari atas. |
| `backdrop-filter: blur(10px)` | `backdrop-filter: blur(28px) saturate(210%)` | Kaca tebal membiaskan dan meningkatkan saturasi warna yang lewat di bawahnya (*chromatic boost*). |
| Permukaan flat warna solid | `linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03))` + pseudo-element specular sheen | Memberikan kilau pantulan cahaya di permukaan atas kartu layaknya lapisan kaca riil. |
| Background statis polos | **Three.js Interactive 3D WebGL Mesh Backdrop** | Objek 3D geometris (Torus Knot, Icosahedron, Octahedron) melayang dan berputar pelan di balik kaca, bergerak halus mengikuti kursor (*parallax*) sehingga distorsi dan pembiasan kaca terlihat sangat jelas dan nyata secara optik. |
| Shadow satu lapisan | `box-shadow: 0 16px 40px rgba(0,0,0,0.35), inset 0 1.5px 2px rgba(255,255,255,0.4), inset 0 -1px 2px rgba(0,0,0,0.25)` | *Inner glow* atas membuktikan ketebalan optik material kaca, sedangkan inner shadow bawah memberikan efek kedalaman (*depth bevel*). |

---

## 3. Typography Hierarchy & Contrast Standards
- **Font Display / Heading**: Inter / Plus Jakarta Sans (Variable, 600 - 700)
- **Font Body / UI**: Inter (400 - 500, font-size 14px - 15px, line-height 1.5)
- **Font Code / Monospace**: JetBrains Mono / Fira Code (12px - 13px untuk URL, language pill, commit hash)

> **Aturan Keras Kontras (Zero Dull Gray & Ethereal Frost Shadow Rule)**:
> - Pada tema gelap (**Aurora Borealis** & **Sunset Velvet**), seluruh teks sekunder, deskripsi repositori, tag topik, dan metadata wajib menggunakan **Putih Bersih Terang** (`rgba(255, 255, 255, 0.92)` - `#ffffff`) dengan text-shadow halus, BUKAN abu-abu redup, agar tetap tajam dan terbaca jelas di atas gradasi warna.
> - Pada tema **Ethereal Frost**, seluruh teks putih (judul repo, tag topik pill, **serta seluruh teks navigasi menu sidebar**) **WAJIB memiliki black drop shadow berlapis** (`text-shadow: 0 1px 2px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.75), 0 0 1px rgba(0,0,0,0.95)`) agar garis batas teks terlihat sangat kontras, tegas, dan tidak silau di atas permukaan kaca es yang terang. Teks deskripsi menggunakan warna Slate pekat (`#1e293b`) dan footer metadata (`#0f172a`).

---

## 4. Layout Architecture & Component Anatomy

### 4.1 Master Layout Grid
- **Sidebar (Collapsible 280px / 64px Icon Mode)**:
  - Header: Logo icon + App Title ("GitLibrary").
  - Quick Filter: "All Repositories" + total badge.
  - Group Tree: Main Category (dengan icon & counter) -> Sub-categories (nested padding 1.25rem).
  - Quick Actions: "+ Kategori Baru" inline dialog trigger.
  - **Floating Collapse Button**:
    - Posisi: Floating mengambang di tepi kanan garis border sidebar (`absolute -right-[1px] top-6`).
    - Visibilitas: Tersembunyi secara default (`opacity-0`), hanya muncul saat kursor diarahkan ke area sidebar (`sidebar:hover` -> `opacity-100`).
    - Styling: Rounded square dengan border cyan/sky subtle, efek glow dan elevation drop-shadow.
    - Shortcut: Dukungan keyboard shortcut `Ctrl+B` / `Cmd+B`.
    - Mode Collapsed: Menyusut menjadi lebar mini 72px (`4.5rem`) dengan centering simetris untuk logo GitLibrary dan icon kategori inti (tanpa overflow atau terpotong tombol toggle) untuk memaksimalkan ruang kartu repositori.
- **Main Viewport (Flex 1)**:
  - Sticky Header: Global search input (dengan shortcut `Cmd/Ctrl+K`), Filter pill (Language, Sort), dan CTA "+ Add Repository".
  - Hero Metrics Bar: Total Repos, Total Stars, Active Categories.
  - Content Area: Bento Grid 3-kolom responsif (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3`).

### 4.2 Repository Card Anatomy
1. **Header Row**: Owner avatar/icon + Repo name (clickable outbound link) + External link icon.
2. **Category Pill**: Badge kategori dan sub-kategori berwarna subtle (`bg-indigo-500/10 text-indigo-400 border border-indigo-500/20`).
3. **Description**: Multiline clamp (maks 3 baris) dengan text contrast tinggi.
4. **Metadata Bar**:
   - Primary language indicator (dot warna standar GitHub + teks).
   - Stars count (icon bintang + format ribuan `12.4k`).
   - Forks count (icon fork + angka).
5. **Topics / Tags**: Horizontal scrolling tag badges.

### 4.3 Add Repository Modal Flow
1. Input URL GitHub (`https://github.com/:owner/:repo`).
2. Auto-fetch trigger button / on-paste detection dengan loading spinner.
3. Card Preview interaktif: seketika data ditarik dari GitHub API, detail repo langsung muncul di form preview.
4. Cascading Select: Category -> Sub-category (dengan opsi instant `+ Custom Category`).
5. Action Footer: Cancel dan "Simpan ke Library".

### 4.4 Authentic GitHub Repository View Modal (Real Glassmorphism & 3-Theme Adaptive)
Tampilan antarmuka GitHub yang **mengambil data live langsung dari GitHub REST API** saat repositori diklik dengan **efek Real Physical Glassmorphism**:
1. **Glass Architecture & Material Layers**:
   - Kontainer Utama (`.glass-modal-container`): Frosted glass dengan `backdrop-filter: blur(40px) saturate(220%)`, border specular ganda atas `2px solid rgba(255,255,255,0.45)`, dan ambient depth shadow `0 30px 80px rgba(0,0,0,0.85)`.
   - Header & Action Sub-bar: Lapisan frosted transparan tipis (`rgba(22, 27, 34, 0.65)` / `blur(25px)`).
   - Table File Explorer & Container README: Menggunakan `.glass-inner-panel` semi-transparan `blur(20px)` dengan inner specular bevel sehingga siluet Three.js dan gradien warna di belakang modal tetap terbiaskan secara indah.
2. **Sinkronisasi 3 Preset Tema Gradasi**:
   - **Aurora Borealis**: Glass slate transparan dengan aksen cyan & indigo.
   - **Sunset Velvet**: Glass violet pekat transparan dengan border specular pink-rose.
   - **Ethereal Frost**: Glass putih mutiara berkilau (`rgba(255, 255, 255, 0.88)`), border specular kristal, dan teks tajam kontras hitam obsidian.
3. **Live Data Fetch Endpoints**:
   - `GET /repos/:owner/:repo`: Metadata utama (Stars, Forks, Description, Homepage, Topics, Default Branch).
   - `GET /repos/:owner/:repo/contents`: Mengambil daftar folder & file asli dari tree repositori.
   - `GET /repos/:owner/:repo/readme` (dengan header `Accept: application/vnd.github.html+json`): Mengambil HTML rendered resmi dari GitHub Markdown parser sehingga banner gambar, format tabel, dan badges tampil 100% identik.
   - `GET /repos/:owner/:repo/languages`: Mengambil byte size asli tiap bahasa pemrograman untuk kalkulasi proporsi progress bar warna.
2. **Header Top Bar**:
   - Breadcrumb repository: `owner / repo-name` (Public badge).
   - Action buttons: Sponsor, Watch count, Fork count, Star count, dan Outbound Direct Link.
   - Strip tab resmi: `<> Code`, `Issues`, `Pull requests`, `Actions`, `Projects`, `Security`, `Insights`.
3. **Control Bar & File Explorer Tree (Kolom Kiri - 8 Cols)**:
   - Branch selector (`main`), file search `Go to file (t)`, `Add file`, dan tombol hijau `<> Code`.
   - Tabel direktori & file nyata yang dapat diklik langsung ke URL filenya di GitHub.
4. **README.md View Container**:
   - Header README.md dengan copy button & code view.
   - Render HTML langsung dari GitHub.
5. **Sidebar Metadata Panel (Kolom Kanan - 4 Cols)**:
   - About text & website link resmi.
   - Topics / Tags chip badges asli.
   - License info & Release latest.
   - Languages progress bar persentase dinamis sesuai data byte repository.

---

## 5. Micro-interactions & Motion (60fps)
- **Card Hover**: Subtle scale `translateY(-2px)`, border glow `border-indigo-500/40`, shadow elevation.
- **Accordion Toggle**: Smooth transition height `150ms cubic-bezier(0.4, 0, 0.2, 1)`.
- **Button Feedback**: `active:scale-[0.98]` tactile feel.
- **Motion Airfall (Cascade Droplet Physics)**:
  - Custom Popover Menu: `airfallMenu` dengan kurva `cubic-bezier(0.16, 1, 0.3, 1)` durasi 260ms (menghasilkan efek jatuh dari atas dengan overshoot mikro `translateY(3px)` sebelum settle di `translateY(0)`).
  - Staggered Menu Items: `airfallItem` diterapkan bertahap pada tiap child item (Delay item 1: 40ms, item 2: 90ms, item 3: 140ms) sehingga menu terkesan mengalir turun secara organik layaknya tetesan air jatuh (*waterfall*).
  - Physical Light Surface: Popover menu menggunakan high-contrast frosted glass `rgba(13, 18, 30, 0.94)` (dan `rgba(245, 248, 255, 0.96)` pada light frost) dengan `backdrop-filter: blur(36px) saturate(210%)`, inset border highlight atas `rgba(255,255,255,0.35)`, dan deep elevation shadow `0 24px 60px -10px rgba(0,0,0,0.75)` sehingga teks menu tetap tajam dan tidak tembus/bertabrakan dengan elemen kartu di belakangnya.

