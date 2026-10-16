'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'id' | 'en';

export interface Translations {
  header: {
    searchPlaceholder: string;
    playVideo: string;
    pauseVideo: string;
    addRepo: string;
    addShort: string;
    version: string;
    brandSubtitle: string;
  };
  sort: {
    stars: string;
    recent: string;
    name: string;
    sortBy: string;
  };
  theme: {
    theme: string;
    auroraTitle: string;
    auroraSubtitle: string;
    sunsetTitle: string;
    sunsetSubtitle: string;
    frostTitle: string;
    frostSubtitle: string;
  };
  content: {
    allRepos: string;
    allReposDesc: string;
    repoCatalog: string;
    showingReposIn: string;
    categories: string;
    stars: string;
    emptyTitle: string;
    emptyDesc: string;
    addFirstRepo: string;
    detail: string;
    copyClone: string;
    copied: string;
    noDesc: string;
  };
  sidebar: {
    allCategories: string;
    manageCategories: string;
    addCategory: string;
    totalRepos: string;
    collapseSidebar: string;
    expandSidebar: string;
    editSubTitle: string;
    editSubSubtitle: string;
    subNameLabel: string;
    deleteSubTitle: string;
    deleteSubConfirm: string;
    deleteNow: string;
    save: string;
    cancel: string;
  };
  card: {
    dragTooltip: string;
    noDesc: string;
    stars: string;
    detail: string;
    copyCommand: string;
  };
  addRepoModal: {
    title: string;
    subtitle: string;
    urlLabel: string;
    autoFetchBtn: string;
    fetchingBtn: string;
    repoNameLabel: string;
    aiSuggestionTitle: string;
    analyzingRepo: string;
    applySuggestion: string;
    suggestionApplied: string;
    primaryCatLabel: string;
    subCatLabel: string;
    notesLabel: string;
    notesPlaceholder: string;
    cancelBtn: string;
    submitBtn: string;
    savingBtn: string;
    createNewCat: string;
    createNewSub: string;
    noSubCategory: string;
    duplicateWarning: string;
    duplicateWarningDesc: string;
    alreadyInLibraryBtn: string;
  };
  addCategoryModal: {
    title: string;
    subtitle: string;
    nameLabel: string;
    namePlaceholder: string;
    iconLabel: string;
    descLabel: string;
    descPlaceholder: string;
    cancelBtn: string;
    submitBtn: string;
    savingBtn: string;
  };
  repoDetailModal: {
    openInGithub: string;
    codeTab: string;
    watch: string;
    fork: string;
    star: string;
    sponsor: string;
    cloneCommand: string;
    latestFiles: string;
    noFiles: string;
    execSummary: string;
    realProblem: string;
    coreSolution: string;
    keyTech: string;
    impactMetrics: string;
    realCases: string;
    architecture: string;
    quickStart: string;
  };
  chatbot: {
    launcherLabel: string;
    title: string;
    connectedBadge: string;
    welcomeMsg: string;
    clearChat: string;
    close: string;
    inputPlaceholder: string;
    pressEnter: string;
    quickPrompts: string[];
    detailBtn: string;
    copyCommand: string;
  };
  galaxy: {
    filtersTitle: string;
    all: string;
    none: string;
    nodeTypes: string;
    groupSun: string;
    subGroupPlanet: string;
    repositoryMoon: string;
    languageComet: string;
    topicMeteor: string;
    galaxyClusters: string;
    displaySettings: string;
    cameraControls: string;
    resetCamera: string;
    topDownView: string;
    autoRotate: string;
    starScale: string;
    linkGlow: string;
    neonSunGlow: string;
    showOrbitLabels: string;
    resetHighlight: string;
    connected: string;
    neonLinks: string;
    highlightConnector: string;
    openFiltersTooltip: string;
    collapseFiltersTooltip: string;
    resizeHandleTooltip: string;
    highlightGroupTitle: string;
    highlightSubGroupTitle: string;
    openReadmeTitle: string;
    tooltipGroup: string;
    tooltipSubGroup: string;
    tooltipRepo: string;
    tooltipLanguage: string;
    tooltipTopic: string;
    reposWord: string;
    subGroupsWord: string;
    mainOrbitWord: string;
    closeBtn: string;
    activeBadge: string;
  };
}

// Kamus translasi kategori default database (EN <-> ID)
export const CATEGORY_MAP_EN_TO_ID: Record<string, string> = {
  'Large Language Models': 'Model Bahasa Besar (LLM)',
  'RAG & Vector Search': 'Pencarian RAG & Vektor',
  'Video & Multimodal': 'Video & Multimodal',
  'AI Agent Frameworks': 'Framework Agen AI',
  'AI Agent Skills & Tools': 'Skill & Tool Agen AI',
  'AI Agent Framework Trading': 'Framework Trading Agen AI',
  'AI/ML Learning & Education': 'Pembelajaran & Edukasi AI/ML',
  'OCR detecting': 'Deteksi & Ekstraksi OCR',
  'Database & Data Management': 'Basis Data & Manajemen Data',
  'Speech & Audio AI': 'AI Suara & Audio',
  'Productivity & Note-Taking': 'Produktivitas & Catatan',
  'All AI Repositories': 'Semua Repositori AI',
  'AI Models & LLMs': 'Model AI & LLM',
  'AI Frameworks & Agents': 'Framework & Agen AI',
  'AI Frameworks & Orchestration': 'Framework & Orkestrasi',
  'RAG & Vector Pipelines': 'Pipeline RAG & Vektor',
  'Video, Audio & Multimodal': 'Video, Audio & Multimodal',
  'Developer Tools & Utilities': 'Tools & Utilitas Developer',
  'AI General': 'AI Umum',
  'General': 'Umum',
};

export const CATEGORY_MAP_ID_TO_EN: Record<string, string> = {
  'Model Bahasa Besar (LLM)': 'Large Language Models',
  'Pencarian RAG & Vektor': 'RAG & Vector Search',
  'Video & Multimodal': 'Video & Multimodal',
  'Framework Agen AI': 'AI Agent Frameworks',
  'Skill & Tool Agen AI': 'AI Agent Skills & Tools',
  'Framework Trading Agen AI': 'AI Agent Framework Trading',
  'Pembelajaran & Edukasi AI/ML': 'AI/ML Learning & Education',
  'Deteksi & Ekstraksi OCR': 'OCR detecting',
  'Basis Data & Manajemen Data': 'Database & Data Management',
  'AI Suara & Audio': 'Speech & Audio AI',
  'Produktivitas & Catatan': 'Productivity & Note-Taking',
  'Semua Repositori AI': 'All AI Repositories',
  'Model AI & LLM': 'AI Models & LLMs',
  'Framework & Agen AI': 'AI Frameworks & Agents',
  'Framework & Orkestrasi': 'AI Frameworks & Orchestration',
  'Pipeline RAG & Vector': 'RAG & Vector Pipelines',
  'Pipeline RAG & Vektor': 'RAG & Vector Pipelines',
  'Tools & Utility Developer': 'Developer Tools & Utilities',
  'Tools & Utilitas Developer': 'Developer Tools & Utilities',
  'AI Umum': 'AI General',
  'Umum': 'General',
};

// Kamus translasi sub-kategori database (EN <-> ID)
export const SUBCATEGORY_MAP_EN_TO_ID: Record<string, string> = {
  'Inference Engines': 'Mesin Inferensi',
  'Quantization & Run': 'Kuantisasi & Eksekusi',
  'Fine-Tuning': 'Fine-Tuning & Penyesuaian',
  'Vector Databases': 'Basis Data Vektor',
  'Retrieval Pipelines': 'Pipeline Pengambilan',
  'Chunking & Parser': 'Pemotong & Parser Teks',
  'Text-to-Video': 'Teks ke Video',
  'Video Assembly': 'Perakitan Video',
  'Animation & Motion': 'Animasi & Gerak',
  'Multi-Agent Orchestrator': 'Orkestrator Multi-Agen',
  'Browser Agents': 'Agen Peramban Web',
  'Coding Agents': 'Agen Pemrograman',
  'Token Saver & Cost': 'Penghemat Token & Biaya',
  'UI/UX & Frontend': 'UI/UX & Frontend',
  'Web & Browser Agent': 'Agen Web & Peramban',
  'MCP & Protocols': 'Protokol & Server MCP',
  'Memory & Knowledge': 'Memori & Pengetahuan',
  'Coding Methodology': 'Metodologi Koding',
  'Financial & Trading Agents': 'Agen Finansial & Trading',
  'Roadmaps & Curated Resources': 'Panduan & Sumber Terkurasi',
  'Courseware & Tutorials': 'Materi Kursus & Tutorial',
  'OCR & Document Parsing': 'OCR & Parsing Dokumen',
  'Database IDEs & Clients': 'IDE & Klien Basis Data',
  'Text-to-Speech (TTS)': 'Teks ke Suara (TTS)',
  'Self-Hosted Note-Taking & Memos': 'Catatan & Memo Self-Hosted',
  'Diagramming & Visualization': 'Diagram & Visualisasi',
  'Reverse Engineering & Binary Analysis Agents': 'Agen Analisis Biner & RE',
  'Specialized Agent Collections': 'Koleksi Agen Khusus',
  'AI Video Editing & Generation': 'Edit & Pembuatan Video AI',
  'Knowledge Graph RAG': 'Graf Pengetahuan RAG',
  'RAG Knowledge Graph': 'Graf Pengetahuan RAG',
  'Local LLMs': 'LLM Lokal',
  'Voice Cloning': 'Kloning Suara',
  'Prompt Engineering': 'Rekayasa Prompt',
  'Embedding Models': 'Model Embedding',
  'Video Generation': 'Pembuatan Video',
  'General': 'Umum',
};

export const SUBCATEGORY_MAP_ID_TO_EN: Record<string, string> = {
  'Mesin Inferensi': 'Inference Engines',
  'Kuantisasi & Eksekusi': 'Quantization & Run',
  'Fine-Tuning & Penyesuaian': 'Fine-Tuning',
  'Fine-Tuning': 'Fine-Tuning',
  'Basis Data Vektor': 'Vector Databases',
  'Pipeline Pengambilan': 'Retrieval Pipelines',
  'Pemotong & Parser Teks': 'Chunking & Parser',
  'Teks ke Video': 'Text-to-Video',
  'Perakitan Video': 'Video Assembly',
  'Animasi & Gerak': 'Animation & Motion',
  'Orkestrator Multi-Agen': 'Multi-Agent Orchestrator',
  'Agen Peramban Web': 'Browser Agents',
  'Agen Pemrograman': 'Coding Agents',
  'Penghemat Token & Biaya': 'Token Saver & Cost',
  'UI/UX & Frontend': 'UI/UX & Frontend',
  'Agen Web & Peramban': 'Web & Browser Agent',
  'Protokol & Server MCP': 'MCP & Protocols',
  'Memori & Pengetahuan': 'Memory & Knowledge',
  'Metodologi Koding': 'Coding Methodology',
  'Agen Finansial & Trading': 'Financial & Trading Agents',
  'Panduan & Sumber Terkurasi': 'Roadmaps & Curated Resources',
  'Materi Kursus & Tutorial': 'Courseware & Tutorials',
  'OCR & Parsing Dokumen': 'OCR & Document Parsing',
  'IDE & Klien Basis Data': 'Database IDEs & Clients',
  'Teks ke Suara (TTS)': 'Text-to-Speech (TTS)',
  'Catatan & Memo Self-Hosted': 'Self-Hosted Note-Taking & Memos',
  'Diagram & Visualisasi': 'Diagramming & Visualization',
  'Agen Analisis Biner & RE': 'Reverse Engineering & Binary Analysis Agents',
  'Koleksi Agen Khusus': 'Specialized Agent Collections',
  'Edit & Pembuatan Video AI': 'AI Video Editing & Generation',
  'Graf Pengetahuan RAG': 'Knowledge Graph RAG',
  'RAG Knowledge Graph': 'Knowledge Graph RAG',
  'LLM Lokal': 'Local LLMs',
  'Kloning Suara': 'Voice Cloning',
  'Rekayasa Prompt': 'Prompt Engineering',
  'Model Embedding': 'Embedding Models',
  'Pembuatan Video': 'Video Generation',
  'Umum': 'General',
};

export function translateCategory(name: string | undefined | null, lang: Language = 'id'): string {
  if (!name) return '';
  const trimmed = name.trim();
  if (lang === 'id') {
    return CATEGORY_MAP_EN_TO_ID[trimmed] || trimmed;
  }
  return CATEGORY_MAP_ID_TO_EN[trimmed] || trimmed;
}

export function translateSubCategory(name: string | undefined | null, lang: Language = 'id'): string {
  if (!name) return '';
  const trimmed = name.trim();
  if (lang === 'id') {
    return SUBCATEGORY_MAP_EN_TO_ID[trimmed] || trimmed;
  }
  return SUBCATEGORY_MAP_ID_TO_EN[trimmed] || trimmed;
}

// Kamus translasi deskripsi repositori terkurasi (EN <-> ID)
export const REPO_DESCRIPTION_MAP: Record<string, { en: string; id: string }> = {
  'obra/superpowers': {
    en: 'An agentic skills framework & software development methodology that works.',
    id: 'Framework skill agen & metodologi pengembangan software yang terbukti bekerja efektif.',
  },
  'morluto/rea': {
    en: 'Reverse engineer anything with agents, from app behavior down to native binaries.',
    id: 'Reverse engineering apa saja dengan agen cerdas, dari perilaku aplikasi hingga file biner native.',
  },
  'dietrichgebert/ponytail': {
    en: 'Makes your AI agent think like the laziest senior dev in the room. The best code is the code you never wrote.',
    id: 'Membuat agen AI berpikir seperti senior developer paling santai: solusi paling minimal dan efisien tanpa over-engineering.',
  },
  'msitarzewski/agency-agents': {
    en: 'A complete AI agency at your fingertips - From frontend wizards to Reddit community ninjas, from whimsy injectors to reality checkers.',
    id: 'Agensi AI lengkap di ujung jari Anda — dari spesialis frontend hingga validator realitas sistem.',
  },
  'nextlevelbuilder/ui-ux-pro-max-skill': {
    en: 'An AI skill that provides design intelligence for building professional UI/UX across multiple platforms.',
    id: 'Skill AI yang menyediakan kecerdasan desain profesional untuk membangun antarmuka UI/UX lintas platform.',
  },
  'harry0703/moneyprinterturbo': {
    en: 'Generate HD short videos from a topic or keyword with an automated AI workflow.',
    id: 'Buat video pendek HD otomatis dari topik atau kata kunci menggunakan workflow AI otomatis.',
  },
  'graphify-labs/graphify': {
    en: 'Turn any codebase, with its docs, SQL schemas, configs, and PDFs, into a queryable knowledge graph.',
    id: 'Ubah basis kode, dokumen, skema SQL, dan file PDF menjadi graf pengetahuan interaktif yang dapat di-query.',
  },
  'earendil-works/pi': {
    en: 'AI agent toolkit: unified LLM API, agent loop, TUI, coding agent CLI',
    id: 'Toolkit agen AI: API LLM terpadu, loop agen otonom, antarmuka TUI, dan CLI agen pemrograman.',
  },
  'tauricresearch/tradingagents': {
    en: 'TradingAgents: Multi-Agents LLM Financial Trading Framework',
    id: 'TradingAgents: Framework trading finansial multi-agen otonom berbasis LLM.',
  },
  'juliusbrussee/caveman': {
    en: '🪨 why use many token when few token do trick. Viral skill + proxy for coding agents that cuts 65% of tokens by talking like a caveman.',
    id: '🪨 Hemat 65% token untuk agen pemrograman dengan gaya komunikasi super padat ala manusia purba.',
  },
  'microsoft/ai-for-beginners': {
    en: '12 Weeks, 24 Lessons, AI for All!',
    id: 'Kurikulum 12 minggu, 24 modul pembelajaran AI & machine learning komprehensif untuk semua kalangan.',
  },
  'leonxlnx/taste-skill': {
    en: 'Agent skills that give coding agents taste: art direction, reference images and a browser check instead of generic AI pages',
    id: 'Skill agen yang memberi selera estetika tinggi pada coding agent: arahan visual, referensi desain, dan inspeksi browser.',
  },
  'egonex-ai/understand-anything': {
    en: 'Graphs that teach > graphs that impress. Turn any code into an interactive knowledge graph you can explore, search, and ask questions about.',
    id: 'Ubah kode apa pun menjadi graf pengetahuan interaktif yang dapat dijelajahi, dicari, dan ditanyakan.',
  },
  'pbakaus/impeccable': {
    en: 'The design language that makes your AI harness better at design.',
    id: 'Bahasa desain komprehensif yang menyempurnakan kemampuan harness AI dalam merancang antarmuka.',
  },
  'tirth8205/code-review-graph': {
    en: 'Local-first code intelligence graph for MCP and CLI. Builds a persistent map of your codebase so AI coding tools read only what matters.',
    id: 'Graf intelijen kode lokal untuk MCP dan CLI yang memetakan kode secara persisten agar AI hanya membaca konteks esensial.',
  },
  'lvcidpsyche/auto-browser': {
    en: 'Give your AI agent a real browser — with a human in the loop. Open-source MCP-native browser agent.',
    id: 'Beri agen AI peramban web nyata dengan kontrol interaktif human-in-the-loop berbasis protokol MCP.',
  },
  'rtk-ai/rtk': {
    en: 'CLI proxy that reduces LLM token consumption by 60-90% on common dev commands. Single Rust binary, zero dependencies',
    id: 'Proxy CLI berbasis Rust yang memangkas konsumsi token LLM sebesar 60-90% pada perintah developer tanpa dependensi tambahan.',
  },
  'vllm-project/vllm': {
    en: 'A high-throughput and memory-efficient LLM serving engine.',
    id: 'Engine inferensi dan serving LLM berperforma tinggi serta efisien memori dengan algoritma PagedAttention.',
  },
  'browser-use/browser-use': {
    en: 'Make websites accessible for AI agents. Open-source controller enabling LLMs to browse the web.',
    id: 'Jadikan situs web dapat diakses oleh agen AI melalui pengontrol otomatisasi browser open-source.',
  },
  'emilkowalski/skills': {
    en: 'Skills for Designers and Engineers.',
    id: 'Kumpulan skill interaksi, animasi micro-interaction, dan detail UI untuk desainer dan engineer.',
  },
  'ruvnet/ruview': {
    en: 'WiFi Sensing & Spatial Intelligence',
    id: 'Penginderaan WiFi cerdas & kecerdasan spasial pelacakan objek melalui gelombang RF.',
  },
};

export function translateRepoDescription(
  fullName?: string | null,
  originalDesc?: string | null,
  lang: Language = 'id'
): string {
  if (!originalDesc && !fullName) return '';
  if (!fullName) return originalDesc || '';
  const key = fullName.toLowerCase().trim();
  const entry = REPO_DESCRIPTION_MAP[key];
  if (entry) {
    if (lang === 'id') return entry.id;
    return entry.en || originalDesc || '';
  }
  return originalDesc || '';
}

export const translations: Record<Language, Translations> = {
  id: {
    header: {
      searchPlaceholder: 'Cari repo, topik, atau bahasa (Ctrl+K)...',
      playVideo: 'Putar Video Latar',
      pauseVideo: 'Jeda Video Latar',
      addRepo: 'Tambah Repository',
      addShort: 'Tambah',
      version: 'v1.0',
      brandSubtitle: 'Koleksi AI Terkurasi',
    },
    sort: {
      stars: 'Bintang Terbanyak',
      recent: 'Terbaru Ditambahkan',
      name: 'Nama Repo (A-Z)',
      sortBy: 'Urutkan',
    },
    theme: {
      theme: 'Tema',
      auroraTitle: 'Aurora Borealis',
      auroraSubtitle: 'Deep Teal • Cyan • Indigo',
      sunsetTitle: 'Sunset Velvet',
      sunsetSubtitle: 'Rose • Coral • Violet',
      frostTitle: 'Ethereal Frost',
      frostSubtitle: 'Light Glass • Iridescent',
    },
    content: {
      allRepos: 'Semua Repositori AI',
      allReposDesc: 'Koleksi terkurasi model, frameworks, tools, dan skill AI pilihan.',
      repoCatalog: 'Katalog Repositori',
      showingReposIn: 'Menampilkan daftar repositori dalam filter kategori',
      categories: 'Kategori',
      stars: 'bintang',
      emptyTitle: 'Belum ada repositori di filter ini',
      emptyDesc: 'Tambahkan repositori GitHub pertama ke dalam sub-kategori ini atau sesuaikan kata kunci pencarian.',
      addFirstRepo: 'Tambah Repository Sekarang',
      detail: 'Detail',
      copyClone: 'Salin Perintah',
      copied: 'Tersalin!',
      noDesc: 'Tidak ada deskripsi repositori.',
    },
    sidebar: {
      allCategories: 'Semua Kategori',
      manageCategories: 'Kelola Kategori',
      addCategory: 'Tambah Kategori',
      totalRepos: 'Total Repositori',
      collapseSidebar: 'Ciutkan Sidebar',
      expandSidebar: 'Buka Sidebar',
      editSubTitle: 'Edit Sub-kategori',
      editSubSubtitle: 'Ubah nama sub-kategori terpilih',
      subNameLabel: 'Nama Sub-kategori',
      deleteSubTitle: 'Hapus Sub-kategori',
      deleteSubConfirm: 'Apakah Anda yakin ingin menghapus sub-kategori',
      deleteNow: 'Hapus Sekarang',
      save: 'Simpan',
      cancel: 'Batal',
    },
    card: {
      dragTooltip: 'Tarik kartu ini ke sub-kategori di sidebar untuk memindahkannya',
      noDesc: 'Tidak ada deskripsi repositori.',
      stars: 'bintang',
      detail: 'Detail',
      copyCommand: 'Salin Perintah',
    },
    addRepoModal: {
      title: 'Tambah Repository Baru',
      subtitle: 'Paste link GitHub untuk auto-fetch detail',
      urlLabel: 'GitHub URL',
      autoFetchBtn: 'Auto Fetch',
      fetchingBtn: 'Mengambil...',
      repoNameLabel: 'Nama Repositori',
      aiSuggestionTitle: 'Rekomendasi Klasifikasi AI',
      analyzingRepo: 'Menganalisis repositori...',
      applySuggestion: 'Terapkan Rekomendasi',
      suggestionApplied: 'Rekomendasi Diterapkan',
      primaryCatLabel: 'Pilih Kategori Utama',
      subCatLabel: 'Sub-Kategori',
      notesLabel: 'Catatan / Alasan Kurasi (Opsional)',
      notesPlaceholder: 'Contoh: Framework paling efisien untuk browser automation...',
      cancelBtn: 'Batal',
      submitBtn: 'Simpan ke Library',
      savingBtn: 'Menyimpan...',
      createNewCat: '+ Buat Kategori Baru...',
      createNewSub: '+ Buat Sub-Kategori Baru...',
      noSubCategory: 'Tanpa Sub-kategori (Umum)',
      duplicateWarning: 'Repositori Sudah Terdaftar',
      duplicateWarningDesc: 'Repositori ini sudah tersimpan di dalam library.',
      alreadyInLibraryBtn: 'Sudah di Library',
    },
    addCategoryModal: {
      title: 'Tambah Kategori Baru',
      subtitle: 'Buat pengelompokan repositori baru di hierarki katalog',
      nameLabel: 'Nama Kategori',
      namePlaceholder: 'Contoh: Framework AI, Pipeline RAG, Audio Gen...',
      iconLabel: 'Pilih Ikon Representatif',
      descLabel: 'Deskripsi Singkat (Opsional)',
      descPlaceholder: 'Koleksi library khusus bidang...',
      cancelBtn: 'Batal',
      submitBtn: 'Simpan Kategori',
      savingBtn: 'Menyimpan...',
    },
    repoDetailModal: {
      openInGithub: 'Buka di GitHub',
      codeTab: 'Kode',
      watch: 'Pantau',
      fork: 'Fork',
      star: 'Bintang',
      sponsor: 'Dukung',
      cloneCommand: 'Salin URL Kloning',
      latestFiles: 'File commit terbaru',
      noFiles: 'Tidak ada file yang ditemukan.',
      execSummary: 'Ringkasan Eksekutif',
      realProblem: 'Masalah Nyata',
      coreSolution: 'Solusi Utama',
      keyTech: 'Teknologi Kunci',
      impactMetrics: 'Metrik Dampak',
      realCases: 'Kasus Penggunaan Nyata',
      architecture: 'Arsitektur & Alur Kerja',
      quickStart: 'Panduan Cepat',
    },
    chatbot: {
      launcherLabel: 'Library Advisor',
      title: 'Library Advisor',
      connectedBadge: 'Katalog terhubung',
      welcomeMsg: 'Asisten terhubung ke data kategori dan repositori. Sebutkan kebutuhan teknis Anda untuk rekomendasi spesifik dan skills terkait.',
      clearChat: 'Bersihkan obrolan',
      close: 'Tutup panel',
      inputPlaceholder: 'Tanyakan rekomendasi repositori...',
      pressEnter: 'Tekan Enter untuk kirim',
      quickPrompts: [
        'Hemat token & biaya LLM',
        'Framework browser agent',
        'Inference engine lokal',
        'Pipeline RAG & vector',
      ],
      detailBtn: 'Detail',
      copyCommand: 'Salin Perintah',
    },
    galaxy: {
      filtersTitle: 'Filter Galaksi',
      all: 'Semua',
      none: 'Kosongkan',
      nodeTypes: 'Tipe Node',
      groupSun: 'Kategori (☀️ Matahari)',
      subGroupPlanet: 'Sub-Grup (🪐 Planet)',
      repositoryMoon: 'Repositori (🌙 Bulan)',
      languageComet: 'Bahasa (☄️ Komet)',
      topicMeteor: 'Topik (🌠 Meteor)',
      galaxyClusters: 'Klaster Galaksi',
      displaySettings: 'Pengaturan Tampilan',
      cameraControls: 'Kontrol Kamera',
      resetCamera: 'Reset Kamera',
      topDownView: 'Tampak Atas (Top-Down)',
      autoRotate: 'Rotasi Otomatis',
      starScale: 'Ukuran Bintang',
      linkGlow: 'Pijar Garis Hubung',
      neonSunGlow: 'Pijar Inti Neon',
      showOrbitLabels: 'Tampilkan Label Orbit',
      resetHighlight: 'Reset Sorotan',
      connected: 'Terhubung',
      neonLinks: 'Garis Neon',
      highlightConnector: 'Sorot Konektor',
      openFiltersTooltip: 'Buka Filters (Ctrl+B)',
      collapseFiltersTooltip: 'Tutup Filters (Ctrl+B)',
      resizeHandleTooltip: 'Tarik pinggir untuk mengubah ukuran menu filter (Double-click untuk reset)',
      highlightGroupTitle: 'Sorot klaster grup ini',
      highlightSubGroupTitle: 'Sorot cabang sub-grup ini',
      openReadmeTitle: 'Buka README di modal / tab baru',
      tooltipGroup: 'Grup Kategori',
      tooltipSubGroup: 'Sub-Kategori',
      tooltipRepo: 'Repositori AI',
      tooltipLanguage: 'Bahasa Pemrograman',
      tooltipTopic: 'Tag Topik',
      reposWord: 'Repositori',
      subGroupsWord: 'Sub-Grup',
      mainOrbitWord: 'Orbit Utama',
      closeBtn: 'Tutup',
      activeBadge: 'Aktif',
    },
  },
  en: {
    header: {
      searchPlaceholder: 'Search repos, topics, or languages (Ctrl+K)...',
      playVideo: 'Play Background Video',
      pauseVideo: 'Pause Background Video',
      addRepo: 'Add Repository',
      addShort: 'Add',
      version: 'v1.0',
      brandSubtitle: 'Curated AI Repos',
    },
    sort: {
      stars: 'Most Stars',
      recent: 'Recently Added',
      name: 'Repo Name (A-Z)',
      sortBy: 'Sort By',
    },
    theme: {
      theme: 'Theme',
      auroraTitle: 'Aurora Borealis',
      auroraSubtitle: 'Deep Teal • Cyan • Indigo',
      sunsetTitle: 'Sunset Velvet',
      sunsetSubtitle: 'Rose • Coral • Violet',
      frostTitle: 'Ethereal Frost',
      frostSubtitle: 'Light Glass • Iridescent',
    },
    content: {
      allRepos: 'All AI Repositories',
      allReposDesc: 'Curated collection of top AI models, frameworks, tools, and skills.',
      repoCatalog: 'Repository Catalog',
      showingReposIn: 'Showing repositories in category filter',
      categories: 'Categories',
      stars: 'Stars',
      emptyTitle: 'No repositories in this filter',
      emptyDesc: 'Add your first GitHub repository to this subcategory or adjust search keywords.',
      addFirstRepo: 'Add Repository Now',
      detail: 'Detail',
      copyClone: 'Copy Command',
      copied: 'Copied!',
      noDesc: 'No repository description available.',
    },
    sidebar: {
      allCategories: 'All Categories',
      manageCategories: 'Manage Categories',
      addCategory: 'Add Category',
      totalRepos: 'Total Repositories',
      collapseSidebar: 'Collapse Sidebar',
      expandSidebar: 'Expand Sidebar',
      editSubTitle: 'Edit Sub-category',
      editSubSubtitle: 'Rename selected sub-category',
      subNameLabel: 'Sub-category Name',
      deleteSubTitle: 'Delete Sub-category',
      deleteSubConfirm: 'Are you sure you want to delete sub-category',
      deleteNow: 'Delete Now',
      save: 'Save',
      cancel: 'Cancel',
    },
    card: {
      dragTooltip: 'Drag this card to a sub-category in the sidebar to move it',
      noDesc: 'No repository description available.',
      stars: 'stars',
      detail: 'Detail',
      copyCommand: 'Copy Command',
    },
    addRepoModal: {
      title: 'Add New Repository',
      subtitle: 'Paste GitHub link to auto-fetch details',
      urlLabel: 'GitHub URL',
      autoFetchBtn: 'Auto Fetch',
      fetchingBtn: 'Fetching...',
      repoNameLabel: 'Repository Name',
      aiSuggestionTitle: 'AI Classification Suggestion',
      analyzingRepo: 'Analyzing repository...',
      applySuggestion: 'Apply Suggestion',
      suggestionApplied: 'Suggestion Applied',
      primaryCatLabel: 'Select Primary Category',
      subCatLabel: 'Sub-Category',
      notesLabel: 'Notes / Curation Rationale (Optional)',
      notesPlaceholder: 'E.g.: Most efficient framework for browser automation...',
      cancelBtn: 'Cancel',
      submitBtn: 'Save to Library',
      savingBtn: 'Saving...',
      createNewCat: '+ Create New Category...',
      createNewSub: '+ Create New Sub-Category...',
      noSubCategory: 'No Sub-category (General)',
      duplicateWarning: 'Repository Already Exists',
      duplicateWarningDesc: 'This repository is already saved in the library.',
      alreadyInLibraryBtn: 'Already in Library',
    },
    addCategoryModal: {
      title: 'Add New Category',
      subtitle: 'Create a new repository grouping in catalog hierarchy',
      nameLabel: 'Category Name',
      namePlaceholder: 'E.g.: AI Frameworks, RAG Pipelines, Audio Gen...',
      iconLabel: 'Select Representative Icon',
      descLabel: 'Short Description (Optional)',
      descPlaceholder: 'Curated collection of libraries for...',
      cancelBtn: 'Cancel',
      submitBtn: 'Save Category',
      savingBtn: 'Saving...',
    },
    repoDetailModal: {
      openInGithub: 'Open in GitHub',
      codeTab: 'Code',
      watch: 'Watch',
      fork: 'Fork',
      star: 'Star',
      sponsor: 'Sponsor',
      cloneCommand: 'Copy clone URL',
      latestFiles: 'Latest commit files',
      noFiles: 'No files found.',
      execSummary: 'Executive Summary',
      realProblem: 'The Problem',
      coreSolution: 'Core Solution',
      keyTech: 'Key Technologies',
      impactMetrics: 'Impact Metrics',
      realCases: 'Real-world Use Cases',
      architecture: 'Architecture & Workflow',
      quickStart: 'Quick Start Guide',
    },
    chatbot: {
      launcherLabel: 'Library Advisor',
      title: 'Library Advisor',
      connectedBadge: 'Catalog connected',
      welcomeMsg: 'Assistant connected to categories and repositories. State your technical requirements for specific recommendations and relevant skills.',
      clearChat: 'Clear chat',
      close: 'Close panel',
      inputPlaceholder: 'Ask for repository recommendations...',
      pressEnter: 'Press Enter to send',
      quickPrompts: [
        'Save LLM tokens & cost',
        'Browser agent frameworks',
        'Local inference engines',
        'RAG & vector pipelines',
      ],
      detailBtn: 'Detail',
      copyCommand: 'Copy Command',
    },
    galaxy: {
      filtersTitle: 'Galaxy Filters',
      all: 'All',
      none: 'None',
      nodeTypes: 'Node Types',
      groupSun: 'Category (☀️ Sun)',
      subGroupPlanet: 'Sub-Group (🪐 Planet)',
      repositoryMoon: 'Repository (🌙 Moon)',
      languageComet: 'Language (☄️ Comet)',
      topicMeteor: 'Topic (🌠 Meteor)',
      galaxyClusters: 'Galaxy Clusters',
      displaySettings: 'Display Settings',
      cameraControls: 'Camera Controls',
      resetCamera: 'Reset Camera',
      topDownView: 'Top-Down View',
      autoRotate: 'Auto-Rotate',
      starScale: 'Star Scale',
      linkGlow: 'Link Glow',
      neonSunGlow: 'Neon Sun Glow',
      showOrbitLabels: 'Show Orbit Labels',
      resetHighlight: 'Reset Highlight',
      connected: 'Connected',
      neonLinks: 'Neon Links',
      highlightConnector: 'Highlight Connector',
      openFiltersTooltip: 'Open Filters (Ctrl+B)',
      collapseFiltersTooltip: 'Collapse Filters (Ctrl+B)',
      resizeHandleTooltip: 'Drag right edge to resize filters menu (Double-click to reset)',
      highlightGroupTitle: 'Highlight this group cluster',
      highlightSubGroupTitle: 'Highlight this sub-group branch',
      openReadmeTitle: 'Open README in modal / new tab',
      tooltipGroup: 'Category Group',
      tooltipSubGroup: 'Sub-Category',
      tooltipRepo: 'AI Repository',
      tooltipLanguage: 'Programming Language',
      tooltipTopic: 'Topic Tag',
      reposWord: 'Repositories',
      subGroupsWord: 'Sub-Groups',
      mainOrbitWord: 'Main Orbit',
      closeBtn: 'Close',
      activeBadge: 'Active',
    },
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  translateCategory: (name?: string | null, langOverride?: Language) => string;
  translateSubCategory: (name?: string | null, langOverride?: Language) => string;
  translateRepoDescription: (fullName?: string | null, originalDesc?: string | null, langOverride?: Language) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'id',
  setLanguage: () => {},
  t: translations.id,
  translateCategory: (name) => name || '',
  translateSubCategory: (name) => name || '',
  translateRepoDescription: (_fullName, originalDesc) => originalDesc || '',
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('id');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('gitlibrary_lang_v1') as Language | null;
      if (saved === 'id' || saved === 'en') {
        setLanguageState(saved);
      }
    } catch (e) {
      console.warn('Failed to load language from localStorage:', e);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('gitlibrary_lang_v1', lang);
    } catch (e) {
      console.warn('Failed to save language to localStorage:', e);
    }
  };

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      t: translations[language],
      translateCategory: (name, langOverride) => translateCategory(name, langOverride || language),
      translateSubCategory: (name, langOverride) => translateSubCategory(name, langOverride || language),
      translateRepoDescription: (fullName, originalDesc, langOverride) => translateRepoDescription(fullName, originalDesc, langOverride || language),
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
