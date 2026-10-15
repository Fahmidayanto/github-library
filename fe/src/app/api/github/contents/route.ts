import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');

  if (!owner || !repo) {
    return NextResponse.json({ error: 'owner dan repo wajib diisi.' }, { status: 400 });
  }

  // Tier 1: GitHub Official REST API
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GitHub-Library-Hub',
    };

    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, {
      headers,
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return NextResponse.json(data);
      }
    }
  } catch {
    // API timeout/limit -> lanjut ke Tier 2
  }

  // Tier 2: HTML Smart Scraper (Bypass 403 Rate Limit)
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
      const html = await pageRes.text();
      const fileRegex = /\{"name":"([^"]+)","path":"([^"]+)","contentType":"(file|directory)"[^}]*\}/g;
      const matches = [...html.matchAll(fileRegex)];

      if (matches.length > 0) {
        const unique = new Map<string, any>();
        for (const m of matches) {
          const name = m[1];
          const path = m[2];
          const type = m[3] === 'directory' ? 'dir' : 'file';
          if (!unique.has(name)) {
            unique.set(name, {
              name,
              path,
              type,
              size: 0,
              html_url: `https://github.com/${owner}/${repo}/blob/main/${path}`,
            });
          }
        }
        const fileList = Array.from(unique.values()).sort((a, b) => (a.type === 'dir' ? -1 : 1));
        return NextResponse.json(fileList);
      }
    }
  } catch {
    // Lanjut ke default
  }

  // Tier 3: Default empty array
  return NextResponse.json([]);
}
