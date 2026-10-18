'use server';

import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';
import { db, isDbConfigured } from '@/db';
import { categories, subCategories, repositories } from '@/db/schema';
import { eq, desc, sql, or } from 'drizzle-orm';
import { getOrGenerateSummary } from '@/lib/ai-summarizer';
import { resolveCategoryIcon } from '@/lib/category-icons';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

// Mock in-memory data jika backend offline atau DATABASE_URL belum dikonfigurasi
const fallbackCategories = [
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

const fallbackRepositories = [
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
    starsCount: 82989,
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

function getStoreFilePath(): string {
  const p1 = path.resolve(process.cwd(), 'data/library-store.json');
  if (fs.existsSync(p1)) return p1;
  const p2 = path.resolve(process.cwd(), '../data/library-store.json');
  if (fs.existsSync(p2)) return p2;
  const p3 = path.resolve(process.cwd(), '../../data/library-store.json');
  if (fs.existsSync(p3)) return p3;
  return p2;
}

function loadLocalStore(): { categories: any[]; repositories: any[] } {
  try {
    const storePath = getStoreFilePath();
    if (fs.existsSync(storePath)) {
      const raw = fs.readFileSync(storePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.categories) && Array.isArray(parsed.repositories)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('actions.ts: Gagal membaca library-store.json:', err);
  }
  return { categories: fallbackCategories, repositories: fallbackRepositories };
}

function saveLocalStore(cats: any[], repos: any[]) {
  try {
    const storePath = getStoreFilePath();
    const dir = path.dirname(storePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(storePath, JSON.stringify({ categories: cats, repositories: repos }, null, 2), 'utf-8');
  } catch (err) {
    console.warn('actions.ts: Gagal menyimpan library-store.json:', err);
  }
}

export async function getCategoriesTree() {
  if (db && isDbConfigured) {
    try {
      const data = await db.query.categories.findMany({
        with: {
          subCategories: true,
        },
      });
      if (Array.isArray(data) && data.length > 0) return data;
    } catch (err) {
      console.warn('Gagal membaca kategori dari DB, beralih ke fallback:', err);
    }
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/categories`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {
    // Backend offline / fallback
  }
  return loadLocalStore().categories;
}

export async function getRepositories(filter?: { categoryId?: string; subCategoryId?: string; search?: string }) {
  if (db && isDbConfigured) {
    try {
      const allRepos = await db.query.repositories.findMany({
        with: {
          category: true,
          subCategory: true,
        },
        orderBy: [desc(repositories.starsCount)],
      });
      if (Array.isArray(allRepos) && allRepos.length > 0) {
        let result = allRepos.map(r => ({
          ...r,
          categoryId: r.categoryId,
          categoryName: r.category?.name || '',
          subCategoryId: r.subCategoryId || '',
          subCategoryName: r.subCategory?.name || '',
        }));
        if (filter?.categoryId && filter.categoryId !== 'all') {
          result = result.filter(r => r.categoryId === filter.categoryId);
        }
        if (filter?.subCategoryId) {
          result = result.filter(r => r.subCategoryId === filter.subCategoryId);
        }
        if (filter?.search) {
          const q = filter.search.toLowerCase();
          result = result.filter(r => r.name.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q));
        }
        return result;
      }
    } catch (err) {
      console.warn('Gagal membaca repositori dari DB, beralih ke fallback:', err);
    }
  }

  try {
    const query = new URLSearchParams();
    if (filter?.categoryId) query.set('categoryId', filter.categoryId);
    if (filter?.subCategoryId) query.set('subCategoryId', filter.subCategoryId);
    if (filter?.search) query.set('search', filter.search);

    const res = await fetch(`${BACKEND_URL}/api/repositories?${query.toString()}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {
    // Backend offline / fallback
  }

  const store = loadLocalStore();
  let result = [...store.repositories];
  if (filter?.categoryId && filter.categoryId !== 'all') {
    result = result.filter(r => r.categoryId === filter.categoryId);
  }
  if (filter?.subCategoryId) {
    result = result.filter(r => r.subCategoryId === filter.subCategoryId);
  }
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    result = result.filter(r => r.name.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q));
  }
  return result;
}

export async function createRepositoryAction(data: any) {
  const targetUrl = (data.githubUrl || '').trim().toLowerCase().replace(/\/+$/, '').replace(/\.git$/, '');
  const targetFullName = (data.fullName || `${data.owner}/${data.name}` || '').trim().toLowerCase();

  if (db && isDbConfigured) {
    try {
      // 1. Cek apakah repositori sudah ada di Database
      const existingInDb = await db.query.repositories.findFirst({
        where: (r, { or, sql }) =>
          or(
            sql`lower(regexp_replace(regexp_replace(${r.githubUrl}, '/+$', ''), '\\.git$', '')) = ${targetUrl}`,
            sql`lower(${r.fullName}) = ${targetFullName}`
          ),
      });

      if (existingInDb) {
        return {
          success: false,
          error: 'duplicate',
          message: `Repositori "${data.fullName || data.name}" sudah terdaftar di library.`,
          repository: existingInDb,
        };
      }

      let categoryId = data.categoryId;
      let categoryName = data.categoryName || '';
      let subCategoryId = data.subCategoryId;
      let createdCategory = null;
      let createdSubCategory = null;

      if ((categoryId === 'create_new' || !categoryId) && data.customCategoryName?.trim()) {
        const cleanCat = data.customCategoryName.trim();
        const catSlug = cleanCat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const resolvedIcon = resolveCategoryIcon(cleanCat, data.icon);
        const [newCat] = await db.insert(categories).values({
          name: cleanCat,
          slug: catSlug,
          icon: resolvedIcon,
        }).returning();
        if (newCat) {
          categoryId = newCat.id;
          categoryName = newCat.name;
          createdCategory = newCat;
        }
      }

      if (data.subCategoryName && data.subCategoryName.trim() && categoryId) {
        const cleanSub = data.subCategoryName.trim();
        const subSlug = cleanSub.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const [newSub] = await db.insert(subCategories).values({
          categoryId,
          name: cleanSub,
          slug: subSlug,
        }).returning();
        subCategoryId = newSub.id;
        createdSubCategory = newSub;
      }

      const [newRepo] = await db.insert(repositories).values({
        categoryId,
        subCategoryId: subCategoryId || null,
        githubUrl: data.githubUrl,
        owner: data.owner,
        name: data.name,
        fullName: data.fullName || `${data.owner}/${data.name}`,
        description: data.description || '',
        starsCount: data.starsCount || 0,
        forksCount: data.forksCount || 0,
        primaryLanguage: data.primaryLanguage || 'Unknown',
        topics: Array.isArray(data.topics) ? data.topics : [],
        homepage: data.homepage || '',
        license: typeof data.license === 'object' ? data.license?.name || data.license?.spdx_id : data.license || null,
        isFeatured: Boolean(data.isFeatured),
      }).returning();

      // Trigger AI summary & README fetch di background (fire-and-forget)
      getOrGenerateSummary(newRepo.fullName, { meta: newRepo }).catch(() => {});
      fetch(`${BACKEND_URL}/api/repositories/${newRepo.id}/readme`, { method: 'PATCH' }).catch(() => {});

      revalidatePath('/');
      return { success: true, repository: newRepo, createdCategory, createdSubCategory };
    } catch (err: any) {
      if (err?.code === '23505' || err?.message?.includes('duplicate key') || err?.message?.includes('unique constraint')) {
        return {
          success: false,
          error: 'duplicate',
          message: `Repositori "${data.fullName || data.name}" sudah terdaftar di library.`,
        };
      }
      console.warn('Gagal insert repo ke DB, beralih ke fallback:', err);
    }
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/repositories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.status === 409 || !res.ok) {
      const json = await res.json().catch(() => ({}));
      if (res.status === 409 || json.error === 'duplicate') {
        return {
          success: false,
          error: 'duplicate',
          message: json.message || `Repositori "${data.fullName || data.name}" sudah terdaftar di library.`,
        };
      }
    }
    if (res.ok) {
      const json = await res.json();
      revalidatePath('/');
      return json;
    }
  } catch {
    // fallback
  }

  // Fallback disk store
  const store = loadLocalStore();
  const isDuplicateInStore = store.repositories.some((r: any) => {
    const rUrl = (r.githubUrl || '').trim().toLowerCase().replace(/\/+$/, '').replace(/\.git$/, '');
    const rFullName = (r.fullName || `${r.owner}/${r.name}` || '').trim().toLowerCase();
    return (targetUrl && rUrl === targetUrl) || (targetFullName && rFullName === targetFullName);
  });

  if (isDuplicateInStore) {
    return {
      success: false,
      error: 'duplicate',
      message: `Repositori "${data.fullName || data.name}" sudah terdaftar di library.`,
    };
  }

  let categoryId = data.categoryId;
  let categoryName = data.categoryName || '';
  let subCategoryId = data.subCategoryId;
  let subCategoryName = data.subCategoryName || '';
  let createdCategory = null;
  let createdSubCategory = null;

  if ((categoryId === 'create_new' || !categoryId) && data.customCategoryName?.trim()) {
    const cleanCat = data.customCategoryName.trim();
    const resolvedIcon = resolveCategoryIcon(cleanCat, data.icon);
    const newCat = {
      id: `cat-${Date.now()}`,
      name: cleanCat,
      slug: cleanCat.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      icon: resolvedIcon,
      description: '',
      subCategories: [],
    };
    store.categories.push(newCat);
    categoryId = newCat.id;
    categoryName = newCat.name;
    createdCategory = newCat;
  }

  if (!categoryId) {
    categoryId = 'cat-5';
  }

  const parentCat = store.categories.find(c => c.id === categoryId);
  if (subCategoryName && subCategoryName.trim()) {
    const cleanSub = subCategoryName.trim();
    if (parentCat) {
      if (!parentCat.subCategories) parentCat.subCategories = [];
      const existing = parentCat.subCategories.find(
        (s: any) => s.id === subCategoryId || s.name.toLowerCase() === cleanSub.toLowerCase()
      );
      if (existing) {
        subCategoryId = existing.id;
        subCategoryName = existing.name;
      } else {
        const newSub = {
          id: `sub-${Date.now()}`,
          name: cleanSub,
          slug: cleanSub.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        };
        parentCat.subCategories.push(newSub);
        subCategoryId = newSub.id;
        subCategoryName = newSub.name;
        createdSubCategory = newSub;
      }
    }
  }

  const newRepo = {
    ...data,
    id: data.id || `repo-${Date.now()}`,
    categoryId,
    categoryName: parentCat?.name || categoryName || 'AI General',
    subCategoryId,
    subCategoryName,
  };
  store.repositories.unshift(newRepo);
  saveLocalStore(store.categories, store.repositories);
  getOrGenerateSummary(newRepo.fullName, { meta: newRepo }).catch(() => {});
  revalidatePath('/');
  return { success: true, repository: newRepo, createdCategory, createdSubCategory };
}

export async function createCategoryAction(name: string, subCategoryNames: string[]) {
  if (db && isDbConfigured) {
    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const resolvedIcon = resolveCategoryIcon(name);
      const [newCat] = await db.insert(categories).values({
        name,
        slug,
        icon: resolvedIcon,
      }).returning();

      const createdSubs: any[] = [];
      if (Array.isArray(subCategoryNames) && subCategoryNames.length > 0) {
        for (const sub of subCategoryNames) {
          const subSlug = sub.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const [s] = await db.insert(subCategories).values({
            categoryId: newCat.id,
            name: sub,
            slug: subSlug,
          }).returning();
          createdSubs.push(s);
        }
      }

      revalidatePath('/');
      return { success: true, category: { ...newCat, subCategories: createdSubs } };
    } catch (err) {
      console.warn('Gagal insert kategori ke DB, beralih ke fallback:', err);
    }
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, subCategories: subCategoryNames }),
    });
    if (res.ok) {
      const json = await res.json();
      revalidatePath('/');
      return json;
    }
  } catch {
    // fallback
  }

  const store = loadLocalStore();
  const resolvedIcon = resolveCategoryIcon(name);
  const newCat = {
    id: `cat-${Date.now()}`,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    icon: resolvedIcon,
    description: '',
    subCategories: Array.isArray(subCategoryNames)
      ? subCategoryNames.map((s, idx) => ({
          id: `sub-${Date.now()}-${idx}`,
          name: s.trim(),
          slug: s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        }))
      : [],
  };
  store.categories.push(newCat);
  saveLocalStore(store.categories, store.repositories);
  revalidatePath('/');
  return { success: true, category: newCat };
}

export async function updateSubCategoryAction(id: string, name: string) {
  if (db && isDbConfigured) {
    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await db.update(subCategories).set({ name, slug }).where(eq(subCategories.id, id));
      revalidatePath('/');
      return { success: true, message: 'Sub-kategori berhasil diubah.' };
    } catch (err) {
      console.warn('Gagal update subkategori di DB, beralih ke fallback:', err);
    }
  }

  const store = loadLocalStore();
  store.categories.forEach(cat => {
    if (cat.subCategories) {
      cat.subCategories.forEach((s: any) => {
        if (s.id === id) {
          s.name = name;
          s.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        }
      });
    }
  });
  store.repositories.forEach(repo => {
    if (repo.subCategoryId === id) {
      repo.subCategoryName = name;
    }
  });
  saveLocalStore(store.categories, store.repositories);

  try {
    const res = await fetch(`${BACKEND_URL}/api/subcategories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const json = await res.json();
      revalidatePath('/');
      return json;
    }
  } catch {
    // fallback
  }

  revalidatePath('/');
  return { success: true, message: 'Sub-kategori berhasil diubah (Mode Mock)' };
}

export async function deleteSubCategoryAction(id: string) {
  if (db && isDbConfigured) {
    try {
      await db.delete(subCategories).where(eq(subCategories.id, id));
      revalidatePath('/');
      return { success: true, message: 'Sub-kategori berhasil dihapus.' };
    } catch (err) {
      console.warn('Gagal delete subkategori di DB, beralih ke fallback:', err);
    }
  }

  const store = loadLocalStore();
  let deletedSubName = '';
  store.categories.forEach(cat => {
    if (cat.subCategories) {
      const found = cat.subCategories.find((s: any) => s.id === id);
      if (found) deletedSubName = found.name;
      cat.subCategories = cat.subCategories.filter((s: any) => s.id !== id);
    }
  });
  store.repositories.forEach(repo => {
    if (
      repo.subCategoryId === id ||
      (deletedSubName && repo.subCategoryName?.toLowerCase() === deletedSubName.toLowerCase())
    ) {
      repo.subCategoryId = undefined as any;
      repo.subCategoryName = undefined as any;
    }
  });
  saveLocalStore(store.categories, store.repositories);

  try {
    const res = await fetch(`${BACKEND_URL}/api/subcategories/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const json = await res.json();
      revalidatePath('/');
      return json;
    }
  } catch {
    // fallback
  }

  revalidatePath('/');
  return { success: true, message: 'Sub-kategori berhasil dihapus (Mode Mock)' };
}

export async function moveRepositoryAction(repoId: string, categoryId: string, subCategoryId: string | null, subCategoryName: string | null) {
  if (db && isDbConfigured) {
    try {
      await db.update(repositories).set({
        categoryId,
        subCategoryId: subCategoryId || null,
        updatedAt: new Date(),
      }).where(eq(repositories.id, repoId));
      revalidatePath('/');
      return { success: true, message: 'Repositori berhasil dipindahkan.' };
    } catch (err) {
      console.warn('Gagal move repo di DB, beralih ke fallback:', err);
    }
  }

  const store = loadLocalStore();
  const targetCat = store.categories.find(c => c.id === categoryId);
  store.repositories.forEach(repo => {
    if (repo.id === repoId) {
      repo.categoryId = categoryId;
      repo.categoryName = targetCat?.name || repo.categoryName;
      repo.subCategoryId = (subCategoryId || undefined) as any;
      repo.subCategoryName = (subCategoryName || undefined) as any;
    }
  });
  saveLocalStore(store.categories, store.repositories);

  try {
    const res = await fetch(`${BACKEND_URL}/api/repositories/${repoId}/move`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId, subCategoryId, subCategoryName }),
    });
    if (res.ok) {
      const json = await res.json();
      revalidatePath('/');
      return json;
    }
  } catch {
    // fallback
  }

  revalidatePath('/');
  return { success: true, message: 'Repositori berhasil dipindahkan (Mode Mock)' };
}

export async function updateRepositoryAction(id: string, updates: { name?: string; description?: string; notes?: string; categoryId?: string; subCategoryId?: string; subCategoryName?: string }) {
  if (db && isDbConfigured) {
    try {
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.categoryId) updateData.categoryId = updates.categoryId;
      if (updates.subCategoryId !== undefined) updateData.subCategoryId = updates.subCategoryId || null;
      updateData.updatedAt = new Date();

      const [updated] = await db.update(repositories).set(updateData).where(eq(repositories.id, id)).returning();
      revalidatePath('/');
      return { success: true, repository: updated };
    } catch (err) {
      console.warn('Gagal update repo di DB, beralih ke fallback:', err);
    }
  }

  const store = loadLocalStore();
  let updatedRepo: any = null;
  store.repositories = store.repositories.map(repo => {
    if (repo.id === id) {
      updatedRepo = {
        ...repo,
        ...updates,
      };
      return updatedRepo;
    }
    return repo;
  });
  saveLocalStore(store.categories, store.repositories);

  try {
    const res = await fetch(`${BACKEND_URL}/api/repositories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const json = await res.json();
      revalidatePath('/');
      return json;
    }
  } catch {
    // fallback
  }

  revalidatePath('/');
  return { success: true, repository: updatedRepo };
}

export async function deleteRepositoryAction(id: string) {
  if (db && isDbConfigured) {
    try {
      await db.delete(repositories).where(eq(repositories.id, id));
      revalidatePath('/');
      return { success: true, message: 'Repositori berhasil dihapus.' };
    } catch (err) {
      console.warn('Gagal delete repo dari DB, beralih ke fallback:', err);
    }
  }

  const store = loadLocalStore();
  store.repositories = store.repositories.filter(repo => repo.id !== id);
  saveLocalStore(store.categories, store.repositories);

  try {
    const res = await fetch(`${BACKEND_URL}/api/repositories/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const json = await res.json();
      revalidatePath('/');
      return json;
    }
  } catch {
    // fallback
  }

  revalidatePath('/');
  return { success: true, message: 'Repositori berhasil dihapus.' };
}

async function runInternalAdvisorChat(messages: Array<{ role: 'user' | 'assistant'; content: string }>) {
  try {
    const cats = await getCategoriesTree();
    const repos = await getRepositories();

    const catalogStructure = (cats || []).map(c => {
      const subs = (c.subCategories || []).map((s: any) => `"${s.name}"`).join(', ');
      return `- Group: "${c.name}"\n  Subgroups: ${subs || '"General"'}`;
    }).join('\n');

    const repoCatalog = (repos || []).map((r, i) => {
      const topicsStr = Array.isArray(r.topics) ? r.topics.slice(0, 10).join(', ') : '';
      const summaryText = typeof r.aiSummary === 'object' && r.aiSummary !== null
        ? ((r.aiSummary as any).corePurpose || (r.aiSummary as any).summary || '')
        : (typeof r.aiSummary === 'string' ? r.aiSummary : '');

      const contextDoc = (r as any).readmeContent
        ? (r as any).readmeContent.slice(0, 1200)
        : (summaryText || r.description || '');

      return `--- REPO #${i + 1} ---
fullName: ${r.fullName || `${r.owner}/${r.name}`}
group: ${r.categoryName || 'General'}
subgroup: ${r.subCategoryName || 'General'}
language: ${r.primaryLanguage || 'Unknown'} | stars: ${r.starsCount || 0}
description: ${r.description || ''}
topics: ${topicsStr}
readme_documentation: ${contextDoc}
clone: git clone ${r.githubUrl || `https://github.com/${r.fullName}`}.git`;
    }).join('\n\n');

    const systemPrompt = `Kamu adalah "AI Library Advisor" untuk platform GitHub Library Hub.
Tugasmu: Menganalisis kebutuhan pengguna secara mendalam dan merekomendasikan repositori yang BENAR-BENAR COCOK berdasarkan dokumentasi resmi katalog di bawah ini.

=== STRUKTUR GRUP & SUBGRUP AKTIF ===
${catalogStructure}

=== KATALOG REPOSITORI LENGKAP (${repos.length} repo dengan README & dokumentasi) ===
${repoCatalog}

=== PROTOKOL JAWABAN (SANGAT KETAT) ===
1. JANGAN PERNAH merekomendasikan repo yang tidak relevan secara fungsional. Misalnya jika user mencari alat penjadwalan media sosial, rekomendasikan hanya tool scheduling (seperti postiz-app atau cogsend), JANGAN PERNAH menyarankan tutorial belajar seperti 30-Days-Of-Python.
2. JANGAN PERNAH menggunakan simbol bintang dua (**) untuk bold dan JANGAN PERNAH menggunakan simbol pagar (#, ##, ###) untuk heading. Gunakan teks polos rapi.
3. Jika kebutuhan pengguna BELUM ADA di dalam katalog, nyatakan secara jujur dan tawarkan grup/subgrup yang tersedia.
4. Format Jawaban:
Analisis Kebutuhan: (1 kalimat ringkas mengenai apa yang dicari user)

Rekomendasi:
[fullName]
- Grup / Subgrup: [Group] / [Subgroup]
- Mengapa Relevan: (poin teknis konkret solusi berdasarkan README)
- Spesifikasi: [Language] | [Stars] Stars
- Clone: git clone https://github.com/[fullName].git

5. Bahasa: Bahasa Indonesia yang lugas, presisi, dan padat.`;

    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    let replyText: string | null = null;
    let provider = 'gemini';

    // 1. Eksekusi Google Gemini (Model aktif: gemini-3.8-flash, fallback gemini-2.0-flash)
    if (geminiKey) {
      const geminiModels = ['gemini-3.8-flash', 'gemini-2.0-flash'];
      for (const model of geminiModels) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
          const contents = messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          }));
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemPrompt }] },
              contents,
              generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
            }),
            signal: AbortSignal.timeout(18000),
          });
          if (res.ok) {
            const json = (await res.json()) as any;
            const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text && text.trim()) {
              replyText = text.trim();
              provider = `gemini (${model})`;
              break;
            }
          }
        } catch (gemErr) {
          console.warn(`Gemini (${model}) error:`, gemErr);
        }
      }
    }

    // 2. Eksekusi Groq Cloud Fallback (Model aktif valid: qwen/qwen3.8-27b, openai/gpt-oss-120b)
    if (!replyText && groqKey) {
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
              temperature: 0.2,
              messages: [
                { role: 'system', content: systemPrompt },
                ...messages.map(m => ({ role: m.role, content: m.content })),
              ],
            }),
            signal: AbortSignal.timeout(18000),
          });
          if (res.ok) {
            const json = (await res.json()) as any;
            const text = json.choices?.[0]?.message?.content;
            if (text && text.trim()) {
              replyText = text.trim();
              provider = `groq (${model})`;
              break;
            }
          }
        } catch (groqErr) {
          console.warn(`Groq (${model}) error:`, groqErr);
        }
      }
    }

    // Jika kedua LLM gagal menghubungi server AI
    if (!replyText) {
      return {
        success: false,
        error: 'Layanan AI sedang sibuk atau kuota sementara tercapai. Silakan coba kembali beberapa saat lagi.',
      };
    }

    // Pembersihan menyeluruh simbol ** dan ## dari output
    replyText = replyText
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*\*/g, '')
      .trim();

    // Detect matched repo cards
    const replyLower = replyText.toLowerCase();
    const detectedRepos = (repos || []).filter(r => {
      const fn = (r.fullName || `${r.owner}/${r.name}`).toLowerCase();
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

    return {
      success: true,
      message: replyText,
      detectedRepos,
      provider: 'internal-fallback',
    };
  } catch (internalErr: any) {
    return {
      success: false,
      error: 'Asisten belum dapat memproses pertanyaan saat ini. Silakan ulangi beberapa saat lagi.',
    };
  }
}

export async function chatWithLibraryAdvisor(messages: Array<{ role: 'user' | 'assistant'; content: string }>) {
  // 1. Coba hubungi Backend API Server terlebih dahulu (port 4000 atau cloud)
  try {
    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
      cache: 'no-store',
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({}));
    if (err?.error) {
      return { success: false, error: err.error };
    }
  } catch {
    // Backend di port 4000 offline atau jaringan cloud tidak terhubung -> gunakan internal advisor
  }

  // 2. Fallback cerdas Next.js internal (mencegah error fetch failed baik di Dev lokal maupun Cloud Vercel)
  return await runInternalAdvisorChat(messages);
}
