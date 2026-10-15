'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  X, 
  Star, 
  GitFork, 
  Eye, 
  Heart, 
  Code2, 
  ExternalLink, 
  GitBranch, 
  Tag, 
  BookOpen, 
  Copy, 
  Check,
  Scale, 
  Activity, 
  Loader2, 
  Folder, 
  FileText,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  GitCompare,
  Terminal,
  XCircle,
  CheckCircle2,
  Zap,
  ShieldAlert,
  Layers,
  HelpCircle,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { formatCompactNumber } from '@/lib/utils';
import { getRepoSummary, RepoSummary, CaseNote, CaseMetric } from '@/lib/repo-summary';

interface RepoDetailModalProps {
  isOpen: boolean;
  repoFullName: string | null;
  onClose: () => void;
}

function getFallbackHtml(code: string, isAfter: boolean): string {
  const accent = isAfter ? 'emerald' : 'rose';
  const badgeText = isAfter ? '✨ Optimal Craftsmanship' : '⚠️ Unoptimized / Legacy UI';
  const buttonText = isAfter ? 'Konfirmasi Aksi' : 'Submit Form';
  const buttonClass = isAfter 
    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20' 
    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-750';

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>body { background-color: #070b14; color: #f8fafc; font-family: ui-sans-serif, system-ui, sans-serif; margin: 0; padding: 12px; }</style>
</head>
<body class="min-h-full flex items-center justify-center">
  <div class="w-full max-w-sm bg-slate-900/95 border border-${accent}-500/40 rounded-xl p-4 shadow-2xl space-y-3 text-xs">
    <div class="flex items-center justify-between pb-2 border-b border-slate-800 text-[10px] font-mono">
      <span class="text-${accent}-400 font-bold flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-${accent}-400"></span>
        <span>${badgeText}</span>
      </span>
      <span class="text-slate-400 font-medium">Visual UI Preview</span>
    </div>

    <div class="space-y-1.5">
      <div class="h-3.5 w-3/4 bg-${accent}-500/25 rounded-md"></div>
      <div class="h-2.5 w-full bg-slate-800 rounded-md"></div>
      <div class="h-2.5 w-5/6 bg-slate-800/80 rounded-md"></div>
    </div>

    <div class="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
      <div class="p-2.5 rounded-lg bg-black/40 border border-white/10">
        <div class="text-slate-400 uppercase tracking-wider text-[9px]">Rendering Performance</div>
        <div class="text-${accent}-400 font-bold mt-0.5 text-xs">${isAfter ? '60 FPS (Fluid)' : '30 FPS (Drops)'}</div>
      </div>
      <div class="p-2.5 rounded-lg bg-black/40 border border-white/10">
        <div class="text-slate-400 uppercase tracking-wider text-[9px]">A11y & Contrast</div>
        <div class="text-${accent}-400 font-bold mt-0.5 text-xs">${isAfter ? 'WCAG AAA (100%)' : 'Fail (2.1:1)'}</div>
      </div>
    </div>

    <button class="w-full py-2 px-3 rounded-lg text-xs transition-all ${buttonClass} cursor-pointer text-center">
      ${buttonText}
    </button>
  </div>
</body>
</html>`;
}

export function RepoDetailModal({ isOpen, repoFullName, onClose }: RepoDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [repoData, setRepoData] = useState<any>(null);
  const [contents, setContents] = useState<any[]>([]);
  const [readmeHtml, setReadmeHtml] = useState<string>('');
  const [languages, setLanguages] = useState<Record<string, number>>({});
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isSummaryDrawerOpen, setIsSummaryDrawerOpen] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [activeCaseId, setActiveCaseId] = useState<string>('case1');
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [copiedClone, setCopiedClone] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<RepoSummary | null>(null);
  const readmeContainerRef = React.useRef<HTMLDivElement>(null);

  const handleBodyScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll > 0) {
      setScrollProgress(Math.min(100, Math.max(0, (el.scrollTop / maxScroll) * 100)));
    } else {
      setScrollProgress(0);
    }
  };

  // Multi-tier Fallback & Error Handling untuk seluruh gambar di README
  useEffect(() => {
    const container = readmeContainerRef.current;
    if (!container) return;

    const handleImgError = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target || target.tagName.toLowerCase() !== 'img') return;
      const img = target as HTMLImageElement;

      const originalSrc = img.getAttribute('data-original-src') || img.src;
      const canonicalSrc = img.getAttribute('data-canonical-src');
      const fallbackBranch = img.getAttribute('data-fallback-branch');
      const fallbackCdn = img.getAttribute('data-fallback-cdn');
      const step = parseInt(img.getAttribute('data-error-step') || '0', 10);

      // Tier 1: Canonical source fallback (bypasses camo proxy if camo fails)
      if (step === 0 && canonicalSrc && img.src !== canonicalSrc) {
        img.setAttribute('data-error-step', '1');
        img.src = canonicalSrc;
        return;
      }

      // Tier 2: Alternate branch fallback (e.g. master vs main)
      if (step <= 1 && fallbackBranch && img.src !== fallbackBranch) {
        img.setAttribute('data-error-step', '2');
        img.src = fallbackBranch;
        return;
      }

      // Tier 3: jsDelivr global CDN mirror fallback
      if (step <= 2 && fallbackCdn && img.src !== fallbackCdn) {
        img.setAttribute('data-error-step', '3');
        img.src = fallbackCdn;
        return;
      }

      // Tier 4: Graceful UI handling (never leave an ugly broken image box!)
      img.setAttribute('data-error-step', '4');

      // Check if it's a small badge, status icon, or tracking pixel (jangan sembunyikan gambar/camo riil!)
      const isBadgeOrPixel = 
        (img.naturalWidth > 0 && img.naturalWidth <= 24) ||
        (img.getAttribute('width') && parseInt(img.getAttribute('width')!, 10) <= 24) ||
        (img.getAttribute('height') && parseInt(img.getAttribute('height')!, 10) <= 24) ||
        (img.alt && /badge|shield|track|npm|license|build|stars|version/i.test(img.alt)) ||
        /shields\.io|badge|pixel|1x1|track/i.test(img.src);

      if (isBadgeOrPixel) {
        img.style.display = 'none';
        return;
      }

      // Replace content image with clean glass fallback UI
      const placeholder = document.createElement('div');
      placeholder.className = 'my-3 p-3.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-between gap-3 text-xs text-slate-300';
      placeholder.innerHTML = `
        <div class="flex items-center space-x-2.5 min-w-0">
          <span class="p-1 rounded bg-white/10 text-slate-400 shrink-0">🖼️</span>
          <span class="truncate font-mono text-[11px] text-slate-300">${img.alt || 'Pratinjau Gambar'}</span>
        </div>
        <a href="${originalSrc}" target="_blank" rel="noopener noreferrer" class="shrink-0 text-sky-400 hover:underline flex items-center space-x-1 font-mono text-[11px] bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
          <span>Buka di GitHub</span>
          <span>↗</span>
        </a>
      `;
      img.parentNode?.replaceChild(placeholder, img);
    };

    container.addEventListener('error', handleImgError, { capture: true });
    return () => container.removeEventListener('error', handleImgError, { capture: true });
  }, [readmeHtml]);

  useEffect(() => {
    if (!isOpen || !repoFullName) return;

    const parts = repoFullName.split('/');
    const owner = parts[0];
    const repo = parts[1] || parts[0];

    setLoading(true);
    setRepoData(null);
    setAiSummary(null);
    setReadmeHtml('');
    setContents([]);

    async function loadData() {
      try {
        // 1. Core Metadata (Prioritaskan proxy internal yang kebal 403)
        let meta: any = null;
        let defaultBranch = 'main';
        try {
          const inspectRes = await fetch(`/api/github/inspect?url=https://github.com/${owner}/${repo}`);
          if (inspectRes.ok) {
            meta = await inspectRes.json();
          } else {
            const metaRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
            if (metaRes.ok) {
              meta = await metaRes.json();
            }
          }
        } catch {
          const inspectRes = await fetch(`/api/github/inspect?url=https://github.com/${owner}/${repo}`);
          if (inspectRes.ok) {
            meta = await inspectRes.json();
          }
        }

        if (meta) {
          setRepoData(meta);
          defaultBranch = meta.default_branch || meta.defaultBranch || 'main';
        }

        // 2. Contents / File Explorer (Gunakan endpoint /api/github/contents dengan scraper fallback)
        try {
          const contentsRes = await fetch(`/api/github/contents?owner=${owner}&repo=${repo}`);
          if (contentsRes.ok) {
            const files = await contentsRes.json();
            if (Array.isArray(files) && files.length > 0) {
              files.sort((a: any, b: any) => (a.type === 'dir' ? -1 : 1));
              setContents(files.slice(0, 15));
            }
          } else {
            const directRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`);
            if (directRes.ok) {
              const files = await directRes.json();
              if (Array.isArray(files)) {
                files.sort((a: any, b: any) => (a.type === 'dir' ? -1 : 1));
                setContents(files.slice(0, 15));
              }
            }
          }
        } catch (e) {
          console.warn('Failed to load repo contents:', e);
        }

        // 3. Languages
        try {
          if (meta?.languages && typeof meta.languages === 'object') {
            setLanguages(meta.languages);
          } else {
            const langRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`);
            if (langRes.ok) {
              const lang = await langRes.json();
              setLanguages(lang);
            }
          }
        } catch (e) {
          console.warn('Failed to load repo languages:', e);
        }

        // 4. README HTML & Multi-Tier Resilient Image Resolver
        let html = '';
        try {
          const proxyRes = await fetch(`/api/github/readme?owner=${owner}&repo=${repo}`);
          if (proxyRes.ok) {
            html = await proxyRes.text();
          } else {
            const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
              headers: { Accept: 'application/vnd.github.html+json' },
            });
            if (readmeRes.ok) {
              html = await readmeRes.text();
            }
          }
        } catch {
          const proxyRes = await fetch(`/api/github/readme?owner=${owner}&repo=${repo}`);
          if (proxyRes.ok) {
            html = await proxyRes.text();
          }
        }

        if (html) {
          const altBranch = defaultBranch === 'main' ? 'master' : 'main';
          const rawBaseUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/`;
          const altRawBaseUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${altBranch}/`;
          const cdnBaseUrl = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${defaultBranch}/`;
          const githubBaseUrl = `https://github.com/${owner}/${repo}/blob/${defaultBranch}/`;

          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');

          doc.querySelectorAll('img').forEach(img => {
            const rawSrc = img.getAttribute('src') || '';
            const canonicalSrc = img.getAttribute('data-canonical-src');
            img.setAttribute('data-original-src', rawSrc);

            // 1. Prioritaskan URL Canonical Asli (Bypass proxy Camo yang sering timeout/403)
            if (canonicalSrc && canonicalSrc.startsWith('http')) {
              img.setAttribute('src', canonicalSrc);
              img.setAttribute('data-fallback-cdn', rawSrc);
            }
            // 2. Rewrite GitHub blob URLs langsung ke raw image
            else if (rawSrc.includes(`github.com/${owner}/${repo}/blob/`)) {
              const cleaned = rawSrc
                .replace(`github.com/${owner}/${repo}/blob/`, `raw.githubusercontent.com/${owner}/${repo}/`)
                .replace('/HEAD/', `/${defaultBranch}/`);
              img.setAttribute('src', cleaned);
            }
            // 3. Rewrite GitHub raw URLs (normalisasi HEAD ke defaultBranch)
            else if (rawSrc.includes(`raw.githubusercontent.com/${owner}/${repo}/HEAD/`)) {
              img.setAttribute('src', rawSrc.replace('/HEAD/', `/${defaultBranch}/`));
            }
            else if (rawSrc.includes(`github.com/${owner}/${repo}/raw/`)) {
              const cleaned = rawSrc
                .replace(`github.com/${owner}/${repo}/raw/`, `raw.githubusercontent.com/${owner}/${repo}/`)
                .replace('/HEAD/', `/${defaultBranch}/`);
              img.setAttribute('src', cleaned);
            }
            // 4. Rewrite path relatif GitHub SSR (/owner/repo/raw/... atau /owner/repo/blob/...)
            else if (rawSrc.startsWith(`/${owner}/${repo}/raw/`)) {
              const pathWithoutRaw = rawSrc
                .replace(`/${owner}/${repo}/raw/`, `/${owner}/${repo}/`)
                .replace('/HEAD/', `/${defaultBranch}/`);
              img.setAttribute('src', `https://raw.githubusercontent.com${pathWithoutRaw}`);
            }
            else if (rawSrc.startsWith(`/${owner}/${repo}/blob/`)) {
              const pathWithoutBlob = rawSrc
                .replace(`/${owner}/${repo}/blob/`, `/${owner}/${repo}/`)
                .replace('/HEAD/', `/${defaultBranch}/`);
              img.setAttribute('src', `https://raw.githubusercontent.com${pathWithoutBlob}`);
            }
            // 5. Resolve Relative Paths dengan pembersihan duplikasi owner/repo
            else if (rawSrc && !rawSrc.startsWith('http://') && !rawSrc.startsWith('https://') && !rawSrc.startsWith('data:')) {
              let cleanSrc = rawSrc.replace(/^(\.\/|\.\.\/|\/)+/, '');
              if (cleanSrc.startsWith(`${owner}/${repo}/`)) {
                cleanSrc = cleanSrc.replace(`${owner}/${repo}/`, '');
              }
              cleanSrc = cleanSrc.replace(/^raw\//, '').replace(/^HEAD\//, '');

              img.setAttribute('src', rawBaseUrl + cleanSrc);
              img.setAttribute('data-fallback-branch', altRawBaseUrl + cleanSrc);
              img.setAttribute('data-fallback-cdn', cdnBaseUrl + cleanSrc);
            }

            img.setAttribute('referrerpolicy', 'no-referrer');
            img.setAttribute('loading', 'lazy');
            img.setAttribute('decoding', 'async');
            img.classList.add('rounded-xl', 'max-w-full', 'h-auto', 'my-3');
          });

          doc.querySelectorAll('a').forEach(a => {
            const href = a.getAttribute('href');
            if (href && !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('#') && !href.startsWith('mailto:')) {
              let cleanHref = href.replace(/^(\.\/|\.\.\/|\/)+/, '');
              if (cleanHref.startsWith(`${owner}/${repo}/`)) {
                cleanHref = cleanHref.replace(`${owner}/${repo}/`, '');
              }
              a.setAttribute('href', githubBaseUrl + cleanHref);
            }
            a.setAttribute('target', '_blank');
            a.setAttribute('rel', 'noopener noreferrer');
          });

          setReadmeHtml(doc.body.innerHTML);
        }

        // 4. Fetch Pure AI Summary dari Antigravity Watcher
        try {
          const sumRes = await fetch(`/api/github/summary?repo=${encodeURIComponent(repoFullName || '')}`);
          if (sumRes.ok) {
            const sumData = await sumRes.json();
            if (sumData.success && sumData.summary) {
              setAiSummary(sumData.summary);
            }
          }
        } catch {
          // Fallback ke template dinamis jika belum digenerate AI
        }
      } catch (err) {
        console.error('Error fetching repo data:', err);
      } finally {
        setLoading(false);
      }
    }


    loadData();
  }, [isOpen, repoFullName]);

  useEffect(() => {
    setIsSummaryDrawerOpen(false);
    setIsSummaryExpanded(false);
    setActiveCaseId('case1');
    setViewMode('preview');
    setCopiedClone(false);
    setCopiedSnippet(null);
  }, [isOpen, repoFullName]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isSummaryDrawerOpen) {
          setIsSummaryDrawerOpen(false);
          setIsSummaryExpanded(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSummaryDrawerOpen, onClose]);

  const parts = repoFullName ? repoFullName.split('/') : ['', ''];
  const owner = parts[0] || '';
  const repo = parts[1] || parts[0] || '';

  const summary: RepoSummary = useMemo(() => {
    if (aiSummary) return aiSummary;
    return getRepoSummary(repoData || { full_name: repoFullName, name: repo, owner: owner });
  }, [aiSummary, repoData, repoFullName, repo, owner]);

  const activeCase = summary.cases.find(c => c.id === activeCaseId) || summary.cases[0];

  useEffect(() => {
    if (activeCase?.scenarioType === 'ui' && (activeCase?.beforeHtml || activeCase?.afterHtml)) {
      setViewMode('preview');
    } else {
      setViewMode('code');
    }
  }, [activeCase?.id, activeCase?.scenarioType, activeCase?.beforeHtml, activeCase?.afterHtml]);

  const handleCopyClone = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedClone(true);
    setTimeout(() => setCopiedClone(false), 1600);
  };

  const handleCopySnippet = (snippet: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedSnippet(snippet);
    setTimeout(() => setCopiedSnippet(null), 1600);
  };

  if (!isOpen || !repoFullName) return null;

  const totalBytes = Object.values(languages).reduce((a, b) => a + b, 0);

  return (
    <div 
      id="repoDetailModal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto bg-black/60 backdrop-blur-xl animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="glass-modal-container relative w-full max-w-6xl max-h-[92vh] rounded-3xl flex flex-col overflow-hidden text-slate-200 shadow-2xl animate-in zoom-in-95 duration-150"
      >
        {/* Top Header */}
        <div className="glass-modal-header px-5 pt-3.5 pb-0 flex flex-col justify-between shrink-0">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-slate-200 shrink-0 shadow-sm overflow-hidden">
                <img
                  src={repoData?.owner?.avatar_url || `https://github.com/${owner}.png`}
                  alt="Avatar"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.getAttribute('data-avatar-fallback')) {
                      target.setAttribute('data-avatar-fallback', 'true');
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(owner)}&background=1e1b4b&color=38bdf8&bold=true`;
                    }
                  }}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="flex items-center space-x-2 text-sm font-normal text-slate-200 truncate">
                <span className="text-sky-400 font-semibold hover:underline cursor-pointer">{owner}</span>
                <span className="text-slate-400">/</span>
                <span className="font-bold text-white hover:underline cursor-pointer text-base">{repo}</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full border border-white/20 text-slate-300 bg-white/10">
                  {repoData?.visibility || 'Public'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button className="px-2.5 py-1 rounded-md glass-modal-btn text-xs text-pink-400 flex items-center space-x-1.5">
                <Heart className="w-3.5 h-3.5 fill-pink-500/20" />
                <span>Sponsor</span>
              </button>
              <div className="flex items-center rounded-md overflow-hidden glass-modal-btn text-xs p-0 divide-x divide-white/10">
                <span className="px-2.5 py-1 text-slate-300 flex items-center space-x-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Watch</span>
                </span>
                <span className="px-2 py-1 text-slate-400 font-semibold font-mono">
                  {formatCompactNumber(repoData?.subscribers_count ?? repoData?.watcherCount ?? 0)}
                </span>
              </div>
              <div className="flex items-center rounded-md overflow-hidden glass-modal-btn text-xs p-0 divide-x divide-white/10">
                <span className="px-2.5 py-1 text-slate-300 flex items-center space-x-1">
                  <GitFork className="w-3.5 h-3.5" />
                  <span>Fork</span>
                </span>
                <span className="px-2 py-1 text-slate-400 font-semibold font-mono">
                  {formatCompactNumber(repoData?.forks_count ?? repoData?.forksCount ?? 0)}
                </span>
              </div>
              <div className="flex items-center rounded-md overflow-hidden glass-modal-btn text-xs p-0 divide-x divide-white/10">
                <span className="px-2.5 py-1 text-slate-200 flex items-center space-x-1">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>Star</span>
                </span>
                <span className="px-2 py-1 text-slate-100 font-bold font-mono">
                  {formatCompactNumber(repoData?.stargazers_count ?? repoData?.starsCount ?? 0)}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg glass-modal-btn text-slate-400 hover:text-white transition-colors ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* GitHub Tab Strip */}
          <div className="flex items-center space-x-1 overflow-x-auto text-xs text-slate-400 font-medium border-t border-white/10 pt-1 -mb-[1px]">
            <button className="flex items-center space-x-2 px-3 py-2 text-slate-100 border-b-2 border-indigo-500 font-semibold">
              <Code2 className="w-4 h-4" />
              <span>Code</span>
            </button>
          </div>
        </div>

        {/* Action Subbar */}
        <div className="px-5 py-3 glass-modal-subbar border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center space-x-3">
            <button className="px-3 py-1.5 rounded-lg glass-modal-btn font-semibold flex items-center space-x-1.5">
              <GitBranch className="w-3.5 h-3.5 text-slate-300" />
              <span>{repoData?.default_branch || 'main'}</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={`https://github.com/${owner}/${repo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 font-semibold text-white flex items-center space-x-1.5 shadow-md border border-emerald-400/40"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Buka di GitHub</span>
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>
        </div>

        {/* Hairline Scroll Progress Bar (Emil Kowalski micro-interaction) */}
        <div className="w-full h-[2px] bg-white/5 relative overflow-hidden shrink-0">
          <div 
            className="h-full bg-gradient-to-r from-sky-400 via-indigo-400 to-pink-400 transition-all duration-100 ease-out"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        {/* Modal Main Body */}
        <div 
          onScroll={handleBodyScroll}
          className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 glass-modal-body premium-scrollbar scroll-smooth"
        >
          {/* Left Column: File Explorer & README */}
          <div className="lg:col-span-8 space-y-6">
            {/* File Explorer Table */}
            <div className="border border-white/15 rounded-2xl overflow-hidden glass-inner-panel">
              <div className="bg-white/10 px-4 py-2.5 border-b border-white/10 flex items-center justify-between text-xs text-slate-200">
                <span className="font-semibold">{owner}</span>
                <span className="text-slate-400 font-mono text-[11px]">Latest commit files</span>
              </div>

              <div className="divide-y divide-white/10 text-xs">
                {contents.map((item, idx) => (
                  <div key={idx} className="px-4 py-2 flex items-center justify-between glass-modal-row">
                    <div className="flex items-center space-x-2.5">
                      {item.type === 'dir' ? (
                        <Folder className="w-4 h-4 text-sky-400 fill-sky-400/20" />
                      ) : (
                        <FileText className="w-4 h-4 text-slate-400" />
                      )}
                      <a
                        href={item.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-slate-200 hover:text-sky-400 text-xs"
                      >
                        {item.name}
                      </a>
                    </div>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {item.type === 'dir' ? 'Directory' : `${Math.round((item.size || 0) / 1024)} KB`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* README Container */}
            <div className="border border-white/15 rounded-2xl overflow-hidden glass-inner-panel">
              <div className="bg-white/10 px-4 py-2.5 border-b border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-slate-200 font-semibold">
                  <BookOpen className="w-4 h-4 text-slate-300" />
                  <span>README.md</span>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-6 text-slate-100 text-sm leading-relaxed">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-3 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
                    <span className="text-xs font-mono">Mengambil data README langsung dari GitHub...</span>
                  </div>
                ) : readmeHtml ? (
                  <div
                    ref={readmeContainerRef}
                    className="prose prose-invert max-w-none text-slate-200"
                    dangerouslySetInnerHTML={{ __html: readmeHtml }}
                  />
                ) : (
                  <p className="text-slate-400 italic">README.md tidak tersedia.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: About & Languages */}
          <div className="lg:col-span-4 space-y-5 text-xs">
            <div className="space-y-3 border-b border-white/10 pb-5">
              <h4 className="font-bold text-slate-100 text-sm">About</h4>
              <p className="text-slate-300 leading-relaxed">{repoData?.description || 'Tidak ada deskripsi.'}</p>
              {repoData?.homepage && (
                <div className="flex items-center space-x-2 text-sky-400 text-xs">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <a href={repoData.homepage} target="_blank" rel="noopener noreferrer" className="hover:underline font-mono">
                    {repoData.homepage.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}

              {/* Topics */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {(repoData?.topics || []).map((t: string) => (
                  <span key={t} className="px-2 py-0.5 rounded-full glass-modal-topic-badge text-[11px] font-mono">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* License & Activity */}
            <div className="space-y-2.5 text-slate-400 border-b border-white/10 pb-5">
              <div className="flex items-center space-x-2">
                <Scale className="w-4 h-4 text-slate-400" />
                <span className="text-slate-300">
                  {repoData?.license?.spdx_id || repoData?.license?.name || (typeof repoData?.license === 'string' ? repoData.license : null) || 'License tidak tertera'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-slate-400" />
                <span className="text-slate-300">Default branch: {repoData?.default_branch || repoData?.defaultBranch || 'main'}</span>
              </div>
            </div>

            {/* Languages breakdown */}
            {totalBytes > 0 && (
              <div className="space-y-2.5">
                <h5 className="font-bold text-slate-200">Languages</h5>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                  {Object.entries(languages).map(([lang, bytes]) => (
                    <div key={lang} className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                      <span className="text-slate-200 font-medium">{lang}</span>
                      <span className="text-slate-500 font-mono">{((bytes / totalBytes) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================= DOCKED SLIDE TAB (DI TEPI KANAN MODAL) ================= */}
        <button
          type="button"
          onClick={() => setIsSummaryDrawerOpen(prev => !prev)}
          title="Klik untuk membuka summary fungsi repositori"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-gradient-to-l from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white py-4 px-2.5 rounded-l-2xl shadow-2xl border-l border-y border-white/30 flex flex-col items-center space-y-2 cursor-pointer transition-all group animate-pulse"
        >
          <Sparkles className="w-4 h-4 text-amber-300 group-hover:scale-125 transition-transform" />
          <span 
            className="tracking-wider text-[11px] font-bold select-none"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            SLIDE SUMMARY →
          </span>
          <ChevronLeft className="w-3.5 h-3.5 text-white/90 group-hover:-translate-x-1 transition-transform" />
        </button>

        {/* ================= SLIDE-OVER DRAWER: SUMMARY FUNGSI GITHUB ================= */}
        <aside
          className={`absolute top-0 right-0 bottom-0 z-40 bg-[#080d19]/95 backdrop-blur-3xl border-l border-white/20 shadow-[-24px_0_70px_rgba(0,0,0,0.85)] flex flex-col transition-all duration-300 ease-out overflow-hidden ${
            isSummaryExpanded 
              ? 'w-full sm:w-[850px] lg:w-[980px] max-w-full' 
              : 'w-full sm:w-[520px]'
          } ${
            isSummaryDrawerOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
          }`}
        >
          {/* Header Drawer */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/5">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-pink-500 text-white shadow-md shadow-purple-500/30 shrink-0">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div className="truncate">
                <h3 className="text-sm font-bold text-white truncate">
                  Summary Analisis Repositori
                </h3>
                <p className="text-[11px] text-slate-300 truncate">Panduan penggunaan, kapabilitas & analisis before vs after</p>
              </div>
            </div>

            {/* Action Buttons: Expand & Close */}
            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsSummaryExpanded(prev => !prev)}
                title={isSummaryExpanded ? "Perkecil (Normal)" : "Perlebar (Expand)"}
                aria-label={isSummaryExpanded ? "Perkecil Tampilan" : "Perlebar Tampilan"}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                {isSummaryExpanded ? (
                  <Minimize2 className="w-4 h-4 text-sky-400" />
                ) : (
                  <Maximize2 className="w-4 h-4 text-sky-400" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSummaryDrawerOpen(false);
                  setIsSummaryExpanded(false);
                }}
                title="Tutup"
                aria-label="Tutup"
                className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/20 border border-white/15 text-slate-300 hover:text-rose-300 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 space-y-5 text-xs text-slate-200 custom-scrollbar">
            {/* 1. Fungsi Utama */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center space-x-2 text-sky-400 font-mono font-semibold text-[11px] uppercase tracking-wider">
                <Terminal className="w-3.5 h-3.5" />
                <span>Fungsi & Nilai Utama</span>
              </div>
              <p className="text-slate-200 text-xs leading-relaxed font-normal">
                {summary.corePurpose}
              </p>
            </div>

            {/* 2. Cara Penggunaan / Panduan Cepat */}
            {summary.howToUse && summary.howToUse.length > 0 && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center space-x-2 text-sky-400 font-mono font-semibold text-[11px] uppercase tracking-wider">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Cara Penggunaan / Panduan Cepat</span>
                </div>
                <div className="space-y-2.5">
                  {summary.howToUse.map((stepItem, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                      <div className="flex items-center space-x-2 text-xs font-semibold text-white">
                        <span className="w-5 h-5 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-300 font-mono text-[10px] flex items-center justify-center shrink-0">
                          {stepItem.step || idx + 1}
                        </span>
                        <span>{stepItem.title}</span>
                      </div>
                      {stepItem.description && (
                        <p className="text-[11px] text-slate-300 leading-relaxed pl-7">{stepItem.description}</p>
                      )}
                      {stepItem.command && (
                        <div className="ml-7 flex items-start justify-between bg-black/70 border border-white/15 rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-sky-300 gap-2">
                          <code className="whitespace-pre-wrap break-all flex-1">{stepItem.command}</code>
                          <button
                            type="button"
                            onClick={() => handleCopySnippet(stepItem.command!)}
                            className="text-slate-400 hover:text-white p-1 hover:bg-white/10 rounded transition-colors shrink-0 cursor-pointer"
                            title="Salin Perintah"
                          >
                            {copiedSnippet === stepItem.command ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Daftar Command & Fungsinya */}
            {summary.commands && summary.commands.length > 0 && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-emerald-400 font-mono font-semibold text-[11px] uppercase tracking-wider">
                  <div className="flex items-center space-x-2">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Command & Fungsinya</span>
                  </div>
                  <span className="text-[10px] font-normal text-slate-400">
                    {summary.commands.length} Commands
                  </span>
                </div>
                <div className="space-y-2">
                  {summary.commands.map((cmd, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="inline-flex items-center space-x-1.5 font-mono font-bold text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md max-w-full">
                          <code className="whitespace-pre-wrap break-all">{cmd.command}</code>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopySnippet(cmd.example || cmd.command)}
                          className="text-slate-400 hover:text-white p-1 hover:bg-white/10 rounded transition-colors cursor-pointer shrink-0"
                          title="Salin Perintah"
                        >
                          {copiedSnippet === (cmd.example || cmd.command) ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed break-words">
                        {cmd.function}
                      </p>
                      {cmd.example && cmd.example !== cmd.command && (
                        <div className="text-[10px] font-mono text-slate-400 bg-black/50 px-2.5 py-1.5 rounded border border-white/5 flex items-start">
                          <span className="text-slate-500 font-semibold mr-1.5 shrink-0">Contoh:</span>
                          <span className="text-slate-300 whitespace-pre-wrap break-all flex-1">{cmd.example}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Before vs After Showcase */}
            {summary.cases.length > 0 && activeCase && (
              <div className="p-4 rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/15 space-y-3.5 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-amber-300 font-mono font-bold text-[11px] uppercase tracking-wider">
                    <GitCompare className="w-4 h-4 text-amber-400" />
                    <span>Contoh Output: Before vs After</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold">
                    {Array.isArray(activeCase.metrics) 
                      ? (activeCase.metrics[0]?.value || 'Optimal')
                      : (activeCase.metrics as any)?.tokenSaving}
                  </span>
                </div>

                {/* Case Switcher Tabs */}
                {summary.cases.length > 1 && (
                  <div className="flex items-center p-1 bg-black/40 rounded-xl border border-white/10 font-mono text-[11px]">
                    {summary.cases.map((c: any) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setActiveCaseId(c.id)}
                        className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition-all cursor-pointer ${
                          activeCaseId === c.id
                            ? 'text-white bg-indigo-600/80 shadow-sm'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Skenario & Prompt Info */}
                <div className="space-y-1.5">
                  {activeCase.scenarioBadge && (
                    <div className="flex items-center space-x-1.5 text-[11px] font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span>{activeCase.scenarioBadge}</span>
                    </div>
                  )}
                  <div className="px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-[11px] text-slate-300 flex items-start space-x-2">
                    <Terminal className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                    <span className="whitespace-pre-wrap break-words"><strong className="text-white">Skenario / Prompt:</strong> {activeCase.prompt}</span>
                  </div>
                </div>

                {/* Tab Switcher: Khusus HANYA untuk repositori Frontend UI yang memiliki file HTML */}
                {activeCase.scenarioType === 'ui' && Boolean(activeCase.beforeHtml || activeCase.afterHtml) && (
                  <div className="flex items-center justify-between p-1.5 bg-black/50 rounded-xl border border-white/10 text-[11px] font-mono">
                    <div className="flex items-center space-x-1.5 px-2 text-slate-300 font-semibold">
                      <Layers className="w-3.5 h-3.5 text-sky-400" />
                      <span>Mode Output:</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => setViewMode('preview')}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                          viewMode === 'preview'
                            ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40 shadow-sm'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Visual UI (.html)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('code')}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                          viewMode === 'code'
                            ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40 shadow-sm'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>Kode Source</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* BEFORE Card */}
                <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 overflow-hidden">
                  <div className="px-3 py-2 bg-rose-500/10 border-b border-rose-500/20 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-rose-400 font-mono font-bold text-[11px]">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{activeCase.beforeTitle}</span>
                    </div>
                    <span className="text-[10px] font-mono text-rose-300/80">{activeCase.beforeMeta}</span>
                  </div>

                  {/* Body: Visual UI jika Frontend, jika bukan maka MURNI teks/kode dinamis */}
                  {activeCase.scenarioType === 'ui' && viewMode === 'preview' && activeCase.beforeHtml ? (
                    <div className="p-3 bg-black/70 border-b border-rose-500/20 space-y-2">
                      <div className="flex items-center justify-between px-1 text-[10px] font-mono text-slate-400">
                        <span className="flex items-center gap-1.5 text-rose-300 font-bold">
                          <Eye className="w-3 h-3 text-rose-400" /> Live Render (.html)
                        </span>
                        <span className="text-slate-500">Iframe Sandboxed</span>
                      </div>
                      <div className="w-full h-[265px] rounded-lg overflow-hidden border border-rose-500/30 bg-[#0b0f19]">
                        <iframe
                          srcDoc={activeCase.beforeHtml || getFallbackHtml(activeCase.beforeCode, false)}
                          title="Before UI Output"
                          sandbox="allow-scripts"
                          className="w-full h-full border-0"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-black/60 font-mono text-[11px] leading-relaxed text-rose-200/90 overflow-hidden">
                      <pre className="whitespace-pre-wrap break-words font-mono">{activeCase.beforeCode}</pre>
                    </div>
                  )}

                  <div className="px-3.5 py-2.5 bg-rose-950/60 border-t border-rose-500/25 space-y-2 text-[11px] font-mono">
                    {Array.isArray(activeCase.beforeNotes) ? (
                      activeCase.beforeNotes.map((note: any, i: number) => (
                        <div key={i} className="grid grid-cols-[85px_1fr] items-start gap-2.5 leading-relaxed">
                          <span className="text-rose-400 font-bold tracking-tight">{note.label}:</span>
                          <span className="text-rose-200/90 break-words">{note.value}</span>
                        </div>
                      ))
                    ) : (
                      <div className="space-y-1.5">
                        <div className="grid grid-cols-[85px_1fr] items-start gap-2.5 leading-relaxed">
                          <span className="text-rose-400 font-bold">Token:</span>
                          <span className="text-rose-200/90 break-words">{(activeCase.beforeNotes as any)?.token}</span>
                        </div>
                        <div className="grid grid-cols-[85px_1fr] items-start gap-2.5 leading-relaxed">
                          <span className="text-rose-400 font-bold">Dependensi:</span>
                          <span className="text-rose-200/90 break-words">{(activeCase.beforeNotes as any)?.dep}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rule Divider */}
                <div className="flex items-center justify-center my-1 relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                  <div className="relative px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-mono text-[10px] font-bold flex items-center space-x-1 shadow-lg">
                    <Zap className="w-3 h-3 text-amber-300" />
                    <span>{activeCase.ruleBadge}</span>
                  </div>
                </div>

                {/* AFTER Card */}
                <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/20 overflow-hidden shadow-lg shadow-emerald-950/30">
                  <div className="px-3 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-emerald-400 font-mono font-bold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{activeCase.afterTitle}</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-300 font-semibold">{activeCase.afterMeta}</span>
                  </div>

                  {/* Body: Visual UI jika Frontend, jika bukan maka MURNI teks/kode dinamis */}
                  {activeCase.scenarioType === 'ui' && viewMode === 'preview' && activeCase.afterHtml ? (
                    <div className="p-3 bg-black/70 border-b border-emerald-500/20 space-y-2">
                      <div className="flex items-center justify-between px-1 text-[10px] font-mono text-slate-400">
                        <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
                          <Eye className="w-3 h-3 text-emerald-400" /> Live Render (.html)
                        </span>
                        <span className="text-slate-500">Iframe Sandboxed</span>
                      </div>
                      <div className="w-full h-[265px] rounded-lg overflow-hidden border border-emerald-500/30 bg-[#0b0f19]">
                        <iframe
                          srcDoc={activeCase.afterHtml || getFallbackHtml(activeCase.afterCode, true)}
                          title="After UI Output"
                          sandbox="allow-scripts"
                          className="w-full h-full border-0"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-black/60 font-mono text-[11px] leading-relaxed text-emerald-200/90 overflow-hidden">
                      <pre className="whitespace-pre-wrap break-words font-mono">{activeCase.afterCode}</pre>
                    </div>
                  )}
                  <div className="px-3.5 py-2.5 bg-emerald-950/60 border-t border-emerald-500/25 space-y-2 text-[11px] font-mono">
                    {Array.isArray(activeCase.afterNotes) ? (
                      activeCase.afterNotes.map((note: any, i: number) => (
                        <div key={i} className="grid grid-cols-[85px_1fr] items-start gap-2.5 leading-relaxed">
                          <span className="text-emerald-400 font-bold tracking-tight">{note.label}:</span>
                          <span className="text-emerald-200/90 break-words">{note.value}</span>
                        </div>
                      ))
                    ) : (
                      <div className="space-y-1.5">
                        <div className="grid grid-cols-[85px_1fr] items-start gap-2.5 leading-relaxed">
                          <span className="text-emerald-400 font-bold">Token:</span>
                          <span className="text-emerald-200/90 break-words">{(activeCase.afterNotes as any)?.token}</span>
                        </div>
                        <div className="grid grid-cols-[85px_1fr] items-start gap-2.5 leading-relaxed">
                          <span className="text-emerald-400 font-bold">Dependensi:</span>
                          <span className="text-emerald-200/90 break-words">{(activeCase.afterNotes as any)?.dep}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dynamic Metric Pills */}
                <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-center">
                  {Array.isArray(activeCase.metrics) ? (
                    activeCase.metrics.map((m: any, idx: number) => {
                      const colorClass =
                        m.color === 'emerald' ? 'text-emerald-400' :
                        m.color === 'sky' ? 'text-sky-400' :
                        m.color === 'amber' ? 'text-amber-300' :
                        m.color === 'rose' ? 'text-rose-400' :
                        m.color === 'indigo' ? 'text-indigo-300' :
                        m.color === 'purple' ? 'text-purple-300' :
                        'text-emerald-400';
                      return (
                        <div key={idx} className="p-2 rounded-xl bg-white/5 border border-white/10">
                          <p className="text-[9px] text-slate-400 uppercase tracking-wider truncate">{m.label}</p>
                          <p className={`text-xs font-bold mt-0.5 truncate ${colorClass}`}>{m.value}</p>
                        </div>
                      );
                    })
                  ) : (
                    <>
                      <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-[9px] text-slate-400 uppercase">Baris Kode</p>
                        <p className="text-xs font-bold text-emerald-400 mt-0.5">{(activeCase.metrics as any)?.lines}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-[9px] text-slate-400 uppercase">Dependensi</p>
                        <p className="text-xs font-bold text-sky-400 mt-0.5">{(activeCase.metrics as any)?.deps}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-[9px] text-slate-400 uppercase">Token / Nilai</p>
                        <p className="text-xs font-bold text-amber-300 mt-0.5">{(activeCase.metrics as any)?.tokenSaving}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* 5. Masalah yang Dipecahkan */}
            <div className="space-y-2">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider font-mono text-slate-200 flex items-center space-x-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Masalah yang Dipecahkan</span>
              </h4>
              <div className="space-y-2">
                {summary.problemsSolved.map((prob: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white text-xs">{prob.title}</p>
                      <p className="text-[11px] text-slate-300 leading-tight mt-0.5">{prob.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. Metodologi (Jika Ada) */}
            {summary.ladderRules && summary.ladderRules.length > 0 && (
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 space-y-2.5 font-mono">
                <div className="flex items-center justify-between text-indigo-300 font-semibold text-[11px]">
                  <span className="flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Prinsip / Metodologi Inti</span>
                  </span>
                  <span className="text-[10px] bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30">
                    Best Practice
                  </span>
                </div>
                <ol className="space-y-1.5 text-[11px] text-slate-200 list-decimal list-inside leading-relaxed">
                  {summary.ladderRules.map((rule: any, idx: number) => (
                    <li key={idx} className="text-slate-200">{rule}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* 7. Kapan Harus Digunakan */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider font-mono text-slate-200 flex items-center space-x-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
                <span>Kapan Harus Digunakan?</span>
              </h4>
              <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside leading-relaxed">
                {summary.useCases.map((uc: any, idx: number) => (
                  <li key={idx}>{uc}</li>
                ))}
              </ul>
            </div>

            {/* 8. Quick Clone Command */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                <span>Quick Clone URL</span>
                <span className="text-sky-400 font-semibold">HTTPS</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-black/50 border border-white/15 rounded-xl px-3 py-2 font-mono text-[11px] text-slate-200 whitespace-pre-wrap break-all select-all">
                  {summary.cloneCommand}
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => handleCopyClone(summary.cloneCommand)}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-slate-200 flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    {copiedClone ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-sky-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs text-slate-300 font-mono shrink-0">
            <span className="flex items-center space-x-2">
              <span>Stars: <strong className="text-amber-300">{formatCompactNumber(repoData?.stargazers_count ?? 0)}</strong></span>
              <span className="text-slate-500">•</span>
              <span>Forks: <strong className="text-sky-300">{formatCompactNumber(repoData?.forks_count ?? 0)}</strong></span>
            </span>
            <span className="text-[11px] text-slate-400">
              {repoData?.license?.spdx_id || repoData?.license?.name || 'Open Source'}
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}
