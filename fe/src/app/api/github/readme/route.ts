import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');

  if (!owner || !repo) {
    return NextResponse.json({ error: 'owner dan repo wajib diisi.' }, { status: 400 });
  }

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
        return new NextResponse(html, {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
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
        return new NextResponse(articleMatch[1], {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
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

            // Ubah sintaks markdown image ![alt](url) menjadi tag img nyata
            processedHtml = processedHtml.replace(/!\[(.*?)\]\((https?:\/\/[^\s\)]+|[^\s\)]+\.(?:png|jpe?g|gif|webp|svg)[^\s\)]*)\)/gi, (_m, alt, src) => {
              return `<img src="${src}" alt="${alt}" referrerpolicy="no-referrer" class="rounded-xl max-w-full h-auto my-3" />`;
            });

            const safeHtml = `<div class="whitespace-pre-wrap font-sans text-sm text-slate-200 leading-relaxed">${processedHtml}</div>`;
            return new NextResponse(safeHtml, {
              status: 200,
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });
          }
        }
      } catch {
        continue;
      }
    }
  }

  return NextResponse.json({ error: 'README.md tidak ditemukan di repositori ini.' }, { status: 404 });
}
