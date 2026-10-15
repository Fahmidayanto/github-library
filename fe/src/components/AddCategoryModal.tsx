'use client';

import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Category } from './Sidebar';
import { createCategoryAction } from '@/app/actions';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryAdded: (newCat: Category) => void;
}

export function AddCategoryModal({
  isOpen,
  onClose,
  onCategoryAdded,
}: AddCategoryModalProps) {
  const [name, setName] = useState('');
  const [subNamesText, setSubNamesText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Nama kategori utama tidak boleh kosong.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const subList = subNamesText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    try {
      const res = await createCategoryAction(name.trim(), subList);
      const newCategory: Category = {
        id: res?.category?.id || `cat-${Date.now()}`,
        name: name.trim(),
        slug: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        icon: 'folder',
        subCategories: subList.map((s, idx) => ({
          id: `sub-${Date.now()}-${idx}`,
          name: s,
          slug: s.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        })),
      };

      onCategoryAdded(newCategory);
      onClose();
      setName('');
      setSubNamesText('');
    } catch (err: any) {
      setError(err.message || 'Gagal menambahkan kategori.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-panel-elevated w-full max-w-md rounded-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-sm font-bold text-slate-100">Tambah Custom Kategori</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Nama Kategori Utama</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Contoh: Audio AI, Robotics, Vision" 
              className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-300 mb-1">Sub-kategori Awal (Pisahkan dengan koma)</label>
            <input 
              type="text" 
              value={subNamesText}
              onChange={e => setSubNamesText(e.target.value)}
              placeholder="TTS, STT, Voice Cloning" 
              className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 border-t border-white/10 pt-3">
          <button 
            onClick={onClose} 
            className="px-4 py-1.5 rounded-xl text-xs text-slate-400 hover:text-slate-200"
          >
            Batal
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-1.5 rounded-xl text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 disabled:opacity-50"
          >
            {isSubmitting ? 'Menambahkan...' : 'Tambah'}
          </button>
        </div>
      </div>
    </div>
  );
}

