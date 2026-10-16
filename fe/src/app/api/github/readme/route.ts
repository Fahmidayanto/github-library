import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function getCacheFilePath(owner: string, repo: string): string {
  const rootDir = path.resolve(process.cwd(), '../data/translated-readmes');
  const localDir = path.resolve(process.cwd(), 'data/translated-readmes');
  const dir = fs.existsSync(path.resolve(process.cwd(), '../data')) ? rootDir : localDir;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, `${owner.toLowerCase()}_${repo.toLowerCase()}_id.html`);
}

async function translateText(text: string): Promise<string> {
  if (!text || !text.trim()) return text;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=id&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return text;
    const json = await res.json();
    if (Array.isArray(json) && Array.isArray(json[0])) {
      return json[0].map((item: any) => item[0]).join('');
    }
    return text;
  } catch {
    return text;
  }
}

async function translateBatchWithRetry(batch: string[], retries = 2): Promise<string[]> {
  const SEP = '\n⟦SEP⟧\n';
  const joined = batch.join(SEP);
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=id&dt=t&q=${encodeURIComponent(joined)}`;

  for (let r = 0; r <= retries; r++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json) && Array.isArray(json[0])) {
          const trans = json[0].map((item: any) => item[0]).join('');
          const split = trans.split(/\s*⟦SEP⟧\s*/);
          if (split.length === batch.length) {
            return split.map(s => s.trim());
          }
        }
      }
    } catch {
      // lanjut retry atau fallback
    }
  }

  // Fallback: translate individual segments jika batch separator gagal
  const results: string[] = [];
  for (const item of batch) {
    try {
      const single = await translateText(item);
      results.push(single.trim());
    } catch {
      results.push(item);
    }
  }
  return results;
}

async function translateHtml(html: string): Promise<string> {
  // 1. Protect code blocks, pre tags, and svgs from translation
  const codeBlocks: string[] = [];
  const protectedHtml = html.replace(/<(pre|code|svg)[^>]*>[\s\S]*?<\/\1>/gi, m => {
    codeBlocks.push(m);
    return `___PRE_CODE_${codeBlocks.length - 1}___`;
  });

  // 2. Extract visible text between tags
  const textSegments: string[] = [];
  const placeholderRegex = />([^<]+)</g;
  let match: RegExpExecArray | null;
  while ((match = placeholderRegex.exec(protectedHtml)) !== null) {
    const raw = match[1];
    if (raw.trim().length > 1 && !/^___PRE_CODE_\d+___$/.test(raw.trim())) {
      textSegments.push(raw);
    }
  }

  if (textSegments.length === 0) return html;

  // 3. Conservative batch size (max 1000 chars atau 20 item) agar tidak terkena HTTP 414 / dropping
  let currentBatch: string[] = [];
  let currentLen = 0;
  const batches: string[][] = [];

  for (const seg of textSegments) {
    if ((currentLen + seg.length > 1000 || currentBatch.length >= 20) && currentBatch.length > 0) {
      batches.push(currentBatch);
      currentBatch = [];
      currentLen = 0;
    }
    currentBatch.push(seg);
    currentLen += seg.length;
  }
  if (currentBatch.length > 0) batches.push(currentBatch);

  const translations: string[] = [];
  for (let b = 0; b < batches.length; b++) {
    const res = await translateBatchWithRetry(batches[b]);
    translations.push(...res);
  }

  // 4. Inject translated text back into HTML
  let idx = 0;
  let replacedHtml = protectedHtml.replace(/>([^<]+)</g, (fullMatch, content) => {
    if (content.trim().length > 1 && !/^___PRE_CODE_\d+___$/.test(content.trim())) {
      const trans = translations[idx++] || content;
      const leadingSpace = content.match(/^\s*/)?.[0] || '';
      const trailingSpace = content.match(/\s*$/)?.[0] || '';
      return '>' + leadingSpace + trans + trailingSpace + '<';
    }
    return fullMatch;
  });

  // 5. Restore code blocks
  replacedHtml = replacedHtml.replace(/___PRE_CODE_(\d+)___/g, (_, i) => codeBlocks[Number(i)] || '');
  return replacedHtml;
}

async function fetchRawReadmeHtml(owner: string, repo: string): Promise<string | null> {
  // Tier 1: GitHub Official REST API (Accept: application/vnd.github.html+json)
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.html+json',
      'User-Agent': 'GitHub-Library-Hub',
    };

    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
      headers,
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const html = await res.text();
      if (html && html.trim()) {
        return html;
      }
    }
  } catch {
    // API rate limit / network error -> lanjut ke Tier 2
  }

  // Tier 2: Pre-rendered HTML Scraper dari halaman publik GitHub
  try {
    const pageRes = await fetch(`https://github.com/${owner}/${repo}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (pageRes.ok) {
      const pageHtml = await pageRes.text();
      const articleMatch = pageHtml.match(/<article[^>]*class="[^"]*markdown-body[^"]*"[^>]*>([\s\S]*?)<\/article>/i);
      if (articleMatch && articleMatch[1].trim()) {
        return articleMatch[1];
      }
    }
  } catch {
    // Lanjut ke Tier 3 jika scraping gagal
  }

  // Tier 3: Fetch raw markdown dari raw.githubusercontent.com (No Rate Limit)
  for (const branch of ['main', 'master']) {
    for (const filename of ['README.md', 'readme.md', 'README.markdown', 'README.txt']) {
      try {
        const rawRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filename}`, {
          signal: AbortSignal.timeout(4000),
        });
        if (rawRes.ok) {
          const rawText = await rawRes.text();
          if (rawText && rawText.trim()) {
            let processedHtml = rawText
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');

            processedHtml = processedHtml.replace(/!\[(.*?)\]\((https?:\/\/[^\s\)]+|[^\s\)]+\.(?:png|jpe?g|gif|webp|svg)[^\s\)]*)\)/gi, (_m, alt, src) => {
              return `<img src="${src}" alt="${alt}" referrerpolicy="no-referrer" class="rounded-xl max-w-full h-auto my-3" />`;
            });

            return `<div class="whitespace-pre-wrap font-sans text-sm text-slate-200 leading-relaxed">${processedHtml}</div>`;
          }
        }
      } catch {
        continue;
      }
    }
  }

  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const lang = (searchParams.get('lang') || 'en').toLowerCase();

  if (!owner || !repo) {
    return NextResponse.json({ error: 'owner dan repo wajib diisi.' }, { status: 400 });
  }

  // Jika meminta Bahasa Indonesia, periksa cache terjemahan terlebih dahulu
  if (lang === 'id') {
    try {
      const cacheFile = getCacheFilePath(owner, repo);
      if (fs.existsSync(cacheFile)) {
        const cachedHtml = fs.readFileSync(cacheFile, 'utf-8');
        if (cachedHtml && cachedHtml.trim()) {
          return new NextResponse(cachedHtml, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        }
      }
    } catch {
      // cache read failed, proceed to fetch & translate
    }
  }

  const rawHtml = await fetchRawReadmeHtml(owner, repo);
  if (!rawHtml) {
    return NextResponse.json({ error: 'README.md tidak ditemukan di repositori ini.' }, { status: 404 });
  }

  // Jika meminta Bahasa Indonesia, terjemahkan dan simpan ke cache
  if (lang === 'id') {
    try {
      const translatedHtml = await translateHtml(rawHtml);
      try {
        const cacheFile = getCacheFilePath(owner, repo);
        fs.writeFileSync(cacheFile, translatedHtml, 'utf-8');
      } catch (err) {
        console.warn('Gagal menyimpan cache README terjemahan:', err);
      }
      return new NextResponse(translatedHtml, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    } catch (err) {
      console.warn('Gagal menerjemahkan README, fallback ke original:', err);
      return new NextResponse(rawHtml, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
  }

  // Jika meminta Bahasa Inggris (Original)
  return new NextResponse(rawHtml, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
