'use client';

import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface LanguageSwitchProps {
  className?: string;
}

export function LanguageSwitch({ className }: LanguageSwitchProps) {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      role="radiogroup"
      aria-label="Language selection"
      className={cn(
        "relative flex items-center bg-black/40 border border-white/15 rounded-xl p-0.5 select-none text-xs font-mono backdrop-blur-md shadow-inner transition-colors",
        className
      )}
    >
      {/* Icon Indicator */}
      <div 
        className="pl-2 pr-1 text-slate-400 flex items-center justify-center shrink-0 pointer-events-none"
        aria-hidden="true"
      >
        <Languages className="w-3.5 h-3.5 text-cyan-400/80" />
      </div>

      {/* Segmented Control Container */}
      <div className="relative flex items-center">
        {/* Emil Design Eng: Sliding Pill Indicator with custom cubic-bezier (180ms ease-out) */}
        <div
          className={cn(
            "absolute top-0 bottom-0 w-1/2 rounded-lg transition-transform duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)] will-change-transform pointer-events-none",
            "bg-gradient-to-r from-cyan-500/25 to-indigo-500/25 border border-cyan-400/40 shadow-sm shadow-cyan-500/10",
            language === 'en' ? "translate-x-full" : "translate-x-0"
          )}
        />

        {/* ID Segment Button */}
        <button
          type="button"
          role="radio"
          aria-checked={language === 'id'}
          onClick={() => setLanguage('id')}
          className={cn(
            "relative z-10 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wider transition-colors duration-150 cursor-pointer select-none",
            "active:scale-95 transform transition-transform",
            language === 'id' 
              ? "text-cyan-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]" 
              : "text-slate-400 hover:text-slate-200"
          )}
          title="Bahasa Indonesia"
        >
          ID
        </button>

        {/* ENG Segment Button */}
        <button
          type="button"
          role="radio"
          aria-checked={language === 'en'}
          onClick={() => setLanguage('en')}
          className={cn(
            "relative z-10 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wider transition-colors duration-150 cursor-pointer select-none",
            "active:scale-95 transform transition-transform",
            language === 'en' 
              ? "text-cyan-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]" 
              : "text-slate-400 hover:text-slate-200"
          )}
          title="English"
        >
          ENG
        </button>
      </div>
    </div>
  );
}

