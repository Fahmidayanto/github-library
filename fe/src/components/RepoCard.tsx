'use client';

import React from 'react';
import { 
  Star, 
  GitFork, 
  ArrowUpRight, 
  GitBranch, 
  Cpu, 
  Database, 
  Video, 
  Bot, 
  Sparkles,
  GripVertical 
} from 'lucide-react';
import { formatCompactNumber } from '@/lib/utils';

export interface RepoCardData {
  id: string;
  fullName: string;
  name: string;
  owner: string;
  description?: string | null;
  starsCount: number;
  forksCount: number;
  primaryLanguage?: string | null;
  githubUrl?: string;
  topics?: string[] | null;
  categoryName?: string;
  subCategoryName?: string;
  categoryId?: string;
  subCategoryId?: string;
}

interface RepoCardProps {
  repo: RepoCardData;
  onClick: (fullName: string) => void;
}

function getCategoryIconAndColor(categoryName?: string) {
  const name = (categoryName || '').toLowerCase();
  if (name.includes('llm') || name.includes('language')) {
    return {
      icon: <Cpu className="w-4 h-4" />,
      boxStyle: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
      badgeStyle: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      hoverColor: 'hover:text-cyan-400',
    };
  }
  if (name.includes('rag') || name.includes('vector')) {
    return {
      icon: <Database className="w-4 h-4" />,
      boxStyle: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
      badgeStyle: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      hoverColor: 'hover:text-cyan-400',
    };
  }
  if (name.includes('video') || name.includes('motion')) {
    return {
      icon: <Video className="w-4 h-4" />,
      boxStyle: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      badgeStyle: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      hoverColor: 'hover:text-emerald-400',
    };
  }
  if (name.includes('agent')) {
    return {
      icon: <Bot className="w-4 h-4" />,
      boxStyle: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      badgeStyle: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      hoverColor: 'hover:text-amber-400',
    };
  }
  if (name.includes('skill') || name.includes('mcp')) {
    return {
      icon: <GitBranch className="w-4 h-4" />,
      boxStyle: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
      badgeStyle: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      hoverColor: 'hover:text-indigo-400',
    };
  }
  return {
    icon: <Sparkles className="w-4 h-4" />,
    boxStyle: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    badgeStyle: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    hoverColor: 'hover:text-indigo-400',
  };
}

function getLanguageDotColor(lang?: string | null) {
  const l = (lang || '').toLowerCase();
  if (l.includes('javascript')) return 'bg-yellow-400';
  if (l.includes('typescript')) return 'bg-blue-400';
  if (l.includes('python')) return 'bg-blue-500';
  if (l.includes('rust')) return 'bg-orange-500';
  if (l.includes('go')) return 'bg-cyan-400';
  return 'bg-emerald-400';
}

export function RepoCard({ repo, onClick }: RepoCardProps) {
  const styling = getCategoryIconAndColor(repo.categoryName);
  // Fokus pada nama sub-kategori agar selalu 1 baris ringkas dan presisi
  const badgeLabel = repo.subCategoryName || repo.categoryName || 'AI Repo';
  const fullCategoryPath = repo.categoryName
    ? `${repo.categoryName}${repo.subCategoryName ? ` • ${repo.subCategoryName}` : ''}`
    : 'AI Repo';

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', repo.id);
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        id: repo.id,
        name: repo.name,
        fullName: repo.fullName,
        categoryId: repo.categoryId,
        subCategoryId: repo.subCategoryId,
      })
    );
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onClick(repo.fullName || `${repo.owner}/${repo.name}`)}
      className="glass-card rounded-2xl p-5 flex flex-col justify-between group cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:border-indigo-400/30 hover:shadow-xl hover:shadow-indigo-500/10 active:cursor-grabbing select-none"
    >
      <div className="space-y-3">
        {/* Top Header: Icon + Full Name & 1-Line Category Badge underneath */}
        <div className="flex items-start space-x-2.5">
          <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${styling.boxStyle}`}>
            {styling.icon}
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className={`text-sm font-semibold text-slate-100 flex items-center justify-between transition-colors ${styling.hoverColor}`}>
              <div className="flex items-center space-x-1 min-w-0">
                <span className="break-words [overflow-wrap:anywhere] leading-snug">{repo.fullName || `${repo.owner}/${repo.name}`}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 shrink-0 inline-block" />
              </div>
              <span 
                title="Tarik kartu ini ke sub-kategori di sidebar untuk memindahkannya"
                className="opacity-0 group-hover:opacity-40 hover:!opacity-100 p-0.5 text-slate-400 hover:text-indigo-300 cursor-grab active:cursor-grabbing transition-opacity shrink-0"
              >
                <GripVertical className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* Category / Subcategory Pill Badge (PASTI 1 BARIS, tidak pecah 2 baris) */}
            <div className="flex items-center">
              <span 
                title={fullCategoryPath}
                className={`text-[10px] font-medium font-mono px-2 py-0.5 rounded-full border max-w-full whitespace-nowrap truncate inline-block ${styling.badgeStyle}`}
              >
                {badgeLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {repo.description || 'Tidak ada deskripsi repositori.'}
        </p>

        {/* Topics */}
        {repo.topics && repo.topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {repo.topics.slice(0, 4).map(topic => (
              <span
                key={topic}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10"
              >
                {topic}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Footer: Language + Stars + Forks */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/10 text-xs text-slate-400">
        <div className="flex items-center space-x-1.5 font-mono text-[11px]">
          <span className={`w-2.5 h-2.5 rounded-full ${getLanguageDotColor(repo.primaryLanguage)}`} />
          <span>{repo.primaryLanguage || 'Unknown'}</span>
        </div>
        <div className="flex items-center space-x-3 font-mono text-[11px]">
          <div className="flex items-center space-x-1 text-amber-400">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>{formatCompactNumber(repo.starsCount || 0)}</span>
          </div>
          <div className="flex items-center space-x-1 text-slate-500">
            <GitFork className="w-3.5 h-3.5" />
            <span>{formatCompactNumber(repo.forksCount || 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
