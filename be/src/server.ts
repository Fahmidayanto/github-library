import express, { Request, Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, isDbConfigured } from './db/index.js';
import { categories, subCategories, repositories } from './db/schema.js';
import { desc, eq, sql, or } from 'drizzle-orm';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_STORE_PATH = path.resolve(__dirname, '../../data/library-store.json');
const AI_SUMMARIES_PATH = path.resolve(__dirname, '../../data/ai-summaries.json');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Initial seed categories & repositories
const initialCategories: any[] = [
  {
    id: 'cat-1',
    name: 'Large Language Models',
    slug: 'llm',
    icon: 'cpu',
    description: 'Inference engines, quantization, dan serving frameworks.',
    subCategories: [
      { id: 'sub-1', name: 'Inference Engines', slug: 'inference' },
      { id: 'sub-2', name: 'Quantization & Run', slug: 'quantization' },
      { id: 'sub-3', name: 'Fine-Tuning', slug: 'fine-tuning' },
    ],
  },
  {
    id: 'cat-2',
    name: 'RAG & Vector Search',
    slug: 'rag',
    icon: 'database',
    description: 'Vector databases, retrievers, dan embedding pipelines.',
    subCategories: [
      { id: 'sub-4', name: 'Vector Databases', slug: 'vector-db' },
      { id: 'sub-5', name: 'Retrieval Pipelines', slug: 'retrievers' },
      { id: 'sub-6', name: 'Chunking & Parser', slug: 'parsers' },
    ],
  },
  {
    id: 'cat-3',
    name: 'Video & Multimodal',
    slug: 'video',
    icon: 'video',
    description: 'Video generation, auto-captioning, motion editing.',
    subCategories: [
      { id: 'sub-7', name: 'Text-to-Video', slug: 't2v' },
      { id: 'sub-8', name: 'Video Assembly', slug: 'assembly' },
      { id: 'sub-9', name: 'Animation & Motion', slug: 'motion' },
    ],
  },
  {
    id: 'cat-4',
    name: 'AI Agent Frameworks',
    slug: 'agent',
    icon: 'bot',
    description: 'Multi-agent orchestration, reasoning loops, dan tool-use.',
    subCategories: [
      { id: 'sub-10', name: 'Multi-Agent Orchestrator', slug: 'orchestrator' },
      { id: 'sub-11', name: 'Browser Agents', slug: 'browser-agents' },
      { id: 'sub-12', name: 'Coding Agents', slug: 'coding-agents' },
    ],
  },
  {
    id: 'cat-5',
    name: 'AI Agent Skills & Tools',
    slug: 'skill',
    icon: 'sparkles',
    description: 'Extensible skill repositories, prompts, dan MCP integrations.',
    subCategories: [
      { id: 'sub-tokensaver', name: 'Token Saver & Cost', slug: 'token-saver-cost' },
      { id: 'sub-uiux', name: 'UI/UX & Frontend', slug: 'ui-ux-frontend' },
      { id: 'sub-webagent', name: 'Web & Browser Agent', slug: 'web-browser-agent' },
      { id: 'sub-mcp', name: 'MCP & Protocols', slug: 'mcp-protocols' },
      { id: 'sub-memory', name: 'Memory & Knowledge', slug: 'memory-knowledge' },
    ],
  },
];

const initialRepositories: any[] = [
  {
    id: 'repo-rtk',
    categoryId: 'cat-5',
    subCategoryId: 'sub-tokensaver',
    categoryName: 'AI Agent Skills & Tools',
    subCategoryName: 'Token Saver & Cost',
    githubUrl: 'https://github.com/rtk-ai/rtk',
    owner: 'rtk-ai',
    name: 'rtk',
    fullName: 'rtk-ai/rtk',
    description: 'CLI proxy that reduces LLM token consumption by 60-90% on common dev commands. Single Rust binary, zero dependencies',
    starsCount: 82990,
    forksCount: 5268,
    primaryLanguage: 'Rust',
    topics: ['agentic-coding', 'ai-coding', 'anthropic', 'claude-code', 'cli', 'command-line-tool', 'cost-reduction', 'developer-tools', 'llm', 'open-source', 'productivity', 'rust', 'token-optimization'],
    homepage: 'https://www.rtk-ai.app',
    license: 'Apache-2.0',
    isFeatured: true,
  },
  {
    id: 'repo-caveman',
    categoryId: 'cat-5',
    subCategoryId: 'sub-tokensaver',
    categoryName: 'AI Agent Skills & Tools',
    subCategoryName: 'Token Saver & Cost',
    githubUrl: 'https://github.com/JuliusBrussee/caveman',
    owner: 'JuliusBrussee',
    name: 'caveman',
    fullName: 'JuliusBrussee/caveman',
    description: '🪨 why use many token when few token do trick. Viral skill + proxy for coding agents that cuts 65% of tokens by talking like a caveman.',
    starsCount: 111087,
    forksCount: 6429,
    primaryLanguage: 'Unknown',
    topics: ['ai', 'anthropic', 'caveman', 'claude', 'claude-code', 'llm', 'meme', 'prompt-engineering', 'skill', 'tokens'],
    homepage: '',
    license: 'MIT',
    isFeatured: true,
  },
  {
    id: 'repo-1',
    categoryId: 'cat-5',
    subCategoryId: 'sub-uiux',
    categoryName: 'AI Agent Skills & Tools',
    subCategoryName: 'UI/UX & Frontend',
    githubUrl: 'https://github.com/DietrichGebert/ponytail',
    owner: 'DietrichGebert',
    name: 'ponytail',
    fullName: 'DietrichGebert/ponytail',
    description: 'Makes your AI agent think like the laziest senior dev in the room. The best code is the code you never wrote.',
    starsCount: 160900,
    forksCount: 8700,
    primaryLanguage: 'JavaScript',
    topics: ['agent-skills', 'ai-agents', 'claude-code', 'prompt-engineering', 'yagni'],
    homepage: 'https://ponytail.dev',
    license: 'MIT',
    isFeatured: true,
  },
  {
    id: 'repo-2',
    categoryId: 'cat-1',
    subCategoryId: 'sub-1',
    categoryName: 'Large Language Models',
    subCategoryName: 'Inference Engines',
    githubUrl: 'https://github.com/vllm-project/vllm',
    owner: 'vllm-project',
    name: 'vllm',
    fullName: 'vllm-project/vllm',
    description: 'A high-throughput and memory-efficient inference and serving engine for LLMs featuring PagedAttention.',
    starsCount: 38200,
    forksCount: 5400,
    primaryLanguage: 'Python',
    topics: ['llm', 'inference', 'serving', 'cuda', 'paged-attention'],
    homepage: 'https://vllm.ai',
    license: 'Apache-2.0',
    isFeatured: true,
  },
  {
    id: 'repo-3',
    categoryId: 'cat-4',
    subCategoryId: 'sub-11',
    categoryName: 'AI Agent Frameworks',
    subCategoryName: 'Browser Agents',
    githubUrl: 'https://github.com/browser-use/browser-use',
    owner: 'browser-use',
    name: 'browser-use',
    fullName: 'browser-use/browser-use',
    description: 'Make websites accessible for AI agents. Open-source controller enabling LLMs to browse the web.',
    starsCount: 29400,
    forksCount: 2900,
    primaryLanguage: 'Python',
    topics: ['ai-agent', 'browser-automation', 'playwright', 'web-scraping'],
    homepage: 'https://browser-use.com',
    license: 'MIT',
    isFeatured: true,
  },
];

// Helper load / save ke library-store.json di disk (Tahan restart / reload)
function loadLocalStore(): { categories: any[]; repositories: any[] } {
  try {
    const dataDir = path.dirname(DATA_STORE_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (fs.existsSync(DATA_STORE_PATH)) {
      const raw = fs.readFileSync(DATA_STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.categories) && Array.isArray(parsed.repositories)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Gagal membaca library-store.json:', err);
  }

  const initial = { categories: initialCategories, repositories: initialRepositories };
  saveLocalStore(initial.categories, initial.repositories);
  return initial;
}

function saveLocalStore(cats: any[], repos: any[]) {
  try {
    const dataDir = path.dirname(DATA_STORE_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(
      DATA_STORE_PATH,
      JSON.stringify({ categories: cats, repositories: repos }, null, 2),
      'utf-8'
    );
  } catch (err) {
    console.error('Gagal menulis library-store.json:', err);
  }
}

// Inisialisasi data aktif dari disk
const storeData = loadLocalStore();
let fallbackCategories: any[] = storeData.categories;
let fallbackRepositories: any[] = storeData.repositories;
const DYNAMIC_CATEGORY_ICONS = [
  'trending-up', 'graduation-cap', 'scan-text', 'hard-drive', 'mic',
  'file-text', 'circuit-board', 'wrench', 'shield', 'globe',
  'code', 'smartphone', 'cloud', 'brain', 'zap', 'compass', 'flame', 'layers'
];

function resolveCategoryIcon(categoryName?: string | null, explicitIcon?: string | null): string {
  if (explicitIcon && explicitIcon !== 'folder') return explicitIcon;
  if (!categoryName) return 'box';
  const name = categoryName.toLowerCase().trim();

  if (name.includes('trading') || name.includes('finance') || name.includes('stock') || name.includes('crypto') || name.includes('quant')) return 'trending-up';
  if (name.includes('learn') || name.includes('education') || name.includes('course') || name.includes('tutorial') || name.includes('study') || name.includes('pembelajaran') || name.includes('edukasi')) return 'graduation-cap';
  if (name.includes('ocr') || name.includes('detect') || name.includes('vision') || name.includes('scan') || name.includes('document')) return 'scan-text';
  if (name.includes('database') || name.includes('data management') || name.includes('basis data') || name.includes('storage') || name.includes('warehouse')) return 'hard-drive';
  if (name.includes('speech') || name.includes('audio') || name.includes('voice') || name.includes('sound') || name.includes('suara') || name.includes('tts')) return 'mic';
  if (name.includes('productivity') || name.includes('note') || name.includes('catatan') || name.includes('memo') || name.includes('task') || name.includes('todo')) return 'file-text';
  if (name.includes('iot') || name.includes('embedded') || name.includes('hardware') || name.includes('sensor') || name.includes('arduino') || name.includes('raspberry')) return 'circuit-board';
  if (name.includes('utilit') || name.includes('maintenance') || name.includes('tool') || name.includes('system') || name.includes('devops') || name.includes('cli')) return 'wrench';
  if (name.includes('large language model') || name.includes('llm') || name.includes('inference')) return 'cpu';
  if (name.includes('rag') || name.includes('vector') || name.includes('retrieval')) return 'database';
  if (name.includes('video') || name.includes('multimodal') || name.includes('motion')) return 'video';
  if (name.includes('agent') || name.includes('agen') || name.includes('framework')) return 'bot';
  if (name.includes('skill') || name.includes('prompt')) return 'sparkles';
  if (name.includes('security') || name.includes('shield')) return 'shield';
  if (name.includes('browser') || name.includes('web')) return 'globe';
  if (name.includes('code') || name.includes('programming')) return 'code';
  if (name.includes('mobile') || name.includes('android') || name.includes('ios')) return 'smartphone';
  if (name.includes('cloud') || name.includes('docker') || name.includes('k8s')) return 'cloud';
  if (name.includes('brain') || name.includes('neural')) return 'brain';

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return DYNAMIC_CATEGORY_ICONS[Math.abs(hash) % DYNAMIC_CATEGORY_ICONS.length];
}

// Helper parse Metric Number (111.1k -> 111100)
function parseMetricNumber(val: string | number | null | undefined): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const clean = val.toString().trim().replace(/,/g, '').toLowerCase();
  if (clean.endsWith('k')) {
    const num = parseFloat(clean.replace('k', ''));
    return isNaN(num) ? 0 : Math.round(num * 1000);
  }
  if (clean.endsWith('m')) {
    const num = parseFloat(clean.replace('m', ''));
    return isNaN(num) ? 0 : Math.round(num * 1000000);
  }
  const parsed = parseInt(clean, 10);
  return isNaN(parsed) ? 0 : parsed;
}

// Helper fetch README dari GitHub API — disimpan ke DB saat repo ditambahkan
async function fetchGitHubReadme(owner: string, repo: string): Promise<string | null> {
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.raw+json',
      'User-Agent': 'GitHub-Library-Hub-BE',
    };
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
      headers,
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return null;

    let content = await res.text();

    // Decode base64 jika response bukan raw (JSON format)
    if (content.trim().startsWith('{')) {
      try {
        const json = JSON.parse(content);
        if (json.content && json.encoding === 'base64') {
          content = Buffer.from(json.content.replace(/\n/g, ''), 'base64').toString('utf-8');
        }
      } catch { /* biarkan content apa adanya */ }
    }

    // Strip badge images, HTML tags, dan truncate ke 4000 char
    const cleaned = content
      .replace(/!\[.*?\]\(https:\/\/.*?\)/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .slice(0, 4000);

    return cleaned || null;
  } catch {
    return null;
  }
}

// Helper parse GitHub URL multi-format & sub-path safe
function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // 1. Cek format SSH: git@github.com:owner/repo(.git)
  const sshMatch = trimmed.match(/^git@github\.com:([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+?)(?:\.git)?$/i);
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2].replace(/\.git$/, '') };
  }

  // 2. Cek format HTTP/HTTPS atau domain langsung
  try {
    const withoutHost = trimmed
      .replace(/^(?:https?:\/\/)?(?:www\.)?github\.com\/?/i, '')
      .replace(/^\/+/, '');

    const cleanPath = withoutHost.split(/[?#]/)[0];
    const segments = cleanPath.split('/').filter(Boolean);

    if (segments.length >= 2) {
      const owner = segments[0].trim();
      const repo = segments[1].trim().replace(/\.git$/, '');
      const reserved = ['features', 'explore', 'topics', 'trending', 'collections', 'events', 'settings'];
      if (owner && repo && !reserved.includes(owner.toLowerCase())) {
        return { owner, repo };
      }
    }
    return null;
  } catch {
    return null;
  }
}

// Fallback HTML Scraper jika GitHub REST API rate-limited (HTTP 403)
async function scrapeGitHubHtml(owner: string, repo: string) {
  try {
    const targetUrl = `https://github.com/${owner}/${repo}`;
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      if (res.status === 404) return { notFound: true };
      return null;
    }

    const html = await res.text();

    // 1. Stars count
    let starsCount = 0;
    const jsonStars = html.match(/"stargazerCount":\s*(\d+)/i);
    if (jsonStars) {
      starsCount = parseInt(jsonStars[1], 10);
    } else {
      const strongStars = html.match(/id="repo-stars-counter-star"[^>]*title="([\d,]+)"/i) ||
                          html.match(/<strong[^>]*>([\d.,]+[km]?)<\/strong>\s*stars/i) ||
                          html.match(/id="repo-stars-counter-star"[^>]*>([\d.,]+[km]?)<\/span>/i);
      if (strongStars) starsCount = parseMetricNumber(strongStars[1]);
    }

    // 2. Forks count
    let forksCount = 0;
    const jsonForks = html.match(/"forksCount":\s*(\d+)/i);
    if (jsonForks) {
      forksCount = parseInt(jsonForks[1], 10);
    } else {
      const strongForks = html.match(/id="repo-network-counter"[^>]*title="([\d,]+)"/i) ||
                          html.match(/<strong[^>]*>([\d.,]+[km]?)<\/strong>\s*forks/i) ||
                          html.match(/id="repo-network-counter"[^>]*>([\d.,]+[km]?)<\/span>/i);
      if (strongForks) forksCount = parseMetricNumber(strongForks[1]);
    }

    // 3. Description
    let description = '';
    const jsonDesc = html.match(/"description":\s*"([^"]+)"/i);
    if (jsonDesc) {
      description = jsonDesc[1];
    } else {
      const metaDesc = html.match(/<meta\s+(?:property="og:description"|name="description")\s+content="([^"]*)"/i);
      if (metaDesc) {
        description = metaDesc[1]
          .replace(/^[^-]+-\s*(?:GitHub\s*-\s*)?[^:]+:\s*/, '')
          .replace(/\s*-\s*[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/, '')
          .trim();
      }
    }

    // 4. Topics
    const topicMatches = [...html.matchAll(/href="\/topics\/([a-zA-Z0-9_-]+)"/gi)];
    const topics = Array.from(new Set(topicMatches.map(m => m[1])));

    // 5. Language
    let primaryLanguage = 'Unknown';
    const langMatch = html.match(/itemprop="programmingLanguage">([^<]+)<\/span>/i) ||
                      html.match(/<span class="color-fg-default text-bold mr-1">([^<]+)<\/span>/i);
    if (langMatch) {
      primaryLanguage = langMatch[1].trim();
    } else {
      const commonLangs = ['typescript', 'javascript', 'python', 'rust', 'go', 'html', 'css', 'c++', 'c#', 'java', 'kotlin', 'swift'];
      const foundLang = topics.find(t => commonLangs.includes(t.toLowerCase()));
      if (foundLang) {
        primaryLanguage = foundLang.charAt(0).toUpperCase() + foundLang.slice(1);
      }
    }

    // Watchers / subscribers count
    let subscribersCount = 0;
    const jsonWatchers = html.match(/"watcherCount":\s*(\d+)/i);
    if (jsonWatchers) subscribersCount = parseInt(jsonWatchers[1], 10);

    // 6. License
    let license: string | null = null;
    const licenseMatch = html.match(/href="\/[^\/]+\/[^\/]+\/blob\/[^\/]+\/LICENSE[^"]*"[^>]*>[\s\S]*?<\/svg>\s*([^<\n\r]+)/i) ||
                         html.match(/"licenseInfo":\s*\{[^}]*"name":\s*"([^"]+)"/i);
    if (licenseMatch) license = licenseMatch[1].trim();
    if (!license && html.includes('LICENSE-MIT')) {
      license = 'MIT';
    } else if (!license && html.includes('LICENSE-APACHE')) {
      license = 'Apache-2.0';
    }

    return {
      owner,
      name: repo,
      fullName: `${owner}/${repo}`,
      description: description || 'Repositori GitHub terkurasi',
      starsCount,
      stargazers_count: starsCount,
      forksCount,
      forks_count: forksCount,
      subscribers_count: subscribersCount,
      primaryLanguage,
      language: primaryLanguage,
      topics,
      homepage: '',
      license: license ? { spdx_id: license, name: license } : null,
      avatarUrl: `https://github.com/${owner}.png`,
      defaultBranch: 'main',
      default_branch: 'main',
      tier: 2,
    };
  } catch {
    return null;
  }
}


// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'github-library-backend',
    databaseConnected: isDbConfigured,
    timestamp: new Date().toISOString(),
  });
});

// Categories GET
app.get('/api/categories', async (_req: Request, res: Response) => {
  if (!db || !isDbConfigured) {
    return res.json(fallbackCategories);
  }
  try {
    const cats = await db.query.categories.findMany({
      with: {
        subCategories: true,
      },
    });
    return res.json(cats.length > 0 ? cats : fallbackCategories);
  } catch (err: any) {
    console.error('Error fetching categories from DB:', err.message);
    return res.json(fallbackCategories);
  }
});

// Categories POST
app.post('/api/categories', async (req: Request, res: Response) => {
  const { name, subCategories: subNames } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Nama kategori wajib diisi.' });
  }

  const resolvedIcon = resolveCategoryIcon(name, req.body.icon);

  if (!db || !isDbConfigured) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newCat = {
      id: `cat-${Date.now()}`,
      name,
      slug,
      icon: resolvedIcon,
      description: '',
      subCategories: Array.isArray(subNames)
        ? subNames.map((s: string, idx: number) => ({
            id: `sub-${Date.now()}-${idx}`,
            name: s.trim(),
            slug: s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          }))
        : [],
    };
    fallbackCategories.push(newCat);
    saveLocalStore(fallbackCategories, fallbackRepositories);
    return res.json({ success: true, category: newCat });
  }

  try {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const [newCat] = await db.insert(categories).values({
      name,
      slug,
      icon: resolvedIcon,
    }).returning();

    if (Array.isArray(subNames) && subNames.length > 0) {
      for (const sub of subNames) {
        const subSlug = sub.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        await db.insert(subCategories).values({
          categoryId: newCat.id,
          name: sub,
          slug: subSlug,
        });
      }
    }

    return res.json({ success: true, category: newCat });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Sub-categories PUT (Update Name)
app.put('/api/subcategories/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Nama sub-kategori wajib diisi.' });
  }
  const trimmed = name.trim();
  const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  let updatedSub: any = null;
  fallbackCategories.forEach(cat => {
    if (cat.subCategories) {
      cat.subCategories.forEach((sub: any) => {
        if (sub.id === id) {
          sub.name = trimmed;
          sub.slug = slug;
          updatedSub = sub;
        }
      });
    }
  });

  fallbackRepositories.forEach(repo => {
    if (repo.subCategoryId === id) {
      repo.subCategoryName = trimmed;
    }
  });

  saveLocalStore(fallbackCategories, fallbackRepositories);

  if (db && isDbConfigured) {
    try {
      const [result] = await (db as any)
        .update(subCategories)
        .set({ name: trimmed, slug })
        .where(eq(subCategories.id as any, id))
        .returning();
      if (result) updatedSub = result;
    } catch (err: any) {
      console.warn('DB update subcategory error:', err.message);
    }
  }

  return res.json({ success: true, subCategory: updatedSub || { id, name: trimmed, slug } });
});

// Sub-categories DELETE
app.delete('/api/subcategories/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  let deletedSubName = '';
  fallbackCategories.forEach(cat => {
    if (cat.subCategories) {
      const found = cat.subCategories.find((sub: any) => sub.id === id);
      if (found) deletedSubName = found.name;
      cat.subCategories = cat.subCategories.filter((sub: any) => sub.id !== id);
    }
  });

  fallbackRepositories.forEach(repo => {
    if (
      repo.subCategoryId === id ||
      (deletedSubName && repo.subCategoryName?.toLowerCase() === deletedSubName.toLowerCase())
    ) {
      repo.subCategoryId = null;
      repo.subCategoryName = null;
    }
  });

  saveLocalStore(fallbackCategories, fallbackRepositories);

  if (db && isDbConfigured) {
    try {
      await (db as any).update(repositories).set({ subCategoryId: null }).where(eq(repositories.subCategoryId as any, id));
      await (db as any).delete(subCategories).where(eq(subCategories.id as any, id));
    } catch (err: any) {
      console.warn('DB delete subcategory error:', err.message);
    }
  }

  return res.json({ success: true, message: 'Sub-kategori berhasil dihapus.' });
});

// Repositories GET
app.get('/api/repositories', async (req: Request, res: Response) => {
  const { categoryId, subCategoryId, search } = req.query as {
    categoryId?: string;
    subCategoryId?: string;
    search?: string;
  };

  if (!db || !isDbConfigured) {
    let result = [...fallbackRepositories];
    if (categoryId && categoryId !== 'all') {
      result = result.filter(r => r.categoryId === categoryId);
    }
    if (subCategoryId) {
      result = result.filter(r => r.subCategoryId === subCategoryId);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r => r.name.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q));
    }
    return res.json(result);
  }

  try {
    const repos = await db.query.repositories.findMany({
      with: {
        category: true,
        subCategory: true,
      },
      orderBy: [desc(repositories.starsCount)],
    });

    let mapped = repos.map(r => ({
      ...r,
      categoryName: r.category?.name || '',
      subCategoryName: r.subCategory?.name || '',
      semanticBridges: (r.aiSummary as any)?.semanticBridges || [],
    }));

    if (categoryId && categoryId !== 'all') {
      mapped = mapped.filter(r => r.categoryId === categoryId);
    }
    if (subCategoryId) {
      mapped = mapped.filter(r => r.subCategoryId === subCategoryId);
    }
    if (search) {
      const q = search.toLowerCase();
      mapped = mapped.filter(r => r.name.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q));
    }

    return res.json(mapped);
  } catch (err: any) {
    console.error('Error fetching repositories from DB:', err.message);
    return res.json(fallbackRepositories);
  }
});

// Repositories POST
app.post('/api/repositories', async (req: Request, res: Response) => {
  const repoData = req.body;
  if (!repoData?.githubUrl || !repoData?.name) {
    return res.status(400).json({ error: 'Data repositori tidak lengkap.' });
  }

  const targetUrl = (repoData.githubUrl || '').trim().toLowerCase().replace(/\/+$/, '').replace(/\.git$/, '');
  const targetFullName = (repoData.fullName || `${repoData.owner}/${repoData.name}` || '').trim().toLowerCase();

  const categoryId = repoData.categoryId || 'cat-5';
  let subCategoryId = repoData.subCategoryId || null;
  let subCategoryName = repoData.subCategoryName || '';
  let createdSubCategory: any = null;

  if (!db || !isDbConfigured) {
    // Cek duplikasi di fallback local repositories
    const existingFallback = fallbackRepositories.find(r => {
      const rUrl = (r.githubUrl || '').trim().toLowerCase().replace(/\/+$/, '').replace(/\.git$/, '');
      const rFullName = (r.fullName || `${r.owner}/${r.name}` || '').trim().toLowerCase();
      return (targetUrl && rUrl === targetUrl) || (targetFullName && rFullName === targetFullName);
    });

    if (existingFallback) {
      return res.status(409).json({
        error: 'duplicate',
        message: `Repositori "${repoData.fullName || repoData.name}" sudah terdaftar di library.`,
        existingRepo: existingFallback,
      });
    }

    const parentCategory = fallbackCategories.find(c => c.id === categoryId);
    
    // Auto-create atau cari subCategory jika subCategoryName diisi
    if (subCategoryName && subCategoryName.trim()) {
      const cleanSubName = subCategoryName.trim();
      if (parentCategory) {
        if (!parentCategory.subCategories) parentCategory.subCategories = [];
        const existingSub = parentCategory.subCategories.find(
          (s: any) => s.id === subCategoryId || s.name.toLowerCase() === cleanSubName.toLowerCase()
        );
        if (existingSub) {
          subCategoryId = existingSub.id;
          subCategoryName = existingSub.name;
        } else {
          const newSub = {
            id: `sub-${Date.now()}`,
            name: cleanSubName,
            slug: cleanSubName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          };
          parentCategory.subCategories.push(newSub);
          subCategoryId = newSub.id;
          subCategoryName = newSub.name;
          createdSubCategory = newSub;
        }
      }
    }

    const newRepo = {
      id: `repo-${Date.now()}`,
      categoryId,
      subCategoryId,
      categoryName: parentCategory?.name || 'AI General',
      subCategoryName,
      githubUrl: repoData.githubUrl,
      owner: repoData.owner,
      name: repoData.name,
      fullName: repoData.fullName || `${repoData.owner}/${repoData.name}`,
      description: repoData.description || '',
      starsCount: Number(repoData.starsCount) || 0,
      forksCount: Number(repoData.forksCount) || 0,
      primaryLanguage: repoData.primaryLanguage || 'Unknown',
      topics: Array.isArray(repoData.topics) ? repoData.topics : [],
      homepage: repoData.homepage || '',
      license: repoData.license || null,
      isFeatured: false,
    };
    fallbackRepositories.unshift(newRepo);
    saveLocalStore(fallbackCategories, fallbackRepositories);
    return res.json({ success: true, repository: newRepo, createdSubCategory });
  }

  try {
    // Cek duplikasi di DB
    const existingDbRepo = await db.query.repositories.findFirst({
      where: (r, { or, sql }) =>
        or(
          sql`lower(regexp_replace(regexp_replace(${r.githubUrl}, '/+$', ''), '\\.git$', '')) = ${targetUrl}`,
          sql`lower(${r.fullName}) = ${targetFullName}`
        ),
    });

    if (existingDbRepo) {
      return res.status(409).json({
        error: 'duplicate',
        message: `Repositori "${repoData.fullName || repoData.name}" sudah terdaftar di database.`,
        existingRepo: existingDbRepo,
      });
    }

    if (subCategoryName && subCategoryName.trim() && !subCategoryId) {
      const cleanSubName = subCategoryName.trim();
      const subSlug = cleanSubName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const existingSub = await (db.query as any).subCategories?.findFirst({
        where: (sub: any, { eq, and }: any) => and(eq(sub.categoryId, categoryId), eq(sub.name, cleanSubName))
      });
      if (existingSub) {
        subCategoryId = existingSub.id;
      } else {
        const [insertedSub] = await db.insert(subCategories).values({
          categoryId,
          name: cleanSubName,
          slug: subSlug,
        }).returning();
        if (insertedSub) {
          subCategoryId = insertedSub.id;
          createdSubCategory = insertedSub;
        }
      }
    }

    // Fetch README async (fire-and-forget) — tidak memblokir response
    const [savedRepo] = await db.insert(repositories).values({
      ...repoData,
      categoryId,
      subCategoryId,
    }).returning();

    // Background: fetch README dari GitHub dan simpan ke DB
    fetchGitHubReadme(repoData.owner, repoData.name).then(async (readme) => {
      if (readme && savedRepo?.id) {
        try {
          await (db as any).update(repositories)
            .set({ readmeContent: readme })
            .where(eq(repositories.id, savedRepo.id));
          console.log(`README saved for ${repoData.fullName}`);
        } catch (e: any) {
          console.warn(`Gagal simpan README ${repoData.fullName}:`, e.message);
        }
      }
    }).catch(() => {});

    return res.json({ success: true, repository: savedRepo, createdSubCategory });
  } catch (err: any) {
    if (err?.code === '23505' || err?.message?.includes('duplicate key') || err?.message?.includes('unique constraint')) {
      return res.status(409).json({
        error: 'duplicate',
        message: `Repositori "${repoData.fullName || repoData.name}" sudah terdaftar di database.`,
      });
    }
    return res.status(500).json({ error: err.message });
  }
});

// GitHub Inspect GET with 3-Tier Fallback
app.get('/api/github/inspect', async (req: Request, res: Response) => {
  const repoUrl = req.query.url as string;

  if (!repoUrl) {
    return res.status(400).json({ error: 'URL repositori GitHub wajib diisi.' });
  }

  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) {
    return res.status(400).json({ error: 'Format URL GitHub tidak valid. Contoh: https://github.com/owner/repo' });
  }

  const { owner, repo } = parsed;

  // Tier 1: GitHub Official REST API
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GitHub-Library-Hub-BE',
    };

    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers,
      signal: AbortSignal.timeout(4000),
    });

    if (ghRes.ok) {
      const data = (await ghRes.json()) as any;
      const stars = data.stargazers_count || 0;
      const forks = data.forks_count || 0;
      const licenseName = data.license?.spdx_id || data.license?.name || null;
      return res.json({
        tier: 1,
        owner: data.owner?.login || owner,
        name: data.name || repo,
        fullName: data.full_name || `${owner}/${repo}`,
        description: data.description || '',
        starsCount: stars,
        stargazers_count: stars,
        forksCount: forks,
        forks_count: forks,
        subscribers_count: data.subscribers_count || 0,
        primaryLanguage: data.language || 'Unknown',
        language: data.language || 'Unknown',
        topics: data.topics || [],
        homepage: data.homepage || '',
        license: licenseName ? { spdx_id: licenseName, name: licenseName } : null,
        avatarUrl: data.owner?.avatar_url || `https://github.com/${owner}.png`,
        defaultBranch: data.default_branch || 'main',
        default_branch: data.default_branch || 'main',
      });
    }

    if (ghRes.status === 404) {
      const scraped = await scrapeGitHubHtml(owner, repo);
      if (scraped && (scraped as any).notFound) {
        return res.status(404).json({ error: 'Repositori tidak ditemukan atau bersifat private di GitHub.' });
      }
      if (scraped && !(scraped as any).notFound) {
        return res.json(scraped);
      }
    }
  } catch {
    // API network/timeout error -> lanjut ke Tier 2
  }

  // Tier 2: HTML Smart Scraper Fallback
  const scrapedData = await scrapeGitHubHtml(owner, repo);
  if (scrapedData) {
    if ((scrapedData as any).notFound) {
      return res.status(404).json({ error: 'Repositori tidak ditemukan atau bersifat private di GitHub.' });
    }
    return res.json(scrapedData);
  }

  // Tier 3: Heuristic Safe Fallback
  return res.json({
    tier: 3,
    isFallback: true,
    owner,
    name: repo,
    fullName: `${owner}/${repo}`,
    description: `Repositori ${owner}/${repo}`,
    starsCount: 0,
    stargazers_count: 0,
    forksCount: 0,
    forks_count: 0,
    subscribers_count: 0,
    primaryLanguage: 'Unknown',
    language: 'Unknown',
    topics: [],
    homepage: '',
    license: null,
    avatarUrl: `https://github.com/${owner}.png`,
    defaultBranch: 'main',
    default_branch: 'main',
    warning: 'Metadata diambil secara dasar karena GitHub API rate-limited atau offline.',
  });
});

// AI Summary GET (Dual-layer: Database first, then JSON file cache)
app.get('/api/github/summary', async (req: Request, res: Response) => {
  const repoParam = (req.query.repo as string)?.trim().toLowerCase();
  if (!repoParam) {
    if (fs.existsSync(AI_SUMMARIES_PATH)) {
      try {
        const summaries = JSON.parse(fs.readFileSync(AI_SUMMARIES_PATH, 'utf-8'));
        return res.json({ success: true, count: Object.keys(summaries).length, summaries });
      } catch {}
    }
    return res.json({ success: true, count: 0, summaries: {} });
  }

  // 1. Cek Database PostgreSQL Neon
  if (db && isDbConfigured) {
    try {
      const found = await db.query.repositories.findFirst({
        where: (r, { or }) =>
          or(
            sql`lower(${r.fullName}) = ${repoParam}`,
            sql`lower(${r.githubUrl}) = ${`https://github.com/${repoParam}`}`
          ),
      });
      if (found && found.aiSummary) {
        return res.json({
          success: true,
          isAiGenerated: true,
          source: 'database',
          repo: repoParam,
          summary: found.aiSummary,
        });
      }
    } catch (err: any) {
      console.warn('BE DB summary fetch error:', err.message);
    }
  }

  // 2. Cek Cache File
  if (fs.existsSync(AI_SUMMARIES_PATH)) {
    try {
      const summaries = JSON.parse(fs.readFileSync(AI_SUMMARIES_PATH, 'utf-8'));
      if (summaries[repoParam]) {
        return res.json({
          success: true,
          isAiGenerated: true,
          source: 'cache',
          repo: repoParam,
          summary: summaries[repoParam],
        });
      }
    } catch {}
  }

  return res.status(404).json({ success: false, message: `Summary belum tersedia untuk ${repoParam}` });
});

// Repository Move (Drag & Drop Sub-category reassignment)
app.patch('/api/repositories/:id/move', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { categoryId, subCategoryId, subCategoryName } = req.body;

  let targetCat = fallbackCategories.find(c => c.id === categoryId);
  let resolvedSubName = subCategoryName;
  if (!resolvedSubName && subCategoryId && targetCat?.subCategories) {
    const foundSub = targetCat.subCategories.find((s: any) => s.id === subCategoryId);
    if (foundSub) resolvedSubName = foundSub.name;
  }

  let updatedRepo: any = null;
  fallbackRepositories = fallbackRepositories.map(repo => {
    if (repo.id === id) {
      updatedRepo = {
        ...repo,
        categoryId: categoryId || repo.categoryId,
        categoryName: targetCat?.name || repo.categoryName,
        subCategoryId: subCategoryId || null,
        subCategoryName: resolvedSubName || null,
      };
      return updatedRepo;
    }
    return repo;
  });

  saveLocalStore(fallbackCategories, fallbackRepositories);

  if (db && isDbConfigured) {
    try {
      const [result] = await (db as any)
        .update(repositories)
        .set({
          categoryId: categoryId,
          subCategoryId: subCategoryId || null,
        })
        .where(eq(repositories.id as any, id))
        .returning();
      if (result) updatedRepo = result;
    } catch (err: any) {
      console.warn('DB move repo error:', err.message);
    }
  }

  if (!updatedRepo) {
    return res.status(404).json({ error: 'Repositori tidak ditemukan.' });
  }

  return res.json({ success: true, repository: updatedRepo });
});

// Repository Update (Edit Name, Description, Notes, Category, SubCategory)
app.put('/api/repositories/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, notes, categoryId, subCategoryId, subCategoryName } = req.body;

  let updatedRepo: any = null;
  fallbackRepositories = fallbackRepositories.map(repo => {
    if (repo.id === id) {
      updatedRepo = {
        ...repo,
        name: name !== undefined ? name.trim() : repo.name,
        description: description !== undefined ? description : repo.description,
        notes: notes !== undefined ? notes : repo.notes,
        categoryId: categoryId !== undefined ? categoryId : repo.categoryId,
        subCategoryId: subCategoryId !== undefined ? subCategoryId : repo.subCategoryId,
        subCategoryName: subCategoryName !== undefined ? subCategoryName : repo.subCategoryName,
      };
      return updatedRepo;
    }
    return repo;
  });

  saveLocalStore(fallbackCategories, fallbackRepositories);

  if (db && isDbConfigured) {
    try {
      const updateData: any = {};
      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description;
      if (notes !== undefined) updateData.notes = notes;
      if (categoryId !== undefined) updateData.categoryId = categoryId;
      if (subCategoryId !== undefined) updateData.subCategoryId = subCategoryId;

      const [result] = await (db as any)
        .update(repositories)
        .set(updateData)
        .where(eq(repositories.id as any, id))
        .returning();
      if (result) updatedRepo = result;
    } catch (err: any) {
      console.warn('DB update repo error:', err.message);
    }
  }

  if (!updatedRepo) {
    return res.status(404).json({ error: 'Repositori tidak ditemukan.' });
  }

  return res.json({ success: true, repository: updatedRepo });
});

// Repository Delete
app.delete('/api/repositories/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLength = fallbackRepositories.length;
  fallbackRepositories = fallbackRepositories.filter(repo => repo.id !== id);

  saveLocalStore(fallbackCategories, fallbackRepositories);

  if (db && isDbConfigured) {
    try {
      await (db as any).delete(repositories).where(eq(repositories.id as any, id));
    } catch (err: any) {
      console.warn('DB delete repo error:', err.message);
    }
  }

  if (fallbackRepositories.length === initialLength && (!db || !isDbConfigured)) {
    return res.status(404).json({ error: 'Repositori tidak ditemukan.' });
  }

  return res.json({ success: true, message: 'Repositori berhasil dihapus.' });
});

// README Backfill — fetch & simpan README untuk repo yang belum punya readmeContent
app.patch('/api/repositories/:id/readme', async (req: Request, res: Response) => {
  const { id } = req.params;

  // Cari repo
  let owner = '';
  let name = '';

  if (db && isDbConfigured) {
    try {
      const found = await (db.query as any).repositories.findFirst({
        where: (r: any, { eq: eqFn }: any) => eqFn(r.id, id),
      });
      if (!found) return res.status(404).json({ error: 'Repo tidak ditemukan.' });
      if (found.readmeContent) {
        return res.json({ success: true, cached: true, message: 'README sudah ada.' });
      }
      owner = found.owner;
      name = found.name;
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  } else {
    const found = fallbackRepositories.find(r => r.id === id);
    if (!found) return res.status(404).json({ error: 'Repo tidak ditemukan.' });
    owner = found.owner;
    name = found.name;
  }

  const readme = await fetchGitHubReadme(owner, name);
  if (!readme) {
    return res.json({ success: false, message: 'README tidak tersedia di GitHub untuk repo ini.' });
  }

  if (db && isDbConfigured) {
    try {
      await (db as any).update(repositories)
        .set({ readmeContent: readme })
        .where(eq(repositories.id as any, id));
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  } else {
    fallbackRepositories = fallbackRepositories.map(r =>
      r.id === id ? { ...r, readmeContent: readme } : r
    );
    saveLocalStore(fallbackCategories, fallbackRepositories);
  }

  return res.json({ success: true, message: 'README berhasil disimpan.', length: readme.length });
});


async function callGeminiChat(systemPrompt: string, history: Array<{ role: string; content: string }>): Promise<string | null> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return null;

  const models = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'];
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
      const contents = history.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: {
            temperature: 0.25,
            maxOutputTokens: 2048,
          },
        }),
        signal: AbortSignal.timeout(20000),
      });

      if (res.ok) {
        const json = (await res.json()) as any;
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim()) return text.trim();
      }
    } catch (err: any) {
      console.warn(`Gemini (${model}) chat error:`, err.message);
    }
  }
  return null;
}

// Helper call Groq API Fallback
async function callGroqChat(systemPrompt: string, history: Array<{ role: string; content: string }>): Promise<string | null> {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return null;

  const models = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b', 'qwen/qwen3.6-27b'];
  for (const model of models) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.25,
          messages: [
            { role: 'system', content: systemPrompt },
            ...history.map(m => ({ role: m.role, content: m.content })),
          ],
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (res.ok) {
        const json = (await res.json()) as any;
        const text = json.choices?.[0]?.message?.content;
        if (text && text.trim()) return text.trim();
      }
    } catch (err: any) {
      console.warn(`Groq (${model}) chat error:`, err.message);
    }
  }
  return null;
}

// AI Library Advisor Chatbot Endpoint (Ingests Groups, Subgroups, Repos + README)
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Array messages wajib diisi.' });
    }

    // 1. Ambil data katalog + repositori (dengan readmeContent) secara real-time
    let cats = fallbackCategories;
    let repos = fallbackRepositories;

    if (db && isDbConfigured) {
      try {
        const dbCats = await db.query.categories.findMany({
          with: { subCategories: true },
        });
        if (dbCats && dbCats.length > 0) cats = dbCats;

        const dbRepos = await db.query.repositories.findMany({
          with: { category: true, subCategory: true },
        });
        if (dbRepos && dbRepos.length > 0) {
          repos = dbRepos.map((r: any) => ({
            ...r,
            categoryName: r.category?.name || '',
            subCategoryName: r.subCategory?.name || '',
          }));
        }
      } catch (err: any) {
        console.warn('DB read error for chat context, fallback store:', err.message);
      }
    }

    // 2. Susun struktur katalog (grup & subgrup) untuk LLM
    const catalogStructure = cats.map(c => {
      const subs = (c.subCategories || []).map((s: any) => `"${s.name}"`).join(', ');
      return `- Group: "${c.name}"\n  Subgroups: ${subs || '"General"'}`;
    }).join('\n');

    // 3. Bangun catalog repo dengan README snippet / AI Summary / Description
    const repoCatalog = repos.map((r, i) => {
      const topicsStr = Array.isArray(r.topics) ? r.topics.slice(0, 10).join(', ') : '';
      const summaryText = typeof r.aiSummary === 'object' && r.aiSummary !== null
        ? ((r.aiSummary as any).corePurpose || (r.aiSummary as any).summary || '')
        : (typeof r.aiSummary === 'string' ? r.aiSummary : '');

      const contextSnippet = r.readmeContent
        ? r.readmeContent.slice(0, 1000)
        : (summaryText || r.description || '');

      return `--- REPO #${i + 1} ---
fullName: ${r.fullName || `${r.owner}/${r.name}`}
group: ${r.categoryName || 'General'}
subgroup: ${r.subCategoryName || 'General'}
language: ${r.primaryLanguage || 'Unknown'} | stars: ${r.starsCount || 0}
description: ${r.description || ''}
topics: ${topicsStr}
context_knowledge: ${contextSnippet}
clone: git clone ${r.githubUrl || `https://github.com/${r.fullName}`}.git`;
    }).join('\n\n');

    // 4. System Prompt — powerful, grounded, anti-hallucination, structured
    const systemPrompt = `Kamu adalah "AI Library Advisor" untuk platform GitHub Library Hub.
Tugasmu: Merekomendasikan repositori yang TEPAT SASARAN berdasarkan katalog resmi di bawah ini.

=== STRUKTUR GRUP & SUBGRUP AKTIF ===
${catalogStructure}

=== KATALOG REPOSITORI LENGKAP (${repos.length} repo) ===
${repoCatalog}

=== PROTOKOL JAWABAN (WAJIB DIIKUTI) ===
1. JANGAN PERNAH mengarang repositori atau merekomendasikan repo yang TIDAK RELEVAN.
2. JANGAN PERNAH menggunakan simbol bintang dua (**) untuk bold dan JANGAN PERNAH menggunakan simbol pagar (#, ##, ###) untuk heading. Gunakan teks bersih biasa.
3. Jika kebutuhan pengguna BELUM ADA di dalam katalog (misalnya mencari hal yang tidak berkaitan dengan AI Agent, LLM, RAG, Video, Tools):
   - Nyatakan secara jujur dan tegas bahwa katalog saat ini belum memiliki repositori untuk domain tersebut.
   - Jangan pernah memaksakan repo seperti codegraph, ponytail, rtk, dll jika tidak ada sangkut pautnya dengan pertanyaan.
   - Tawarkan alternatif grup/subgrup yang tersedia di katalog jika ada yang mendekati.
4. Jika ADA repositori yang relevan:
   - Pilih HANYA repositori yang benar-benar memecahkan masalah pengguna.
   - Jelaskan kecocokan teknisnya berdasarkan deskripsi, cuplikan README, atau context_knowledge yang tersedia.
5. Format Jawaban:
   Gunakan plain text rapi tanpa ** dan tanpa ##/###:
   Analisis Kebutuhan: (1 kalimat ringkas mengenai apa yang dicari user)
   
   Rekomendasi:
   [fullName]
   - Grup / Subgrup: [Group] / [Subgroup]
   - Mengapa Relevan: (poin teknis konkret solusi yang ditawarkan repo ini)
   - Spesifikasi: [Language] | [Stars] Stars
   - Clone: git clone https://github.com/[fullName].git
6. DILARANG: kalimat pembuka/penutup klise AI ("Tentu!", "Halo!", "Semoga membantu!"), emoji, basa-basi.
7. Bahasa: Bahasa Indonesia yang lugas, presisi, dan padat (gaya smart senior developer).`;

    // 5. Eksekusi LLM: Gemini -> Groq Fallback (Tanpa Heuristic Manual)
    let assistantReply = await callGeminiChat(systemPrompt, messages);
    let provider = 'gemini';

    if (!assistantReply) {
      assistantReply = await callGroqChat(systemPrompt, messages);
      provider = 'groq';
    }

    if (!assistantReply) {
      return res.status(503).json({
        success: false,
        error: 'Layanan AI sedang sibuk atau kuota sementara tercapai. Silakan coba kembali beberapa saat lagi.',
      });
    }

    // Bersihkan simbol ** dan ##/### bila model masih mengeluarkannya
    assistantReply = (assistantReply || '')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*\*/g, '')
      .trim();

    // 7. Detect repo cards (FIXED: strict fullName match saja, hindari false positive)
    const replyLower = assistantReply.toLowerCase();
    const detectedRepos = repos.filter(r => {
      const fn = (r.fullName || `${r.owner}/${r.name}`).toLowerCase();
      // Hanya match jika fullName (owner/repo) benar-benar ada dalam reply
      return replyLower.includes(fn);
    }).map(r => ({
      id: r.id,
      name: r.name,
      fullName: r.fullName || `${r.owner}/${r.name}`,
      categoryName: r.categoryName,
      subCategoryName: r.subCategoryName,
      starsCount: r.starsCount,
      githubUrl: r.githubUrl,
      description: r.description,
    }));

    return res.json({
      success: true,
      message: assistantReply,
      provider,
      detectedRepos,
    });
  } catch (err: any) {
    console.error('Error in /api/chat endpoint:', err);
    return res.status(500).json({ error: 'Gagal memproses rekomendasi chatbot: ' + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend API Server running at http://localhost:${PORT}`);
});
