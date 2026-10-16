import fs from 'fs';
import path from 'path';
import { db, isDbConfigured } from '../db';
import { repositories } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { RepoSummary } from './repo-summary';

const ROOT_DATA_DIR = path.resolve(process.cwd(), '../data');
const LOCAL_DATA_DIR = path.resolve(process.cwd(), 'data');

function getSummariesFilePath(): string {
  const p1 = path.join(ROOT_DATA_DIR, 'ai-summaries.json');
  if (fs.existsSync(p1)) return p1;
  const p2 = path.join(LOCAL_DATA_DIR, 'ai-summaries.json');
  if (fs.existsSync(p2)) return p2;
  return p1;
}

export function loadCachedSummaries(): Record<string, RepoSummary> {
  try {
    const filePath = getSummariesFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('ai-summarizer: Gagal membaca ai-summaries.json:', err);
  }
  return {};
}

export function saveCachedSummaries(data: Record<string, RepoSummary>): void {
  try {
    const filePath = getSummariesFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('ai-summarizer: Gagal menyimpan ai-summaries.json:', err);
  }
}

export async function fetchGitHubReadme(owner: string, repo: string): Promise<string> {
  const headers: Record<string, string> = {
    'User-Agent': 'GitHub-Library-Hub-Summarizer/1.0',
    'Accept': 'application/vnd.github.v3+json',
  };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }

  // 1. Coba REST API
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
      headers,
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.content && data.encoding === 'base64') {
        const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
        if (decoded.trim()) return decoded;
      }
    }
  } catch {
    // fallback ke raw content
  }

  // 2. Fallback ke Raw User Content
  for (const branch of ['main', 'master']) {
    for (const filename of ['README.md', 'readme.md', 'README.markdown', 'README.txt']) {
      try {
        const rawRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filename}`, {
          signal: AbortSignal.timeout(5000),
        });
        if (rawRes.ok) {
          const text = await rawRes.text();
          if (text.trim()) return text;
        }
      } catch {
        continue;
      }
    }
  }

  return '';
}

export async function fetchRepoStructureContext(owner: string, repo: string): Promise<string> {
  const detected: string[] = [];
  const candidates = ['skills', '.claude/skills', '.agents/skills', 'commands', 'src/commands', 'plugins', 'tools'];
  const headers: Record<string, string> = {
    'User-Agent': 'GitHub-Library-Hub-Summarizer/1.0',
    'Accept': 'application/vnd.github.v3+json',
  };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }

  for (const sub of candidates) {
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${sub}`, {
        headers,
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const items = await res.json();
        if (Array.isArray(items) && items.length > 0) {
          const names = items
            .filter((item: any) => item && item.name)
            .map((item: any) => item.name);
          detected.push(`Folder '${sub}/': ${names.join(', ')}`);
        }
      }
    } catch {
      continue;
    }
  }

  if (detected.length > 0) {
    return 'STRUKTUR FUNGSI & SKILLS NYATA YANG TERDETEKSI DI REPOSITORY:\n' + detected.join('\n');
  }
  return '';
}

export function cleanReadmeContent(content: string, maxChars = 12000): string {
  const lines = content.split('\n');
  const cleanedLines: string[] = [];
  for (const line of lines) {
    if (/shields\.io|badge|travis-ci|codecov|github\/actions/i.test(line)) {
      continue;
    }
    cleanedLines.push(line);
  }
  const text = cleanedLines.join('\n').trim();
  if (text.length <= maxChars) return text;

  const intro = text.slice(0, 3500);
  const pattern = /(##+\s*(?:what's inside|skills|commands|features|usage|workflow|philosophy|components|api)[\s\S]*?)(?=\n##+ |\Z)/gi;
  const matches = text.match(pattern);
  const keySections: string[] = [];
  if (matches) {
    for (const m of matches.slice(0, 6)) {
      keySections.push(m.trim());
    }
  }

  if (keySections.length > 0) {
    const combined = `${intro}\n\n... [BAGIAN INTI SKILLS & FITUR] ...\n\n${keySections.join('\n\n')}`;
    return combined.slice(0, maxChars);
  }
  return text.slice(0, maxChars);
}

export async function callAiAgent(prompt: string): Promise<string | null> {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  // 1. Prioritas 1: Groq API (Ultra-Fast)
  if (groqKey) {
    const groqModels = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'qwen/qwen3.6-27b'];
    for (const model of groqModels) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content: 'You are the Antigravity AI Agent. Reply ONLY with valid JSON. Never output markdown outside the JSON.',
              },
              { role: 'user', content: prompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2,
          }),
          signal: AbortSignal.timeout(35000),
        });

        if (res.ok) {
          const json = await res.json();
          const content = json.choices?.[0]?.message?.content;
          if (content && content.trim()) {
            return content;
          }
        }
      } catch (err) {
        console.warn(`ai-summarizer: Groq model ${model} gagal, mencoba fallback...`);
      }
    }
  }

  // 2. Prioritas 2: Google Gemini REST API
  if (geminiKey) {
    const geminiModels = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-3.8-flash'];
    for (const model of geminiModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          }),
          signal: AbortSignal.timeout(30000),
        });

        if (res.ok) {
          const json = await res.json();
          const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (content && content.trim()) {
            return content;
          }
        }
      } catch (err) {
        console.warn(`ai-summarizer: Gemini model ${model} gagal, mencoba berikutnya...`);
      }
    }
  }

  return null;
}

export function buildPrompt(
  fullName: string,
  owner: string,
  name: string,
  lang: string,
  desc: string,
  topics: string[] | string,
  readmeExcerpt: string,
  structureContext: string
): string {
  const topicsStr = Array.isArray(topics) ? topics.join(', ') : topics;

  return `Anda adalah "AI Agent Antigravity" untuk platform GitHub Library Hub.
Tugas Anda adalah membedah repositori open-source berikut berdasarkan README asli, tujuan teknis, dan arsitekturnya, lalu menghasilkan ringkasan mendalam yang 100% otentik dan bebas dari template generik.

INFORMASI REPOSITORI:
- Full Name: ${fullName}
- Bahasa Utama: ${lang}
- Deskripsi: ${desc}
- Topik/Tags: ${topicsStr}

${structureContext ? `${structureContext}\n\n` : ''}KONTEN README ASLI (Kutipan):
"""
${readmeExcerpt}
"""

INSTRUKSI OUTPUT:
Hasilkan HANYA objek JSON valid (tanpa markdown backtick atau teks pembuka) dengan skema berikut:

{
  "corePurpose": "Penjelasan presisi 2-3 kalimat dalam Bahasa Indonesia mengenai apa masalah mendasar yang diselesaikan oleh proyek ini dan arsitektur intinya.",
  "problemsSolved": [
    {
      "title": "Nama Masalah Konkret 1",
      "description": "Penjelasan mengapa ini menjadi masalah bagi developer dan bagaimana solusi repo ini mengatasinya."
    },
    {
      "title": "Nama Masalah Konkret 2",
      "description": "Penjelasan detail..."
    },
    {
      "title": "Nama Masalah Konkret 3",
      "description": "Penjelasan detail..."
    }
  ],
  "ladderRules": [
    "Prinsip atau metodologi inti 1 yang diterapkan",
    "Prinsip atau metodologi inti 2 yang diterapkan",
    "Prinsip atau metodologi inti 3 yang diterapkan"
  ],
  "useCases": [
    "Kapan developer harus menggunakan repo ini (Kasus 1)",
    "Kapan developer harus menggunakan repo ini (Kasus 2)",
    "Kapan developer harus menggunakan repo ini (Kasus 3)"
  ],
  "cases": [
    {
      "id": "case1",
      "name": "1. [Nama Studi Kasus Utama yang Relevan dengan Repo Ini]",
      "prompt": "\\\"[Contoh prompt nyata yang diketik developer saat ingin memanfaatkan repositori ini]\\\"",
      "scenarioType": "automation | engine | data | security | ui | efficiency | backend",
      "scenarioBadge": "[Emoji & Label Skenario, contoh: '⚡ Code Intelligence & Blast Radius' atau '🤖 Autonomous Web Agent']",
      "beforeTitle": "BEFORE ([Kondisi sebelum ada repositori ini / pendekatan konvensional])",
      "beforeMeta": "[Ringkasan kelemahan before, misal: Brute-force file scan • Boros 3.000 tokens]",
      "beforeCode": "[Contoh kode atau alur kerja lama yang lambat, rapuh, atau tidak aman]",
      "beforeNotes": [
        { "label": "Kelemahan", "value": "[Kelemahan cara lama]" },
        { "label": "Beban", "value": "[Beban/biaya cara lama]" }
      ],
      "afterTitle": "AFTER (Dengan ${name})",
      "afterMeta": "[Ringkasan keunggulan after, misal: Persistent graph mapping • Hemat 75% tokens]",
      "afterCode": "[Contoh kode atau perintah CLI nyata yang menggunakan ${name}]",
      "afterNotes": [
        { "label": "Keunggulan", "value": "[Solusi nyata ${name}]" },
        { "label": "Hasil", "value": "[Hasil yang didapatkan]" }
      ],
      "ruleBadge": "[Teknologi/prinsip inti repo ini]",
      "metrics": [
        { "label": "[Label Metrik 1, misal: Akurasi / Throughput / Token]", "value": "[Nilai 1]", "color": "emerald" },
        { "label": "[Label Metrik 2, misal: Latensi / Resiliensi / Efisiensi]", "value": "[Nilai 2]", "color": "sky" },
        { "label": "[Label Metrik 3, misal: Integrasi / Format / Protokol]", "value": "[Nilai 3]", "color": "amber" }
      ]
    }
  ],
  "howToUse": [
    {
      "step": 1,
      "title": "[Langkah 1: Instalasi / Setup]",
      "command": "[Perintah terminal untuk instalasi, misal: pip install ... atau npm install ...]",
      "description": "[Penjelasan langkah instalasi atau dependensi]"
    },
    {
      "step": 2,
      "title": "[Langkah 2: Konfigurasi / Inisialisasi]",
      "command": "[Perintah inisialisasi atau setup config]",
      "description": "[Penjelasan konfigurasi atau env setup]"
    },
    {
      "step": 3,
      "title": "[Langkah 3: Eksekusi / Penggunaan]",
      "command": "[Perintah terminal untuk menjalankan fitur utama]",
      "description": "[Penjelasan cara menjalankan atau memanggil]"
    }
  ],
  "commands": [
    {
      "command": "[Nama Command / Slash Command / Sub-command / Skill]",
      "function": "[Fungsi dan penjelasan detail peran perintah ini]",
      "example": "[Contoh pemanggilan nyata di terminal atau chat prompt]"
    }
  ],
  "cloneCommand": "git clone https://github.com/${fullName}.git"
}

ATURAN MUTLAK VISUAL UI:
Field beforeHtml dan afterHtml HANYA boleh dihasilkan jika repositori berfokus murni pada Frontend Web UI (scenarioType == 'ui'). Untuk CLI, backend, framework SDLC, devtools, metodologi, dan engine (scenarioType != 'ui'), DILARANG KERAS membuat beforeHtml/afterHtml; wajib gunakan beforeCode dan afterCode berupa teks/script/command dinamis!

ATURAN DAFTAR COMMANDS:
Bagian commands WAJIB mendaftar SELURUH skill, slash-command, sub-command, atau CLI tools yang ada di repo secara komprehensif tanpa dipotong.
`;
}

export async function generateAiSummary(
  owner: string,
  name: string,
  meta?: {
    fullName?: string;
    description?: string | null;
    primaryLanguage?: string | null;
    topics?: string[] | null;
  }
): Promise<RepoSummary | null> {
  const fullName = meta?.fullName || `${owner}/${name}`;
  const lang = meta?.primaryLanguage || 'Unknown';
  const desc = meta?.description || '';
  const topics = meta?.topics || [];

  const readmeRaw = await fetchGitHubReadme(owner, name);
  const readmeExcerpt = cleanReadmeContent(readmeRaw, 12000);
  const structureContext = await fetchRepoStructureContext(owner, name);

  const prompt = buildPrompt(
    fullName,
    owner,
    name,
    lang,
    desc,
    topics,
    readmeExcerpt,
    structureContext
  );

  const rawResponse = await callAiAgent(prompt);
  if (!rawResponse) return null;

  // Bersihkan backtick markdown jika LLM membungkus JSON
  const cleaned = rawResponse
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    // Sanitasi ketat skenario non-UI
    if (parsed && Array.isArray(parsed.cases)) {
      for (const c of parsed.cases) {
        if (c && c.scenarioType !== 'ui') {
          delete c.beforeHtml;
          delete c.afterHtml;
        }
      }
    }
    return parsed as RepoSummary;
  } catch (err) {
    console.warn('ai-summarizer: Gagal parse JSON respons AI:', err);
    return null;
  }
}

export async function getOrGenerateSummary(
  repoFullName: string,
  options?: {
    forceRefresh?: boolean;
    meta?: {
      owner?: string;
      name?: string;
      description?: string | null;
      primaryLanguage?: string | null;
      topics?: string[] | null;
    };
  }
): Promise<{ summary: RepoSummary | null; source: 'database' | 'cache' | 'llm-generated' | 'fallback' }> {
  const normalizedKey = repoFullName.trim().toLowerCase();
  const parts = normalizedKey.split('/');
  const owner = options?.meta?.owner || parts[0];
  const name = options?.meta?.name || parts[1] || parts[0];

  // 1. Layer 1: Cek Database PostgreSQL Neon jika tidak force refresh
  if (!options?.forceRefresh && db && isDbConfigured) {
    try {
      const foundRepo = await db.query.repositories.findFirst({
        where: (r, { eq, or }) =>
          or(
            eq(sql`lower(${r.fullName})`, normalizedKey),
            eq(sql`lower(${r.githubUrl})`, `https://github.com/${normalizedKey}`)
          ),
      });

      if (foundRepo && foundRepo.aiSummary) {
        return {
          summary: foundRepo.aiSummary as RepoSummary,
          source: 'database',
        };
      }
    } catch (err) {
      console.warn('ai-summarizer: Gagal membaca summary dari DB Neon:', err);
    }
  }

  // 2. Layer 2: Cek Cache File data/ai-summaries.json jika tidak force refresh
  const cachedSummaries = loadCachedSummaries();
  if (!options?.forceRefresh && cachedSummaries[normalizedKey]) {
    const summary = cachedSummaries[normalizedKey];

    // Backfill ke database jika repo ada di DB tapi aiSummary masih kosong
    if (db && isDbConfigured) {
      try {
        await db
          .update(repositories)
          .set({ aiSummary: summary as any, updatedAt: new Date() })
          .where(
            sql`lower(${repositories.fullName}) = ${normalizedKey} OR lower(${repositories.githubUrl}) = ${`https://github.com/${normalizedKey}`}`
          );
      } catch {
        // Abaikan error backfill
      }
    }

    return {
      summary,
      source: 'cache',
    };
  }

  // 3. Layer 3: Generate On-Demand via LLM (Groq / Gemini)
  const newSummary = await generateAiSummary(owner, name, {
    fullName: repoFullName,
    description: options?.meta?.description,
    primaryLanguage: options?.meta?.primaryLanguage,
    topics: options?.meta?.topics,
  });

  if (newSummary) {
    // Simpan ke Database PostgreSQL Neon
    if (db && isDbConfigured) {
      try {
        await db
          .update(repositories)
          .set({ aiSummary: newSummary as any, updatedAt: new Date() })
          .where(
            sql`lower(${repositories.fullName}) = ${normalizedKey} OR lower(${repositories.githubUrl}) = ${`https://github.com/${normalizedKey}`}`
          );
      } catch (err) {
        console.warn('ai-summarizer: Gagal menyimpan summary ke DB Neon:', err);
      }
    }

    // Simpan ke File data/ai-summaries.json (Dual-Layer Sync)
    cachedSummaries[normalizedKey] = newSummary;
    saveCachedSummaries(cachedSummaries);

    return {
      summary: newSummary,
      source: 'llm-generated',
    };
  }

  // 4. Fallback ke cache jika ada sebelumnya saat LLM gagal
  if (cachedSummaries[normalizedKey]) {
    return {
      summary: cachedSummaries[normalizedKey],
      source: 'cache',
    };
  }

  return {
    summary: null,
    source: 'fallback',
  };
}

export interface CategorySuggestion {
  scenario: 'existing_all' | 'existing_group_new_sub' | 'new_all';
  categoryId?: string | null;
  categoryName: string;
  subCategoryId?: string | null;
  subCategoryName: string;
  reason: string;
  confidence?: number;
}

export async function suggestCategoryForRepo(
  repoMeta: {
    owner: string;
    name: string;
    fullName?: string;
    description?: string | null;
    primaryLanguage?: string | null;
    topics?: string[] | null;
  },
  existingCategories: Array<{
    id: string;
    name: string;
    subCategories?: Array<{ id: string; name: string }>;
  }>
): Promise<CategorySuggestion | null> {
  const hierarchyText = existingCategories
    .map(c => {
      const subs = (c.subCategories || []).map(s => `"${s.name}" (ID: ${s.id})`).join(', ');
      return `- Group ID: "${c.id}" | Nama Group: "${c.name}"\n  Sub-groups: [${subs || 'Belum ada sub-group'}]`;
    })
    .join('\n');

  const prompt = `Anda adalah AI Classifier cerdas untuk GitHub Library Hub.
Tugas Anda: Menentukan klasifikasi Group (Kategori Utama) dan Sub-Group (Sub-kategori) yang paling tepat untuk repositori baru berikut.

INFORMASI REPOSITORI:
- Full Name: ${repoMeta.fullName || `${repoMeta.owner}/${repoMeta.name}`}
- Bahasa Utama: ${repoMeta.primaryLanguage || 'Unknown'}
- Deskripsi: ${repoMeta.description || '-'}
- Topik/Tags: ${(repoMeta.topics || []).join(', ')}

DAFTAR KATEGORI & SUB-KATEGORI EXISTING:
${hierarchyText}

ATURAN KLASIFIKASI (WAJIB PILIH SALAH SATU DARI 3 SKENARIO):
1. Skenario "existing_all":
   Gunakan jika repositori COCOK dengan Group yang ada DAN COCOK dengan salah satu Sub-Group existing.
   Format: { "scenario": "existing_all", "categoryId": "<ID-kategori-existing>", "categoryName": "<Nama-kategori-existing>", "subCategoryId": "<ID-subkategori-existing>", "subCategoryName": "<Nama-subkategori-existing>", "reason": "<alasan>", "confidence": 0.95 }

2. Skenario "existing_group_new_sub":
   Gunakan jika repositori COCOK dengan Group yang ada, TETAPI Sub-Group yang tepat belum ada, sehingga perlu dibuatkan Sub-Group baru di bawah Group tersebut.
   Format: { "scenario": "existing_group_new_sub", "categoryId": "<ID-kategori-existing>", "categoryName": "<Nama-kategori-existing>", "subCategoryId": null, "subCategoryName": "<Nama Sub-Group Baru yang Ringkas>", "reason": "<alasan>", "confidence": 0.90 }

3. Skenario "new_all":
   Gunakan HANYA JIKA domain repositori benar-benar di luar seluruh Group yang ada saat ini, sehingga butuh Group baru dan Sub-Group baru.
   Format: { "scenario": "new_all", "categoryId": null, "categoryName": "<Nama Group Baru>", "subCategoryId": null, "subCategoryName": "<Nama Sub-Group Baru>", "reason": "<alasan>", "confidence": 0.85 }

INSTRUKSI OUTPUT:
Keluarkan HANYA objek JSON valid (tanpa markdown backtick atau teks lain).
`;

  try {
    const raw = await callAiAgent(prompt);
    if (!raw) return null;
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!parsed || !parsed.scenario || !parsed.categoryName || !parsed.subCategoryName) {
      return null;
    }

    if (parsed.scenario === 'existing_all' || parsed.scenario === 'existing_group_new_sub') {
      const matchCat = existingCategories.find(
        c => c.id === parsed.categoryId || c.name.toLowerCase() === parsed.categoryName.toLowerCase()
      );
      if (matchCat) {
        parsed.categoryId = matchCat.id;
        parsed.categoryName = matchCat.name;
        if (parsed.scenario === 'existing_all') {
          const matchSub = (matchCat.subCategories || []).find(
            s => s.id === parsed.subCategoryId || s.name.toLowerCase() === parsed.subCategoryName.toLowerCase()
          );
          if (matchSub) {
            parsed.subCategoryId = matchSub.id;
            parsed.subCategoryName = matchSub.name;
          } else {
            parsed.scenario = 'existing_group_new_sub';
            parsed.subCategoryId = null;
          }
        }
      } else {
        parsed.scenario = 'new_all';
        parsed.categoryId = null;
        parsed.subCategoryId = null;
      }
    }

    return parsed as CategorySuggestion;
  } catch (err) {
    console.warn('ai-summarizer: Gagal suggestCategoryForRepo:', err);
    return null;
  }
}
