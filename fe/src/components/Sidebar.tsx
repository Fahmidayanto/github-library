'use client';

import React, { useState, useEffect } from 'react';
import { 
  FolderGit2, 
  Layers, 
  Cpu, 
  Database, 
  Video, 
  Bot, 
  Sparkles, 
  Plus, 
  Columns2, 
  PanelLeftOpen, 
  ChevronDown,
  Menu,
  Pencil,
  Trash2,
  Check,
  X,
  GripVertical
} from 'lucide-react';
import { cn, formatCompactNumber } from '@/lib/utils';

export interface SubCategory {
  id: string;
  name: string;
  slug: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  subCategories?: SubCategory[];
}

export interface SidebarRepoItem {
  id: string;
  name: string;
  fullName: string;
  categoryId?: string;
  subCategoryId?: string;
  subCategoryName?: string;
  primaryLanguage?: string | null;
  starsCount?: number;
}

interface SidebarProps {
  categories: Category[];
  selectedCategory: string;
  selectedSubCategory: string | null;
  totalCount: number;
  categoryCounts?: Record<string, number>;
  repositories?: SidebarRepoItem[];
  onSelectCategory: (categoryId: string, subCategoryId?: string | null) => void;
  onSelectRepo?: (fullName: string) => void;
  onOpenAddCategory: () => void;
  onUpdateSubCategory?: (id: string, newName: string) => Promise<void> | void;
  onDeleteSubCategory?: (id: string) => Promise<void> | void;
  onUpdateRepo?: (id: string, newName: string) => Promise<void> | void;
  onDeleteRepo?: (id: string) => Promise<void> | void;
  onDropRepo?: (repoId: string, categoryId: string, subCategoryId: string, subCategoryName: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  cpu: <Cpu className="w-4 h-4 text-indigo-400" />,
  database: <Database className="w-4 h-4 text-cyan-400" />,
  video: <Video className="w-4 h-4 text-emerald-400" />,
  bot: <Bot className="w-4 h-4 text-amber-400" />,
  sparkles: <Sparkles className="w-4 h-4 text-fuchsia-400" />,
};

const ICON_MAP_LARGE: Record<string, React.ReactNode> = {
  cpu: <Cpu className="w-5 h-5 text-indigo-400" />,
  database: <Database className="w-5 h-5 text-cyan-400" />,
  video: <Video className="w-5 h-5 text-emerald-400" />,
  bot: <Bot className="w-5 h-5 text-amber-400" />,
  sparkles: <Sparkles className="w-5 h-5 text-fuchsia-400" />,
};

export function Sidebar({
  categories,
  selectedCategory,
  selectedSubCategory,
  totalCount,
  categoryCounts = {},
  repositories = [],
  onSelectCategory,
  onSelectRepo,
  onOpenAddCategory,
  onUpdateSubCategory,
  onDeleteSubCategory,
  onUpdateRepo,
  onDeleteRepo,
  onDropRepo,
  isCollapsed: propIsCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = propIsCollapsed !== undefined ? propIsCollapsed : internalCollapsed;
  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed(prev => !prev);
    }
  };

  const [expandedSubIds, setExpandedSubIds] = useState<Record<string, boolean>>({});
  const [dragOverSubId, setDragOverSubId] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // State untuk burger menu & edit/delete sub-kategori modal
  const [activeMenuSubId, setActiveMenuSubId] = useState<string | null>(null);
  const [editModalData, setEditModalData] = useState<{ id: string; name: string } | null>(null);
  const [deleteModalData, setDeleteModalData] = useState<{ id: string; name: string } | null>(null);
  const [editNameInput, setEditNameInput] = useState<string>('');

  // State untuk edit & delete repositori di sub-group
  const [editRepoModalData, setEditRepoModalData] = useState<{ id: string; name: string; fullName: string } | null>(null);
  const [deleteRepoModalData, setDeleteRepoModalData] = useState<{ id: string; name: string; fullName: string } | null>(null);
  const [editRepoNameInput, setEditRepoNameInput] = useState<string>('');

  // Close burger dropdown saat klik di luar menu container
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('.sub-menu-container')) {
        return;
      }
      setActiveMenuSubId(null);
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  // Keyboard shortcut (Ctrl+B / Cmd+B) persis seperti ui-prototype.html
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCollapse]);

  const toggleGroup = (id: string) => {
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside 
      id="mainSidebar"
      className={cn(
        "sidebar-container glass-panel relative border-r border-white/10 flex flex-col shrink-0 z-20 group/sidebar h-full max-h-full",
        isCollapsed ? "collapsed w-[4.5rem]" : "w-full md:w-72"
      )}
    >
      {/* Floating Collapse / Expand Button (Hanya Muncul saat Kursor Diarahkan ke Sidebar) */}
      <button
        id="sidebarToggleBtn"
        onClick={toggleCollapse}
        title="Toggle Sidebar (Ctrl+B)"
        className="sidebar-toggle-btn absolute -right-[1px] top-3.5 z-30 w-7 h-7 rounded-lg bg-[#0e1726]/90 backdrop-blur-md border border-sky-400/50 text-sky-400 hover:text-white hover:bg-sky-500/30 shadow-lg shadow-sky-950/60 flex items-center justify-center cursor-pointer transition-all active:scale-95"
      >
        {isCollapsed ? (
          <PanelLeftOpen className="w-4 h-4 stroke-[2.2]" />
        ) : (
          <Columns2 className="w-4 h-4 stroke-[2.2]" />
        )}
      </button>

      {/* Quick Filter: All Repos */}
      <div className="p-3 border-b border-white/10 shrink-0" id="quickFilterContainer">
        <button
          onClick={() => onSelectCategory('all', null)}
          title="Semua Repositori"
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all",
            selectedCategory === 'all'
              ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20"
              : "text-slate-300 hover:bg-white/5"
          )}
        >
          <div className="flex items-center space-x-2.5">
            <Layers className="w-4 h-4 shrink-0 text-indigo-400" />
            <span className="sidebar-text">Semua Repositori</span>
          </div>
          <span className="sidebar-badge px-1.5 py-0.5 text-[10px] bg-indigo-500/30 rounded font-mono text-indigo-300">
            {totalCount}
          </span>
        </button>
      </div>

      {/* Mini Icon-Only View saat Collapsed (100% Presisi prototype) */}
      <div className="sidebar-icon-only hidden flex-1 flex-col items-center py-4 space-y-3">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id, null)}
            title={cat.name}
            className={cn(
              "w-10 h-10 rounded-xl hover:bg-white/10 flex items-center justify-center transition-colors",
              selectedCategory === cat.id ? "bg-white/10 border border-white/20" : ""
            )}
          >
            {ICON_MAP_LARGE[cat.icon] || <Cpu className="w-5 h-5 text-indigo-400" />}
          </button>
        ))}
        <div className="w-6 h-[1px] bg-white/10 my-2" />
        <button
          onClick={onOpenAddCategory}
          title="Tambah Kategori"
          className="w-10 h-10 rounded-xl border border-dashed border-slate-700 hover:border-indigo-500 text-slate-400 hover:text-indigo-400 flex items-center justify-center transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Category Groups / Tree Navigation (Expanded) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 min-h-0" id="categoryTree">
        {categories.map(cat => {
          const isOpen = openGroups[cat.id] ?? false;
          const isSelected = selectedCategory === cat.id && !selectedSubCategory;
          const count = categoryCounts[cat.id] ?? (cat.subCategories ? cat.subCategories.length : 0);

          return (
            <div key={cat.id} className="space-y-0.5">
              <div
                className={cn(
                  "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors group",
                  isSelected ? "bg-white/10 text-white font-semibold" : "text-slate-200 hover:bg-white/5"
                )}
              >
                {/* Area Klik Kategori Utama (Hanya Filter, Accordion Tetap) */}
                <button
                  type="button"
                  onClick={() => onSelectCategory(cat.id, null)}
                  className="flex items-center space-x-2 truncate min-w-0 flex-1 py-1 text-left cursor-pointer"
                  title={`Filter: ${cat.name}`}
                >
                  {ICON_MAP[cat.icon] || <Cpu className="w-4 h-4 text-indigo-400 shrink-0" />}
                  <span className="truncate">{cat.name}</span>
                </button>

                {/* Area Kanan: Badge Jumlah & Tombol Dropdown Accordion */}
                <div className="flex items-center space-x-1 shrink-0">
                  <span className="text-[10px] text-slate-500 font-mono px-1 py-0.5 rounded bg-white/5">
                    {count}
                  </span>
                  {cat.subCategories && cat.subCategories.length > 0 && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        toggleGroup(cat.id);
                      }}
                      title={isOpen ? "Tutup sub-kategori" : "Buka sub-kategori"}
                      className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <ChevronDown
                        className={cn(
                          "w-3.5 h-3.5 transition-transform duration-200",
                          isOpen ? "rotate-180 text-indigo-400" : "text-slate-500 hover:text-slate-300"
                        )}
                      />
                    </button>
                  )}
                </div>
              </div>

              {isOpen && cat.subCategories && cat.subCategories.length > 0 && (
                <div className="ml-4 pl-3.5 border-l border-white/10 space-y-1 my-1 dropdown-airfall">
                  {cat.subCategories.map(sub => {
                    const isSubActive = selectedSubCategory === sub.id;
                    const isMenuOpen = activeMenuSubId === sub.id;
                    const subRepos = repositories.filter(
                      r => r.subCategoryId === sub.id || (r.categoryId === cat.id && r.subCategoryName?.toLowerCase() === sub.name.toLowerCase())
                    );
                    const isReposExpanded = expandedSubIds[sub.id] ?? false;
                    const isDragOver = dragOverSubId === sub.id;

                    return (
                      <div key={sub.id} className="space-y-0.5">
                        <div
                          onDragOver={e => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            if (dragOverSubId !== sub.id) setDragOverSubId(sub.id);
                          }}
                          onDragLeave={() => setDragOverSubId(null)}
                          onDrop={e => {
                            e.preventDefault();
                            setDragOverSubId(null);
                            const repoId = e.dataTransfer.getData('text/plain');
                            if (repoId && onDropRepo) {
                              onDropRepo(repoId, cat.id, sub.id, sub.name);
                            }
                          }}
                          className={cn(
                            "sub-menu-container relative group/sub w-full flex items-center justify-between rounded-lg px-1.5 py-1 text-[11px] transition-all border",
                            isDragOver
                              ? "bg-indigo-500/30 border-indigo-400 ring-2 ring-indigo-500/50 scale-[1.02] shadow-lg shadow-indigo-500/30 text-white font-semibold"
                              : isSubActive
                              ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-300 font-semibold"
                              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5",
                            isMenuOpen ? "z-30" : "z-0"
                          )}
                        >
                          <div className="flex items-center space-x-1 flex-1 min-w-0">
                            {/* Expand/Collapse Repos toggle */}
                            {subRepos.length > 0 ? (
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  setExpandedSubIds(prev => ({ ...prev, [sub.id]: !prev[sub.id] }));
                                }}
                                title={isReposExpanded ? "Tutup daftar repositori" : "Buka daftar repositori"}
                                className="p-0.5 text-slate-500 hover:text-slate-200 rounded transition-colors shrink-0 cursor-pointer"
                              >
                                <ChevronDown
                                  className={cn(
                                    "w-3.5 h-3.5 transition-transform duration-200",
                                    isReposExpanded && "rotate-180 text-indigo-400"
                                  )}
                                />
                              </button>
                            ) : (
                              <span className="w-3.5 inline-block shrink-0" />
                            )}

                            <button
                              type="button"
                              onClick={() => onSelectCategory(cat.id, sub.id)}
                              className="flex-1 text-left truncate cursor-pointer py-0.5"
                            >
                              <span className="truncate">{sub.name}</span>
                            </button>
                          </div>

                          <div className="flex items-center space-x-1 shrink-0">
                            {/* Repo count */}
                            <span className="text-[10px] text-slate-500 font-mono px-1 py-0.5 rounded bg-white/5">
                              {subRepos.length}
                            </span>

                            {/* Burger Menu Button (Icon Menu dari Lucide) */}
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                setActiveMenuSubId(isMenuOpen ? null : sub.id);
                              }}
                              title="Menu Sub-kategori"
                              className={cn(
                                "p-1 rounded opacity-0 group-hover/sub:opacity-100 hover:bg-white/10 transition-all shrink-0 text-slate-400 hover:text-white cursor-pointer",
                                isMenuOpen && "opacity-100 text-white bg-white/10"
                              )}
                            >
                              <Menu className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Dropdown Menu Popover with Theme Airfall Motion */}
                          {isMenuOpen && (
                            <div
                              className="absolute right-0 top-full mt-1.5 w-44 rounded-2xl glass-dropdown-surface p-1.5 shadow-2xl z-50 border border-white/10 dropdown-airfall"
                              onClick={e => e.stopPropagation()}
                            >
                              <div className="px-2.5 py-1 text-[10px] font-mono tracking-wider uppercase text-slate-400 border-b border-white/10 mb-1">
                                Opsi Sub-Kategori
                              </div>
                              <div className="space-y-0.5">
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setEditModalData({ id: sub.id, name: sub.name });
                                    setEditNameInput(sub.name);
                                    setActiveMenuSubId(null);
                                  }}
                                  className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-white/10 transition-all text-left cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                  <span>Edit Nama</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setDeleteModalData({ id: sub.id, name: sub.name });
                                    setActiveMenuSubId(null);
                                  }}
                                  className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all text-left cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                  <span>Hapus</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Level 3: Nested List of Repositories inside this Sub-group with Airfall Motion */}
                        {isReposExpanded && subRepos.length > 0 && (
                          <div className="ml-3 my-1.5 p-1.5 rounded-2xl glass-dropdown-surface border border-white/10 shadow-2xl dropdown-airfall space-y-0.5">
                            <div className="px-2.5 py-1 text-[10px] font-mono tracking-wider uppercase text-slate-400 border-b border-white/10 mb-1">
                              Repositori ({subRepos.length})
                            </div>
                            {subRepos.map(repo => (
                              <div
                                key={repo.id}
                                draggable
                                onDragStart={e => {
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
                                }}
                                onClick={() => {
                                  if (onSelectRepo) {
                                    onSelectRepo(repo.fullName);
                                  } else {
                                    onSelectCategory(cat.id, sub.id);
                                  }
                                }}
                                title={`Buka modal detail ${repo.fullName} (atau drag ke sub-kategori lain)`}
                                className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between hover:bg-white/10 transition-all text-slate-200 hover:text-white cursor-pointer select-none active:cursor-grabbing group/repo"
                              >
                                <div className="flex items-center space-x-2 truncate min-w-0">
                                  <GripVertical className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover/repo:opacity-80 hover:!opacity-100 shrink-0 cursor-grab active:cursor-grabbing transition-opacity" />
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                                  <span className="truncate font-medium text-[11px]">{repo.name}</span>
                                </div>
                                <div className="flex items-center space-x-1 shrink-0 ml-1">
                                  {repo.starsCount !== undefined && repo.starsCount > 0 && (
                                    <span className="text-[10px] font-mono text-amber-400/90 group-hover/repo:hidden">
                                      ★{formatCompactNumber(repo.starsCount)}
                                    </span>
                                  )}
                                  <div className="hidden group-hover/repo:flex items-center space-x-0.5">
                                    <button
                                      type="button"
                                      onClick={e => {
                                        e.stopPropagation();
                                        setEditRepoModalData({ id: repo.id, name: repo.name, fullName: repo.fullName });
                                        setEditRepoNameInput(repo.name);
                                      }}
                                      title={`Edit nama ${repo.name}`}
                                      className="p-1 rounded hover:bg-white/15 text-slate-400 hover:text-sky-300 transition-colors cursor-pointer"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={e => {
                                        e.stopPropagation();
                                        setDeleteRepoModalData({ id: repo.id, name: repo.name, fullName: repo.fullName });
                                      }}
                                      title={`Hapus ${repo.name} dari library`}
                                      className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Tambah Kategori Baru Button (Expanded) */}
      <div className="sidebar-footer-btn p-3 border-t border-white/10 bg-black/20 shrink-0 mt-auto">
        <button
          onClick={onOpenAddCategory}
          className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg border border-dashed border-slate-700 hover:border-indigo-500 text-slate-400 hover:text-indigo-400 text-xs font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Kategori Baru</span>
        </button>
      </div>

      {/* Modal Edit Nama Sub-kategori */}
      {editModalData && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setEditModalData(null)}
        >
          <div 
            className="glass-panel-elevated w-full max-w-sm rounded-2xl p-5 border border-white/20 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Edit Sub-kategori</h3>
                  <p className="text-[11px] text-slate-400">Ubah nama sub-kategori terpilih</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditModalData(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Nama Sub-kategori</label>
              <input
                type="text"
                value={editNameInput}
                onChange={e => setEditNameInput(e.target.value)}
                onKeyDown={async e => {
                  if (e.key === 'Enter' && editNameInput.trim()) {
                    if (onUpdateSubCategory) {
                      await onUpdateSubCategory(editModalData.id, editNameInput.trim());
                    }
                    setEditModalData(null);
                  }
                  if (e.key === 'Escape') setEditModalData(null);
                }}
                autoFocus
                className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white placeholder-slate-400 focus:outline-none"
                placeholder="Nama sub-kategori..."
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setEditModalData(null)}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-300 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (editNameInput.trim() && onUpdateSubCategory) {
                    await onUpdateSubCategory(editModalData.id, editNameInput.trim());
                  }
                  setEditModalData(null);
                }}
                disabled={!editNameInput.trim()}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:opacity-90 text-white text-xs font-semibold shadow-lg shadow-sky-500/25 transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Simpan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Sub-kategori */}
      {deleteModalData && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setDeleteModalData(null)}
        >
          <div 
            className="glass-panel-elevated w-full max-w-sm rounded-2xl p-5 border border-white/20 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Hapus Sub-kategori</h3>
                  <p className="text-[11px] text-slate-400">Konfirmasi tindakan penghapusan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalData(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus sub-kategori <span className="font-semibold text-white">"{deleteModalData.name}"</span>?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalData(null)}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-300 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (onDeleteSubCategory) {
                    await onDeleteSubCategory(deleteModalData.id);
                  }
                  setDeleteModalData(null);
                }}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Nama Repositori */}
      {editRepoModalData && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setEditRepoModalData(null)}
        >
          <div 
            className="glass-panel-elevated w-full max-w-sm rounded-2xl p-5 border border-white/20 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Edit Nama Repositori</h3>
                  <p className="text-[11px] text-slate-400 font-mono truncate max-w-[200px]">{editRepoModalData.fullName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditRepoModalData(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Nama Repositori / Alias</label>
              <input
                type="text"
                value={editRepoNameInput}
                onChange={e => setEditRepoNameInput(e.target.value)}
                onKeyDown={async e => {
                  if (e.key === 'Enter' && editRepoNameInput.trim()) {
                    if (onUpdateRepo) {
                      await onUpdateRepo(editRepoModalData.id, editRepoNameInput.trim());
                    }
                    setEditRepoModalData(null);
                  }
                  if (e.key === 'Escape') setEditRepoModalData(null);
                }}
                autoFocus
                className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white placeholder-slate-400 focus:outline-none"
                placeholder="Nama repositori..."
              />
              <p className="text-[10px] text-slate-400">
                Nama ini akan diperbarui di sidebar dan kartu repositori.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setEditRepoModalData(null)}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-300 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (editRepoNameInput.trim() && onUpdateRepo) {
                    await onUpdateRepo(editRepoModalData.id, editRepoNameInput.trim());
                  }
                  setEditRepoModalData(null);
                }}
                disabled={!editRepoNameInput.trim()}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:opacity-90 text-white text-xs font-semibold shadow-lg shadow-sky-500/25 transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Simpan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Repositori */}
      {deleteRepoModalData && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setDeleteRepoModalData(null)}
        >
          <div 
            className="glass-panel-elevated w-full max-w-sm rounded-2xl p-5 border border-rose-500/30 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Hapus Repositori?</h3>
                  <p className="text-[11px] text-slate-400">Konfirmasi tindakan penghapusan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteRepoModalData(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1">
              <div className="text-xs font-semibold text-rose-300 truncate">
                {deleteRepoModalData.name}
              </div>
              <div className="text-[10px] font-mono text-slate-400 truncate">
                {deleteRepoModalData.fullName}
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus repositori ini dari library? Data di GitHub tidak akan terhapus.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setDeleteRepoModalData(null)}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-300 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (onDeleteRepo) {
                    await onDeleteRepo(deleteRepoModalData.id);
                  }
                  setDeleteRepoModalData(null);
                }}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Repositori</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
