'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  PlusCircle, 
  Folder, 
  Star,
  Play,
  Pause
} from 'lucide-react';
import { ThreeBackdrop } from '@/components/ThreeBackdrop';
import { Sidebar, Category } from '@/components/Sidebar';
import { RepoCard, RepoCardData } from '@/components/RepoCard';
import { RepoDetailModal } from '@/components/RepoDetailModal';
import { AddRepoModal } from '@/components/AddRepoModal';
import { AddCategoryModal } from '@/components/AddCategoryModal';
import { ThemeAndSortDropdowns } from '@/components/ThemeAndSortDropdowns';
import { getCategoriesTree, getRepositories, updateSubCategoryAction, deleteSubCategoryAction, moveRepositoryAction, updateRepositoryAction, deleteRepositoryAction } from '@/app/actions';
import { cn, formatCompactNumber } from '@/lib/utils';

export default function HomePage() {
  const [theme, setTheme] = useState<'aurora' | 'sunset' | 'frost'>('aurora');
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(true);
  const [sortKey, setSortKey] = useState<string>('stars');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [repositories, setRepositories] = useState<RepoCardData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Modals state
  const [activeRepoModal, setActiveRepoModal] = useState<string | null>(null);
  const [isAddRepoOpen, setIsAddRepoOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Storage keys untuk Client Persistence
  const STORAGE_KEY_REPOS = 'github_library_repos_v1';
  const STORAGE_KEY_CATS = 'github_library_cats_v1';

  const saveToLocalStorage = (repos?: RepoCardData[], cats?: Category[]) => {
    if (typeof window === 'undefined') return;
    try {
      if (repos) window.localStorage.setItem(STORAGE_KEY_REPOS, JSON.stringify(repos));
      if (cats) window.localStorage.setItem(STORAGE_KEY_CATS, JSON.stringify(cats));
    } catch (e) {
      console.warn('Gagal menyimpan ke localStorage:', e);
    }
  };

  // Load initial data (Client localStorage first, lalu sinkronkan dari Server)
  useEffect(() => {
    try {
      const cachedRepos = window.localStorage.getItem(STORAGE_KEY_REPOS);
      const cachedCats = window.localStorage.getItem(STORAGE_KEY_CATS);
      if (cachedRepos) {
        const parsed = JSON.parse(cachedRepos);
        if (Array.isArray(parsed) && parsed.length > 0) setRepositories(parsed);
      }
      if (cachedCats) {
        const parsed = JSON.parse(cachedCats);
        if (Array.isArray(parsed) && parsed.length > 0) setCategories(parsed);
      }
    } catch (e) {
      console.warn('Gagal membaca cache localStorage:', e);
    }

    async function loadInitial() {
      try {
        const cats = await getCategoriesTree();
        const repos = await getRepositories();

        if (Array.isArray(cats) && cats.length > 0) {
          setCategories(cats);
          saveToLocalStorage(undefined, cats);
        }
        if (Array.isArray(repos) && repos.length > 0) {
          setRepositories(repos);
          saveToLocalStorage(repos, undefined);
        }
      } catch (err) {
        console.warn('Gagal sinkronisasi data server:', err);
      }
    }
    loadInitial();
  }, []);

  // Update theme class di document.body
  useEffect(() => {
    document.body.classList.remove('theme-sunset', 'theme-frost');
    if (theme === 'sunset') {
      document.body.classList.add('theme-sunset');
    } else if (theme === 'frost') {
      document.body.classList.add('theme-frost');
    }
  }, [theme]);

  // Keyboard shortcut Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update sub-category name
  const handleUpdateSubCategory = async (id: string, newName: string) => {
    setCategories(prev => {
      const updated = prev.map(cat => ({
        ...cat,
        subCategories: cat.subCategories?.map(sub =>
          sub.id === id ? { ...sub, name: newName, slug: newName.toLowerCase().replace(/[^a-z0-9]+/g, '-') } : sub
        ),
      }));
      saveToLocalStorage(undefined, updated);
      return updated;
    });
    setRepositories(prev => {
      const updated = prev.map(repo =>
        repo.subCategoryId === id ? { ...repo, subCategoryName: newName } : repo
      );
      saveToLocalStorage(updated, undefined);
      return updated;
    });
    await updateSubCategoryAction(id, newName);
  };

  // Delete sub-category
  const handleDeleteSubCategory = async (id: string) => {
    if (selectedSubCategory === id) {
      setSelectedSubCategory(null);
    }
    setCategories(prev => {
      const updated = prev.map(cat => ({
        ...cat,
        subCategories: cat.subCategories?.filter(sub => sub.id !== id),
      }));
      saveToLocalStorage(undefined, updated);
      return updated;
    });
    setRepositories(prev => {
      const updated = prev.map(repo =>
        repo.subCategoryId === id ? { ...repo, subCategoryId: undefined, subCategoryName: undefined } : repo
      );
      saveToLocalStorage(updated, undefined);
      return updated;
    });
    await deleteSubCategoryAction(id);
  };

  // Move repository via Drag & Drop
  const handleMoveRepo = async (repoId: string, categoryId: string, subCategoryId: string, subCategoryName: string) => {
    const targetCat = categories.find(c => c.id === categoryId);
    setRepositories(prev => {
      const updated = prev.map(repo =>
        repo.id === repoId
          ? {
              ...repo,
              categoryId,
              categoryName: targetCat?.name || repo.categoryName,
              subCategoryId,
              subCategoryName,
            }
          : repo
      );
      saveToLocalStorage(updated, undefined);
      return updated;
    });
    await moveRepositoryAction(repoId, categoryId, subCategoryId, subCategoryName);
  };

  // Update repository name
  const handleUpdateRepo = async (repoId: string, newName: string) => {
    setRepositories(prev => {
      const updated = prev.map(repo =>
        repo.id === repoId ? { ...repo, name: newName } : repo
      );
      saveToLocalStorage(updated, undefined);
      return updated;
    });
    await updateRepositoryAction(repoId, { name: newName });
  };

  // Delete repository from library
  const handleDeleteRepo = async (repoId: string) => {
    setRepositories(prev => {
      const updated = prev.filter(repo => repo.id !== repoId);
      saveToLocalStorage(updated, undefined);
      return updated;
    });
    await deleteRepositoryAction(repoId);
  };

  // Compute category repo counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    repositories.forEach(repo => {
      if (repo.categoryId) {
        counts[repo.categoryId] = (counts[repo.categoryId] || 0) + 1;
      }
      const matched = categories.find(c => c.name.toLowerCase() === (repo.categoryName || '').toLowerCase());
      if (matched && matched.id !== repo.categoryId) {
        counts[matched.id] = (counts[matched.id] || 0) + 1;
      }
    });
    return counts;
  }, [repositories, categories]);

  // Compute total stars
  const totalStars = useMemo(() => {
    return repositories.reduce((sum, r) => sum + (r.starsCount || 0), 0);
  }, [repositories]);

  // Filter & sort repos
  const currentCategoryObj = useMemo(() => {
    return categories.find(c => c.id === selectedCategory);
  }, [categories, selectedCategory]);

  const filteredAndSortedRepos = useMemo(() => {
    return repositories
      .filter(repo => {
        if (selectedCategory !== 'all') {
          const cat = currentCategoryObj;
          const matchCat = (cat && (repo.categoryName === cat.name || repo.categoryId === cat.id)) ||
            (repo.categoryId === selectedCategory);
          if (!matchCat) return false;

          if (selectedSubCategory) {
            const sub = cat?.subCategories?.find(s => s.id === selectedSubCategory);
            const matchSub = (sub && (repo.subCategoryName === sub.name || repo.subCategoryId === sub.id)) ||
              (repo.subCategoryId === selectedSubCategory);
            if (!matchSub) return false;
          }
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = (repo.name || '').toLowerCase().includes(q);
          const matchFullName = (repo.fullName || '').toLowerCase().includes(q);
          const matchDesc = (repo.description || '').toLowerCase().includes(q);
          const matchLang = (repo.primaryLanguage || '').toLowerCase().includes(q);
          const matchTopics = (repo.topics || []).some(t => t.toLowerCase().includes(q));
          if (!matchName && !matchFullName && !matchDesc && !matchLang && !matchTopics) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortKey === 'stars') return (b.starsCount || 0) - (a.starsCount || 0);
        if (sortKey === 'forks') return (b.forksCount || 0) - (a.forksCount || 0);
        if (sortKey === 'name') return (a.name || '').localeCompare(b.name || '');
        return 0; // recent
      });
  }, [repositories, selectedCategory, selectedSubCategory, searchQuery, sortKey, currentCategoryObj]);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col relative select-none">
      {/* 3D WebGL Canvas Backdrop (Three.js 5 Prisms & Torus matching prototype) */}
      <ThreeBackdrop theme={theme} isPlaying={isVideoPlaying} />

      {/* Top Navbar Header spanning full width matching Foto 1 & Foto 2 */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between sticky top-0 glass-panel z-30 shrink-0">
        {/* Left: Logo Section matching Foto 2 */}
        <div 
          className={cn(
            "h-full border-r border-white/10 flex items-center justify-between px-4 shrink-0 brand-header-inner transition-all duration-200",
            isSidebarCollapsed ? "w-[4.5rem] justify-center px-0" : "w-full md:w-72"
          )}
        >
          <div className={cn("flex items-center", isSidebarCollapsed ? "justify-center w-full" : "space-x-3")}>
            <img
              src="/logo-neural-vault.svg"
              alt="GitLibrary Logo"
              className="w-10 h-10 rounded-xl shadow-lg shadow-indigo-500/25 shrink-0 object-contain select-none hover:scale-105 transition-transform"
            />
            {!isSidebarCollapsed && (
              <div className="sidebar-text truncate">
                <h1 className="text-sm font-bold text-slate-100 tracking-tight leading-none">GitLibrary</h1>
                <span className="text-[10px] text-indigo-400 font-mono font-medium tracking-wide">Curated AI Repos</span>
              </div>
            )}
          </div>
          {!isSidebarCollapsed && (
            <span className="sidebar-badge text-[11px] font-mono bg-white/5 text-slate-300 px-2.5 py-1 rounded-lg border border-white/10 shrink-0">
              v1.0
            </span>
          )}
        </div>

        {/* Right: Search Input & Action Tools matching Foto 1 */}
        <div className="flex-1 flex items-center justify-between px-4 md:px-6 gap-3 md:gap-4 min-w-0">
          {/* Search Input */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              ref={searchInputRef}
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari repo, topik, atau bahasa (Ctrl+K)..." 
              className="w-full pl-9 pr-12 py-2 rounded-xl glass-input text-xs text-slate-100 placeholder-slate-400 focus:outline-none transition-all"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 border border-white/10 bg-white/5 px-1.5 py-0.5 rounded">
              ⌘K
            </span>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center space-x-3">
            {/* Play / Pause Background Video Control */}
            <button
              type="button"
              onClick={() => setIsVideoPlaying(prev => !prev)}
              title={isVideoPlaying ? 'Jeda Video Latar' : 'Putar Video Latar'}
              aria-label={isVideoPlaying ? 'Jeda Video Latar' : 'Putar Video Latar'}
              className="pressable-btn flex items-center justify-center p-2 rounded-xl glass-panel hover:bg-white/10 text-slate-300 border border-white/10 hover:border-white/20 transition-all active:scale-95 group cursor-pointer"
            >
              {isVideoPlaying ? (
                <Pause className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              ) : (
                <Play className="w-4 h-4 text-emerald-400 fill-emerald-400/20 group-hover:scale-110 transition-transform ml-0.5" />
              )}
            </button>

            <ThemeAndSortDropdowns
              currentTheme={theme}
              onThemeChange={setTheme}
              currentSort={sortKey}
              onSortChange={setSortKey}
            />

            {/* Add Repo CTA */}
            <button 
              onClick={() => setIsAddRepoOpen(true)}
              className="pressable-btn flex items-center space-x-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-purple-500/25 border border-white/25 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Tambah Repository</span>
              <span className="sm:hidden">Tambah</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body Area below Header */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative z-10">
        {/* Sidebar Navigation */}
        <Sidebar
          categories={categories}
          selectedCategory={selectedCategory}
          selectedSubCategory={selectedSubCategory}
          totalCount={repositories.length}
          categoryCounts={categoryCounts}
          repositories={repositories}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
          onSelectRepo={fullName => setActiveRepoModal(fullName)}
          onDropRepo={handleMoveRepo}
          onSelectCategory={(catId, subId) => {
            setSelectedCategory(catId);
            setSelectedSubCategory(subId || null);
          }}
          onOpenAddCategory={() => setIsAddCategoryOpen(true)}
          onUpdateSubCategory={handleUpdateSubCategory}
          onDeleteSubCategory={handleDeleteSubCategory}
          onUpdateRepo={handleUpdateRepo}
          onDeleteRepo={handleDeleteRepo}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 relative z-10 overflow-y-auto h-full">
          {/* Content Viewport */}
          <div className="p-6 flex-1 space-y-6">
          {/* Stats / Headline Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <span>
                  {selectedCategory === 'all'
                    ? 'Semua Repositori AI'
                    : currentCategoryObj?.name || 'Katalog Repositori'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedCategory === 'all'
                  ? 'Koleksi terkurasi model, frameworks, tools, dan skill AI pilihan.'
                  : `Menampilkan daftar repositori dalam filter kategori ${currentCategoryObj?.name || ''}${selectedSubCategory ? ' > ' + (currentCategoryObj?.subCategories?.find(s => s.id === selectedSubCategory)?.name || '') : ''}.`}
              </p>
            </div>
            <div className="flex items-center space-x-4 text-xs font-mono">
              <div className="flex items-center space-x-1.5 text-slate-300 px-3 py-1 rounded-lg glass-panel text-[11px]">
                <Folder className="w-3.5 h-3.5 text-indigo-400" />
                <span>{categories.length} Kategori</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-300 px-3 py-1 rounded-lg glass-panel text-[11px]">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>{formatCompactNumber(totalStars)} Stars</span>
              </div>
            </div>
          </div>

          {/* Repository Cards Grid */}
          {filteredAndSortedRepos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" id="repoGrid">
              {filteredAndSortedRepos.map(repo => (
                <RepoCard
                  key={repo.id}
                  repo={repo}
                  onClick={fullName => setActiveRepoModal(fullName)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl glass-panel border border-white/10 space-y-4 my-8">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10">
                <Folder className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-100">Belum ada repositori di filter ini</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Tambahkan repositori GitHub pertama ke dalam sub-kategori ini atau sesuaikan kata kunci pencarian.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddRepoOpen(true)}
                className="pressable-btn flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/30 border border-indigo-400/30 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Tambah Repository Sekarang</span>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>

      {/* GitHub Authentic Detail Modal */}
      <RepoDetailModal
        isOpen={!!activeRepoModal}
        repoFullName={activeRepoModal}
        onClose={() => setActiveRepoModal(null)}
      />

      {/* Add Repository Modal */}
      <AddRepoModal
        isOpen={isAddRepoOpen}
        categories={categories}
        defaultCategoryId={selectedCategory !== 'all' ? selectedCategory : undefined}
        onClose={() => setIsAddRepoOpen(false)}
        onRepoAdded={(newRepo, createdSub, createdCat) => {
          if (createdCat) {
            setCategories(prev => {
              if (prev.some(c => c.id === createdCat.id || c.name.toLowerCase() === createdCat.name.toLowerCase())) {
                return prev;
              }
              const updated = [
                ...prev,
                {
                  id: createdCat.id,
                  name: createdCat.name,
                  slug: createdCat.slug,
                  icon: createdCat.icon || 'folder',
                  description: createdCat.description || '',
                  subCategories: createdSub ? [{ id: createdSub.id, name: createdSub.name, slug: createdSub.slug }] : [],
                },
              ];
              saveToLocalStorage(undefined, updated);
              return updated;
            });
          } else if (createdSub) {
            setCategories(prev => {
              const updated = prev.map(cat => {
                if (cat.id === createdSub.categoryId) {
                  const existing = cat.subCategories || [];
                  if (!existing.some(s => s.id === createdSub.id || s.name.toLowerCase() === createdSub.name.toLowerCase())) {
                    return {
                      ...cat,
                      subCategories: [...existing, { id: createdSub.id, name: createdSub.name, slug: createdSub.slug }],
                    };
                  }
                }
                return cat;
              });
              saveToLocalStorage(undefined, updated);
              return updated;
            });
          }
          setRepositories(prev => {
            const updated = [newRepo, ...prev.filter(r => r.id !== newRepo.id && r.fullName !== newRepo.fullName)];
            saveToLocalStorage(updated, undefined);
            return updated;
          });
        }}
      />

      {/* Add Category Modal */}
      <AddCategoryModal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        onCategoryAdded={newCat => {
          setCategories(prev => {
            const updated = [...prev, newCat];
            saveToLocalStorage(undefined, updated);
            return updated;
          });
        }}
      />
    </div>
  );
}
