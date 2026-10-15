'use client';

import React, { useState } from 'react';
import { 
  ChevronDown, 
  ArrowDownWideNarrow, 
  Star, 
  Clock, 
  ArrowDownAZ, 
  Check 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropdownProps {
  currentTheme: 'aurora' | 'sunset' | 'frost';
  onThemeChange: (theme: 'aurora' | 'sunset' | 'frost') => void;
  currentSort: string;
  onSortChange: (sortKey: string) => void;
}

export function ThemeAndSortDropdowns({
  currentTheme,
  onThemeChange,
  currentSort,
  onSortChange,
}: DropdownProps) {
  const [themeOpen, setThemeOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const THEMES = [
    {
      key: 'aurora',
      label: 'Aurora',
      title: 'Aurora Borealis',
      subtitle: 'Deep Teal • Cyan • Indigo',
      dotClass: 'bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500 shadow-teal-500/50',
    },
    {
      key: 'sunset',
      label: 'Sunset',
      title: 'Sunset Velvet',
      subtitle: 'Rose • Coral • Violet',
      dotClass: 'bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 shadow-rose-500/50',
    },
    {
      key: 'frost',
      label: 'Frost',
      title: 'Ethereal Frost',
      subtitle: 'Light Glass • Iridescent',
      dotClass: 'bg-gradient-to-r from-sky-200 via-teal-100 to-pink-200 shadow-sky-300/50',
    },
  ];

  const SORTS = [
    { 
      key: 'stars', 
      name: 'Bintang Terbanyak', 
      icon: <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" /> 
    },
    { 
      key: 'recent', 
      name: 'Terbaru Ditambahkan', 
      icon: <Clock className="w-3.5 h-3.5 text-sky-400" /> 
    },
    { 
      key: 'name', 
      name: 'Nama Repo (A-Z)', 
      icon: <ArrowDownAZ className="w-3.5 h-3.5 text-emerald-400" /> 
    },
  ];

  const activeTheme = THEMES.find(t => t.key === currentTheme) || THEMES[0];
  const activeSort = SORTS.find(s => s.key === currentSort) || SORTS[0];

  return (
    <div className="flex items-center space-x-3">
      {/* 3 Emil Gradient Theme Dropdown with Airfall Motion */}
      <div className="relative">
        <button
          onClick={() => {
            setThemeOpen(!themeOpen);
            setSortOpen(false);
          }}
          className="pressable-btn glass-panel border border-white/20 px-3 py-2 rounded-xl text-xs font-medium flex items-center space-x-2 text-slate-200 hover:text-white"
          title="Pilih Tema Gradasi Glassmorphism"
        >
          <span className={cn("w-2.5 h-2.5 rounded-full shadow-sm", activeTheme.dotClass)} />
          <span>{activeTheme.label}</span>
          <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform duration-200", themeOpen && "rotate-180")} />
        </button>

        {themeOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-dropdown-surface p-2 shadow-2xl z-50 dropdown-airfall border border-white/10">
            <div className="px-2.5 py-1.5 text-[10px] font-mono tracking-wider uppercase text-slate-400 border-b border-white/10 mb-1">
              Gradasi & Glass Preset
            </div>
            {THEMES.map(t => (
              <button
                key={t.key}
                onClick={() => {
                  onThemeChange(t.key as any);
                  setThemeOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-xl text-xs flex items-center space-x-2.5 hover:bg-white/10 transition-all text-slate-200 hover:text-white",
                  currentTheme === t.key ? "bg-white/10" : ""
                )}
              >
                <span className={cn("w-3.5 h-3.5 rounded-full shadow-sm border border-white/20", t.dotClass)} />
                <div className="flex-1">
                  <div className="font-semibold text-[12px]">{t.title}</div>
                  <div className="text-[10px] text-slate-400">{t.subtitle}</div>
                </div>
                {currentTheme === t.key && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Custom Sort Dropdown with Airfall Motion */}
      <div className="relative">
        <button
          onClick={() => {
            setSortOpen(!sortOpen);
            setThemeOpen(false);
          }}
          className="pressable-btn glass-input text-slate-200 text-xs rounded-xl px-3 py-2 flex items-center space-x-2 border border-white/15 hover:border-white/30"
        >
          <ArrowDownWideNarrow className="w-3.5 h-3.5 text-indigo-400" />
          <span>{activeSort.name}</span>
          <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform duration-200", sortOpen && "rotate-180")} />
        </button>

        {sortOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-2xl glass-dropdown-surface p-1.5 shadow-2xl z-50 dropdown-airfall border border-white/10">
            {SORTS.map(s => (
              <button
                key={s.key}
                onClick={() => {
                  onSortChange(s.key);
                  setSortOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-xl text-xs flex items-center space-x-2 hover:bg-white/10 transition-all text-slate-200 hover:text-white",
                  currentSort === s.key ? "bg-white/10" : ""
                )}
              >
                {s.icon}
                <span className="flex-1">{s.name}</span>
                {currentSort === s.key && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
