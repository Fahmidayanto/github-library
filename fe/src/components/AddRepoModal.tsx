'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Sparkles, 
  Star, 
  GitFork, 
  Loader2, 
  Check, 
  FolderGit2,
  AlertCircle,
  ChevronDown 
} from 'lucide-react';
import { cn, formatCompactNumber, parseGitHubUrl } from '@/lib/utils';
import { Category } from './Sidebar';
import { RepoCardData } from './RepoCard';
import { createRepositoryAction } from '@/app/actions';


interface AddRepoModalProps {
  isOpen: boolean;
  categories: Category[];
  defaultCategoryId?: string;
  onClose: () => void;
  onRepoAdded: (
    newRepo: RepoCardData,
    createdSubCategory?: { id: string; name: string; slug: string; categoryId: string },
    createdCategory?: { id: string; name: string; slug: string; icon?: string; description?: string }
  ) => void;
}

interface RepoPreviewData {
  owner: string;
  name: string;
  fullName: string;
  description: string;
  starsCount: number;
  forksCount: number;
  primaryLanguage: string;
  topics: string[];
  homepage: string;
  license: string | null;
  avatarUrl?: string;
  isFallback?: boolean;
}

export function AddRepoModal({
  isOpen,
  categories,
  defaultCategoryId,
  onClose,
  onRepoAdded,
}: AddRepoModalProps) {
  const [url, setUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<RepoPreviewData | null>(null);
  const [repoName, setRepoName] = useState('');

  const [selectedCatId, setSelectedCatId] = useState<string>(categories[0]?.id || 'cat-5');
  const [customCatName, setCustomCatName] = useState<string>('');
  const [selectedSubId, setSelectedSubId] = useState<string>('none');
  const [customSubName, setCustomSubName] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // AI Suggestion State
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<any | null>(null);
  const [isSuggestionApplied, setIsSuggestionApplied] = useState(false);

  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [isSubDropdownOpen, setIsSubDropdownOpen] = useState(false);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest('.custom-category-dropdown')) {
        setIsCatDropdownOpen(false);
        setIsSubDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Sinkronkan kategori aktif saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      if (defaultCategoryId && categories.some(c => c.id === defaultCategoryId)) {
        setSelectedCatId(defaultCategoryId);
      } else if (categories.length > 0) {
        // Utamakan AI Agent Skills & Tools jika ada
        const agentCat = categories.find(c => c.id === 'cat-5');
        setSelectedCatId(agentCat ? agentCat.id : categories[0].id);
      }
      setSelectedSubId('none');
      setCustomSubName('');
      setCustomCatName('');
      setRepoName('');
      setFetchError(null);
      setIsCatDropdownOpen(false);
      setIsSubDropdownOpen(false);
      setAiSuggestion(null);
      setIsSuggestionApplied(false);
      setIsSuggesting(false);
    }
  }, [isOpen, defaultCategoryId, categories]);

  if (!isOpen) return null;

  const currentCat = categories.find(c => c.id === selectedCatId) || categories[0];

  const handleAutoFetch = async (targetUrl?: string) => {
    const rawUrl = (targetUrl || url).trim();
    if (!rawUrl) {
      setFetchError('Silakan masukkan URL GitHub terlebih dahulu.');
      return;
    }

    setFetchError(null);
    setIsFetching(true);

    try {
      const parsed = parseGitHubUrl(rawUrl);
      if (!parsed) {
        throw new Error('Format URL tidak valid. Gunakan format https://github.com/owner/repository');
      }

      const { owner, repo } = parsed;
      let data: any = null;

      // 1. Coba lewat proxy internal Next.js (yang telah dilengkapi 3-tier fallback)
      try {
        const proxyRes = await fetch(`/api/github/inspect?url=${encodeURIComponent(rawUrl)}`, {
          signal: AbortSignal.timeout(8000),
        });
        if (proxyRes.ok) {
          const json = await proxyRes.json();
          if (json && !json.error) {
            data = json;
          } else if (json?.error && proxyRes.status === 404) {
            throw new Error(json.error);
          }
        }
      } catch (err: any) {
        if (err.message && err.message.includes('404')) throw err;
      }

      // 2. Coba fallback ke Express backend jika proxy Next.js belum mengembalikan data
      if (!data) {
        try {
          const beRes = await fetch(`http://localhost:4000/api/github/inspect?url=${encodeURIComponent(rawUrl)}`, {
            signal: AbortSignal.timeout(8000),
          });
          if (beRes.ok) {
            const json = await beRes.json();
            if (json && !json.error) {
              data = json;
            } else if (json?.error && beRes.status === 404) {
              throw new Error(json.error);
            }
          }
        } catch (err: any) {
          if (err.message && err.message.includes('404')) throw err;
        }
      }

      // 3. Fallback Heuristik Aman (Menjamin modal tetap bisa digunakan meski GitHub offline/rate limited)
      if (!data) {
        data = {
          owner,
          name: repo,
          fullName: `${owner}/${repo}`,
          description: `Repositori ${owner}/${repo}`,
          starsCount: 0,
          forksCount: 0,
          primaryLanguage: 'Unknown',
          topics: [],
          homepage: '',
          license: null,
          avatarUrl: `https://github.com/${owner}.png`,
          isFallback: true,
        };
      }

      setPreviewData(data);
      if (data?.name) {
        setRepoName(data.name);
      }

      // Otomatis minta rekomendasi klasifikasi dari AI
      fetchAiCategorySuggestion(data);
    } catch (err: any) {
      setFetchError(err.message || 'Terjadi kesalahan saat memeriksa GitHub URL.');
    } finally {
      setIsFetching(false);
    }
  };

function generateClientHeuristicSuggestion(
  repo: RepoPreviewData,
  categories: Category[]
) {
  const text = `${repo.name} ${repo.description || ''} ${(repo.topics || []).join(' ')} ${repo.primaryLanguage || ''}`.toLowerCase();

  for (const cat of categories) {
    for (const sub of cat.subCategories || []) {
      const subWords = sub.name.toLowerCase().split(/[\s,&/-]+/);
      if (subWords.some(w => w.length > 2 && text.includes(w))) {
        return {
          scenario: 'existing_all' as const,
          categoryId: cat.id,
          categoryName: cat.name,
          subCategoryId: sub.id,
          subCategoryName: sub.name,
          reason: `Dipetakan ke "${cat.name} > ${sub.name}" berdasarkan topik repositori (Mode Heuristik).`,
          isFallback: true,
        };
      }
    }
  }

  for (const cat of categories) {
    const catWords = cat.name.toLowerCase().split(/[\s,&/-]+/);
    if (catWords.some(w => w.length > 3 && text.includes(w))) {
      const firstSub = cat.subCategories?.[0];
      return {
        scenario: 'existing_all' as const,
        categoryId: cat.id,
        categoryName: cat.name,
        subCategoryId: firstSub?.id || 'none',
        subCategoryName: firstSub?.name || 'General',
        reason: `Dipetakan ke kategori "${cat.name}" berdasarkan kecocokan kata kunci (Mode Heuristik).`,
        isFallback: true,
      };
    }
  }

  const defaultCat = categories.find(c => c.id === 'cat-5') || categories[0];
  const defaultSub = defaultCat?.subCategories?.[0];
  return {
    scenario: 'existing_all' as const,
    categoryId: defaultCat?.id || 'cat-5',
    categoryName: defaultCat?.name || 'AI General',
    subCategoryId: defaultSub?.id || 'none',
    subCategoryName: defaultSub?.name || 'General',
    reason: 'Kategori default yang direkomendasikan untuk repositori AI/developer tools (Mode Heuristik).',
    isFallback: true,
  };
}

  const fetchAiCategorySuggestion = async (repoData: RepoPreviewData) => {
    setIsSuggesting(true);
    setAiSuggestion(null);
    setIsSuggestionApplied(false);

    try {
      const res = await fetch('/api/github/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo: repoData,
          categories,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.suggestion) {
          setAiSuggestion(json.suggestion);
          return;
        }
      }

      // Fallback lokal jika backend mengembalikan error atau timeout
      const fallback = generateClientHeuristicSuggestion(repoData, categories);
      setAiSuggestion(fallback);
    } catch (err) {
      console.warn('Gagal memuat saran kategori dari AI, beralih ke fallback heuristik:', err);
      const fallback = generateClientHeuristicSuggestion(repoData, categories);
      setAiSuggestion(fallback);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleApplySuggestion = () => {
    if (!aiSuggestion) return;
    const { scenario, categoryId, categoryName, subCategoryId, subCategoryName } = aiSuggestion;

    if (scenario === 'existing_all') {
      if (categoryId) setSelectedCatId(categoryId);
      setSelectedSubId(subCategoryId || 'none');
      setCustomCatName('');
      setCustomSubName('');
    } else if (scenario === 'existing_group_new_sub') {
      if (categoryId) setSelectedCatId(categoryId);
      setSelectedSubId('create_new');
      setCustomSubName(subCategoryName || '');
      setCustomCatName('');
    } else if (scenario === 'new_all') {
      setSelectedCatId('create_new');
      setCustomCatName(categoryName || '');
      setSelectedSubId('create_new');
      setCustomSubName(subCategoryName || '');
    }
    setIsSuggestionApplied(true);
  };

  const handleSave = async () => {
    if (!url.trim()) {
      setFetchError('URL GitHub wajib diisi.');
      return;
    }

    if (selectedCatId === 'create_new' && !customCatName.trim()) {
      setFetchError('Nama kategori utama baru wajib diisi.');
      return;
    }

    if (selectedSubId === 'create_new' && !customSubName.trim()) {
      setFetchError('Nama sub-kategori baru wajib diisi.');
      return;
    }

    setIsSaving(true);
    setFetchError(null);

    // Fallback data jika auto-fetch belum selesai/gagal
    let finalPreview: RepoPreviewData | null = previewData;
    if (!finalPreview) {
      const parsed = parseGitHubUrl(url);
      if (parsed) {
        finalPreview = {
          owner: parsed.owner,
          name: parsed.repo,
          fullName: `${parsed.owner}/${parsed.repo}`,
          description: `Repositori ${parsed.owner}/${parsed.repo}`,
          starsCount: 0,
          forksCount: 0,
          primaryLanguage: 'Unknown',
          topics: [],
          homepage: '',
          license: null,
          avatarUrl: `https://github.com/${parsed.owner}.png`,
        };
      } else {
        setFetchError('Format URL GitHub tidak valid. Harap periksa kembali.');
        setIsSaving(false);
        return;
      }
    }

    if (!finalPreview) {
      setIsSaving(false);
      return;
    }

    let finalCatId = selectedCatId;
    let finalCatName = selectedCatId === 'create_new' ? customCatName.trim() : (currentCat?.name || 'AI General');
    let finalSubId: string | undefined = undefined;
    let finalSubName: string | undefined = undefined;

    if (selectedSubId === 'create_new' && customSubName.trim()) {
      finalSubName = customSubName.trim();
    } else if (selectedSubId !== 'none' && selectedSubId !== 'create_new') {
      const foundSub = currentCat?.subCategories?.find(s => s.id === selectedSubId);
      if (foundSub) {
        finalSubId = foundSub.id;
        finalSubName = foundSub.name;
      }
    }

    const finalName = repoName.trim() || finalPreview.name;

    const newRepoItem: RepoCardData = {
      id: `repo-${Date.now()}`,
      categoryId: finalCatId,
      subCategoryId: finalSubId,
      categoryName: finalCatName,
      subCategoryName: finalSubName,
      githubUrl: url.trim(),
      owner: finalPreview.owner,
      name: finalName,
      fullName: finalPreview.fullName,
      description: finalPreview.description,
      starsCount: finalPreview.starsCount,
      forksCount: finalPreview.forksCount,
      primaryLanguage: finalPreview.primaryLanguage,
      topics: finalPreview.topics,
    };

    try {
      const saveRes = await createRepositoryAction({
        ...newRepoItem,
        customCategoryName: selectedCatId === 'create_new' ? customCatName.trim() : undefined,
        subCategoryName: selectedSubId === 'create_new' ? customSubName.trim() : undefined,
        notes: notes.trim(),
        license: finalPreview.license,
        homepage: finalPreview.homepage,
      });

      const createdCat = saveRes?.createdCategory;
      const createdSub = saveRes?.createdSubCategory
        ? { ...saveRes.createdSubCategory, categoryId: createdCat?.id || finalCatId }
        : (selectedSubId === 'create_new' && finalSubName ? {
            id: saveRes?.repository?.subCategoryId || `sub-${Date.now()}`,
            name: finalSubName,
            slug: finalSubName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            categoryId: createdCat?.id || finalCatId,
          } : undefined);

      if (createdCat) {
        newRepoItem.categoryId = createdCat.id;
        newRepoItem.categoryName = createdCat.name;
      }
      if (createdSub) {
        newRepoItem.subCategoryId = createdSub.id;
        newRepoItem.subCategoryName = createdSub.name;
      }

      onRepoAdded(newRepoItem, createdSub, createdCat);
      onClose();
      // Reset form
      setUrl('');
      setPreviewData(null);
      setRepoName('');
      setSelectedSubId('none');
      setCustomSubName('');
      setCustomCatName('');
      setNotes('');
      setAiSuggestion(null);
      setIsSuggestionApplied(false);
    } catch (err: any) {
      setFetchError(err.message || 'Gagal menyimpan repositori ke database.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="glass-panel-elevated w-full max-w-lg max-h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 shrink-0 bg-white/[0.02]">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Tambah Repository Baru</h3>
              <p className="text-[11px] text-slate-400">Paste link GitHub untuk auto-fetch detail</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 text-xs premium-scrollbar">
          {/* URL Input & Auto-fetch Button */}
          <div>
            <label className="block font-medium text-slate-300 mb-1">GitHub URL</label>
            <div className="flex space-x-2">
              <input 
                type="url" 
                value={url}
                onChange={e => {
                  const newUrl = e.target.value;
                  setUrl(newUrl);
                  if (fetchError) setFetchError(null);
                  const parsed = parseGitHubUrl(newUrl);
                  if (parsed?.repo) {
                    setRepoName(prev => (!prev || prev === previewData?.name ? parsed.repo : prev));
                  }
                }}
                onBlur={() => {
                  if (url.trim().includes('github.com') && !previewData && !isFetching) {
                    handleAutoFetch();
                  }
                }}
                onPaste={e => {
                  const pasted = e.clipboardData.getData('text');
                  if (pasted && pasted.includes('github.com')) {
                    const parsed = parseGitHubUrl(pasted);
                    if (parsed?.repo) {
                      setRepoName(parsed.repo);
                    }
                    handleAutoFetch(pasted);
                  }
                }}
                onKeyDown={e => { if (e.key === 'Enter') handleAutoFetch(); }}
                placeholder="https://github.com/owner/repository" 
                className="flex-1 px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none font-mono text-xs"
              />
              <button 
                type="button"
                onClick={() => handleAutoFetch()}
                disabled={isFetching}
                className="px-3 py-2 glass-panel hover:bg-white/10 text-slate-200 rounded-xl font-medium flex items-center space-x-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isFetching ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    <span>Fetching...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Auto Fetch</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Form Nama Repository (Auto-detect dari GitHub & Bisa diedit langsung) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-medium text-slate-300">Nama Repository</label>
              <span className="text-[10px] text-indigo-400 font-mono">
                Auto-sync GitHub • Bisa diedit
              </span>
            </div>
            <div className="relative">
              <input 
                type="text" 
                value={repoName}
                onChange={e => setRepoName(e.target.value)}
                placeholder="Contoh: superpowers (otomatis terisi saat URL dimasukkan)" 
                className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 placeholder-slate-500 focus:outline-none font-medium text-xs border border-white/10 focus:border-indigo-500/50 transition-all"
              />
              {repoName && (
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center space-x-1 pointer-events-none">
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    Nama Aktif
                  </span>
                </div>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Nama ini akan ditampilkan sebagai judul kartu dan nama di menu sidebar sub-group.
            </p>
          </div>

          {/* Error notice */}
          {fetchError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{fetchError}</span>
            </div>
          )}

          {/* Preview Card Section (Dynamically Loaded) */}
          {previewData && (
            <div className="p-3.5 bg-black/40 rounded-xl border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-200 flex items-center space-x-1.5">
                  <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{previewData.fullName}</span>
                </div>
                {previewData.isFallback ? (
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded flex items-center space-x-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Mode Dasar (Offline/Rate-Limit)</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center space-x-1">
                    <Check className="w-3 h-3" />
                    <span>Metadata Terverifikasi</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2">{previewData.description}</p>
              <div className="flex items-center space-x-3 text-[10px] font-mono text-slate-400 pt-1">
                <span className="text-amber-400 flex items-center space-x-1">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>{formatCompactNumber(previewData.starsCount)}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <GitFork className="w-3 h-3" />
                  <span>{formatCompactNumber(previewData.forksCount)}</span>
                </span>
                <span className="text-indigo-400">{previewData.primaryLanguage}</span>
              </div>
            </div>
          )}

          {/* AI Category Suggestion Card */}
          {(isSuggesting || aiSuggestion) && (
            <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-black/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-indigo-300 font-semibold text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  <span>Rekomendasi Klasifikasi AI</span>
                </div>
                {isSuggesting ? (
                  <span className="flex items-center space-x-1 text-[10px] text-indigo-300 font-mono">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Menganalisis repositori...</span>
                  </span>
                ) : (
                  <span className={cn(
                    "text-[10px] font-mono px-2 py-0.5 rounded border",
                    aiSuggestion?.scenario === 'existing_all' && "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
                    aiSuggestion?.scenario === 'existing_group_new_sub' && "bg-sky-500/10 border-sky-500/30 text-sky-400",
                    aiSuggestion?.scenario === 'new_all' && "bg-purple-500/10 border-purple-500/30 text-purple-400"
                  )}>
                    {aiSuggestion?.scenario === 'existing_all' && 'Grup & Sub-Grup Sesuai'}
                    {aiSuggestion?.scenario === 'existing_group_new_sub' && 'Grup Ada + Buat Sub-Grup Baru'}
                    {aiSuggestion?.scenario === 'new_all' && 'Buat Grup & Sub-Grup Baru'}
                  </span>
                )}
              </div>

              {aiSuggestion && (
                <>
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-black/30 p-2.5 rounded-lg border border-white/5">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Kategori Utama:</span>
                      <span className="font-semibold text-slate-200">
                        {aiSuggestion.categoryName}
                      </span>
                      <span className="text-[9px] text-indigo-400 ml-1.5 font-mono">
                        {aiSuggestion.scenario === 'new_all' ? '(Baru)' : '(Existing)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Sub-Kategori:</span>
                      <span className="font-semibold text-slate-200">
                        {aiSuggestion.subCategoryName}
                      </span>
                      <span className="text-[9px] text-indigo-400 ml-1.5 font-mono">
                        {aiSuggestion.scenario === 'existing_all' ? '(Existing)' : '(Baru)'}
                      </span>
                    </div>
                  </div>

                  {aiSuggestion.reason && (
                    <p className="text-[11px] text-slate-300 italic">
                      "{aiSuggestion.reason}"
                    </p>
                  )}

                  {aiSuggestion.isFallback && (
                    <div className="flex items-center space-x-1.5 text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                      <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>Mode Cepat (Heuristik) • Pasang <code className="text-amber-200 font-mono">GROQ_API_KEY</code> di Vercel untuk reasoning AI penuh</span>
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleApplySuggestion}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer",
                        isSuggestionApplied
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
                      )}
                    >
                      {isSuggestionApplied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Rekomendasi Diterapkan</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Terapkan Rekomendasi</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Category & Sub Category Selection */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Custom Glass Dropdown: Kategori Utama */}
              <div className="relative custom-category-dropdown">
                <label className="block font-medium text-slate-300 mb-1">Kategori Utama</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCatDropdownOpen(!isCatDropdownOpen);
                    setIsSubDropdownOpen(false);
                  }}
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 focus:outline-none flex items-center justify-between text-left cursor-pointer border border-white/10 hover:border-white/20 transition-all"
                >
                  <span className="truncate">
                    {selectedCatId === 'create_new'
                      ? (customCatName.trim() ? customCatName.trim() : '+ Buat Kategori Baru...')
                      : (currentCat?.name || 'Pilih Kategori')}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0",
                      isCatDropdownOpen && "rotate-180 text-indigo-400"
                    )}
                  />
                </button>

                {isCatDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 rounded-2xl glass-dropdown-surface p-1.5 shadow-2xl z-50 border border-white/10 dropdown-airfall max-h-56 overflow-y-auto space-y-0.5">
                    <div className="px-2.5 py-1 text-[10px] font-mono tracking-wider uppercase text-slate-400 border-b border-white/10 mb-1">
                      Kategori Utama
                    </div>
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedCatId(cat.id);
                          setSelectedSubId('none');
                          setCustomSubName('');
                          setCustomCatName('');
                          setIsCatDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between hover:bg-white/10 transition-all text-slate-200 hover:text-white cursor-pointer",
                          selectedCatId === cat.id && "bg-white/10 font-semibold text-white"
                        )}
                      >
                        <span className="truncate">{cat.name}</span>
                        {selectedCatId === cat.id && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-1.5" />}
                      </button>
                    ))}

                    <div className="border-t border-white/10 my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCatId('create_new');
                        setSelectedSubId('create_new');
                        setIsCatDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer font-semibold",
                        selectedCatId === 'create_new' && "bg-indigo-500/20 text-white"
                      )}
                    >
                      <span className="truncate">+ Buat Kategori Baru...</span>
                      {selectedCatId === 'create_new' && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-1.5" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Custom Glass Dropdown: Sub Kategori */}
              <div className="relative custom-category-dropdown">
                <label className="block font-medium text-slate-300 mb-1">Sub Kategori</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsSubDropdownOpen(!isSubDropdownOpen);
                    setIsCatDropdownOpen(false);
                  }}
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 focus:outline-none flex items-center justify-between text-left cursor-pointer border border-white/10 hover:border-white/20 transition-all"
                >
                  <span className="truncate">
                    {selectedSubId === 'create_new'
                      ? (customSubName.trim() ? customSubName.trim() : '+ Buat Sub-kategori Baru...')
                      : selectedSubId === 'none'
                      ? '-- Tanpa Sub-kategori --'
                      : (currentCat?.subCategories?.find(s => s.id === selectedSubId)?.name || '-- Tanpa Sub-kategori --')}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0",
                      isSubDropdownOpen && "rotate-180 text-indigo-400"
                    )}
                  />
                </button>

                {isSubDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 rounded-2xl glass-dropdown-surface p-1.5 shadow-2xl z-50 border border-white/10 dropdown-airfall max-h-56 overflow-y-auto space-y-0.5">
                    <div className="px-2.5 py-1 text-[10px] font-mono tracking-wider uppercase text-slate-400 border-b border-white/10 mb-1">
                      Sub-Kategori
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSubId('none');
                        setCustomSubName('');
                        setIsSubDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between hover:bg-white/10 transition-all text-slate-200 hover:text-white cursor-pointer",
                        selectedSubId === 'none' && "bg-white/10 font-semibold text-white"
                      )}
                    >
                      <span className="truncate">-- Tanpa Sub-kategori --</span>
                      {selectedSubId === 'none' && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-1.5" />}
                    </button>

                    {(currentCat?.subCategories || []).map(sub => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          setSelectedSubId(sub.id);
                          setCustomSubName('');
                          setIsSubDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between hover:bg-white/10 transition-all text-slate-200 hover:text-white cursor-pointer",
                          selectedSubId === sub.id && "bg-white/10 font-semibold text-white"
                        )}
                      >
                        <span className="truncate">{sub.name}</span>
                        {selectedSubId === sub.id && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-1.5" />}
                      </button>
                    ))}

                    <div className="border-t border-white/10 my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSubId('create_new');
                        setIsSubDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer font-semibold",
                        selectedSubId === 'create_new' && "bg-indigo-500/20 text-white"
                      )}
                    >
                      <span className="truncate">+ Buat Sub-kategori Baru...</span>
                      {selectedSubId === 'create_new' && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-1.5" />}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Input Nama Kategori Utama Baru */}
            {selectedCatId === 'create_new' && (
              <div className="p-3 bg-purple-500/10 border border-purple-500/25 rounded-xl space-y-1.5 animate-in fade-in duration-150">
                <label className="block font-medium text-purple-300 text-[11px]">Nama Kategori Utama Baru</label>
                <input 
                  type="text" 
                  value={customCatName}
                  onChange={e => setCustomCatName(e.target.value)}
                  placeholder="Contoh: AI Frameworks & Tools, Data Engineering" 
                  className="w-full px-3 py-1.5 rounded-lg glass-input text-slate-200 focus:outline-none font-medium text-xs border border-purple-400/40"
                  autoFocus
                />
                <p className="text-[10px] text-slate-400">Kategori utama baru ini akan otomatis dibuat dan langsung muncul di menu Sidebar.</p>
              </div>
            )}

            {/* Input Nama Sub-kategori Baru */}
            {selectedSubId === 'create_new' && (
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/25 rounded-xl space-y-1.5 animate-in fade-in duration-150">
                <label className="block font-medium text-indigo-300 text-[11px]">Nama Sub-kategori Baru</label>
                <input 
                  type="text" 
                  value={customSubName}
                  onChange={e => setCustomSubName(e.target.value)}
                  placeholder="Contoh: Prompt Optimization, Code Reviewers, Token Analytics" 
                  className="w-full px-3 py-1.5 rounded-lg glass-input text-slate-200 focus:outline-none font-medium text-xs border border-indigo-400/40"
                  autoFocus={selectedCatId !== 'create_new'}
                />
                <p className="text-[10px] text-slate-400">Sub-kategori ini akan otomatis dibuat dan langsung muncul di menu Sidebar.</p>
              </div>
            )}
          </div>

          {/* Custom Notes */}
          <div>
            <label className="block font-medium text-slate-300 mb-1">Catatan Pribadi (Opsional)</label>
            <textarea 
              rows={2} 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Alasan menyimpan atau usecase repo ini..." 
              className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 focus:outline-none text-xs"
            />
          </div>
        </div>

        {/* Action Buttons (Pinned at bottom) */}
        <div className="flex items-center justify-end space-x-3 border-t border-white/10 px-6 py-4 shrink-0 bg-black/20">
          <button 
            type="button"
            onClick={onClose} 
            className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
          >
            Batal
          </button>
          <button 
            type="button"
            onClick={handleSave}
            disabled={isSaving || !url.trim()}
            className="px-4 py-2 rounded-xl text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 border border-indigo-400/30 active:scale-95 transition-all disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <span>Simpan ke Library</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

