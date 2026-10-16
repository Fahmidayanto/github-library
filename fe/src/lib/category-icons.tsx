import React from 'react';
import {
  Cpu,
  Database,
  Video,
  Bot,
  Sparkles,
  TrendingUp,
  GraduationCap,
  ScanText,
  HardDrive,
  Mic,
  FileText,
  CircuitBoard,
  Wrench,
  Shield,
  Globe,
  Code2,
  Smartphone,
  Cloud,
  Brain,
  Terminal,
  Zap,
  Box,
  Folder,
  Layers,
  Compass,
  Flame,
  Radio,
  Sliders,
  Eye,
  LineChart,
} from 'lucide-react';

export type CategoryIconSize = 'sm' | 'md' | 'lg';

// Map icon ID ke styling warna Tailwind yang kontras, modern, dan bervariasi
const ICON_COMPONENTS: Record<string, {
  component: React.ComponentType<{ className?: string }>;
  colorClass: string;
}> = {
  cpu: { component: Cpu, colorClass: 'text-indigo-400' },
  database: { component: Database, colorClass: 'text-cyan-400' },
  video: { component: Video, colorClass: 'text-emerald-400' },
  bot: { component: Bot, colorClass: 'text-amber-400' },
  sparkles: { component: Sparkles, colorClass: 'text-fuchsia-400' },
  'trending-up': { component: TrendingUp, colorClass: 'text-emerald-400' },
  'line-chart': { component: LineChart, colorClass: 'text-emerald-400' },
  'graduation-cap': { component: GraduationCap, colorClass: 'text-violet-400' },
  'scan-text': { component: ScanText, colorClass: 'text-sky-400' },
  eye: { component: Eye, colorClass: 'text-sky-400' },
  'hard-drive': { component: HardDrive, colorClass: 'text-blue-400' },
  mic: { component: Mic, colorClass: 'text-rose-400' },
  'file-text': { component: FileText, colorClass: 'text-orange-400' },
  'circuit-board': { component: CircuitBoard, colorClass: 'text-teal-400' },
  wrench: { component: Wrench, colorClass: 'text-lime-400' },
  shield: { component: Shield, colorClass: 'text-red-400' },
  globe: { component: Globe, colorClass: 'text-cyan-400' },
  code: { component: Code2, colorClass: 'text-blue-400' },
  smartphone: { component: Smartphone, colorClass: 'text-purple-400' },
  cloud: { component: Cloud, colorClass: 'text-sky-400' },
  brain: { component: Brain, colorClass: 'text-pink-400' },
  terminal: { component: Terminal, colorClass: 'text-emerald-400' },
  zap: { component: Zap, colorClass: 'text-yellow-400' },
  box: { component: Box, colorClass: 'text-indigo-400' },
  layers: { component: Layers, colorClass: 'text-indigo-400' },
  compass: { component: Compass, colorClass: 'text-teal-400' },
  flame: { component: Flame, colorClass: 'text-orange-500' },
  radio: { component: Radio, colorClass: 'text-purple-400' },
  sliders: { component: Sliders, colorClass: 'text-yellow-400' },
  folder: { component: Folder, colorClass: 'text-slate-400' },
};

// Fallback palette untuk kategori baru yang tidak cocok keyword apapun
const DYNAMIC_FALLBACK_ICONS = [
  'trending-up',
  'graduation-cap',
  'scan-text',
  'hard-drive',
  'mic',
  'file-text',
  'circuit-board',
  'wrench',
  'shield',
  'globe',
  'code',
  'smartphone',
  'cloud',
  'brain',
  'zap',
  'compass',
  'flame',
  'layers',
];

/**
 * Mendeteksi icon terbaik secara cerdas berdasarkan nama kategori dan topik.
 * Jika kategori tidak ada keyword kecocokan, gunakan hash string nama kategori
 * agar setiap nama kategori selalu mendapat icon deterministik yang berbeda-beda.
 */
export function resolveCategoryIcon(categoryName?: string | null, explicitIcon?: string | null): string {
  if (explicitIcon && explicitIcon !== 'folder' && explicitIcon in ICON_COMPONENTS) {
    return explicitIcon;
  }

  if (!categoryName) return 'box';
  const name = categoryName.toLowerCase().trim();

  // 1. Trading & Finance
  if (
    name.includes('trading') ||
    name.includes('finance') ||
    name.includes('financial') ||
    name.includes('market') ||
    name.includes('crypto') ||
    name.includes('stock') ||
    name.includes('quant') ||
    name.includes('invest')
  ) {
    return 'trending-up';
  }

  // 2. Education & Learning
  if (
    name.includes('learn') ||
    name.includes('education') ||
    name.includes('course') ||
    name.includes('tutorial') ||
    name.includes('study') ||
    name.includes('academic') ||
    name.includes('pembelajaran') ||
    name.includes('edukasi') ||
    name.includes('book') ||
    name.includes('roadmap')
  ) {
    return 'graduation-cap';
  }

  // 3. OCR & Computer Vision
  if (
    name.includes('ocr') ||
    name.includes('detect') ||
    name.includes('vision') ||
    name.includes('scan') ||
    name.includes('document') ||
    name.includes('recognition') ||
    name.includes('ekstraksi')
  ) {
    return 'scan-text';
  }

  // 4. Database & Storage
  if (
    name.includes('database') ||
    name.includes('data management') ||
    name.includes('basis data') ||
    name.includes('storage') ||
    name.includes('warehouse') ||
    name.includes('sql') ||
    name.includes('lake')
  ) {
    return 'hard-drive';
  }

  // 5. Speech, Audio & Voice
  if (
    name.includes('speech') ||
    name.includes('audio') ||
    name.includes('voice') ||
    name.includes('sound') ||
    name.includes('suara') ||
    name.includes('tts') ||
    name.includes('stt') ||
    name.includes('whisper') ||
    name.includes('music')
  ) {
    return 'mic';
  }

  // 6. Productivity & Notes
  if (
    name.includes('productivity') ||
    name.includes('note') ||
    name.includes('catatan') ||
    name.includes('memo') ||
    name.includes('task') ||
    name.includes('todo') ||
    name.includes('produktivitas') ||
    name.includes('workflow')
  ) {
    return 'file-text';
  }

  // 7. IoT & Embedded Systems
  if (
    name.includes('iot') ||
    name.includes('embedded') ||
    name.includes('hardware') ||
    name.includes('sensor') ||
    name.includes('arduino') ||
    name.includes('raspberry') ||
    name.includes('robot') ||
    name.includes('firmware')
  ) {
    return 'circuit-board';
  }

  // 8. Skills, Tools & Prompts (AI Agent Skills & Tools)
  if (
    name.includes('skill') ||
    name.includes('prompt')
  ) {
    return 'sparkles';
  }

  // 9. Utilities & System Maintenance
  if (
    name.includes('utilit') ||
    name.includes('maintenance') ||
    name.includes('system') ||
    name.includes('infra') ||
    name.includes('devops') ||
    name.includes('cli') ||
    name.includes('pemeliharaan') ||
    (name.includes('tool') && !name.includes('skill'))
  ) {
    return 'wrench';
  }

  // 9. LLM & Inference Engines
  if (
    name.includes('large language model') ||
    name.includes('llm') ||
    name.includes('model bahasa') ||
    name.includes('inference') ||
    name.includes('quantization')
  ) {
    return 'cpu';
  }

  // 10. RAG & Vector Search
  if (
    name.includes('rag') ||
    name.includes('vector') ||
    name.includes('vektor') ||
    name.includes('retrieval') ||
    name.includes('embedding')
  ) {
    return 'database';
  }

  // 11. Video & Multimodal
  if (
    name.includes('video') ||
    name.includes('multimodal') ||
    name.includes('animasi') ||
    name.includes('motion') ||
    name.includes('render')
  ) {
    return 'video';
  }

  // 12. AI Agent Frameworks
  if (
    name.includes('framework') ||
    name.includes('agent') ||
    name.includes('agen') ||
    name.includes('orchestrator')
  ) {
    return 'bot';
  }


  // 14. Security & Privacy
  if (
    name.includes('security') ||
    name.includes('keamanan') ||
    name.includes('privacy') ||
    name.includes('auth') ||
    name.includes('shield')
  ) {
    return 'shield';
  }

  // 15. Web & Browser
  if (
    name.includes('browser') ||
    name.includes('web') ||
    name.includes('scraper') ||
    name.includes('crawler')
  ) {
    return 'globe';
  }

  // 16. Code & Programming
  if (
    name.includes('code') ||
    name.includes('coding') ||
    name.includes('pemrograman') ||
    name.includes('script')
  ) {
    return 'code';
  }

  // 17. Mobile
  if (
    name.includes('mobile') ||
    name.includes('android') ||
    name.includes('ios')
  ) {
    return 'smartphone';
  }

  // 18. Cloud
  if (
    name.includes('cloud') ||
    name.includes('serverless') ||
    name.includes('docker') ||
    name.includes('k8s')
  ) {
    return 'cloud';
  }

  // 19. Cognitive / Brain
  if (
    name.includes('brain') ||
    name.includes('neural') ||
    name.includes('cognit') ||
    name.includes('mind')
  ) {
    return 'brain';
  }

  // Fallback deterministik berbasis hash nama kategori agar tidak ada 2 kategori yang sama
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % DYNAMIC_FALLBACK_ICONS.length;
  return DYNAMIC_FALLBACK_ICONS[idx];
}

interface CategoryIconProps {
  icon?: string | null;
  name?: string | null;
  size?: CategoryIconSize;
  className?: string;
}

export function CategoryIcon({
  icon,
  name,
  size = 'sm',
  className = '',
}: CategoryIconProps) {
  const resolvedKey = resolveCategoryIcon(name, icon);
  const iconConfig = ICON_COMPONENTS[resolvedKey] || ICON_COMPONENTS['box'];
  const IconComponent = iconConfig.component;

  const sizeClass = size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4';

  return (
    <IconComponent
      className={`${sizeClass} ${iconConfig.colorClass} shrink-0 ${className}`.trim()}
    />
  );
}
