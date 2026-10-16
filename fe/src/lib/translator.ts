import fs from 'fs';
import path from 'path';
import { db, isDbConfigured } from '@/db';
import { translationsCache } from '@/db/schema';
import { inArray, sql } from 'drizzle-orm';

export interface TranslationCache {
  [key: string]: {
    id?: string;
    en?: string;
    updatedAt: string;
  };
}

const ROOT_DATA_DIR = path.resolve(process.cwd(), '../data');
const LOCAL_DATA_DIR = path.resolve(process.cwd(), 'data');

function getCacheFilePath(): string {
  if (fs.existsSync(ROOT_DATA_DIR)) {
    return path.join(ROOT_DATA_DIR, 'translations-cache.json');
  }
  return path.join(LOCAL_DATA_DIR, 'translations-cache.json');
}

let memoryCache: TranslationCache | null = null;

export function loadTranslationsCache(): TranslationCache {
  if (memoryCache) return memoryCache;
  try {
    const filePath = getCacheFilePath();
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      memoryCache = JSON.parse(content);
      return memoryCache!;
    }
  } catch (err) {
    console.warn('[translator] Failed to read translations-cache.json:', err);
  }
  memoryCache = {};
  return memoryCache;
}

export function saveTranslationsCache(cache: TranslationCache): void {
  try {
    memoryCache = cache;
    const filePath = getCacheFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[translator] Failed to save translations-cache.json:', err);
  }
}

/**
 * Normalizes text to form a stable cache key
 */
export function getCacheKey(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Call Groq API with Qwen / Llama models
 */
async function callGroqTranslation(texts: string[], targetLang: 'id' | 'en'): Promise<string[] | null> {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return null;

  const targetName = targetLang === 'id' ? 'Indonesian' : 'English';
  const models = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'qwen/qwen3.6-27b'];

  const systemPrompt = `You are a professional software engineering and AI technology translator.
Translate the input texts into accurate, natural ${targetName}.
CRITICAL RULES:
1. Preserve developer, AI, and GitHub terminology verbatim or standard technical usage (e.g. LLM, RAG, prompt engineering, fine-tuning, embeddings, zero-shot, pipeline, inference, vector database, agentic, repo, commit, pull request, monorepo, framework, benchmark, dataset, webhook, middleware, CLI, SDK).
2. Never produce awkward literal translations (e.g. do NOT translate "prompt engineering" as "rekayasa bisikan").
3. Reply ONLY with valid JSON in this exact structure:
{"translations": ["translated text 1", "translated text 2", ...]}`;

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
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: JSON.stringify({ texts }) },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        }),
        signal: AbortSignal.timeout(12000),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed.translations) && parsed.translations.length === texts.length) {
            return parsed.translations;
          }
        }
      }
    } catch (err) {
      console.warn(`[translator] Groq model ${model} failed, trying next...`, err);
    }
  }

  return null;
}

/**
 * Fallback to Google Gemini
 */
async function callGeminiTranslation(texts: string[], targetLang: 'id' | 'en'): Promise<string[] | null> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return null;

  const targetName = targetLang === 'id' ? 'Indonesian' : 'English';
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];

  const prompt = `Translate each item in the following JSON array of strings into ${targetName}.
Maintain AI & developer terminology (LLM, RAG, prompt engineering, fine-tuning, embeddings, pipeline, inference, etc.).
Return ONLY JSON: {"translations": ["...", "..."]}
Input: ${JSON.stringify(texts)}`;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (content) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed.translations) && parsed.translations.length === texts.length) {
            return parsed.translations;
          }
        }
      }
    } catch (err) {
      console.warn(`[translator] Gemini model ${model} failed:`, err);
    }
  }

  return null;
}

/**
 * Main translation entry point with database cache, memory cache, and disk fallback
 */
export async function translateTexts(
  texts: string[],
  targetLang: 'id' | 'en' = 'id'
): Promise<string[]> {
  if (!texts || texts.length === 0) return [];

  const localCache = loadTranslationsCache();
  const results: (string | null)[] = new Array(texts.length).fill(null);
  const missingIndices: number[] = [];
  const missingTexts: string[] = [];

  // 1. Check in-memory & local disk cache first
  texts.forEach((text, idx) => {
    const trimmed = text.trim();
    if (!trimmed) {
      results[idx] = text;
      return;
    }

    const key = getCacheKey(trimmed);
    const cached = localCache[key];
    if (cached && cached[targetLang]) {
      results[idx] = cached[targetLang]!;
    } else {
      missingIndices.push(idx);
      missingTexts.push(trimmed);
    }
  });

  // 2. For items missing from memory, query PostgreSQL Neon database
  if (missingTexts.length > 0 && isDbConfigured && db) {
    try {
      const keysToQuery = missingTexts.map(t => getCacheKey(t));
      const dbRows = await db
        .select()
        .from(translationsCache)
        .where(inArray(translationsCache.cacheKey, keysToQuery));

      if (dbRows && dbRows.length > 0) {
        const dbMap = new Map<string, string>();
        for (const row of dbRows) {
          if (row.targetLang === targetLang && row.translatedText) {
            dbMap.set(row.cacheKey, row.translatedText);
            // Sync to local memory cache
            if (!localCache[row.cacheKey]) {
              localCache[row.cacheKey] = { updatedAt: row.updatedAt.toISOString() };
            }
            localCache[row.cacheKey][targetLang] = row.translatedText;
          }
        }

        // Check if database solved any of the missing items
        const remainingIndices: number[] = [];
        const remainingTexts: string[] = [];

        missingTexts.forEach((originalText, i) => {
          const overallIdx = missingIndices[i];
          const key = getCacheKey(originalText);
          const fromDb = dbMap.get(key);
          if (fromDb) {
            results[overallIdx] = fromDb;
          } else {
            remainingIndices.push(overallIdx);
            remainingTexts.push(originalText);
          }
        });

        missingIndices.length = 0;
        missingIndices.push(...remainingIndices);
        missingTexts.length = 0;
        missingTexts.push(...remainingTexts);
      }
    } catch (dbErr) {
      console.warn('[translator] Failed to query translations from Neon database:', dbErr);
    }
  }

  // If all texts are resolved from memory or DB, return immediately
  if (missingTexts.length === 0) {
    return results as string[];
  }

  // 3. Translate remaining missing texts via LLM in batches of max 20
  const BATCH_SIZE = 20;
  let cacheModified = false;
  const newDbRows: {
    cacheKey: string;
    sourceText: string;
    targetLang: string;
    translatedText: string;
    provider: string;
  }[] = [];

  for (let i = 0; i < missingTexts.length; i += BATCH_SIZE) {
    const batchTexts = missingTexts.slice(i, i + BATCH_SIZE);
    const batchIndices = missingIndices.slice(i, i + BATCH_SIZE);

    // Call Groq first, fallback to Gemini
    let translations = await callGroqTranslation(batchTexts, targetLang);
    if (!translations) {
      translations = await callGeminiTranslation(batchTexts, targetLang);
    }

    // Populate results, memory cache, and prepare DB records
    batchTexts.forEach((originalText, bIdx) => {
      const overallIdx = batchIndices[bIdx];
      const translated = (translations && translations[bIdx]) ? translations[bIdx].trim() : originalText;

      results[overallIdx] = translated;

      const key = getCacheKey(originalText);
      if (!localCache[key]) {
        localCache[key] = { updatedAt: new Date().toISOString() };
      }
      localCache[key][targetLang] = translated;
      localCache[key].updatedAt = new Date().toISOString();
      cacheModified = true;

      newDbRows.push({
        cacheKey: key,
        sourceText: originalText,
        targetLang,
        translatedText: translated,
        provider: 'groq-qwen3.8-27b',
      });
    });
  }

  // 4. Save to disk cache for offline resilience
  if (cacheModified) {
    saveTranslationsCache(localCache);
  }

  // 5. Persist newly translated rows to PostgreSQL Neon Database
  if (isDbConfigured && db && newDbRows.length > 0) {
    try {
      await db
        .insert(translationsCache)
        .values(newDbRows)
        .onConflictDoUpdate({
          target: translationsCache.cacheKey,
          set: {
            translatedText: sql`EXCLUDED.translated_text`,
            updatedAt: sql`NOW()`,
          },
        });
    } catch (dbInsertErr) {
      console.warn('[translator] Failed to persist new translations to database:', dbInsertErr);
    }
  }

  return results as string[];
}

/**
 * Convenience helper for a single text
 */
export async function translateText(
  text: string,
  targetLang: 'id' | 'en' = 'id'
): Promise<string> {
  const [translated] = await translateTexts([text], targetLang);
  return translated || text;
}
