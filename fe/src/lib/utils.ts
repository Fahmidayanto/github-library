import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCompactNumber(number: number): string {
  if (number >= 1000) {
    return (number / 1000).toFixed(1) + 'k';
  }
  return number.toString();
}

export function parseMetricNumber(val: string | number | null | undefined): number {
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

export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
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

