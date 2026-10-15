export interface CaseMetric {
  label: string;
  value: string;
  color?: 'emerald' | 'sky' | 'amber' | 'rose' | 'indigo' | 'purple';
}

export interface CaseNote {
  label: string;
  value: string;
}

export interface BeforeAfterCase {
  id: string;
  name: string;
  prompt: string;
  scenarioType?: 'automation' | 'engine' | 'data' | 'security' | 'ui' | 'efficiency' | 'backend' | 'general';
  scenarioBadge?: string;
  beforeTitle: string;
  beforeMeta: string;
  beforeCode: string;
  beforeNotes: CaseNote[] | { token: string; dep: string };
  beforeHtml?: string;
  afterTitle: string;
  afterMeta: string;
  afterCode: string;
  afterNotes: CaseNote[] | { token: string; dep: string };
  afterHtml?: string;
  ruleBadge: string;
  metrics: CaseMetric[] | { lines: string; deps: string; tokenSaving: string };
}

export interface ProblemSolved {
  title: string;
  description: string;
}

export interface UsageStep {
  step: number;
  title: string;
  command?: string;
  description: string;
}

export interface CommandItem {
  command: string;
  function: string;
  example?: string;
}

export interface RepoSummary {
  corePurpose: string;
  problemsSolved: ProblemSolved[];
  ladderRules?: string[];
  useCases: string[];
  cases: BeforeAfterCase[];
  cloneCommand: string;
  howToUse?: UsageStep[];
  commands?: CommandItem[];
}

// 1. Database Kurasi Khusus untuk Repositori Populer
const CURATED_SUMMARIES: Record<string, RepoSummary> = {
  'obra/superpowers': {
    "corePurpose": "Superpowers adalah framework metodologi rekayasa perangkat lunak lengkap untuk coding agent (Claude Code, Antigravity, Cursor, Codex). Berisi 15 skill terkomposisi yang memprogram alur kerja disiplin: klarifikasi spesifikasi sokratik, perancangan rencana bertahap, TDD (Test-Driven Development), pendelegasian subagent mandiri, isolasi Git worktree, dan gerbang verifikasi ketat sebelum merge.",
    "problemsSolved": [
        {
            "title": "AI Menulis Kode Tanpa Arah (Spec Drift)",
            "description": "Agent cenderung langsung mengedit file tanpa memahami gambaran besar. Superpowers menghentikan kebiasaan ini dengan memaksa proses brainstorming dan pembuatan implementation plan granular sebelum menyentuh kode."
        },
        {
            "title": "Ketiadaan Pengujian Otomatis & Regresi Bug",
            "description": "Agent sering membuat asumsi salah yang merusak fungsi existing. Superpowers menerapkan TDD ketat (Red-Green-Refactor) di mana test gagal wajib ada sebelum kode implementasi ditulis."
        },
        {
            "title": "Agen Tersesat pada Tugas Skala Besar",
            "description": "Pada refactor besar, agent sering kehabisan konteks. Fitur subagent-driven-development dan batch execution plan memungkinkan agent bekerja otonom berjam-jam tanpa keluar jalur rencana."
        }
    ],
    "ladderRules": [
        "Spec Before Code: Dilarang menulis implementasi sebelum spesifikasi disetujui pengguna via brainstorming.",
        "Strict TDD (Red-Green-Refactor): Test harus gagal terlebih dahulu sebelum kode fitur ditulis.",
        "Verification Gate: Wajib menjalankan fresh test suite dan review diff sebelum mengklaim pekerjaan selesai."
    ],
    "useCases": [
        "Saat membangun fitur baru pada codebase produksi yang memerlukan jaminan zero-regression.",
        "Ketika ingin membiarkan AI coding agent bekerja otonom selama beberapa jam tanpa deviasi rencana.",
        "Saat melakukan perbaikan bug kritis yang memerlukan isolasi direktori Git worktree dan investigasi akar masalah 4 fase."
    ],
    "cases": [
        {
            "id": "case1",
            "name": "1. Alur Kerja Rekayasa Perangkat Lunak Terarah (Agentic SDLC)",
            "prompt": "\"Buatkan fitur pembayaran langganan bulanan Stripe dengan webhook handling\"",
            "scenarioType": "automation",
            "scenarioBadge": "⚡ Disciplined Agentic SDLC & Strict TDD",
            "beforeTitle": "BEFORE (Coding Ad-hoc & Tanpa Metodologi)",
            "beforeMeta": "Langsung edit kode • 0% Unit Test • Rawan Regresi",
            "beforeCode": "// ❌ AI Coding Ad-hoc (Tanpa Metodologi & Tanpa TDD):\n// 1. Agent langsung mengedit 12 file tanpa spec yang disetujui\n// 2. Tidak ada unit test yang dibuat (0% test coverage)\n// 3. Menimbulkan 14 regresi bug dan runtime errors:\nTypeError: Cannot read properties of undefined (reading 'session_id')\n    at handleCheckout (src/billing.ts:142)\n    at processWebhook (src/webhook.ts:89)\n// 4. Agent tersesat di tengah refactor, mengklaim 'selesai' tanpa verifikasi!",
            "beforeNotes": [
                {
                    "label": "Metodologi",
                    "value": "Ad-hoc tanpa verifikasi bertahap"
                },
                {
                    "label": "Cakupan Tes",
                    "value": "0% (Tidak ada pengujian TDD)"
                },
                {
                    "label": "Risiko",
                    "value": "Tinggi: 14 regresi bug dan spec drift"
                }
            ],
            "afterTitle": "AFTER (Dengan Superpowers - Disciplined SDLC)",
            "afterMeta": "Socratic Spec -> TDD -> Subagent -> 100% Verified",
            "afterCode": "// ✅ Disciplined Agentic SDLC dengan Superpowers:\n// 1. /brainstorming: Menggali spec sokratik -> sepakati arsitektur idempotency\n// 2. /writing-plans: Menyusun 7 langkah granular (2-5 menit per langkah)\n// 3. /test-driven-development: Tulis failing test di tests/billing.test.ts (RED)\n$ npm test -> FAIL: should reject duplicate stripe webhook event (Expected 409, got 200)\n// 4. Implementasi minimum -> test berhasil hijau (GREEN)\n$ npm test -> PASS: all 15 tests passed (100% verified)\n// 5. /subagent-driven-development di Git worktree terisolasi:\n$ agy worktree isolate feature/stripe-webhook -> clean working tree\n// 6. /verification-before-completion: Fresh build & linter sebelum merge",
            "afterNotes": [
                {
                    "label": "Metodologi",
                    "value": "Socratic Brainstorming + Granular Plan"
                },
                {
                    "label": "Cakupan Tes",
                    "value": "100% TDD Verified (Red-Green-Refactor)"
                },
                {
                    "label": "Keamanan",
                    "value": "Git Worktree terisolasi & review gate"
                }
            ],
            "ruleBadge": "Superpowers: 15 Composable Skills & Strict TDD",
            "metrics": [
                {
                    "label": "Ketepatan Spec",
                    "value": "100% Aligned",
                    "color": "emerald"
                },
                {
                    "label": "Cakupan Tes",
                    "value": "TDD Red-Green",
                    "color": "sky"
                },
                {
                    "label": "Otonomi Agen",
                    "value": "Multi-Jam Aman",
                    "color": "amber"
                }
            ]
        }
    ],
    "cloneCommand": "git clone https://github.com/obra/superpowers.git",
    "howToUse": [
        {
            "step": 1,
            "title": "Instalasi Plugin di Harness",
            "command": "agy plugin install https://github.com/obra/superpowers",
            "description": "Untuk Antigravity. Pengguna Claude Code: /plugin install superpowers@claude-plugins-official. Pengguna Cursor: /add-plugin superpowers."
        },
        {
            "step": 2,
            "title": "Aktivasi Metodologi Otomatis",
            "command": "/using-superpowers",
            "description": "Skill bootstrap aktif otomatis saat sesi dimulai, memastikan agen tidak langsung mengedit kode sebelum menyusun rencana."
        },
        {
            "step": 3,
            "title": "Jalankan Siklus TDD & Review",
            "command": "/brainstorming \"Fitur Baru\"",
            "description": "Mulai dari brainstorming spec -> writing-plans -> executing-plans dengan sub-agent -> verification-before-completion."
        }
    ],
    "commands": [
        {
            "command": "/using-superpowers",
            "function": "Bootstrap Utama — Memaksa agent selalu mengecek dan memuat aturan metodologi rekayasa sebelum menyentuh file kode.",
            "example": "Dipicu otomatis saat memulai sesi baru atau dengan perintah /using-superpowers."
        },
        {
            "command": "/brainstorming",
            "function": "Eksplorasi Kebutuhan & Desain — Melakukan interogasi sokratik bertahap untuk menggali spec dan arsitektur sebelum coding dimulai.",
            "example": "/brainstorming \"Rancang sistem autentikasi multi-tenant dengan session timeout\""
        },
        {
            "command": "/writing-plans",
            "function": "Penyusunan Rencana Granular — Memecah spec menjadi implementation plan langkah demi langkah (2-5 menit per langkah) yang testable.",
            "example": "/writing-plans \"Rencana integrasi Stripe checkout dengan idempotency key\""
        },
        {
            "command": "/executing-plans",
            "function": "Eksekusi Batch Rencana Kerja — Menjalankan tugas dari implementation plan secara berurutan dengan checkpoint verifikasi manusia.",
            "example": "/executing-plans implementation-plan.md"
        },
        {
            "command": "/subagent-driven-development",
            "function": "Pendelegasian Mandiri Sub-Agent — Membuka sub-agen dengan prompt terisolasi untuk menyelesaikan task spesifik dan memvalidasi hasilnya.",
            "example": "/subagent-driven-development \"Refactor data layer ke Drizzle ORM\""
        },
        {
            "command": "/dispatching-parallel-agents",
            "function": "Paralelisasi Multi-Agent — Menjalankan 2+ agen konkuren sekaligus pada tugas independen tanpa risiko bentrok shared state.",
            "example": "/dispatching-parallel-agents \"Bikin test suite modul auth dan modul billing secara paralel\""
        },
        {
            "command": "/test-driven-development",
            "function": "TDD Ketat (Red-Green-Refactor) — Memaksa pembuatan test yang gagal terlebih dahulu sebelum diperbolehkan menulis kode implementasi.",
            "example": "/test-driven-development \"Fungsi kalkulasi diskon kupon bertingkat\""
        },
        {
            "command": "/systematic-debugging",
            "function": "Protokol 4-Fase Investigasi Bug — Investigasi akar masalah secara ketat: Reproduksi -> Diagnosis -> Perbaikan terisolasi -> Tes regresi.",
            "example": "/systematic-debugging \"Fix race condition saat user submit order bersamaan\""
        },
        {
            "command": "/verification-before-completion",
            "function": "Gerbang Verifikasi Akhir — Menjalankan fresh build, linter, dan test suite nyata sebelum diizinkan menyatakan tugas selesai.",
            "example": "/verification-before-completion"
        },
        {
            "command": "/using-git-worktrees",
            "function": "Isolasi Workspace Git — Membuat direktori worktree terpisah agar eksperimen agen tidak mengotori working tree git utama.",
            "example": "/using-git-worktrees create feature/payment-gateway"
        },
        {
            "command": "/requesting-code-review",
            "function": "Pengajuan Review Kode — Menyiapkan rangkuman diff, dampak before/after, dan meminta review sebelum branch di-merge.",
            "example": "/requesting-code-review"
        },
        {
            "command": "/receiving-code-review",
            "function": "Penanganan Feedback Review — Membimbing agen merespons feedback review kode secara objektif dan sistematis.",
            "example": "/receiving-code-review"
        },
        {
            "command": "/finishing-a-development-branch",
            "function": "Protokol Penutupan Branch — Menentukan strategi integrasi (merge, rebase, squash, PR) setelah seluruh test suite hijau.",
            "example": "/finishing-a-development-branch"
        },
        {
            "command": "/writing-skills",
            "function": "Penyusunan Skill Baru — Standar TDD untuk merancang, menguji, dan memvalidasi file SKILL.md baru.",
            "example": "/writing-skills \"Buat skill baru untuk integrasi Supabase Auth\""
        },
        {
            "command": "/diagnosing-superpowers",
            "function": "Diagnostik Harness & Plugin — Memeriksa apakah harness (Claude Code, Antigravity, Cursor, Codex) membaca plugin dengan benar.",
            "example": "/diagnosing-superpowers"
        }
    ]
},

  'dietrichgebert/ponytail': {
    corePurpose:
      'Ponytail adalah skill agentic AI yang memprogram pola pikir asisten coding (Claude Code, Cursor, Copilot) agar bertindak seperti senior developer paling efisien: menolak menulis kode spekulatif, memangkas boilerplate, dan memaksa penggunaan standard library native.',
    problemsSolved: [
      {
        title: 'Menghentikan Over-Engineering',
        description: 'Mencegah AI membuat interface berlebihan, factory class, atau scaffolding untuk hal yang belum dibutuhkan.',
      },
      {
        title: 'Mencegah Ketergantungan Paket Liar',
        description: 'AI dilarang menginstal package npm/pip baru jika hal tersebut dapat diselesaikan 3-5 baris native.',
      },
      {
        title: 'Menghemat 40-60% Token Context Window',
        description: 'Kode lebih ramping berarti konsumsi token LLM jauh lebih hemat dan respon jauh lebih cepat.',
      },
    ],
    ladderRules: [
      'Perlu ada? Jika tidak -> batalkan (YAGNI).',
      'Sudah ada di repo? Pakai ulang fungsi existing.',
      'Stdlib bisa? Utamakan modul internal runtime.',
      'Fitur native platform? Gunakan CSS/DOM bawaan.',
      'Dependency terpasang? Manfaatkan yang sudah ada.',
      'Bisa 1 baris? Tulis 1 baris kode saja.',
    ],
    useCases: [
      'Ketika Anda ingin AI memodifikasi kode tanpa merusak arsitektur existing.',
      'Saat ingin menghindari bloated dependencies di project kecil atau microservice.',
      'Saat sesi coding panjang agar token limit context window tidak cepat habis.',
    ],
    cases: [
      {
        id: 'case1',
        name: '1. Form Input Tanggal (UI)',
        prompt: '"Tambahkan date picker ke form frontend saya tanpa library berat"',
        scenarioType: 'ui',
        scenarioBadge: '🎨 UI Efficiency & Minimalism (Native vs Bloated)',
        beforeTitle: 'BEFORE (Tanpa Ponytail - Custom Calendar Bloated)',
        beforeMeta: '335 baris • 1 library eksternal • 4.2 MB bundle',
        beforeCode: `// ❌ Agent membuat komponen kalender custom 335 baris + date-fns
import { useState } from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { format, addMonths, subMonths } from 'date-fns';

export function BloatedDatePicker() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // 300+ baris kalkulasi grid 42 hari, timezone offset, event bubbling...
  return (
    <div className="relative font-sans">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between border border-rose-400 p-2 rounded cursor-pointer"
      >
        <span>{selectedDate ? format(selectedDate, 'dd/MM/yyyy') : 'Pilih Tanggal'}</span>
        <CalendarIcon className="w-5 h-5 text-rose-500" />
      </div>
      {isOpen && (
        <div className="absolute top-full mt-1 bg-slate-900 border border-slate-700 p-3 rounded shadow-2xl z-50">
          <div className="flex justify-between items-center mb-2">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>&lt;</button>
            <span>{format(currentMonth, 'MMMM yyyy')}</span>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>&gt;</button>
          </div>
          {/* Grid hari, tanggal, & kontrol waktu */}
        </div>
      )}
    </div>
  );
}`,
        beforeNotes: [
          { label: 'Token LLM', value: '~480 tokens context' },
          { label: 'Dependensi', value: 'date-fns & heroicons (4.2 MB)' },
          { label: 'Kelemahan', value: '335 baris kode, rawan bug, maintenance berat' },
        ],
        beforeHtml: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #0b0f19; color: #f1f5f9; font-family: ui-sans-serif, system-ui, sans-serif; margin: 0; padding: 12px; }
  </style>
</head>
<body>
  <div class="max-w-xs mx-auto bg-slate-900/90 border border-rose-500/40 rounded-xl p-3.5 shadow-2xl text-xs space-y-2.5">
    <div class="flex items-center justify-between pb-2 border-b border-slate-800">
      <div class="flex items-center space-x-1.5 text-rose-400 font-bold">
        <span>📅</span>
        <span>Custom Calendar v3.4</span>
      </div>
      <span class="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 font-mono">335 baris • Bloated</span>
    </div>

    <!-- Mock Fake Dropdown Trigger -->
    <div class="flex items-center justify-between bg-slate-950 border border-rose-500/50 rounded-lg px-2.5 py-1.5 text-slate-300 shadow-inner">
      <span class="text-rose-200 font-mono">12 / 10 / 2026</span>
      <span class="text-rose-400 text-xs">▼</span>
    </div>

    <!-- Calendar Popover Widget -->
    <div class="bg-slate-950/90 border border-slate-800 rounded-lg p-2.5 space-y-2">
      <div class="flex items-center justify-between text-slate-300 font-semibold px-1">
        <button class="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white">&lt;</button>
        <span class="text-[11px] font-bold text-white">Oktober 2026</span>
        <button class="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white">&gt;</button>
      </div>

      <div class="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-500 font-mono">
        <span>Mg</span><span>Sn</span><span>Sl</span><span>Rb</span><span>Km</span><span>Jm</span><span>Sb</span>
      </div>

      <div class="grid grid-cols-7 gap-1 text-center text-[10px] font-mono">
        <span class="p-1 text-slate-700">28</span><span class="p-1 text-slate-700">29</span><span class="p-1 text-slate-700">30</span>
        <span class="p-1 text-slate-400 hover:bg-slate-800 rounded">1</span><span class="p-1 text-slate-400 hover:bg-slate-800 rounded">2</span>
        <span class="p-1 text-slate-400 hover:bg-slate-800 rounded">3</span><span class="p-1 text-slate-400 hover:bg-slate-800 rounded">4</span>
        <span class="p-1 text-slate-400 hover:bg-slate-800 rounded">5</span><span class="p-1 text-slate-400 hover:bg-slate-800 rounded">6</span>
        <span class="p-1 text-slate-400 hover:bg-slate-800 rounded">7</span><span class="p-1 text-slate-400 hover:bg-slate-800 rounded">8</span>
        <span class="p-1 text-slate-400 hover:bg-slate-800 rounded">9</span><span class="p-1 text-slate-400 hover:bg-slate-800 rounded">10</span>
        <span class="p-1 text-slate-400 hover:bg-slate-800 rounded">11</span>
        <span class="p-1 bg-rose-500 text-white font-bold rounded shadow-md ring-1 ring-rose-400">12</span>
        <span class="p-1 text-slate-400 hover:bg-slate-800 rounded">13</span><span class="p-1 text-slate-400 hover:bg-slate-800 rounded">14</span>
        <span class="p-1 text-slate-400 hover:bg-slate-800 rounded">15</span><span class="p-1 text-slate-400 hover:bg-slate-800 rounded">16</span>
        <span class="p-1 text-slate-400 hover:bg-slate-800 rounded">17</span><span class="p-1 text-slate-400 hover:bg-slate-800 rounded">18</span>
      </div>
    </div>

    <div class="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
      <span class="text-rose-400 font-mono">⚠️ 335 baris • 4.2 MB bundle</span>
      <span>date-fns / heroicons</span>
    </div>
  </div>
</body>
</html>`,
        afterTitle: 'AFTER (Dengan Ponytail - Native HTML5)',
        afterMeta: '10 baris • 0 dependency • Built-in OS Picker',
        afterCode: `// ✅ Ponytail ladder #4: Gunakan fitur native platform browser
// 10 baris kode, zero dependency, aksesibilitas screen reader bawaan OS
export function NativeDatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor="booking-date" className="block text-xs font-medium text-slate-300">
        Pilih Tanggal Mulai
      </label>
      <input
        id="booking-date"
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-900 border border-emerald-500/40 rounded-lg px-3 py-2 text-white text-xs focus:ring-2 focus:ring-emerald-500 font-mono"
      />
    </div>
  );
}`,
        afterNotes: [
          { label: 'Token LLM', value: '45 tokens (-90%)' },
          { label: 'Dependensi', value: 'Pure Platform Native (0 KB)' },
          { label: 'Keunggulan', value: 'Aksesibilitas bawaan OS, zero bug maintenance' },
        ],
        afterHtml: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #0b0f19; color: #f1f5f9; font-family: ui-sans-serif, system-ui, sans-serif; margin: 0; padding: 12px; }
    input[type="date"]::-webkit-calendar-picker-indicator {
      filter: invert(0.8) sepia(100%) saturate(300%) hue-rotate(95deg);
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="max-w-xs mx-auto bg-slate-900/90 border border-emerald-500/40 rounded-xl p-4 shadow-2xl text-xs space-y-3">
    <div class="flex items-center justify-between pb-2 border-b border-slate-800">
      <div class="flex items-center space-x-1.5 text-emerald-400 font-bold">
        <span>⚡</span>
        <span>Native Platform Input</span>
      </div>
      <span class="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">0 KB Dep • HTML5</span>
    </div>

    <div class="space-y-1.5">
      <label for="date-input" class="block text-[11px] font-semibold text-slate-300">
        Pilih Tanggal Mulai:
      </label>
      <input
        id="date-input"
        type="date"
        value="2026-10-12"
        class="w-full bg-slate-950 border border-emerald-500/40 rounded-lg px-3 py-2 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/60 shadow-inner"
      />
    </div>

    <div class="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-[11px] text-emerald-200/90 space-y-1">
      <div class="flex items-center space-x-1 font-semibold text-emerald-300">
        <span>✓</span>
        <span>Aksesibilitas & Dialog Kalender Bawaan OS</span>
      </div>
      <p class="text-[10px] text-slate-400 leading-relaxed">
        Langsung memunculkan pemilih tanggal native iOS/Android/Windows tanpa bundle JavaScript tambahan.
      </p>
    </div>

    <div class="flex items-center justify-between text-[10px] text-slate-500 pt-0.5 font-mono">
      <span class="text-emerald-400">✓ 10 Baris Kode</span>
      <span>0 Dependensi</span>
    </div>
  </div>
</body>
</html>`,
        ruleBadge: 'Ponytail Ladder: Native Platform Feature First',
        metrics: [
          { label: 'Baris Kode', value: '-97% Ringkas', color: 'emerald' },
          { label: 'Dependensi', value: '0 (Pure HTML5)', color: 'sky' },
          { label: 'Token Context', value: '-90% Hemat', color: 'amber' },
        ],
      },
      {
        id: 'case2',
        name: '2. Format Tanggal String (Intl)',
        prompt: '"Format tanggal ISO ke teks Bahasa Indonesia tanpa library berat"',
        scenarioType: 'efficiency',
        scenarioBadge: '⚡ Standard Library First & YAGNI',
        beforeTitle: 'BEFORE (Tanpa Ponytail - AI Over-engineering)',
        beforeMeta: '38 baris • 1 npm package • Abstract Factory',
        beforeCode: `// ❌ Install package besar + buat abstract class
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

interface IDateFormatterService {
  formatDate(raw: string): string;
}

export class CustomDateFormatterService implements IDateFormatterService {
  public formatDate(rawDate: string): string {
    try {
      const parsed = parseISO(rawDate);
      return format(parsed, 'dd MMMM yyyy', { locale: id });
    } catch (err) {
      throw new Error('Failed parsing date');
    }
  }
}`,
        beforeNotes: [
          { label: 'Token LLM', value: '~360 tokens context' },
          { label: 'Dependensi', value: 'date-fns (4.2 MB)' },
        ],
        afterTitle: 'AFTER (Dengan Ponytail - Native & Minimal)',
        afterMeta: '2 baris • 0 dependency • Built-in Intl',
        afterCode: `// ✅ Gunakan standar bawaan platform browser/Node.js
export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('id-ID', { dateStyle: 'long' });`,
        afterNotes: [
          { label: 'Token LLM', value: '32 tokens (-91%)' },
          { label: 'Dependensi', value: 'Pure Platform Native' },
        ],
        ruleBadge: 'Ponytail Ladder: Stdlib & Platform Native First',
        metrics: [
          { label: 'Baris Kode', value: '-95% Ringkas', color: 'emerald' },
          { label: 'Dependensi', value: '0 (Pure Native)', color: 'sky' },
          { label: 'Token Context', value: '-91% Hemat', color: 'amber' },
        ],
      },
      {
        id: 'case3',
        name: '3. Deep Clone Object',
        prompt: '"Buat fungsi deep copy object konfigurasi tanpa library eksternal"',
        scenarioType: 'efficiency',
        scenarioBadge: '⚡ Standard Library First',
        beforeTitle: 'BEFORE (Tanpa Ponytail - AI Over-engineering)',
        beforeMeta: '26 baris • lodash.clonedeep utility class',
        beforeCode: `// ❌ Install paket lodash hanya untuk clone object
import cloneDeep from 'lodash/cloneDeep';

export class CloneUtilityService<T> {
  private target: T;
  constructor(initial: T) { this.target = initial; }
  
  public executeClone(): T {
    return cloneDeep(this.target);
  }
}`,
        beforeNotes: [
          { label: 'Token LLM', value: '~280 tokens' },
          { label: 'Dependensi', value: 'lodash (70 KB min)' },
        ],
        afterTitle: 'AFTER (Dengan Ponytail - Native & Minimal)',
        afterMeta: '1 baris • 0 dependency • Native Engine',
        afterCode: `// ✅ Gunakan built-in structuredClone standard library
export const deepCopy = <T>(data: T): T => structuredClone(data);`,
        afterNotes: [
          { label: 'Token LLM', value: '21 tokens (-92%)' },
          { label: 'Dependensi', value: 'Native structuredClone' },
        ],
        ruleBadge: 'Ponytail Ladder: Stdlib Native First',
        metrics: [
          { label: 'Baris Kode', value: '-95%', color: 'emerald' },
          { label: 'Dependensi', value: '0 (Built-in)', color: 'sky' },
          { label: 'Token Context', value: '-92% Hemat', color: 'amber' },
        ],
      },
    ],
    cloneCommand: 'git clone https://github.com/DietrichGebert/ponytail.git',
    howToUse: [
      {
        step: 1,
        title: 'Instalasi / Setup Skill',
        command: 'npx @dietrichgebert/ponytail install',
        description: 'Menginstal skill Ponytail ke lingkungan agent Claude Code, OpenCode, atau menyalin SKILL.md ke folder .claude/skills/.',
      },
      {
        step: 2,
        title: 'Konfigurasi Mode Default (Opsional)',
        command: 'export PONYTAIL_DEFAULT_MODE=full',
        description: "Menentukan intensitas default saat sesi agent dimulai: 'full' (default standard), 'lite', atau 'ultra' (ekstrem YAGNI).",
      },
      {
        step: 3,
        title: 'Aktivasi & Eksekusi Perintah',
        command: '/ponytail',
        description: 'Ketik slash command /ponytail di prompt percakapan agent untuk mengaktifkan aturan lazy developer seketika.',
      },
    ],
    commands: [
      {
        command: '/ponytail',
        function: 'Mode Full (Default) — Memaksa tangga prioritas efisiensi: YAGNI -> Cari fungsi existing -> Native stdlib -> Platform fitur -> 1 baris -> Minimal code.',
        example: '/ponytail "Implementasi parser JSON sederhana"',
      },
      {
        command: '/ponytail lite',
        function: 'Mode Lite — Membangun kode yang diminta secara utuh, namun selalu menyertakan rekomendasi alternatif paling sederhana dalam 1 baris ringkas.',
        example: '/ponytail lite',
      },
      {
        command: '/ponytail ultra',
        function: 'Mode Ultra (YAGNI Extremist) — Mengutamakan penghapusan kode daripada penambahan. Langsung menantang apakah abstraksi atau fitur spekulatif benar-benar diperlukan.',
        example: '/ponytail ultra',
      },
      {
        command: '/ponytail off',
        function: "Deaktivasi Mode — Mematikan sementara aturan Ponytail dan mengembalikan AI ke perilaku default (juga bisa dengan mengetik 'stop ponytail' atau 'normal mode').",
        example: '/ponytail off',
      },
      {
        command: '/ponytail-review',
        function: 'Review Over-Engineering — Memeriksa git diff atau Pull Request untuk mendeteksi boilerplate, factory class tunggal, atau interface berlebih yang layak di-inline.',
        example: '/ponytail-review',
      },
      {
        command: '/ponytail-audit',
        function: 'Audit Seluruh Repositori — Memindai seluruh codebase dan menghasilkan ranking daftar file, dependensi, atau fitur berlebih yang layak dihapus.',
        example: '/ponytail-audit',
      },
      {
        command: '/ponytail-debt',
        function: "Pelacak Utang Teknis — Mengumpulkan seluruh komentar shortcut '# ponytail:' dari seluruh file kode ke dalam satu ledger pelacak terstruktur.",
        example: '/ponytail-debt',
      },
      {
        command: '/ponytail-gain',
        function: 'Scoreboard Efisiensi — Mengukur dampak nyata yang dihasilkan: penurunan jumlah baris kode, penghematan token context, dan estimasi pengurangan biaya API.',
        example: '/ponytail-gain',
      },
      {
        command: '/ponytail-help',
        function: 'Kartu Referensi Cepat — Menampilkan ringkasan one-shot seluruh mode, trigger perintah, dan level intensitas Ponytail tanpa mengubah state sesi.',
        example: '/ponytail-help',
      },
    ],
  },

  'vllm-project/vllm': {
    corePurpose:
      'vLLM adalah engine inference dan serving LLM berperforma tinggi dengan throughput tinggi yang memelopori PagedAttention untuk mengelola cache KV (Key-Value) memori GPU secara efisien tanpa fragmentasi.',
    problemsSolved: [
      {
        title: 'Pemborosan Memori GPU (KV Cache Fragmentation)',
        description: 'PagedAttention membagi memori KV cache ke blok-blok virtual non-kontigu, menghemat hingga 60-80% VRAM.',
      },
      {
        title: 'Latensi Batching Lambat & OOM',
        description: 'Continuous batching memproses request baru seketika tanpa harus menunggu iterasi token request lain selesai.',
      },
      {
        title: 'Throughput Rendah saat Multi-User Request',
        description: 'Mampu melayani 2x hingga 4x lebih banyak request paralel per detik dibandingkan HuggingFace Transformers standar.',
      },
    ],
    useCases: [
      'Menjalankan LLM open-weight (Llama 3, Mistral, Qwen, DeepSeek) di server lokal atau GPU cloud production.',
      'Membangun API gateway kompatibel OpenAI (/v1/chat/completions) dengan latensi rendah.',
      'Skenario throughput tinggi dengan request konkuren simultan ribuan user.',
    ],
    cases: [
      {
        id: 'case1',
        name: '1. Production Serving & Continuous Batching',
        prompt: '"Deploy Llama-3-8B untuk melayani 50 user simultan tanpa GPU OOM"',
        scenarioType: 'engine',
        scenarioBadge: '⚡ High-Throughput LLM Engine',
        beforeTitle: 'BEFORE (Vanilla Transformers / FastAPI Manual)',
        beforeMeta: 'Manual Python Loop • Batching Sekuensial • VRAM Fragmented',
        beforeCode: `# ❌ Menulis serving server manual dengan PyTorch & HuggingFace
from fastapi import FastAPI
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

app = FastAPI()
model = AutoModelForCausalLM.from_pretrained("meta-llama/Meta-Llama-3-8B")

# Masalah Kritis:
# 1. Tidak ada continuous batching: Request baru harus antre hingga generasi selesai
# 2. KV Cache kontigu: 60-80% VRAM terbuang karena reservasi statis
# 3. Crash OOM (Out Of Memory) saat concurrency > 2`,
        beforeNotes: [
          { label: 'Kendala VRAM', value: 'Fragmentasi KV Cache Parah (OOM)' },
          { label: 'Throughput', value: 'Sangat Rendah (~4 req/detik)' },
        ],
        afterTitle: 'AFTER (vLLM High-Throughput Serving Engine)',
        afterMeta: 'PagedAttention • Continuous Batching • Multi-GPU Tensor Parallel',
        afterCode: `# ✅ 1 Perintah CLI otomatis membuka OpenAI-compatible API Server
vllm serve meta-llama/Meta-Llama-3-8B-Instruct \\
  --tensor-parallel-size 1 \\
  --max-model-len 8192 \\
  --gpu-memory-utilization 0.90 \\
  --port 8000

# Solusi:
# 1. PagedAttention memetakan memori KV seperti Virtual Memory OS
# 2. Iteration-level continuous batching: throughput melonjak 3.5x`,
        afterNotes: [
          { label: 'Throughput', value: '3.5x - 4x Concurrency' },
          { label: 'Alokasi VRAM', value: 'Zero Memory Fragmentation' },
        ],
        ruleBadge: 'vLLM: PagedAttention & Continuous Batching',
        metrics: [
          { label: 'Throughput', value: '3.5x Naik', color: 'emerald' },
          { label: 'Efisiensi VRAM', value: '-70% Limbah', color: 'sky' },
          { label: 'Protokol', value: 'OpenAI Ready', color: 'amber' },
        ],
      },
      {
        id: 'case2',
        name: '2. Offline Batch Inference Skala Besar',
        prompt: '"Lakukan inferensi offline batch untuk 10.000 prompt dokumen"',
        scenarioType: 'engine',
        scenarioBadge: '⚡ Vectorized Batch Computing',
        beforeTitle: 'BEFORE (Loop Manual dengan Padding Token)',
        beforeMeta: 'Padding memboroskan komputasi GPU & lambat',
        beforeCode: `# ❌ Loop manual dengan padding memboroskan komputasi GPU
outputs = []
for batch in chunk(prompts, 8):
    inputs = tokenizer(batch, padding=True, return_tensors="pt")
    # GPU terbebani menghitung padding token kosong
    outputs.extend(model.generate(**inputs))`,
        beforeNotes: [
          { label: 'Waktu Komputasi', value: 'Tinggi (Terganggu Padding)' },
          { label: 'Utilisasi GPU', value: 'Di bawah 40%' },
        ],
        afterTitle: 'AFTER (vLLM Offline LLM Engine)',
        afterMeta: 'Dynamic batching tanpa waste padding token',
        afterCode: `# ✅ vLLM memproses batch secara paralel dengan optimalisasi KV Cache
from vllm import LLM, SamplingParams

llm = LLM(model="meta-llama/Meta-Llama-3-8B")
outputs = llm.generate(prompts, SamplingParams(temperature=0.7))`,
        afterNotes: [
          { label: 'Waktu Komputasi', value: '4x Lebih Cepat' },
          { label: 'Utilisasi GPU', value: '>90% Optimal' },
        ],
        ruleBadge: 'Memory Efficiency & Dynamic Batching',
        metrics: [
          { label: 'Kecepatan', value: '4x Speedup', color: 'emerald' },
          { label: 'Padding Waste', value: '0% (Eliminated)', color: 'sky' },
          { label: 'Pipeline', value: 'Declarative Engine', color: 'amber' },
        ],
      },
    ],
    cloneCommand: 'git clone https://github.com/vllm-project/vllm.git',
  },

  'browser-use/browser-use': {
    corePurpose:
      'Browser-use adalah controller open-source yang memungkinkan AI Agent (seperti GPT-4o, Claude 3.5 Sonnet) untuk berinteraksi langsung dengan web browser layaknya manusia: navigasi visual, ekstraksi data cerdas, dan eksekusi form multi-langkah otonom.',
    problemsSolved: [
      {
        title: 'Script Web Scraping Kerap Patah (Selector Fragility)',
        description: 'Menggantikan selector CSS/XPath statis yang mudah rusak saat web redesign dengan pemahaman visual multimodal & accessibility DOM tree.',
      },
      {
        title: 'Alur Otomasi Web Multi-Langkah yang Rumit',
        description: 'Agent secara otonom dapat mencari tiket, memfilter harga, login 2FA, dan mengisi formulir panjang tanpa panduan koordinat manual.',
      },
      {
        title: 'Integrasi Playwright yang Kompleks & Kaku',
        description: 'Menyediakan interface tingkat tinggi yang langsung menghubungkan model reasoning LLM ke browser runtime aktif.',
      },
    ],
    useCases: [
      'Otomasi tugas riset pasar, intelijen kompetitor, dan monitoring data web dinamis.',
      'Testing UI/UX aplikasi web secara otonom hanya dengan prompt bahasa alami.',
      'Ekstraksi informasi dari portal internal yang membutuhkan alur login dan navigasi interaktif.',
    ],
    cases: [
      {
        id: 'case1',
        name: '1. Web Navigation & Scraping',
        prompt: '"Buka flight comparison, cari tiket Jakarta-Tokyo termurah bulan depan"',
        scenarioType: 'automation',
        scenarioBadge: '🤖 Autonomous Agent & Self-Healing DOM',
        beforeTitle: 'BEFORE (Scripting Manual Selenium / Playwright)',
        beforeMeta: '70+ baris selector kaku • Mudah patah saat redesign',
        beforeCode: `// ❌ Script kaku dengan class selector yang rentan rusak
await page.goto('https://flights.example.com');
await page.waitForSelector('.search-origin-input-v2');
await page.click('.search-origin-input-v2');
await page.type('.search-origin-input-v2', 'CGK');
await page.click('.btn-dropdown-select-item-3'); // fragile!

// Masalah:
// Sekali struktur CSS / class name web di-update, script langsung patah!
// Butuh maintenance terus-menerus oleh developer.`,
        beforeNotes: [
          { label: 'Resiliensi', value: 'Sangat Rendah (Selector Fragile)' },
          { label: 'Maintenansi', value: 'Tinggi (Update script tiap web berubah)' },
        ],
        afterTitle: 'AFTER (Autonomous Agent Browser-Use)',
        afterMeta: '5 baris instruksi deklaratif • Resilient & Multimodal',
        afterCode: `# ✅ Instruksi dalam bahasa manusia, AI memahami tampilan secara visual
from browser_use import Agent
from langchain_openai import ChatOpenAI

agent = Agent(
    task="Buka flights comparison, cari tiket Jakarta ke Tokyo termurah bulan depan, lalu download ringkasan PDF",
    llm=ChatOpenAI(model="gpt-4o"),
)
await agent.run()

# Solusi:
# AI menganalisis Accessibility Tree & Screenshot: tahan terhadap perubahan class CSS!`,
        afterNotes: [
          { label: 'Resiliensi', value: 'Self-Healing (Vision & A11y Tree)' },
          { label: 'Maintenansi', value: 'Zero Selector Maintenance' },
        ],
        ruleBadge: 'Browser-Use: Vision & DOM Tree Understanding',
        metrics: [
          { label: 'Resiliensi', value: 'Self-Healing', color: 'emerald' },
          { label: 'Metode', value: 'Multimodal AI', color: 'sky' },
          { label: 'Perawatan', value: 'Zero Selector', color: 'amber' },
        ],
      },
    ],
    cloneCommand: 'git clone https://github.com/browser-use/browser-use.git',
  },

  'rtk-ai/rtk': {
    corePurpose:
      'RTK (Rust Token Killer) adalah CLI proxy cerdas ultra-cepat yang memangkas konsumsi token LLM sebesar 60-90% pada perintah developer umum (git diff, test, build, lint) untuk asisten coding AI seperti Claude Code, Cursor, dan Codex.',
    problemsSolved: [
      {
        title: 'Pemborosan Token pada Output CLI Panjang',
        description: 'Perintah seperti git diff atau npm test sering menghasilkan ratusan baris log mentah yang membakar token context window secara sia-sia.',
      },
      {
        title: 'Kelebihan Beban Token pada Format Output Mentah',
        description: 'RTK menyaring informasi esensial dan mengubah error log menjadi format padat ramah tokenizer sebelum dikirim ke LLM.',
      },
      {
        title: 'Zero Overhead & Single Binary',
        description: 'Ditulis dalam Rust murni tanpa runtime tambahan, beroperasi dalam hitungan milidetik tanpa memperlambat terminal.',
      },
    ],
    useCases: [
      'Sebagai wrapper CLI saat sesi Claude Code atau Cursor terminal.',
      'Menghemat biaya token API saat menjalankan tes atau inspect diff berukuran besar.',
      'Menjaga token window tetap bersih dari spam build logs.',
    ],
    cases: [
      {
        id: 'case1',
        name: '1. Git Diff & Test Output Proxy',
        prompt: '"Jalankan git diff dan tes unit lalu kirim ke AI assistant"',
        scenarioType: 'efficiency',
        scenarioBadge: '⚡ Token Optimization & Developer Proxy',
        beforeTitle: 'BEFORE (Raw Terminal Output Mentah)',
        beforeMeta: '450+ baris logs mentah • Membakar context window',
        beforeCode: `# ❌ Raw git diff & npm test membakar context window
$ git diff
diff --git a/src/app.ts b/src/app.ts
index e69de29..d95f3ad 100644
--- a/src/app.ts
+++ b/src/app.ts
... 300 lines of verbose logs & unchanged lines ...
# Total: ~2.400 token terbuang hanya untuk 2 baris esensial`,
        beforeNotes: [
          { label: 'Konsumsi Token', value: '~2.400 tokens terbakar' },
          { label: 'Noise Rasio', value: '85% boilerplate log' },
        ],
        afterTitle: 'AFTER (RTK Filtered & Compact Output)',
        afterMeta: '18 baris padat • Rust sub-millisecond proxy',
        afterCode: `# ✅ RTK memfilter noise & hanya menyajikan diff decisive
$ rtk git diff
Modified src/app.ts:
+ L42: validateInput(req)
- L42: // legacy bypass
Summary: 1 file changed, 1 insertion, 1 deletion.
# Token hemat 88%, LLM langsung paham inti perubahan`,
        afterNotes: [
          { label: 'Konsumsi Token', value: '280 tokens (-88% Hemat)' },
          { label: 'Binary Runtime', value: 'Single Rust Executable (0 Dep)' },
        ],
        ruleBadge: 'RTK: Token-Optimized Developer Proxy',
        metrics: [
          { label: 'Token Saving', value: '-88% Hemat', color: 'emerald' },
          { label: 'Runtime Delay', value: '<5ms Overhead', color: 'sky' },
          { label: 'Kerapian', value: 'Decisive Signal', color: 'amber' },
        ],
      },
    ],
    cloneCommand: 'git clone https://github.com/rtk-ai/rtk.git',
  },
};

// 2. Dynamic Auto-Summary Generator untuk Berbagai Macam Skenario Repositori
export function getRepoSummary(repoData: any): RepoSummary {
  if (!repoData) {
    return {
      corePurpose: 'Repositori GitHub yang terkurasi di katalog.',
      problemsSolved: [
        { title: 'Otomasi & Peningkatan Produktivitas', description: 'Mempermudah integrasi dan pengembangan alur kerja modern.' },
      ],
      useCases: ['Pengembangan aplikasi modern.', 'Integrasi sistem terstandar.'],
      cases: [],
      cloneCommand: 'git clone https://github.com/...',
    };
  }

  const fullName = (repoData.full_name || repoData.fullName || `${repoData.owner}/${repoData.name}`).toLowerCase();
  
  // Jika ada di kurasi khusus, gunakan kurasi khusus
  if (CURATED_SUMMARIES[fullName]) {
    return CURATED_SUMMARIES[fullName];
  }

  const name = repoData.name || 'Repository';
  const owner = typeof repoData.owner === 'string' ? repoData.owner : repoData.owner?.login || 'User';
  const desc = repoData.description || 'Repositori open-source GitHub terkurasi dengan fungsionalitas modular.';
  const lang = repoData.language || repoData.primaryLanguage || 'TypeScript';
  const topics: string[] = (repoData.topics || []).map((t: string) => t.toLowerCase());
  const cloneUrl = `git clone https://github.com/${owner}/${name}.git`;

  const allKeywords = `${name} ${desc} ${topics.join(' ')}`.toLowerCase();

  // Deteksi Berbagai Arketipe Skenario
  const isAutonomousAgent = 
    /agent|browser|crawl|scrape|playwright|puppeteer|automation|selenium|bot|autonomous|workflow|extractor/i.test(allKeywords);

  const isEngineOrInfra = 
    /vllm|inference|engine|serving|cuda|gpu|distributed|cache|cluster|docker|kubernetes|paged|tensor/i.test(allKeywords);

  const isDataPipeline = 
    /kafka|spark|flink|etl|pipeline|streaming|dbt|arrow|clickhouse|duckdb|parquet|analytics|sql|database|postgres/i.test(allKeywords);

  const isSecurityAuth = 
    /auth|oauth|jwt|security|crypto|permission|rbac|scanner|vault|leak|firewall|zero-trust|guard/i.test(allKeywords);

  const isFrontendUI = 
    /react|next|vue|svelte|ui|tailwind|css|component|design-system|three|animation|canvas|webgl|gsap|framer/i.test(allKeywords) ||
    /TypeScript|JavaScript/i.test(lang);

  const isDevToolEfficiency = 
    /cli|linter|format|token|compiler|builder|bundler|devtool|rust|cargo|terminal|test/i.test(allKeywords) ||
    /Rust|Go/i.test(lang);

  // 1. Skenario Otonom / Web Agent / Otomasi
  if (isAutonomousAgent) {
    return {
      corePurpose: `${name} adalah sistem otomasi cerdas berbasis ${lang}. Dirancang untuk: ${desc}`,
      problemsSolved: [
        {
          title: 'Selector & Alur Otomasi yang Rentan Rusak (Fragile Scripts)',
          description: 'Menggantikan skrip hardcoded CSS/XPath yang gampang patah saat target web atau alur mengalami perubahan desain.',
        },
        {
          title: 'Kompleksitas Navigasi Multi-Langkah & Form Handling',
          description: 'Mengotomasi alur multi-langkah kompleks secara otonom dengan penalaran kontekstual.',
        },
        {
          title: 'Tingginya Beban Maintenance Script',
          description: 'Menghilangkan kebutuhan update skrip berulang setiap kali antarmuka sasaran berubah.',
        },
      ],
      useCases: [
        `Otomasi proses ekstraksi data web skala besar dan riset terstruktur.`,
        `Testing alur pengguna end-to-end secara otonom dengan bahasa alami.`,
        `Integrasi alur kerja antar platform yang tidak memiliki API resmi.`,
      ],
      cases: [
        {
          id: 'case1',
          name: `1. Otomasi Alur ${name}`,
          prompt: `"Jalankan alur tugas multi-langkah dan ekstraksi data menggunakan ${name}"`,
          scenarioType: 'automation',
          scenarioBadge: '🤖 Autonomous & Resilient Automation',
          beforeTitle: 'BEFORE (Scripting Statis / Selector Kaku)',
          beforeMeta: 'Script manual rapuh • Sering error saat struktur target berubah',
          beforeCode: `// ❌ Script kaku berbasis selector statis
await target.click('.btn-action-primary-v2');
await target.type('#input-query-field', 'data target');
await target.waitForSelector('.result-item-row');
// Rentan error total jika class name atau tata letak berubah sedikit saja!`,
          beforeNotes: [
            { label: 'Stabilitas', value: 'Sangat Rendah (Selector Fragile)' },
            { label: 'Maintenansi', value: 'Harus perbaiki script manual' },
          ],
          afterTitle: `AFTER (Dengan ${name})`,
          afterMeta: 'Otonom & adaptif • Resilient terhadap perubahan struktur',
          afterCode: `// ✅ Menggunakan orkestrasi adaptif ${name}
import { createWorkflow } from '${name.toLowerCase()}';

const runner = createWorkflow({
  objective: "Ekstraksi data target dan selesaikan navigasi secara adaptif"
});
await runner.execute();`,
          afterNotes: [
            { label: 'Stabilitas', value: 'Self-Healing & Context-Aware' },
            { label: 'Maintenansi', value: 'Zero Hardcoded Selector' },
          ],
          ruleBadge: 'Resilient Automation: Context-Aware Execution',
          metrics: [
            { label: 'Ketahanan', value: 'Self-Healing', color: 'emerald' },
            { label: 'Metode', value: 'Context-Aware', color: 'sky' },
            { label: 'Maintenance', value: 'Otomatis', color: 'amber' },
          ],
        },
      ],
      cloneCommand: cloneUrl,
    };
  }

  // 2. Skenario Engine / High-Performance / Serving / GPU
  if (isEngineOrInfra) {
    return {
      corePurpose: `${name} adalah engine berperforma tinggi yang dibangun dengan ${lang}. Dirancang untuk: ${desc}`,
      problemsSolved: [
        {
          title: 'Latensi Tinggi & Bottleneck Concurrency',
          description: 'Mengatasi antrean panjang dan penurunan throughput saat melayani permintaan simultan dalam volume tinggi.',
        },
        {
          title: 'Pemborosan Sumber Daya Komputasi / Memori',
          description: 'Optimalisasi alokasi memori dan komputasi hardware agar tidak terjadi starvation atau OOM.',
        },
        {
          title: 'Kompleksitas Scaling Horisontal',
          description: 'Menyediakan fondasi performa tinggi yang mudah didistribusikan antar cluster/node komputasi.',
        },
      ],
      useCases: [
        `Serving beban kerja berskala besar dengan kebutuhan latensi rendah.`,
        `Optimasi pemanfaatan hardware (GPU/CPU/RAM) secara maksimal.`,
        `Infrastruktur backend mission-critical berkapasitas tinggi.`,
      ],
      cases: [
        {
          id: 'case1',
          name: `1. Throughput & Resource Scaling`,
          prompt: `"Tangani lonjakan concurrency tinggi menggunakan ${name}"`,
          scenarioType: 'engine',
          scenarioBadge: '⚡ High-Throughput Engine',
          beforeTitle: 'BEFORE (Pemrosesan Sekuensial / Naive Concurrency)',
          beforeMeta: 'Resource bottleneck • Latensi melonjak saat beban naik',
          beforeCode: `# ❌ Pemrosesan standar tanpa optimasi memory/batching
# Beban tinggi menyebabkan buffer overflow atau memory spike
for task in incoming_requests:
    process_task_synchronously(task) # Bottleneck antrean panjang!`,
          beforeNotes: [
            { label: 'Throughput', value: 'Terbatas (Single Pipeline)' },
            { label: 'Konsumsi Memori', value: 'Boros & Rawan Crash' },
          ],
          afterTitle: `AFTER (Dengan ${name})`,
          afterMeta: 'Continuous pipeline • Alokasi resource optimal',
          afterCode: `# ✅ 1 Pipeline teroptimasi dengan ${name}
from ${name.toLowerCase()} import Engine

engine = Engine.init(concurrency_mode="high-throughput")
await engine.process_stream(incoming_requests)`,
          afterNotes: [
            { label: 'Throughput', value: 'Multi-Stream Concurrency' },
            { label: 'Konsumsi Memori', value: 'Zero Resource Waste' },
          ],
          ruleBadge: 'High Concurrency & Memory Efficiency',
          metrics: [
            { label: 'Throughput', value: 'Maksimal', color: 'emerald' },
            { label: 'Efisiensi RAM/VRAM', value: 'Teroptimasi', color: 'sky' },
            { label: 'Latensi', value: 'Sub-detik', color: 'amber' },
          ],
        },
      ],
      cloneCommand: cloneUrl,
    };
  }

  // 3. Skenario Data Pipeline / Streaming / Analytical
  if (isDataPipeline) {
    return {
      corePurpose: `${name} adalah solusi data dan analitik modern berbasis ${lang}. Dirancang untuk: ${desc}`,
      problemsSolved: [
        {
          title: 'Bottleneck Pemrosesan Data Skala Besar (ETL Lag)',
          description: 'Mempercepat transformasi dan query data bervolume tinggi tanpa menghabiskan waktu berjam-jam.',
        },
        {
          title: 'Inkonsistensi Skema & Data Drift',
          description: 'Menjaga integritas data di seluruh pipeline dengan kontrak tipe data yang ketat.',
        },
        {
          title: 'Tingginya Biaya Penyimpanan & Komputasi',
          description: 'Kompresi efisien dan format penyimpanan berbasis kolom untuk menghemat biaya operasional.',
        },
      ],
      useCases: [
        `Pipeline analitik data real-time dan batching terdistribusi.`,
        `Transformasi dan ingestion jutaan baris data per detik.`,
        `Dashboard analitik dengan kebutuhan query interaktif sub-detik.`,
      ],
      cases: [
        {
          id: 'case1',
          name: `1. Efisiensi Query & Data Stream`,
          prompt: `"Proses dan query aliran data volume besar dengan ${name}"`,
          scenarioType: 'data',
          scenarioBadge: '📊 Scalable Data Stream & Vectorized Query',
          beforeTitle: 'BEFORE (Row-by-Row Processing Tradisional)',
          beforeMeta: 'Latensi query tinggi • Memori server cepat penuh',
          beforeCode: `-- ❌ Scanning baris per baris yang lambat pada data besar
SELECT * FROM raw_events 
WHERE created_at > NOW() - INTERVAL '7 days'
-- Mengakibatkan full-table scan dan memory exhaustion!`,
          beforeNotes: [
            { label: 'Kecepatan Query', value: 'Detik - Menit (Scanning lambat)' },
            { label: 'Penyimpanan', value: 'Ukuran besar tanpa kompresi' },
          ],
          afterTitle: `AFTER (Dengan ${name})`,
          afterMeta: 'Vectorized columnar query • Kompresi tinggi & instan',
          afterCode: `-- ✅ Query teroptimasi berbasis kolom dengan ${name}
SELECT event_type, count() 
FROM events_optimized 
GROUP BY event_type;
-- Hasil instan dalam hitungan milidetik!`,
          afterNotes: [
            { label: 'Kecepatan Query', value: 'Milidetik (Vectorized)' },
            { label: 'Kompresi', value: 'Hemat penyimpanan hingga 70%' },
          ],
          ruleBadge: 'High-Throughput Analytics & Compression',
          metrics: [
            { label: 'Kecepatan Query', value: 'Sub-detik', color: 'emerald' },
            { label: 'Kompresi', value: 'Hingga 70%', color: 'sky' },
            { label: 'Skalabilitas', value: 'Petabyte Scale', color: 'amber' },
          ],
        },
      ],
      cloneCommand: cloneUrl,
    };
  }

  // 4. Skenario Security / Auth / Cryptography
  if (isSecurityAuth) {
    return {
      corePurpose: `${name} adalah modul keamanan dan autentikasi standar industri dalam ${lang}. Dirancang untuk: ${desc}`,
      problemsSolved: [
        {
          title: 'Celah Keamanan & Kerentanan Autentikasi Custom',
          description: 'Mencegah celah keamanan umum (OWASP, token leakage, replay attack) akibat implementasi auth sendiri.',
        },
        {
          title: 'Kompleksitas Manajemen Kunci, Token, & Sesi',
          description: 'Mengelola siklus hidup token, rotasi kunci, dan enkripsi secara otomatis dan aman.',
        },
        {
          title: 'Kurangnya Standarisasi Audit Trail & Kepatuhan',
          description: 'Menyediakan logging audit yang terenkripsi dan sesuai standar kepatuhan keamanan modern.',
        },
      ],
      useCases: [
        `Pemberian autentikasi dan otorisasi aman (RBAC/ABAC) pada API.`,
        `Proteksi data sensitif dengan enkripsi end-to-end teruji.`,
        `Pemenuhan standar kepatuhan regulasi dan audit keamanan.`,
      ],
      cases: [
        {
          id: 'case1',
          name: `1. Hardened Security & Auth Flow`,
          prompt: `"Amankan akses endpoint dan kelola kredensial dengan ${name}"`,
          scenarioType: 'security',
          scenarioBadge: '🛡️ Zero-Trust Security & Hardened Isolation',
          beforeTitle: 'BEFORE (Implementasi Auth Ad-hoc / Rawan Celah)',
          beforeMeta: 'Pengecekan token manual • Rentan kebocoran kredensial',
          beforeCode: `// ❌ Validasi manual yang mudah dilewati atau bocor
if (req.headers.token === process.env.SECRET) {
  // Plaintext check tanpa proteksi timing attack atau token expiry!
  next();
}`,
          beforeNotes: [
            { label: 'Tingkat Keamanan', value: 'Rentan (High Risk)' },
            { label: 'Standar Audit', value: 'Tidak Terstandar' },
          ],
          afterTitle: `AFTER (Dengan ${name})`,
          afterMeta: 'Zero-Trust guard • Enkripsi kuat & rotasi token otomatis',
          afterCode: `// ✅ Menggunakan proteksi terstandar ${name}
import { securityGuard } from '${name.toLowerCase()}';

app.use(securityGuard({
  strictValidation: true,
  autoRotateKeys: true
}));`,
          afterNotes: [
            { label: 'Tingkat Keamanan', value: 'Hardened (Zero-Trust)' },
            { label: 'Standar Audit', value: 'Compliant & Safe' },
          ],
          ruleBadge: 'Zero-Trust Architecture & Cryptographic Integrity',
          metrics: [
            { label: 'Postur Keamanan', value: 'Hardened', color: 'emerald' },
            { label: 'Kepatuhan', value: 'OWASP Compliant', color: 'sky' },
            { label: 'Resiko Celah', value: 'Minimal', color: 'amber' },
          ],
        },
      ],
      cloneCommand: cloneUrl,
    };
  }

  // 5. Skenario Frontend / UI / Motion / Animation
  if (isFrontendUI) {
    return {
      corePurpose: `${name} adalah pustaka antarmuka pengguna berbasis ${lang}. Dirancang untuk: ${desc}`,
      problemsSolved: [
        {
          title: 'Pola Komponen Tidak Konsisten & Boilerplate DOM',
          description: 'Menyediakan komponen modular yang seragam, aksesibel, dan mudah dikustomisasi tanpa styling berulang.',
        },
        {
          title: 'Masalah Frame Rate, Jitter, & Layout Thrashing',
          description: 'Mengoptimalkan rendering antarmuka agar tetap mulus pada 60/120 FPS tanpa membebani browser main-thread.',
        },
        {
          title: 'Kompleksitas Adaptasi Responsif & Tema (Dark/Light)',
          description: 'Dukungan responsif penuh dan sistem tema yang adaptif out-of-the-box.',
        },
      ],
      useCases: [
        `Membangun antarmuka modern yang reaktif dan responsif.`,
        `Menambahkan interaktivitas visual dan micro-interaction yang halus.`,
        `Standarisasi sistem desain tim frontend secara terstruktur.`,
      ],
      cases: [
        {
          id: 'case1',
          name: `1. Implementasi Komponen ${name}`,
          prompt: `"Gunakan ${name} untuk integrasi antarmuka yang mulus dan deklaratif"`,
          scenarioType: 'ui',
          scenarioBadge: '🎨 Modern UI/UX & Declarative Rendering',
          beforeTitle: 'BEFORE (DOM Imperatif / Styling Manual Rumit)',
          beforeMeta: 'Banyak file CSS tersebar • Rentan layout shift & jank',
          beforeCode: `/* ❌ Ratusan baris styling dan manipulasi DOM manual */
const el = document.getElementById('animated-box');
el.addEventListener('scroll', () => {
  // Manipulasi inline style manual menyebabkan layout thrashing!
  el.style.transform = \`translateY(\${window.scrollY * 0.5}px)\`;
});`,
          beforeNotes: [
            { label: 'Frame Rate', value: 'Rentan Frame Drops (Jitter)' },
            { label: 'Maintainability', value: 'Kode spaghetti sulit diubah' },
          ],
          beforeHtml: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>body { background: #0b0f19; color: #f8fafc; font-family: ui-sans-serif, system-ui, sans-serif; padding: 12px; margin: 0; }</style>
</head>
<body>
  <div class="max-w-xs mx-auto bg-slate-900 border border-rose-500/40 rounded-xl p-3.5 shadow-xl text-xs space-y-2.5">
    <div class="flex items-center justify-between pb-1.5 border-b border-slate-800">
      <span class="font-bold text-rose-400">⚠️ DOM Imperatif Manual</span>
      <span class="text-[10px] text-rose-300 font-mono">Layout Shift</span>
    </div>
    <div class="h-16 bg-slate-950 rounded-lg border border-rose-500/30 flex items-center justify-center text-slate-500 text-center p-2 text-[11px]">
      Manipulasi inline style manual rentan jitter & frame drop
    </div>
    <div class="flex justify-between text-[10px] text-slate-500">
      <span>Rentan Memory Leak</span>
      <span class="text-rose-400">FPS: Drop</span>
    </div>
  </div>
</body>
</html>`,
          afterTitle: `AFTER (Dengan ${name})`,
          afterMeta: 'Deklaratif • GPU-accelerated & Reusable',
          afterCode: `// ✅ 1 Komponen deklaratif siap pakai
import { ${name.replace(/[^a-zA-Z0-9]/g, '') || 'Component'} } from '${name.toLowerCase()}';

export const ModernView = () => (
  <${name.replace(/[^a-zA-Z0-9]/g, '') || 'Component'} 
    variant="smooth" 
    hardwareAccelerated={true} 
  />
);`,
          afterNotes: [
            { label: 'Frame Rate', value: 'Mulus 60-120 FPS' },
            { label: 'Maintainability', value: 'Komponen modular & type-safe' },
          ],
          afterHtml: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>body { background: #0b0f19; color: #f8fafc; font-family: ui-sans-serif, system-ui, sans-serif; padding: 12px; margin: 0; }</style>
</head>
<body>
  <div class="max-w-xs mx-auto bg-slate-900 border border-emerald-500/40 rounded-xl p-3.5 shadow-xl text-xs space-y-2.5">
    <div class="flex items-center justify-between pb-1.5 border-b border-slate-800">
      <span class="font-bold text-emerald-400">✨ ${name} Deklaratif</span>
      <span class="text-[10px] text-emerald-300 font-mono">60-120 FPS</span>
    </div>
    <div class="h-16 bg-slate-950 rounded-lg border border-emerald-500/30 flex items-center justify-center text-emerald-200/90 text-center p-2 font-medium text-[11px]">
      Komponen modern teroptimasi GPU & fluid transition
    </div>
    <div class="flex justify-between text-[10px] text-slate-400">
      <span class="text-emerald-400">✓ Zero Layout Shift</span>
      <span>GPU Accelerated</span>
    </div>
  </div>
</body>
</html>`,
          ruleBadge: 'Declarative UI & Hardware Accelerated',
          metrics: [
            { label: 'Kelancaran', value: '60/120 FPS', color: 'emerald' },
            { label: 'Arsitektur', value: 'Modular UI', color: 'sky' },
            { label: 'Integrasi', value: 'Drop-in Ready', color: 'amber' },
          ],
        },
      ],
      cloneCommand: cloneUrl,
    };
  }

  // 6. Skenario Developer Tooling / CLI / Efficiency
  if (isDevToolEfficiency) {
    return {
      corePurpose: `${name} adalah developer tooling yang dibangun dengan ${lang}. Dirancang untuk: ${desc}`,
      problemsSolved: [
        {
          title: 'Waktu Build & Eksekusi Perintah yang Lambat',
          description: 'Menggantikan proses kompilasi atau tooling lambat dengan binary ultra-cepat berskala native.',
        },
        {
          title: 'Overhead Konfigurasi yang Rumit',
          description: 'Menyediakan konfigurasi zero-setup atau default cerdas yang langsung dapat digunakan.',
        },
        {
          title: 'Inkonsistensi Alur Kerja Developer dalam Tim',
          description: 'Menstandarkan perintah terminal dan format luaran agar ramah pengembang dan CI/CD pipeline.',
        },
      ],
      useCases: [
        `Mempercepat siklus feedback loop saat pengembangan lokal (DX).`,
        `Otomasi tugas repetitive terminal dan integrasi CI/CD.`,
        `Penghematan konsumsi sumber daya dan waktu eksekusi.`,
      ],
      cases: [
        {
          id: 'case1',
          name: `1. Kecepatan & Efisiensi ${name}`,
          prompt: `"Jalankan alur kerja menggunakan ${name} untuk efisiensi instan"`,
          scenarioType: 'efficiency',
          scenarioBadge: '⚡ Ultra-Fast Tooling & Zero Overhead',
          beforeTitle: 'BEFORE (Tooling Lambat & Konfigurasi Berbelit)',
          beforeMeta: 'Beban dependency besar • Eksekusi memakan waktu lama',
          beforeCode: `# ❌ Menjalankan tooling legacy yang boros memori dan lambat
$ legacy-tool --config=giant-config.json
... Menunggu kompilasi dan dependency check (~20-40 detik) ...
... Menghasilkan output sangat verbose yang sulit dibaca ...`,
          beforeNotes: [
            { label: 'Waktu Eksekusi', value: 'Puluhan Detik (Lambat)' },
            { label: 'Ukuran Paket', value: 'Ratusan MB node_modules' },
          ],
          afterTitle: `AFTER (Dengan ${name})`,
          afterMeta: 'Sub-detik instan • Zero-config native binary',
          afterCode: `# ✅ 1 Perintah instan yang ringkas dan padat
$ ${name.toLowerCase()} run --fast
✔ Selesai dalam 12ms (Single native execution)`,
          afterNotes: [
            { label: 'Waktu Eksekusi', value: 'Instan (~12ms)' },
            { label: 'Ukuran Paket', value: 'Single Lightweight Executable' },
          ],
          ruleBadge: 'High-Performance Developer Tooling',
          metrics: [
            { label: 'Kecepatan', value: 'Instan (~ms)', color: 'emerald' },
            { label: 'Overhead', value: 'Nol Boilerplate', color: 'sky' },
            { label: 'Developer DX', value: 'Optimal', color: 'amber' },
          ],
        },
      ],
      cloneCommand: cloneUrl,
    };
  }

  // 7. Skenario Umum / Backend Architecture Fallback
  return {
    corePurpose: `${name} adalah proyek open-source terkurasi yang dibangun dengan ${lang}. Dirancang untuk: ${desc}`,
    problemsSolved: [
      {
        title: 'Mengurangi Waktu Setup & Konfigurasi Manual',
        description: `Menyediakan fondasi arsitektur siap pakai sehingga pengembang tidak perlu merakit fondasi ${lang} dari awal.`,
      },
      {
        title: 'Standarisasi Pola Kode & Best Practices',
        description: `Menerapkan konvensi industri dan optimasi standar untuk ekosistem ${lang}.`,
      },
      {
        title: 'Modularitas & Kemudahan Integrasi Sistem',
        description: `Struktur kode yang mudah diadopsi ke dalam proyek yang sudah ada tanpa konflik dependensi besar.`,
      },
    ],
    useCases: [
      `Pengembangan proyek modern berbasis ${lang}.`,
      `Mempercepat siklus deployment dan pembuatan prototipe cepat.`,
      `Fondasi arsitektur yang aman dan scalable untuk kebutuhan skala tim.`,
    ],
    cases: [
      {
        id: 'case1',
        name: `1. Standarisasi Service ${name}`,
        prompt: `"Terapkan arsitektur modular menggunakan ${name}"`,
        scenarioType: 'backend',
        scenarioBadge: '🏗️ Modular Architecture & Clean Structure',
        beforeTitle: 'BEFORE (Struktur Ad-hoc & Setup Manual)',
        beforeMeta: 'Manual setup • Rentan ketidakkonsistenan antar modul',
        beforeCode: `# ❌ Setup manual dan konfigurasi berulang
export ENV_CONFIG=dev
python run_custom_setup.py --manual-wiring
# Terlalu banyak boilerplate tanpa pola standar!`,
        beforeNotes: [
          { label: 'Setup Time', value: 'Lambat & Rentan Konfigurasi Salah' },
          { label: 'Arsitektur', value: 'Tightly-coupled' },
        ],
        afterTitle: `AFTER (Dengan ${name})`,
        afterMeta: '1 Entrypoint terpadu • Modular & clean',
        afterCode: `# ✅ Terpadu dan siap jalan dalam hitungan detik
${name.toLowerCase()} init --standardized
# Siap digunakan dengan pola arsitektur terbaik`,
        afterNotes: [
          { label: 'Setup Time', value: 'Siap Pakai (Plug & Play)' },
          { label: 'Arsitektur', value: 'Clean & Decoupled' },
        ],
        ruleBadge: 'Best Practice: Modular & Maintainable',
        metrics: [
          { label: 'Kemudahan', value: 'Plug & Play', color: 'emerald' },
          { label: 'Arsitektur', value: 'Clean Code', color: 'sky' },
          { label: 'Konsistensi', value: 'Standar Industri', color: 'amber' },
        ],
      },
    ],
    cloneCommand: cloneUrl,
  };
}

