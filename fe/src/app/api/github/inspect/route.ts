import { NextResponse } from 'next/server';
import { parseGitHubUrl, parseMetricNumber } from '@/lib/utils';

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

    // 1. Stars count (embedded JSON atau HTML counter)
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

    // 2. Forks count (embedded JSON atau HTML counter)
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

    // Watcher / subscribers count
    let subscribersCount = 0;
    const jsonWatchers = html.match(/"watcherCount":\s*(\d+)/i);
    if (jsonWatchers) {
      subscribersCount = parseInt(jsonWatchers[1], 10);
    }

    // License
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repoUrl = searchParams.get('url');

  if (!repoUrl) {
    return NextResponse.json({ error: 'URL repositori GitHub wajib diisi.' }, { status: 400 });
  }

  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) {
    return NextResponse.json(
      { error: 'Format URL GitHub tidak valid. Contoh: https://github.com/owner/repo' },
      { status: 400 }
    );
  }

  const { owner, repo } = parsed;

  // ==========================================
  // Tier 1: GitHub Official REST API
  // ==========================================
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GitHub-Library-Hub',
    };

    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers,
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const data = (await res.json()) as any;
      const stars = data.stargazers_count || 0;
      const forks = data.forks_count || 0;
      const licenseName = data.license?.spdx_id || data.license?.name || null;
      return NextResponse.json({
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

    if (res.status === 404) {
      // Periksa via HTML scraper untuk memverifikasi apakah benar-benar 404 atau private
      const scraped = await scrapeGitHubHtml(owner, repo);
      if (scraped && (scraped as any).notFound) {
        return NextResponse.json(
          { error: 'Repositori tidak ditemukan atau bersifat privat di GitHub (HTTP 404).' },
          { status: 404 }
        );
      }
      if (scraped && !(scraped as any).notFound) {
        return NextResponse.json(scraped);
      }
    }
  } catch {
    // API timeout/network failure -> lanjut ke Tier 2
  }

  // ==========================================
  // Tier 2: HTML Smart Scraper (Bypass 403 Rate Limit)
  // ==========================================
  const scrapedData = await scrapeGitHubHtml(owner, repo);
  if (scrapedData) {
    if ((scrapedData as any).notFound) {
      return NextResponse.json(
        { error: 'Repositori tidak ditemukan atau bersifat privat di GitHub (HTTP 404).' },
        { status: 404 }
      );
    }
    return NextResponse.json(scrapedData);
  }

  // ==========================================
  // Tier 3: Heuristic Safe Fallback (No Failure Gate)
  // ==========================================
  return NextResponse.json({
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
    warning: 'Metadata diambil secara dasar karena GitHub API sedang rate-limit atau offline.',
  });
}
