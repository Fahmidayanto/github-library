'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { 
  Bot, 
  Send, 
  X, 
  RotateCcw, 
  Copy, 
  Check, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { chatWithLibraryAdvisor } from '@/app/actions';
import { useLanguage } from '@/lib/i18n';

interface RepoRecommendation {
  id: string;
  name: string;
  fullName: string;
  categoryName: string;
  subCategoryName: string;
  starsCount: number;
  githubUrl: string;
  description: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  detectedRepos?: RepoRecommendation[];
}

interface ChatbotWidgetProps {
  onOpenRepoDetail?: (fullName: string) => void;
}

export function ChatbotWidget({ onOpenRepoDetail }: ChatbotWidgetProps) {
  const { t, language, translateCategory, translateSubCategory } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: t.chatbot.welcomeMsg,
    },
  ]);

  // Sync welcome message on language toggle if user hasn't chatted yet
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [{ id: 'welcome', role: 'assistant', content: t.chatbot.welcomeMsg }];
      }
      return prev;
    });
  }, [language, t.chatbot.welcomeMsg]);

  const robotContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll ke pesan terbaru
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Focus input saat panel dibuka
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Three.js 3D Obsidian Robot Logo Avatar
  useEffect(() => {
    const container = robotContainerRef.current;
    if (!container) return;

    let animId: number;
    const size = 40;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 4.3);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Pencahayaan terarah + Rim Light
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(2, 3, 4);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    rimLight.position.set(-3, 2, -3);
    scene.add(rimLight);

    // Group Robot
    const robotGroup = new THREE.Group();
    scene.add(robotGroup);

    // Kepala Robot (Obsidian Matte Titanium Black)
    const headGeom = new THREE.BoxGeometry(1.3, 1.15, 1.15);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.65,
      roughness: 0.25,
    });
    const headMesh = new THREE.Mesh(headGeom, headMat);
    robotGroup.add(headMesh);

    // Visor Mata Menyala (Electric Cyan Strip)
    const visorGeom = new THREE.BoxGeometry(1.0, 0.22, 0.1);
    const visorMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const eyeVisor = new THREE.Mesh(visorGeom, visorMat);
    eyeVisor.position.set(0, 0.08, 0.58);
    robotGroup.add(eyeVisor);

    // Antena & Ujung Sensor
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.2 });
    const antGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.35, 8);
    const antMesh = new THREE.Mesh(antGeom, metalMat);
    antMesh.position.set(0, 0.72, 0);
    robotGroup.add(antMesh);

    const tipGeom = new THREE.SphereGeometry(0.12, 12, 12);
    const tipMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const tipMesh = new THREE.Mesh(tipGeom, tipMat);
    tipMesh.position.set(0, 0.92, 0);
    robotGroup.add(tipMesh);

    // Ear Pods
    const earGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.12, 12);
    earGeom.rotateZ(Math.PI / 2);
    const leftEar = new THREE.Mesh(earGeom, metalMat);
    leftEar.position.set(-0.7, 0, 0);
    const rightEar = leftEar.clone();
    rightEar.position.set(0.7, 0, 0);
    robotGroup.add(leftEar);
    robotGroup.add(rightEar);

    // Interaktivitas kursor mouse
    let isHovered = false;
    let targetRotX = 0;
    let targetRotY = 0;

    const onMouseEnter = () => { isHovered = true; };
    const onMouseLeave = () => {
      isHovered = false;
      targetRotX = 0;
      targetRotY = 0;
    };
    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotY = x * 1.5;
      targetRotX = -y * 1.2;
    };

    container.addEventListener('mouseenter', onMouseEnter);
    container.addEventListener('mouseleave', onMouseLeave);
    container.addEventListener('mousemove', onMouseMove);

    const clock = new THREE.Clock();
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Gerak mengambang halus
      robotGroup.position.y = Math.sin(elapsed * 2) * 0.06;

      if (isHovered) {
        robotGroup.rotation.y += (targetRotY - robotGroup.rotation.y) * 0.1;
        robotGroup.rotation.x += (targetRotX - robotGroup.rotation.x) * 0.1;
      } else {
        robotGroup.rotation.y = Math.sin(elapsed * 1.2) * 0.25;
        robotGroup.rotation.x = Math.sin(elapsed * 0.8) * 0.08;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mouseenter', onMouseEnter);
      container.removeEventListener('mouseleave', onMouseLeave);
      container.removeEventListener('mousemove', onMouseMove);
      renderer.dispose();
      headGeom.dispose();
      headMat.dispose();
      visorGeom.dispose();
      visorMat.dispose();
      antGeom.dispose();
      metalMat.dispose();
      tipGeom.dispose();
      tipMat.dispose();
      earGeom.dispose();
    };
  }, [isOpen]);

  // Helper pembersih format markdown (** dan ##/###) agar bubble chat bersih rapi
  const cleanAssistantText = (raw: string): string => {
    if (!raw) return '';
    return raw
      .replace(/^#{1,6}\s+/gm, '') // Hapus tanda #, ##, ### di awal baris
      .replace(/\*\*(.*?)\*\*/g, '$1') // Hapus ** di sekitar teks
      .replace(/\*\*/g, '') // Hapus sisa tanda **
      .trim();
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setIsLoading(true);

    try {
      const formattedForApi = nextHistory.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await chatWithLibraryAdvisor(formattedForApi);

      if (res && res.success && res.message) {
        const assistantMsg: ChatMessage = {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          content: cleanAssistantText(res.message),
          detectedRepos: res.detectedRepos || [],
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: cleanAssistantText(res?.error || 'Maaf, terjadi kendala saat memproses rekomendasi. Silakan ulangi pertanyaan Anda.'),
          },
        ]);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Koneksi ke backend asisten terputus. Pastikan service backend aktif di port 4000.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyClone = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const quickPrompts = t.chatbot.quickPrompts;

  return (
    <>
      {/* FLOATING LAUNCHER PILL (POJOK KANAN BAWAH) - OPAQUE & SYNC DENGAN GLOBAL PALETTE */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#090d16]/95 backdrop-blur-xl text-slate-100 border border-white/20 shadow-2xl shadow-black/80 hover:border-white/40 hover:bg-[#0f172a] transition-all cursor-pointer pressable-btn active:scale-95"
            aria-label={t.chatbot.launcherLabel}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
            </span>
            <Bot className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-100 pr-1 tracking-tight">{t.chatbot.launcherLabel}</span>
          </button>
        </div>
      )}

      {/* FLOATING ASSISTANT PANEL - OPAQUE HIGH-DENSITY BACKDROP (NO CARD BLEED-THROUGH) */}
      {isOpen && (
        <div 
          className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-32px)] h-[620px] max-h-[calc(100vh-48px)] rounded-2xl flex flex-col overflow-hidden bg-[#090d16]/98 backdrop-blur-2xl border border-white/20 shadow-2xl shadow-black/90 text-slate-100 animate-in fade-in zoom-in-95 duration-200"
          style={{ transformOrigin: 'bottom right' }}
        >
          {/* HEADER: 3D ROBOT LOGO & MINIMAL CONTROLS */}
          <div className="px-4 py-3 border-b border-white/10 bg-[#0d1424]/90 flex items-center justify-between select-none shrink-0">
            <div className="flex items-center space-x-3">
              {/* Three.js Robot Container (Kontras Bersih & Solid) */}
              <div 
                ref={robotContainerRef} 
                className="w-10 h-10 rounded-xl bg-[#090d16] border border-white/20 shadow-inner flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing" 
                title="3D Robot Logo"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xs font-bold text-slate-100 tracking-tight">{t.chatbot.title}</h2>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" title={t.chatbot.connectedBadge}></span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setMessages([{ id: 'welcome', role: 'assistant', content: t.chatbot.welcomeMsg }])}
                title={t.chatbot.clearChat}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title={t.chatbot.close}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* MESSAGES BODY */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-xs premium-scrollbar bg-[#090d16]/70 select-text">
            {/* Quick Prompts Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1 select-none">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-white/15 text-xs font-medium text-slate-200 hover:text-white transition-colors cursor-pointer active:scale-95 shadow-sm"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Message Thread */}
            {messages.map(msg => (
              <div key={msg.id} className={msg.role === 'user' ? 'flex justify-end' : 'space-y-3'}>
                {msg.role === 'user' ? (
                  <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-tr-sm bg-indigo-600 border border-indigo-400/30 text-white text-xs leading-relaxed shadow-md shadow-indigo-950/40 font-normal select-text cursor-text">
                    {msg.content}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap bg-slate-900/90 p-3.5 rounded-xl border border-white/10 shadow-sm font-normal select-text cursor-text">
                      {msg.content}
                    </div>

                    {/* Detected Interactive Repo Cards */}
                    {msg.detectedRepos && msg.detectedRepos.length > 0 && (
                      <div className="space-y-2 pt-1">
                        {msg.detectedRepos.map(repo => {
                          const cloneCmd = `git clone https://github.com/${repo.fullName}.git`;
                          return (
                            <div key={repo.id || repo.fullName} className="bg-slate-900/95 p-3.5 rounded-xl space-y-2.5 border border-white/15 hover:border-cyan-500/40 transition-all shadow-md select-text">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-100 cursor-text select-text">{repo.fullName}</span>
                                    <span className="text-[10px] font-mono text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded">
                                      {repo.starsCount?.toLocaleString() || 0} stars
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-cyan-400 font-mono mt-0.5">
                                    {translateCategory(repo.categoryName)} / {translateSubCategory(repo.subCategoryName) || (language === 'en' ? 'General' : 'Umum')}
                                  </div>
                                </div>
                                {onOpenRepoDetail && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenRepoDetail(repo.fullName)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-slate-200 border border-white/15 flex items-center gap-1 cursor-pointer transition-colors active:scale-95 shadow-sm select-none"
                                  >
                                    <span>{t.chatbot.detailBtn}</span>
                                    <ExternalLink className="w-3 h-3 text-slate-300" />
                                  </button>
                                )}
                              </div>

                              {repo.description && (
                                <p className="text-xs text-slate-300 leading-relaxed cursor-text select-text">
                                  {repo.description}
                                </p>
                              )}

                              <div className="bg-black/80 border border-white/15 px-3 py-1.5 rounded-lg text-[11px] text-cyan-300 flex items-center justify-between font-mono select-text cursor-text">
                                <span className="truncate pr-2 select-text">{cloneCmd}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyClone(cloneCmd)}
                                  className="text-slate-400 hover:text-slate-100 p-0.5 cursor-pointer shrink-0 transition-colors"
                                  title={t.chatbot.copyCommand}
                                >
                                  {copiedCmd === cloneCmd ? (
                                    <Check className="w-3.5 h-3.5 text-cyan-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Loading Typing Indicator */}
            {isLoading && (
              <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 w-20 flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse [animation-delay:150ms]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse [animation-delay:300ms]"></span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* CHAT INPUT FORM */}
          <div className="p-3 border-t border-white/10 bg-[#0d1424]/90">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 bg-slate-900/90 border border-white/20 rounded-xl px-3 py-2 focus-within:border-cyan-400/70 focus-within:ring-1 focus-within:ring-cyan-400/30 transition-all"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.chatbot.inputPlaceholder}
                disabled={isLoading}
                className="flex-1 bg-transparent text-xs text-slate-100 placeholder:text-slate-400 focus:outline-none disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer disabled:cursor-not-allowed active:scale-95 border border-indigo-400/30 shadow-md shadow-indigo-600/30"
                title={language === 'id' ? 'Kirim Pesan' : 'Send Message'}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            <div className="text-[10px] text-slate-400 text-right mt-1.5 pr-1">
              {language === 'id' ? 'Tekan' : 'Press'} <kbd className="font-mono bg-white/10 px-1 py-0.5 rounded border border-white/15 text-slate-300">Enter</kbd> {language === 'id' ? 'untuk kirim' : 'to send'}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

