'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import { 
  Sparkles, 
  Filter, 
  RotateCcw, 
  Play, 
  Pause, 
  Folder, 
  Star, 
  X, 
  GitBranch, 
  Layers,
  Database,
  Cpu,
  Video,
  ChevronDown,
  Columns2,
  PanelLeftOpen,
  Compass,
  Sliders,
  Eye
} from 'lucide-react';
import { cn, formatCompactNumber } from '@/lib/utils';
import { Category } from './Sidebar';
import { RepoCardData } from './RepoCard';

interface GalaxyGraphViewProps {
  categories?: Category[];
  repositories?: RepoCardData[];
  onSelectRepo?: (fullName: string) => void;
}

interface GalaxyNode {
  id: string;
  name: string;
  type: 'category' | 'subCategory' | 'repository' | 'language' | 'topic';
  desc: string;
  color: string;
  baseSize: number;
  collisionRadius: number;
  x: number;
  y: number;
  z: number;
  angle?: number;
  branchAngle?: number;
  subAngle?: number;
  targetPosition: THREE.Vector3;
  connections: string[];
  catId?: string;
  subCatId?: string;
  langId?: string;
  stars?: number;
  topics?: string[];
  repoFullName?: string;
  group?: THREE.Group;
  mesh?: THREE.Group;
  coreMesh?: THREE.Mesh;
  innerCorona?: THREE.Sprite;
  outerCorona?: THREE.Sprite;
  baseInnerCoronaScale?: number;
  baseOuterCoronaScale?: number;
  ringGroup?: THREE.Group;
  moonletGroup?: THREE.Group;
  tailMesh?: THREE.Mesh;
  baseTailLen?: number;
  tailPhase?: number;
  baseScale?: number;
  rotSpeedX?: number;
  rotSpeedY?: number;
  coronaPhase?: number;
}

interface GalaxyEdge {
  source: string;
  target: string;
  color: number;
}

export function GalaxyGraphView({
  categories: propCategories = [],
  repositories: propRepositories = [],
  onSelectRepo
}: GalaxyGraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipBadgeRef = useRef<HTMLSpanElement>(null);
  const tooltipTitleRef = useRef<HTMLSpanElement>(null);
  const tooltipDescRef = useRef<HTMLParagraphElement>(null);
  const tooltipMetaRef = useRef<HTMLDivElement>(null);

  // Sliders & Controls state matching prototype (Defaulting to dense, rich cosmic luminescence)
  const [starScaleMultiplier, setStarScaleMultiplier] = useState(1.05);
  const [linkGlowOpacity, setLinkGlowOpacity] = useState(0.55);
  const [nodeNeonShadowOpacity, setNodeNeonShadowOpacity] = useState(0.85);
  const [showLabels, setShowLabels] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);

  // Active filters
  const [activeTypes, setActiveTypes] = useState<Record<string, boolean>>({
    category: true,
    subCategory: true,
    repository: true,
    language: true,
    topic: true
  });

  // Collapsible Filters Panel (Persis seperti sidebar existing)
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false);

  // Resizable Filter Sidebar width (default: 320px, min: 240px, max: 560px)
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const isResizingRef = useRef(false);

  // Camera Controls Dropdown Menu
  const [isControlsMenuOpen, setIsControlsMenuOpen] = useState(false);

  // Accordion States for Galaxy Clusters & Sub-groups
  const [expandedClusters, setExpandedClusters] = useState<Record<string, boolean>>({});
  const [expandedSubGroups, setExpandedSubGroups] = useState<Record<string, boolean>>({});

  // Display Settings Dropdown state
  const [isDisplaySettingsOpen, setIsDisplaySettingsOpen] = useState(false);

  // Highlighting state
  const [highlightedNode, setHighlightedNode] = useState<GalaxyNode | null>(null);
  const [connectedCount, setConnectedCount] = useState(0);
  const [activeLinkCount, setActiveLinkCount] = useState(0);

  // Detail Modal on double click
  const [modalNode, setModalNode] = useState<GalaxyNode | null>(null);

  // Graph Stats
  const [stats, setStats] = useState({ nodes: 32, edges: 33, clusters: 4 });

  // Internal Three.js state reference
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    nodesMeshGroup: THREE.Group;
    edgesMeshGroup: THREE.Group;
    highlightedEdgesGroup: THREE.Group;
    labelsGroup: THREE.Group;
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
    nodeObjects: GalaxyNode[];
    edgeObjects: GalaxyEdge[];
    hoveredNode: GalaxyNode | null;
    selectedHighlightNode: GalaxyNode | null;
    animFrameId: number;
    clock: THREE.Clock;
    celestialTextureCache: Record<string, THREE.CanvasTexture>;
  } | null>(null);

  // Re-run setup whenever dataMode changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Dispose previous renderer if exists
    if (threeRef.current) {
      cancelAnimationFrame(threeRef.current.animFrameId);
      threeRef.current.renderer.dispose();
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    }

    // 1. Scene with subtle exponential fog (low density so node colors pop vividly and densely without grey wash)
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05070b, 0.00035);

    // 2. Camera: expansive view angle 60, position set to spacious galactic overview (0, 1150, 3200)
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 18000);
    camera.position.set(0, 1150, 3200);

    // 3. Renderer with vibrant tone mapping
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 16000;
    controls.minDistance = 60;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.65;

    // 5. Studio / Celestial Lighting (High vibrancy, saturated highlights, deep rim bounce)
    const ambient = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
    keyLight.position.set(200, 350, 250);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.65);
    rimLight.position.set(-250, -150, -200);
    scene.add(rimLight);

    const coreLight = new THREE.PointLight(0xa855f7, 1.25, 1600);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);

    // 6. Starfield Particle Dust in Background (1200 points)
    const count = 1200;
    const starGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 1600;
      pos[i + 1] = (Math.random() - 0.5) * 1000;
      pos[i + 2] = (Math.random() - 0.5) * 1600;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const starMat = new THREE.PointsMaterial({
      size: 2,
      color: 0x475569,
      transparent: true,
      opacity: 0.6
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // 7. Groups
    const nodesMeshGroup = new THREE.Group();
    const edgesMeshGroup = new THREE.Group();
    const highlightedEdgesGroup = new THREE.Group();
    const labelsGroup = new THREE.Group();
    scene.add(edgesMeshGroup);
    scene.add(highlightedEdgesGroup);
    scene.add(nodesMeshGroup);
    scene.add(labelsGroup);

    // 8. Raycaster & Mouse
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 10 };
    const mouse = new THREE.Vector2();

    const threeState = {
      scene,
      camera,
      renderer,
      controls,
      nodesMeshGroup,
      edgesMeshGroup,
      highlightedEdgesGroup,
      labelsGroup,
      raycaster,
      mouse,
      nodeObjects: [] as GalaxyNode[],
      edgeObjects: [] as GalaxyEdge[],
      hoveredNode: null as GalaxyNode | null,
      selectedHighlightNode: null as GalaxyNode | null,
      animFrameId: 0,
      clock: new THREE.Clock(),
      celestialTextureCache: {} as Record<string, THREE.CanvasTexture>
    };

    threeRef.current = threeState;
    if (typeof window !== 'undefined') {
      (window as unknown as { __threeGalaxy: typeof threeState }).__threeGalaxy = threeState;
    }

    // 9. Build Data & Graph
    buildGalaxyData(threeState);

    // 10. Render 3D Celestial Meshes & Edges
    renderGalaxyMeshes(threeState);

    // 11. Mouse Movement & Raycasting Handler
    const handleMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const visibleGroups = nodesMeshGroup.children.filter(grp => grp.visible);
      const intersects = raycaster.intersectObjects(visibleGroups, true);

      let hit: GalaxyNode | null = null;
      for (let i = 0; i < intersects.length; i++) {
        let obj: THREE.Object3D | null = intersects[i].object;
        if ((obj as THREE.Sprite).isSprite) continue;
        while (obj && (!obj.userData || !obj.userData.id)) {
          obj = obj.parent;
        }
        if (obj && obj.userData && obj.userData.id) {
          hit = obj.userData as GalaxyNode;
          break;
        }
      }

      const tooltip = tooltipRef.current;
      const badge = tooltipBadgeRef.current;
      const titleEl = tooltipTitleRef.current;
      const descEl = tooltipDescRef.current;
      const metaEl = tooltipMetaRef.current;

      if (hit) {
        if (threeState.hoveredNode !== hit) {
          // Reset previous hovered node
          if (threeState.hoveredNode && threeState.hoveredNode.group) {
            const baseS = (threeState.selectedHighlightNode && threeState.selectedHighlightNode.id === threeState.hoveredNode.id)
              ? starScaleMultiplier * 1.35
              : starScaleMultiplier;
            gsap.to(threeState.hoveredNode.group.scale, {
              x: baseS,
              y: baseS,
              z: baseS,
              duration: 0.35,
              ease: "power2.out",
              overwrite: "auto"
            });
          }

          threeState.hoveredNode = hit;

          // Spring tactile scale with GSAP
          if (hit.group) {
            const targetS = starScaleMultiplier * 1.35;
            gsap.to(hit.group.scale, {
              x: targetS,
              y: targetS,
              z: targetS,
              duration: 0.42,
              ease: "back.out(2.2)",
              overwrite: "auto"
            });
          }

          if (titleEl) titleEl.innerText = hit.name;
          if (descEl) descEl.innerText = hit.desc || '';

          const entityLabels: Record<string, string> = {
            category: 'GROUP',
            subCategory: 'SUB-GROUP',
            repository: 'REPOSITORY',
            language: 'LANGUAGE',
            topic: 'TOPIC'
          };

          if (badge) {
            badge.innerText = entityLabels[hit.type] || hit.type;
            badge.style.backgroundColor = (hit.color || '#a855f7') + '25';
            badge.style.color = hit.color || '#a855f7';
          }

          if (metaEl) {
            if (hit.type === 'category') {
              const subCount = threeState.nodeObjects.filter(n => n.type === 'subCategory' && n.catId === hit?.id).length;
              const reposInCat = threeState.nodeObjects.filter(n => {
                if (n.type !== 'repository') return false;
                const parentSub = threeState.nodeObjects.find(s => s.id === n.subCatId);
                return parentSub && parentSub.catId === hit?.id;
              });
              const starsInCat = reposInCat.reduce((sum, r) => sum + (r.stars || 0), 0);
              metaEl.innerHTML = `<span>${subCount} Sub-Grup</span><span>${reposInCat.length} Repositori</span><span>★ ${(starsInCat / 1000).toFixed(1)}k Stars</span>`;
            } else if (hit.type === 'subCategory') {
              const parentCat = threeState.nodeObjects.find(c => c.id === hit?.catId);
              const reposInSub = threeState.nodeObjects.filter(n => n.type === 'repository' && n.subCatId === hit?.id);
              const starsInSub = reposInSub.reduce((sum, r) => sum + (r.stars || 0), 0);
              metaEl.innerHTML = `<span>Grup: ${parentCat?.name || ''}</span><span>${reposInSub.length} Repo</span><span>★ ${(starsInSub / 1000).toFixed(1)}k Stars</span>`;
            } else if (hit.type === 'repository') {
              const langObj = threeState.nodeObjects.find(l => l.id === hit?.langId);
              const topNames = (hit.topics || []).map(tId => {
                const t = threeState.nodeObjects.find(top => top.id === tId || top.id === 'top-' + tId);
                return t ? t.name : tId;
              });
              metaEl.innerHTML = `<span>★ ${((hit.stars || 0) / 1000).toFixed(1)}k Stars</span><span>${langObj?.name || 'Code'}</span>${topNames.length ? `<span>#${topNames[0]}</span>` : ''}`;
            } else if (hit.type === 'language') {
              const repoCount = threeState.nodeObjects.filter(r => r.type === 'repository' && r.langId === hit?.id).length;
              metaEl.innerHTML = `<span>${repoCount} Repositori</span><span>Bahasa Pemrograman</span>`;
            } else if (hit.type === 'topic') {
              const rawId = hit.id.replace('#', '').replace('top-', '');
              const repoCount = threeState.nodeObjects.filter(r => r.type === 'repository' && (r.topics || []).some(t => t.includes(rawId))).length;
              metaEl.innerHTML = `<span>${repoCount} Repositori</span><span>Tag Topik</span>`;
            }
          }

          if (tooltip) {
            tooltip.classList.remove('hidden');
            gsap.fromTo(
              tooltip,
              { opacity: 0, scale: 0.94, y: 6 },
              { opacity: 1, scale: 1, y: 0, duration: 0.2, ease: "power3.out", overwrite: "auto" }
            );
          }
        }

        if (tooltip) {
          let posX = event.clientX - rect.left + 16;
          let posY = event.clientY - rect.top + 16;
          if (posX + 260 > rect.width) posX = Math.max(10, event.clientX - rect.left - 260);
          if (posY + 140 > rect.height) posY = Math.max(10, event.clientY - rect.top - 140);
          tooltip.style.left = `${posX}px`;
          tooltip.style.top = `${posY}px`;
        }
        document.body.style.cursor = 'pointer';
      } else {
        if (threeState.hoveredNode) {
          if (threeState.hoveredNode.group) {
            const baseS = (threeState.selectedHighlightNode && threeState.selectedHighlightNode.id === threeState.hoveredNode.id)
              ? starScaleMultiplier * 1.35
              : starScaleMultiplier;
            gsap.to(threeState.hoveredNode.group.scale, {
              x: baseS,
              y: baseS,
              z: baseS,
              duration: 0.35,
              ease: "power2.out",
              overwrite: "auto"
            });
          }
          threeState.hoveredNode = null;
          if (tooltip) {
            gsap.to(tooltip, {
              opacity: 0,
              scale: 0.96,
              duration: 0.15,
              ease: "power2.in",
              onComplete: () => tooltip.classList.add('hidden')
            });
          }
        }
        document.body.style.cursor = 'default';
      }
    };

    let pointerDownPos = { x: 0, y: 0 };
    const handleMouseDown = (event: MouseEvent) => {
      pointerDownPos = { x: event.clientX, y: event.clientY };
    };

    const handleClick = (event: MouseEvent) => {
      const distMoved = Math.hypot(event.clientX - pointerDownPos.x, event.clientY - pointerDownPos.y);
      if (distMoved > 6) {
        // Drag terdeteksi: kamera sedang digeser/diputar manual oleh user, jangan picu click
        return;
      }

      if (threeState.hoveredNode) {
        if (threeState.selectedHighlightNode && threeState.selectedHighlightNode.id === threeState.hoveredNode.id) {
          clearHighlight(threeState);
        } else {
          applyHighlight(threeState, threeState.hoveredNode);
          if (threeState.hoveredNode.type !== 'category') {
            flyToNode(threeState, threeState.hoveredNode);
          }
        }
      } else {
        clearHighlight(threeState);
      }
    };

    const handleDblClick = () => {
      if (threeState.hoveredNode) {
        if (threeState.hoveredNode.type === 'repository' && onSelectRepo && threeState.hoveredNode.repoFullName) {
          onSelectRepo(threeState.hoveredNode.repoFullName);
        } else {
          setModalNode(threeState.hoveredNode);
        }
      }
    };

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('click', handleClick);
    container.addEventListener('dblclick', handleDblClick);
    window.addEventListener('resize', handleResize);

    // 12. Animation Loop matching prototype (Planetary & Corona Pulses)
    const animate = () => {
      threeState.animFrameId = requestAnimationFrame(animate);

      controls.update();

      const time = threeState.clock.getElapsedTime();

      // Dynamic Rotation & Corona Radiance
      threeState.nodeObjects.forEach(n => {
        if (n.group && n.group.visible) {
          if (n.coreMesh) {
            if (n.type === 'topic' || n.type === 'language') {
              n.coreMesh.rotation.y += (n.rotSpeedY || 0.01) * 1.6;
              n.coreMesh.rotation.x += (n.rotSpeedX || 0.008) * 1.6;
              n.coreMesh.rotation.z += 0.009;
            } else {
              n.coreMesh.rotation.y += n.rotSpeedY || 0.008;
              n.coreMesh.rotation.x += n.rotSpeedX || 0.004;
            }
          }

          // Matahari: Korona surya berdenyut terik dinamis
          if (n.type === 'category') {
            if (n.innerCorona && n.baseInnerCoronaScale && nodeNeonShadowOpacity > 0.05) {
              const pulseInner = 1 + Math.sin(time * 2.4 + (n.coronaPhase || 0)) * 0.08;
              const curScale = n.baseInnerCoronaScale * pulseInner;
              n.innerCorona.scale.set(curScale, curScale, 1);
            }
            if (n.outerCorona && n.baseOuterCoronaScale && nodeNeonShadowOpacity > 0.05) {
              const pulseOuter = 1 + Math.sin(time * 1.4 + (n.coronaPhase || 0) + 1) * 0.1;
              const curScale = n.baseOuterCoronaScale * pulseOuter;
              n.outerCorona.scale.set(curScale, curScale, 1);
            }
          } else {
            // Planet, Bulan, Meteor: Denyut halus atmosfer
            if (n.innerCorona && n.baseInnerCoronaScale && nodeNeonShadowOpacity > 0.05) {
              const pulse = 1 + Math.sin(time * 1.2 + (n.coronaPhase || 0)) * 0.04;
              const curScale = n.baseInnerCoronaScale * pulse;
              n.innerCorona.scale.set(curScale, curScale, 1);
            }
          }

          // Rotasi Cincin Saturnus pada Gas Giant (SubCategory)
          if (n.ringGroup) {
            n.ringGroup.rotation.z += 0.008;
          }

          // Rotasi Satelit Trojan Pengiring Jupiter
          if (n.moonletGroup) {
            n.moonletGroup.rotation.y += 0.022;
          }

          // Efek Pijar Getar Ekor Meteor & Komet Menghujam
          if (n.tailMesh && n.baseTailLen) {
            const flicker = 1 + Math.sin(time * 9 + (n.tailPhase || 0)) * 0.12;
            n.tailMesh.scale.y = flicker;
          }
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(threeState.animFrameId);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('click', handleClick);
      container.removeEventListener('dblclick', handleDblClick);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (typeof window !== 'undefined') {
        delete (window as unknown as { __threeGalaxy?: unknown }).__threeGalaxy;
      }
    };
  }, [propCategories, propRepositories]);

  // Update controls auto-rotate dynamically
  useEffect(() => {
    if (threeRef.current) {
      threeRef.current.controls.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Close camera controls dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('.camera-controls-dropdown')) return;
      setIsControlsMenuOpen(false);
    };
    if (isControlsMenuOpen) {
      document.addEventListener('click', handleOutsideClick);
    }
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isControlsMenuOpen]);

  // Keyboard shortcut (Ctrl+B / Cmd+B) to toggle Filters collapse matching Sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsFiltersCollapsed(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle dragging the right edge of galaxy filters sidebar
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    isResizingRef.current = true;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = moveEvent.clientX - containerRect.left;
      const clampedWidth = Math.max(240, Math.min(560, Math.round(newWidth)));
      setSidebarWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      isResizingRef.current = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };
  function applyHighlight(threeState: NonNullable<typeof threeRef.current>, node: GalaxyNode) {
    threeState.selectedHighlightNode = node;
    setHighlightedNode(node);

    const connectedNodeIds = new Set<string>([node.id]);
    const activeEdges: GalaxyEdge[] = [];

    // Edges langsung
    threeState.edgeObjects.forEach(edge => {
      if (edge.source === node.id || edge.target === node.id) {
        const src = threeState.nodeObjects.find(n => n.id === edge.source);
        const tgt = threeState.nodeObjects.find(n => n.id === edge.target);
        if (src?.group && !src.group.visible) return;
        if (tgt?.group && !tgt.group.visible) return;
        activeEdges.push(edge);
        connectedNodeIds.add(edge.source);
        connectedNodeIds.add(edge.target);
      }
    });

    if (node.type === 'category') {
      const subIds = threeState.nodeObjects.filter(s => s.type === 'subCategory' && s.catId === node.id).map(s => s.id);
      threeState.edgeObjects.forEach(edge => {
        if (subIds.includes(edge.source) || subIds.includes(edge.target)) {
          const src = threeState.nodeObjects.find(n => n.id === edge.source);
          const tgt = threeState.nodeObjects.find(n => n.id === edge.target);
          if (src?.group && !src.group.visible) return;
          if (tgt?.group && !tgt.group.visible) return;
          if (!activeEdges.includes(edge)) activeEdges.push(edge);
          connectedNodeIds.add(edge.source);
          connectedNodeIds.add(edge.target);
        }
      });
    }

    setConnectedCount(connectedNodeIds.size - 1);
    setActiveLinkCount(activeEdges.length);

    // Redupkan edge normal menjadi sangat samar
    if (threeState.edgesMeshGroup.children.length > 0) {
      threeState.edgesMeshGroup.children.forEach(c => {
        const line = c as THREE.LineSegments;
        if (line.material) {
          (line.material as THREE.LineBasicMaterial).opacity = 0.03;
        }
      });
    }

    // Rebuild active highlighted edges (Dual glowing lines: core cyan + aura edge)
    while (threeState.highlightedEdgesGroup.children.length > 0) {
      threeState.highlightedEdgesGroup.remove(threeState.highlightedEdgesGroup.children[0]);
    }

    activeEdges.forEach(edge => {
      const src = threeState.nodeObjects.find(n => n.id === edge.source);
      const tgt = threeState.nodeObjects.find(n => n.id === edge.target);
      if (!src || !tgt) return;
      if (src.group && !src.group.visible) return;
      if (tgt.group && !tgt.group.visible) return;

      const isCross = (src.type === 'language' || tgt.type === 'language' ||
                       src.type === 'topic' || tgt.type === 'topic' ||
                       (src.catId && tgt.catId && src.catId !== tgt.catId));

      let pts: THREE.Vector3[];
      if (!isCross) {
        pts = [src.targetPosition, tgt.targetPosition];
      } else {
        const p0 = src.targetPosition;
        const p2 = tgt.targetPosition;
        const dist = p0.distanceTo(p2);
        const mid = p0.clone().add(p2).multiplyScalar(0.5);
        const arcHeight = Math.max(90, Math.min(260, dist * 0.32));
        const p1 = new THREE.Vector3(
          mid.x + (mid.x > 0 ? 1 : -1) * (dist * 0.08),
          mid.y + arcHeight,
          mid.z + (mid.z > 0 ? 1 : -1) * (dist * 0.08)
        );
        const curve = new THREE.QuadraticBezierCurve3(p0, p1, p2);
        pts = curve.getPoints(24);
      }

      const geo = new THREE.BufferGeometry().setFromPoints(pts);

      // Core electric cyan
      const coreMat = new THREE.LineBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending
      });
      threeState.highlightedEdgesGroup.add(new THREE.Line(geo, coreMat));

      // Outer aura
      const auraMat = new THREE.LineBasicMaterial({
        color: edge.color || 0xa855f7,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
      });
      threeState.highlightedEdgesGroup.add(new THREE.Line(geo, auraMat));
    });

    // Update node visuals with elastic GSAP
    threeState.nodeObjects.forEach(n => {
      if (!n.group) return;
      const isPrimary = (n.id === node.id);
      const isConnected = connectedNodeIds.has(n.id);

      n.group.traverse(child => {
        const mesh = child as THREE.Mesh;
        const sprite = child as THREE.Sprite;

        if (mesh.isMesh && mesh.material) {
          const mat = mesh.material as THREE.MeshPhongMaterial;
          if (isPrimary) {
            mat.opacity = 1.0;
            if (mat.emissive) mat.emissiveIntensity = 1.2;
          } else if (isConnected) {
            mat.opacity = 0.95;
            if (mat.emissive) mat.emissiveIntensity = 0.7;
          } else {
            mat.opacity = 0.15;
            if (mat.emissive) mat.emissiveIntensity = 0.05;
          }
        }
        if (sprite.isSprite && sprite.material) {
          const sMat = sprite.material as THREE.SpriteMaterial;
          if (child === n.innerCorona) {
            sMat.opacity = isPrimary ? Math.min(1.0, nodeNeonShadowOpacity * 1.5) : (isConnected ? nodeNeonShadowOpacity * 0.9 : 0.04);
          } else if (child === n.outerCorona) {
            sMat.opacity = isPrimary ? Math.min(1.0, nodeNeonShadowOpacity * 1.3) : (isConnected ? nodeNeonShadowOpacity * 0.6 : 0.02);
          } else {
            sMat.opacity = isPrimary ? 0.9 : (isConnected ? 0.5 : 0.03);
          }
        }
      });

      const targetScale = starScaleMultiplier * (isPrimary ? 1.38 : (isConnected ? 1.15 : 0.82));
      gsap.to(n.group.scale, {
        x: targetScale,
        y: targetScale,
        z: targetScale,
        duration: isPrimary ? 0.6 : 0.4,
        ease: isPrimary ? "elastic.out(1, 0.45)" : (isConnected ? "back.out(2)" : "power2.out"),
        overwrite: "auto"
      });
    });
  }

  // Clear Highlight
  function clearHighlight(threeState: NonNullable<typeof threeRef.current>) {
    threeState.selectedHighlightNode = null;
    setHighlightedNode(null);

    if (threeState.edgesMeshGroup.children.length > 0) {
      threeState.edgesMeshGroup.children.forEach(c => {
        const line = c as THREE.LineSegments;
        if (line.material) {
          (line.material as THREE.LineBasicMaterial).opacity = linkGlowOpacity;
        }
      });
    }

    while (threeState.highlightedEdgesGroup.children.length > 0) {
      threeState.highlightedEdgesGroup.remove(threeState.highlightedEdgesGroup.children[0]);
    }

    threeState.nodeObjects.forEach(n => {
      if (!n.group) return;
      n.group.traverse(child => {
        const mesh = child as THREE.Mesh;
        const sprite = child as THREE.Sprite;

        if (mesh.isMesh && mesh.material) {
          const mat = mesh.material as THREE.MeshPhongMaterial;
          mat.opacity = 1.0;
          if (mat.emissive) {
            mat.emissiveIntensity = (mat.userData && mat.userData.baseEmissiveIntensity) ?? 0.85;
          }
        }
        if (sprite.isSprite && sprite.material) {
          const sMat = sprite.material as THREE.SpriteMaterial;
          if (child === n.innerCorona) {
            sMat.opacity = Math.min(1.0, nodeNeonShadowOpacity * 1.1);
          } else if (child === n.outerCorona) {
            sMat.opacity = Math.min(1.0, nodeNeonShadowOpacity * 0.75);
          } else {
            sMat.opacity = 0.55;
          }
        }
      });

      gsap.to(n.group.scale, {
        x: starScaleMultiplier,
        y: starScaleMultiplier,
        z: starScaleMultiplier,
        duration: 0.38,
        ease: "power2.out",
        overwrite: "auto"
      });
    });
  }

  // Smooth Camera Fly-To Helpers (Interactive Multi-System Solar Island Focus)
  function flyToMacro(threeState: NonNullable<typeof threeRef.current>) {
    const { camera, controls } = threeState;
    gsap.to(camera.position, {
      x: 0,
      y: 1150,
      z: 3200,
      duration: 1.25,
      ease: "power3.inOut"
    });
    gsap.to(controls.target, {
      x: 0,
      y: 0,
      z: 0,
      duration: 1.25,
      ease: "power3.inOut",
      onUpdate: () => controls.update()
    });
  }

  function flyToTopDown(threeState: NonNullable<typeof threeRef.current>) {
    const { camera, controls } = threeState;
    gsap.to(camera.position, {
      x: 0,
      y: 5200,
      z: 1,
      duration: 1.3,
      ease: "power3.inOut"
    });
    gsap.to(controls.target, {
      x: 0,
      y: 0,
      z: 0,
      duration: 1.3,
      ease: "power3.inOut",
      onUpdate: () => controls.update()
    });
  }

  function flyToNode(threeState: NonNullable<typeof threeRef.current>, node: GalaxyNode) {
    const { camera, controls } = threeState;
    let zoomDist = 280;
    if (node.type === 'category') zoomDist = 440;
    else if (node.type === 'subCategory') zoomDist = 260;
    else if (node.type === 'repository') zoomDist = 180;
    else zoomDist = 240;

    const camTargetX = node.x;
    const camTargetY = node.y;
    const camTargetZ = node.z;

    const dir = new THREE.Vector3(
      camera.position.x - controls.target.x,
      camera.position.y - controls.target.y,
      camera.position.z - controls.target.z
    ).normalize();
    if (dir.lengthSq() < 0.01) dir.set(0, 0.42, 0.9).normalize();

    const targetCamX = camTargetX + dir.x * zoomDist;
    const targetCamY = camTargetY + Math.max(dir.y * zoomDist, zoomDist * 0.35);
    const targetCamZ = camTargetZ + dir.z * zoomDist;

    gsap.to(camera.position, {
      x: targetCamX,
      y: targetCamY,
      z: targetCamZ,
      duration: 1.2,
      ease: "power3.out"
    });

    gsap.to(controls.target, {
      x: camTargetX,
      y: camTargetY,
      z: camTargetZ,
      duration: 1.2,
      ease: "power3.out",
      onUpdate: () => controls.update()
    });
  }

  // Helper: Build Graph Data from Live Database Repositories
  function buildGalaxyData(state: NonNullable<typeof threeRef.current>) {
    state.nodeObjects = [];
    state.edgeObjects = [];

    if (!propCategories || propCategories.length === 0) {
      return;
    }

    // Memetakan repositori aktif ke dalam Multi-System Galaxy Islands (360-Degree Omni-Directional Blossom & Conformal Zero-Crossing Layout)
    const catCount = propCategories.length;
    const catRadius = Math.max(1950, 1200 + catCount * 55);
    const yElevations = [-60, 60, -50, 70];
    const catColors = ['#c084fc', '#f472b6', '#38bdf8', '#4ade80', '#fb923c', '#e879f9', '#a78bfa', '#34d399'];

    propCategories.forEach((cat, idx) => {
      const angle = (idx / catCount) * Math.PI * 2 + Math.PI / 4;
      const x = Math.cos(angle) * catRadius;
      const z = Math.sin(angle) * catRadius;
      const y = yElevations[idx % yElevations.length];

      state.nodeObjects.push({
        id: cat.id,
        name: cat.name,
        type: 'category',
        desc: `Grup kategori utama ${cat.name}.`,
        color: catColors[idx % catColors.length],
        baseSize: 32,
        collisionRadius: 55,
        x, y, z,
        angle,
        targetPosition: new THREE.Vector3(x, y, z),
        connections: []
      });
    });

    // SubCategories & Repositories - Full 360-Degree Blossom Layout around Category Sun (Zero Crossings & Zero Overlaps)
    propCategories.forEach((cat, catIdx) => {
      const parent = state.nodeObjects.find(n => n.id === cat.id);
      if (!parent) return;

      const subs = cat.subCategories || [{ id: `sub-${cat.id}`, name: `${cat.name} General`, slug: 'general' }];
      const subCount = subs.length;

      // Filter and normalize repos belonging to this category
      const catRepos = propRepositories.filter(r => {
        if (r.subCategoryId && subs.some(s => s.id === r.subCategoryId)) return true;
        if (r.categoryId === cat.id) return true;
        return false;
      });

      let unattachedIndex = 0;
      catRepos.forEach(r => {
        if (!r.subCategoryId || !subs.some(s => s.id === r.subCategoryId)) {
          (r as unknown as { assignedSubId: string }).assignedSubId = subs[unattachedIndex % subs.length].id;
          unattachedIndex++;
        } else {
          (r as unknown as { assignedSubId: string }).assignedSubId = r.subCategoryId;
        }
      });

      // 360-degree bloom: subcategories distributed evenly around the full 2*PI circle around Category Sun
      const catPhaseOffset = (catIdx * 0.43) % (Math.PI * 2);
      const angleStep = (Math.PI * 2) / subCount;

      subs.forEach((sub, subIdx) => {
        const subAngle = catPhaseOffset + subIdx * angleStep;

        // Tiering distance from Category Sun
        const subLane = subCount > 8 ? (subIdx % 3) : (subCount > 4 ? (subIdx % 2) : 0);
        const subDist = subCount <= 4 
          ? 200 
          : (subCount <= 8 ? (220 + subLane * 110) : (220 + subLane * 125));

        const sx = parent.x + Math.cos(subAngle) * subDist;
        const sz = parent.z + Math.sin(subAngle) * subDist;
        const sy = parent.y + (subLane === 0 ? 35 : (subLane === 1 ? -35 : 15));

        const subNode: GalaxyNode = {
          id: sub.id,
          name: sub.name,
          type: 'subCategory',
          catId: cat.id,
          desc: `Sub-grup spesialisasi di bawah grup ${parent.name}.`,
          color: '#38bdf8',
          baseSize: 22,
          collisionRadius: 36,
          x: sx,
          y: sy,
          z: sz,
          subAngle,
          targetPosition: new THREE.Vector3(sx, sy, sz),
          connections: [parent.id]
        };
        state.nodeObjects.push(subNode);

        // Edge from Category Sun to SubCategory Planet
        state.edgeObjects.push({ source: parent.id, target: sub.id, color: 0xa855f7 });
        parent.connections.push(sub.id);

        // Repositories for this SubCategory
        const subRepos = catRepos.filter(r => (r as unknown as { assignedSubId: string }).assignedSubId === sub.id);
        const rCount = subRepos.length;

        // Keep repository rays inside subcategory's exclusive angular sector
        const maxWiggle = Math.min(0.08, (angleStep / 2) * 0.4);

        subRepos.forEach((repo, rIdx) => {
          // Staggered outward spine along the radial ray
          const repoDist = 72 + rIdx * 56;
          const repoAngle = subAngle + (rCount > 1 ? (rIdx % 2 === 0 ? maxWiggle : -maxWiggle) : 0);

          const rx = sx + Math.cos(repoAngle) * repoDist;
          const rz = sz + Math.sin(repoAngle) * repoDist;
          const ry = sy + (rIdx % 2 === 0 ? -22 : 22);

          const starSize = Math.max(13, Math.min(25, 12 + ((repo.starsCount || 0) / 10000) * 1.2));

          const node: GalaxyNode = {
            id: repo.id,
            name: repo.name || repo.fullName,
            repoFullName: repo.fullName,
            type: 'repository',
            subCatId: sub.id,
            langId: repo.primaryLanguage ? `lang-${repo.primaryLanguage.toLowerCase()}` : undefined,
            stars: repo.starsCount || 0,
            topics: repo.topics || [],
            desc: repo.description || 'Repositori di ekosistem GitHub Library.',
            color: '#10b981',
            baseSize: starSize,
            collisionRadius: 26,
            x: rx,
            y: ry,
            z: rz,
            targetPosition: new THREE.Vector3(rx, ry, rz),
            connections: [sub.id]
          };

          state.nodeObjects.push(node);
          state.edgeObjects.push({ source: sub.id, target: repo.id, color: 0x38bdf8 });
          subNode.connections.push(repo.id);
        });
      });
    });

    // Languages - Outer Transit Belt
    const uniqueLangs = Array.from(new Set(propRepositories.map(r => r.primaryLanguage).filter(Boolean))) as string[];
    uniqueLangs.slice(0, 6).forEach((lang, idx) => {
      const angle = (idx / uniqueLangs.length) * Math.PI * 2 + 0.32;
      const dist = catRadius + 600;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const y = idx % 2 === 0 ? 140 : -140;
      const langId = `lang-${lang.toLowerCase()}`;

      state.nodeObjects.push({
        id: langId,
        name: lang,
        type: 'language',
        desc: `Bahasa pemrograman utama di katalog.`,
        color: '#f59e0b',
        baseSize: 15,
        collisionRadius: 28,
        x, y, z,
        targetPosition: new THREE.Vector3(x, y, z),
        connections: []
      });

      propRepositories.filter(r => r.primaryLanguage === lang).forEach(r => {
        state.edgeObjects.push({ source: r.id, target: langId, color: 0xf59e0b });
      });
    });

    // Topics - Outer Transit Belt
    const allTopics = propRepositories.flatMap(r => r.topics || []).filter(Boolean);
    const topTopics = Array.from(new Set(allTopics)).slice(0, 8);
    topTopics.forEach((top, idx) => {
      const angle = (idx / topTopics.length) * Math.PI * 2 + 0.18;
      const dist = catRadius + 850 + (idx % 2) * 60;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const y = Math.sin(idx * 1.5) * 85;
      const topId = `top-${top.toLowerCase()}`;

      state.nodeObjects.push({
        id: topId,
        name: '#' + top,
        type: 'topic',
        desc: `Tag topik teknologi.`,
        color: '#f97316',
        baseSize: 11,
        collisionRadius: 24,
        x, y, z,
        targetPosition: new THREE.Vector3(x, y, z),
        connections: []
      });

      propRepositories.filter(r => (r.topics || []).includes(top)).forEach(r => {
        state.edgeObjects.push({ source: r.id, target: topId, color: 0xf97316 });
      });
    });

    // Update target positions for smooth rendering
    state.nodeObjects.forEach(n => {
      n.targetPosition.set(n.x, n.y, n.z);
    });

    // Update Stats
    setStats({
      nodes: state.nodeObjects.length,
      edges: state.edgeObjects.length,
      clusters: state.nodeObjects.filter(n => n.type === 'category').length
    });
  }

  // Render Dynamic Galaxy Edges (Only connects nodes that are currently visible)
  function renderGalaxyEdges(state: NonNullable<typeof threeRef.current>) {
    while (state.edgesMeshGroup.children.length > 0) {
      const child = state.edgesMeshGroup.children[0];
      if ((child as unknown as { geometry?: { dispose: () => void } }).geometry) {
        (child as unknown as { geometry: { dispose: () => void } }).geometry.dispose();
      }
      state.edgesMeshGroup.remove(child);
    }

    const intraPositions: number[] = [];
    const intraColors: number[] = [];
    const crossPositions: number[] = [];
    const crossColors: number[] = [];

    state.edgeObjects.forEach(edge => {
      const srcNode = state.nodeObjects.find(n => n.id === edge.source);
      const tgtNode = state.nodeObjects.find(n => n.id === edge.target);

      if (srcNode && tgtNode) {
        const isSrcVisible = srcNode.group ? srcNode.group.visible : true;
        const isTgtVisible = tgtNode.group ? tgtNode.group.visible : true;

        // PENTING: Hanya render konektor jika KEDUA node (source & target) sedang aktif/terlihat
        if (!isSrcVisible || !isTgtVisible) return;

        const isCross = (
          srcNode.type === 'language' || tgtNode.type === 'language' ||
          srcNode.type === 'topic' || tgtNode.type === 'topic' ||
          (srcNode.catId && tgtNode.catId && srcNode.catId !== tgtNode.catId)
        );

        const col = new THREE.Color(edge.color);

        if (!isCross) {
          // Straight solid connection within the solar island
          intraPositions.push(srcNode.x, srcNode.y, srcNode.z);
          intraPositions.push(tgtNode.x, tgtNode.y, tgtNode.z);
          intraColors.push(col.r, col.g, col.b);
          intraColors.push(col.r, col.g, col.b);
        } else {
          // 3D Quadratic Bezier Curve soaring gracefully above solar systems
          const p0 = new THREE.Vector3(srcNode.x, srcNode.y, srcNode.z);
          const p2 = new THREE.Vector3(tgtNode.x, tgtNode.y, tgtNode.z);
          const dist = p0.distanceTo(p2);
          const mid = p0.clone().add(p2).multiplyScalar(0.5);
          const arcHeight = Math.max(90, Math.min(260, dist * 0.32));
          const p1 = new THREE.Vector3(
            mid.x + (mid.x > 0 ? 1 : -1) * (dist * 0.08),
            mid.y + arcHeight,
            mid.z + (mid.z > 0 ? 1 : -1) * (dist * 0.08)
          );
          const curve = new THREE.QuadraticBezierCurve3(p0, p1, p2);
          const pts = curve.getPoints(16);

          for (let k = 0; k < pts.length - 1; k++) {
            crossPositions.push(pts[k].x, pts[k].y, pts[k].z);
            crossPositions.push(pts[k + 1].x, pts[k + 1].y, pts[k + 1].z);
            crossColors.push(col.r, col.g, col.b);
            crossColors.push(col.r, col.g, col.b);
          }
        }
      }
    });

    const currentIntraOpacity = state.selectedHighlightNode ? 0.03 : Math.min(1.0, linkGlowOpacity * 1.25);
    const currentCrossOpacity = state.selectedHighlightNode ? 0.015 : Math.max(0.12, linkGlowOpacity * 0.65);

    if (intraPositions.length > 0) {
      const intraGeo = new THREE.BufferGeometry();
      intraGeo.setAttribute('position', new THREE.Float32BufferAttribute(intraPositions, 3));
      intraGeo.setAttribute('color', new THREE.Float32BufferAttribute(intraColors, 3));

      const intraMesh = new THREE.LineSegments(
        intraGeo,
        new THREE.LineBasicMaterial({
          vertexColors: true,
          transparent: true,
          opacity: currentIntraOpacity,
          blending: THREE.AdditiveBlending
        })
      );
      state.edgesMeshGroup.add(intraMesh);
    }

    if (crossPositions.length > 0) {
      const crossGeo = new THREE.BufferGeometry();
      crossGeo.setAttribute('position', new THREE.Float32BufferAttribute(crossPositions, 3));
      crossGeo.setAttribute('color', new THREE.Float32BufferAttribute(crossColors, 3));

      const crossMesh = new THREE.LineSegments(
        crossGeo,
        new THREE.LineBasicMaterial({
          vertexColors: true,
          transparent: true,
          opacity: currentCrossOpacity,
          blending: THREE.AdditiveBlending
        })
      );
      state.edgesMeshGroup.add(crossMesh);
    }
  }

  // Render Meshes to Scene
  function renderGalaxyMeshes(state: NonNullable<typeof threeRef.current>) {
    while (state.nodesMeshGroup.children.length > 0) {
      state.nodesMeshGroup.remove(state.nodesMeshGroup.children[0]);
    }
    while (state.labelsGroup.children.length > 0) {
      state.labelsGroup.remove(state.labelsGroup.children[0]);
    }

    // 1. Create Meshes
    state.nodeObjects.forEach(node => {
      const node3DGroup = createNode3DGeometry(state, node);
      node.mesh = node3DGroup;
      node.group = node3DGroup;
      state.nodesMeshGroup.add(node3DGroup);
    });

    // 2. Dual Edge Streams (Intra-group & Cross-group)
    renderGalaxyEdges(state);

    // 3. Billboards / Orbit Labels ONLY on Category nodes
    state.nodeObjects.filter(n => n.type === 'category').forEach(cat => {
      const sprite = createTextSprite(cat.name, cat.color);
      sprite.position.set(cat.x, cat.y + 48, cat.z);
      state.labelsGroup.add(sprite);
    });
  }

  // =============================================================
  // PROCEDURAL 3D GEOMETRY CREATION (PERSIS PROTOTYPE)
  // =============================================================
  function createNode3DGeometry(state: NonNullable<typeof threeRef.current>, node: GalaxyNode): THREE.Group {
    const group = new THREE.Group();
    const col = new THREE.Color(node.color);

    if (node.type === 'category') {
      // 1. MATAHARI (SUN) - 4 Kelas Bintang Kosmik
      const baseR = (node.baseSize || 32) * 0.52;
      const sphereGeo = new THREE.SphereGeometry(baseR, 32, 32);

      let starEmissive = 0xff7700;
      if (node.id === 'cat-ai') starEmissive = 0xc084fc;        // Violet Hypergiant
      else if (node.id === 'cat-video') starEmissive = 0xf43f5e;  // Red Supergiant Betelgeuse
      else if (node.id === 'cat-db') starEmissive = 0x38bdf8;     // Blue Giant Rigel
      else if (node.id === 'cat-framework') starEmissive = 0x22c55e; // Emerald Star Sol
      else {
        const catIdx = state.nodeObjects.filter(n => n.type === 'category').indexOf(node) % 4;
        const emissives = [0xc084fc, 0xf43f5e, 0x38bdf8, 0x22c55e];
        starEmissive = emissives[catIdx];
      }

      const sphereMat = new THREE.MeshPhongMaterial({
        map: getSunTexture(state, node.color, node.id),
        color: new THREE.Color(node.color),
        emissive: starEmissive,
        emissiveIntensity: 1.15,
        shininess: 45
      });
      sphereMat.userData = { baseEmissiveIntensity: 1.15 };
      const coreMesh = new THREE.Mesh(sphereGeo, sphereMat);
      coreMesh.userData = node;
      group.add(coreMesh);
      node.coreMesh = coreMesh;

      // Inner Corona
      const innerCoronaMat = new THREE.SpriteMaterial({
        map: getSolarCoronaTexture(state, node.color, 'inner'),
        transparent: true,
        opacity: Math.min(1.0, nodeNeonShadowOpacity * 1.15),
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const innerCorona = new THREE.Sprite(innerCoronaMat);
      innerCorona.raycast = () => {};
      const innerScale = baseR * 3.3;
      innerCorona.scale.set(innerScale, innerScale, 1);
      innerCorona.userData = node;
      group.add(innerCorona);
      node.innerCorona = innerCorona;
      node.baseInnerCoronaScale = innerScale;

      // Outer Corona
      const outerCoronaMat = new THREE.SpriteMaterial({
        map: getSolarCoronaTexture(state, node.color, 'outer'),
        transparent: true,
        opacity: Math.min(1.0, nodeNeonShadowOpacity * 0.82),
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const outerCorona = new THREE.Sprite(outerCoronaMat);
      outerCorona.raycast = () => {};
      const outerScale = baseR * 5.5;
      outerCorona.scale.set(outerScale, outerScale, 1);
      outerCorona.userData = node;
      group.add(outerCorona);
      node.outerCorona = outerCorona;
      node.baseOuterCoronaScale = outerScale;

    } else if (node.type === 'subCategory') {
      // 2. PLANET (8 Variasi Bentuk & Sistem Cincin)
      const baseR = (node.baseSize || 22) * 0.5;
      let coreMesh: THREE.Mesh;
      let planetMat: THREE.MeshPhongMaterial;

      const subIdx = state.nodeObjects.filter(n => n.type === 'subCategory').indexOf(node) % 8;
      const isCrystal = (node.id === 'sub-serverless-db' || subIdx === 5);

      let planetEmissive = new THREE.Color(node.color);
      if (node.id === 'sub-llm') planetEmissive = new THREE.Color('#a855f7');
      else if (node.id === 'sub-rag') planetEmissive = new THREE.Color('#14b8a6');
      else if (node.id === 'sub-video-edit') planetEmissive = new THREE.Color('#f97316');
      else if (node.id === 'sub-video-ai') planetEmissive = new THREE.Color('#f43f5e');
      else if (node.id === 'sub-orm') planetEmissive = new THREE.Color('#0284c7');
      else if (node.id === 'sub-serverless-db') planetEmissive = new THREE.Color('#06b6d4');
      else if (node.id === 'sub-fullstack') planetEmissive = new THREE.Color('#16a34a');
      else if (node.id === 'sub-motion-lib') planetEmissive = new THREE.Color('#10b981');

      if (isCrystal) {
        const crystalGeo = new THREE.IcosahedronGeometry(baseR, 2);
        planetMat = new THREE.MeshPhongMaterial({
          map: getPlanetTexture(state, node.id, node.color),
          color: new THREE.Color(node.color),
          flatShading: true,
          specular: 0x99e6ff,
          shininess: 95,
          emissive: planetEmissive,
          emissiveIntensity: 0.82
        });
        planetMat.userData = { baseEmissiveIntensity: 0.82 };
        coreMesh = new THREE.Mesh(crystalGeo, planetMat);
      } else {
        const sphereGeo = new THREE.SphereGeometry(baseR, 32, 32);
        planetMat = new THREE.MeshPhongMaterial({
          map: getPlanetTexture(state, node.id, node.color),
          color: new THREE.Color(node.color),
          specular: (node.id === 'sub-orm' || subIdx === 4) ? 0x88ccff : 0x777777,
          shininess: (node.id === 'sub-orm' || subIdx === 4) ? 80 : 50,
          emissive: planetEmissive,
          emissiveIntensity: 0.82
        });
        planetMat.userData = { baseEmissiveIntensity: 0.82 };
        coreMesh = new THREE.Mesh(sphereGeo, planetMat);

        if (node.id === 'sub-llm' || subIdx === 0) {
          coreMesh.scale.set(1.08, 0.92, 1.08); // Oblate Saturnus
        } else if (node.id === 'sub-video-ai' || subIdx === 3) {
          coreMesh.scale.set(1.06, 0.94, 1.06); // Oblate Jupiter
        } else if (node.id === 'sub-motion-lib' || subIdx === 7) {
          coreMesh.scale.set(1.1, 0.88, 1.1);  // Oblate Super-Saturn
        }
      }

      coreMesh.userData = node;
      group.add(coreMesh);
      node.coreMesh = coreMesh;

      // Cincin & Satelit Trojan
      const ringGroup = new THREE.Group();

      if (node.id === 'sub-llm' || subIdx === 0) {
        // Saturnus: Cincin Ganda Lebar dengan Celah Cassini
        const ringGeo = new THREE.RingGeometry(baseR * 1.35, baseR * 2.35, 48);
        const ringMat = new THREE.MeshBasicMaterial({
          map: getPlanetaryRingTexture(state, '#c084fc', 'cassini'),
          transparent: true,
          opacity: 0.92,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        ringGroup.add(new THREE.Mesh(ringGeo, ringMat));
        ringGroup.rotation.x = Math.PI * 0.38;
        ringGroup.rotation.y = Math.PI * 0.12;
        group.add(ringGroup);
        node.ringGroup = ringGroup;

      } else if (node.id === 'sub-rag' || subIdx === 1) {
        // Uranus: Cincin Vertikal Tegak Lurus
        const ringGeo = new THREE.RingGeometry(baseR * 1.4, baseR * 1.62, 48);
        const ringMat = new THREE.MeshBasicMaterial({
          map: getPlanetaryRingTexture(state, '#2dd4bf', 'thin'),
          transparent: true,
          opacity: 0.88,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        ringGroup.add(new THREE.Mesh(ringGeo, ringMat));
        ringGroup.rotation.x = Math.PI * 0.48;
        ringGroup.rotation.z = Math.PI * 0.25;
        group.add(ringGroup);
        node.ringGroup = ringGroup;

      } else if (node.id === 'sub-video-edit' || subIdx === 2) {
        // Magma: Cincin Serpihan Batuan Pijar
        const ringGeo = new THREE.RingGeometry(baseR * 1.25, baseR * 1.5, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          map: getPlanetaryRingTexture(state, '#ea580c', 'debris'),
          transparent: true,
          opacity: 0.75,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        ringGroup.add(new THREE.Mesh(ringGeo, ringMat));
        ringGroup.rotation.x = Math.PI * 0.32;
        group.add(ringGroup);
        node.ringGroup = ringGroup;

      } else if (node.id === 'sub-serverless-db' || subIdx === 5) {
        // Crystal: Cincin Silang Ganda (Cross Rings)
        const ringGeo = new THREE.RingGeometry(baseR * 1.35, baseR * 1.85, 48);
        const ringMat = new THREE.MeshBasicMaterial({
          map: getPlanetaryRingTexture(state, '#38bdf8', 'thin'),
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        const r1 = new THREE.Mesh(ringGeo, ringMat);
        const r2 = new THREE.Mesh(ringGeo, ringMat);
        r1.rotation.x = Math.PI * 0.35;
        r2.rotation.x = -Math.PI * 0.35;
        r2.rotation.y = Math.PI * 0.25;
        ringGroup.add(r1);
        ringGroup.add(r2);
        group.add(ringGroup);
        node.ringGroup = ringGroup;

      } else if (node.id === 'sub-orm' || subIdx === 4) {
        // Ocean: Cincin Kristal Es Miring 18°
        const ringGeo = new THREE.RingGeometry(baseR * 1.45, baseR * 2.15, 48);
        const ringMat = new THREE.MeshBasicMaterial({
          map: getPlanetaryRingTexture(state, '#7dd3fc', 'cassini'),
          transparent: true,
          opacity: 0.75,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        ringGroup.add(new THREE.Mesh(ringGeo, ringMat));
        ringGroup.rotation.x = Math.PI * 0.18;
        group.add(ringGroup);
        node.ringGroup = ringGroup;

      } else if (node.id === 'sub-motion-lib' || subIdx === 7) {
        // Super-Saturn: Cincin Tiga Lapis Konsentris Megah
        const ringGeo1 = new THREE.RingGeometry(baseR * 1.3, baseR * 1.62, 48);
        const ringGeo2 = new THREE.RingGeometry(baseR * 1.75, baseR * 2.1, 48);
        const ringGeo3 = new THREE.RingGeometry(baseR * 2.25, baseR * 2.58, 48);
        const ringMat = new THREE.MeshBasicMaterial({
          map: getPlanetaryRingTexture(state, '#34d399', 'cassini'),
          transparent: true,
          opacity: 0.88,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        ringGroup.add(new THREE.Mesh(ringGeo1, ringMat));
        ringGroup.add(new THREE.Mesh(ringGeo2, ringMat));
        ringGroup.add(new THREE.Mesh(ringGeo3, ringMat));
        ringGroup.rotation.x = Math.PI * 0.42;
        ringGroup.rotation.y = Math.PI * 0.15;
        group.add(ringGroup);
        node.ringGroup = ringGroup;

      } else if (node.id === 'sub-video-ai' || subIdx === 3) {
        // Jupiter: 2 Satelit Trojan Pengiring
        const moonletGroup = new THREE.Group();
        const moonlet1 = new THREE.Mesh(
          new THREE.SphereGeometry(baseR * 0.18, 12, 12),
          new THREE.MeshPhongMaterial({ color: 0xfbcfe8, emissive: 0xf43f5e, emissiveIntensity: 0.5 })
        );
        moonlet1.position.set(baseR * 2.1, 0, 0);
        const moonlet2 = new THREE.Mesh(
          new THREE.SphereGeometry(baseR * 0.14, 12, 12),
          new THREE.MeshPhongMaterial({ color: 0xfde047, emissive: 0xeab308, emissiveIntensity: 0.5 })
        );
        moonlet2.position.set(-baseR * 2.5, baseR * 0.35, 0);
        moonletGroup.add(moonlet1);
        moonletGroup.add(moonlet2);
        group.add(moonletGroup);
        node.moonletGroup = moonletGroup;
      }

      // Ozone Atmosphere halo
      const innerCoronaMat = new THREE.SpriteMaterial({
        map: getSolarCoronaTexture(state, node.color, 'inner'),
        transparent: true,
        opacity: Math.min(1.0, nodeNeonShadowOpacity * 0.75),
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const innerCorona = new THREE.Sprite(innerCoronaMat);
      innerCorona.raycast = () => {};
      const innerScale = baseR * 2.1;
      innerCorona.scale.set(innerScale, innerScale, 1);
      innerCorona.userData = node;
      group.add(innerCorona);
      node.innerCorona = innerCorona;
      node.baseInnerCoronaScale = innerScale;

    } else if (node.type === 'repository') {
      // 3. BULAN (FASE SABIT 3D, PHOBOS MARS, EUROPA ES, TITAN, IO, KUARTIR)
      const baseR = (node.baseSize || 16) * 0.48;
      let coreMesh: THREE.Mesh;

      const repoIdx = state.nodeObjects.filter(n => n.type === 'repository').indexOf(node) % 7;
      const isCrescent = (node.id === 'repo-vllm' || node.id === 'repo-openshorts' || repoIdx === 0 || repoIdx === 1);
      const isPhobos = (node.id === 'repo-nextjs' || repoIdx === 5);
      const isQuarter = (node.id === 'repo-threejs' || repoIdx === 6);

      if (isCrescent) {
        // 🌙 BULAN SABIT 3D ASLI (Extruded Beveled 3D Crescent Moon Geometry)
        const isGold = (node.id === 'repo-vllm' || repoIdx === 0);
        const shape = new THREE.Shape();
        const r = baseR * 1.15;
        shape.absarc(0, 0, r, -Math.PI * 0.5, Math.PI * 0.5, false);
        const offset = isGold ? r * 0.48 : r * 0.62;
        const rInner = isGold ? r * 0.86 : r * 0.94;
        shape.absarc(offset, 0, rInner, Math.PI * 0.5, -Math.PI * 0.5, true);
        shape.closePath();

        const crescentGeo = new THREE.ExtrudeGeometry(shape, {
          depth: r * 0.42,
          bevelEnabled: true,
          bevelSegments: 3,
          steps: 1,
          bevelSize: r * 0.1,
          bevelThickness: r * 0.1
        });
        crescentGeo.center();

        const crescentMat = new THREE.MeshPhongMaterial({
          map: getMoonTexture(state, node.id, isGold ? '#f59e0b' : '#38bdf8'),
          color: isGold ? new THREE.Color('#fbbf24') : new THREE.Color('#93c5fd'),
          specular: isGold ? 0xfffbeb : 0xffffff,
          shininess: 85,
          emissive: isGold ? new THREE.Color('#d97706') : new THREE.Color('#2563eb'),
          emissiveIntensity: 0.85
        });
        crescentMat.userData = { baseEmissiveIntensity: 0.85 };
        coreMesh = new THREE.Mesh(crescentGeo, crescentMat);

      } else if (isPhobos) {
        // 🥔 BULAN PHOBOS MARS (Bulan Kentang Asimetris dengan Kawah Stickney Raksasa)
        const potatoGeo = new THREE.DodecahedronGeometry(baseR, 1);
        const pos = potatoGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          let vx = pos.getX(i) * 1.35;
          let vy = pos.getY(i) * 0.88;
          let vz = pos.getZ(i) * 0.92;
          const distStickney = Math.hypot(vx - baseR * 0.6, vy, vz);
          if (distStickney < baseR * 0.85) {
            vx *= 0.72; vy *= 0.72; vz *= 0.72;
          } else {
            const noise = 1 + Math.sin(vx * 6 + vy * 5) * 0.14;
            vx *= noise; vy *= noise; vz *= noise;
          }
          pos.setXYZ(i, vx, vy, vz);
        }
        potatoGeo.computeVertexNormals();

        const potatoMat = new THREE.MeshPhongMaterial({
          map: getMoonTexture(state, node.id, '#ea580c'),
          color: new THREE.Color('#ea580c'),
          flatShading: true,
          specular: 0x555555,
          shininess: 25,
          emissive: new THREE.Color('#c2410c'),
          emissiveIntensity: 0.72
        });
        potatoMat.userData = { baseEmissiveIntensity: 0.72 };
        coreMesh = new THREE.Mesh(potatoGeo, potatoMat);

      } else if (isQuarter) {
        // 🌓 BULAN KUARTIR / PERBANI (Fase Separuh Bulan Terang-Gelap 3D)
        const halfSphereGeo = new THREE.SphereGeometry(baseR, 24, 24, 0, Math.PI, 0, Math.PI);
        const halfMat = new THREE.MeshPhongMaterial({
          map: getMoonTexture(state, node.id, '#38bdf8'),
          color: new THREE.Color('#38bdf8'),
          specular: 0x88ccff,
          shininess: 50,
          emissive: new THREE.Color('#0284c7'),
          emissiveIntensity: 0.75,
          side: THREE.DoubleSide
        });
        halfMat.userData = { baseEmissiveIntensity: 0.75 };
        coreMesh = new THREE.Mesh(halfSphereGeo, halfMat);

      } else {
        // 🌋 BULAN IO, 🧊 BULAN EUROPA, 🪐 BULAN TITAN
        let moonEmissive = col.getHex();
        if (node.id === 'repo-openmontage' || repoIdx === 2) moonEmissive = 0xf59e0b; // Io Sulfur Lava
        else if (node.id === 'repo-drizzle' || repoIdx === 3) moonEmissive = 0x0284c7; // Europa Ice
        else if (node.id === 'repo-neon' || repoIdx === 4) moonEmissive = 0xd97706; // Titan Amber

        const sphereGeo = new THREE.SphereGeometry(baseR, 32, 32);
        const moonMat = new THREE.MeshPhongMaterial({
          map: getMoonTexture(state, node.id, node.color),
          color: new THREE.Color(node.color),
          specular: (node.id === 'repo-drizzle' || repoIdx === 3) ? 0x99ddff : 0x777777,
          shininess: (node.id === 'repo-drizzle' || repoIdx === 3) ? 80 : 45,
          emissive: moonEmissive,
          emissiveIntensity: 0.8
        });
        moonMat.userData = { baseEmissiveIntensity: 0.8 };
        coreMesh = new THREE.Mesh(sphereGeo, moonMat);
      }

      coreMesh.userData = node;
      group.add(coreMesh);
      node.coreMesh = coreMesh;

      // Lunar Glow
      const innerCoronaMat = new THREE.SpriteMaterial({
        map: getSolarCoronaTexture(state, node.color, 'inner'),
        transparent: true,
        opacity: Math.min(1.0, nodeNeonShadowOpacity * 0.7),
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const innerCorona = new THREE.Sprite(innerCoronaMat);
      innerCorona.raycast = () => {};
      const innerScale = baseR * 1.85;
      innerCorona.scale.set(innerScale, innerScale, 1);
      innerCorona.userData = node;
      group.add(innerCorona);
      node.innerCorona = innerCorona;
      node.baseInnerCoronaScale = innerScale;

    } else {
      // 4 & 5. METEOR & KOMET (Jatuh Menghujam dengan Ekor Pijar Bervariasi)
      const isLang = (node.type === 'language');
      const baseR = (node.baseSize || (isLang ? 14 : 11)) * 0.45;

      const rockGeo = new THREE.DodecahedronGeometry(baseR, 1);
      const pos = rockGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i), vy = pos.getY(i), vz = pos.getZ(i);
        const jitter = 1 + Math.sin(vx * 8 + vy * 6) * 0.22 + Math.cos(vz * 7) * 0.16;
        pos.setXYZ(i, vx * jitter, vy * jitter, vz * jitter);
      }
      rockGeo.computeVertexNormals();

      const rockMat = new THREE.MeshPhongMaterial({
        map: getMeteorTexture(state, node.color),
        color: new THREE.Color(node.color),
        flatShading: true,
        shininess: 45,
        emissive: col.getHex(),
        emissiveIntensity: 0.9
      });
      rockMat.userData = { baseEmissiveIntensity: 0.9 };
      const coreMesh = new THREE.Mesh(rockGeo, rockMat);
      coreMesh.userData = node;
      group.add(coreMesh);
      node.coreMesh = coreMesh;

      // Vektor Arah Menghujam
      const fallDir = new THREE.Vector3(-node.x, -node.y - 80, -node.z).normalize();

      // Ekor Pijar Meteor / Komet
      const tailTypes = ['fire', 'ion', 'emerald', 'spark', 'cosmic'];
      const seed = Math.abs(node.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
      const tailType = tailTypes[seed % tailTypes.length];
      const tailLengths = [50, 68, 46, 58, 64];
      const tailLen = tailLengths[seed % tailLengths.length];

      const tailGeo = new THREE.CylinderGeometry(baseR * 0.95, 0.1, tailLen, 16, 1, true);
      tailGeo.translate(0, -tailLen * 0.5, 0);

      const tailMat = new THREE.MeshBasicMaterial({
        map: getMeteorTailTexture(state, tailType, node.color),
        transparent: true,
        opacity: 0.96,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const tailMesh = new THREE.Mesh(tailGeo, tailMat);
      tailMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), fallDir.clone().negate());
      group.add(tailMesh);
      node.tailMesh = tailMesh;
      node.baseTailLen = tailLen;
      node.tailPhase = Math.random() * Math.PI * 2;

      // Atmospheric Shockwave Flare
      const innerCoronaMat = new THREE.SpriteMaterial({
        map: getSolarCoronaTexture(state, node.color, 'inner'),
        transparent: true,
        opacity: nodeNeonShadowOpacity * 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const innerCorona = new THREE.Sprite(innerCoronaMat);
      innerCorona.raycast = () => {};
      const innerScale = baseR * 2.4;
      innerCorona.scale.set(innerScale, innerScale, 1);
      innerCorona.userData = node;
      group.add(innerCorona);
      node.innerCorona = innerCorona;
      node.baseInnerCoronaScale = innerScale;
    }

    group.position.copy(node.targetPosition);
    group.scale.set(starScaleMultiplier, starScaleMultiplier, starScaleMultiplier);
    group.userData = node;

    node.baseScale = starScaleMultiplier;
    node.rotSpeedX = (Math.random() - 0.5) * 0.012;
    node.rotSpeedY = 0.009 + Math.random() * 0.012;
    node.coronaPhase = Math.random() * Math.PI * 2;

    return group;
  }

  // =============================================================
  // PROCEDURAL TEXTURE GENERATORS (PERSIS PROTOTYPE)
  // =============================================================
  function getSolarCoronaTexture(
    state: NonNullable<typeof threeRef.current>,
    colorHex: string,
    type: 'inner' | 'outer' = 'inner'
  ) {
    const key = `corona_${colorHex}_${type}`;
    if (state.celestialTextureCache[key]) return state.celestialTextureCache[key];

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    const cx = 128, cy = 128;

    if (type === 'inner') {
      const grad = ctx.createRadialGradient(cx, cy, 38, cx, cy, 128);
      grad.addColorStop(0, colorHex);
      grad.addColorStop(0.38, colorHex);
      grad.addColorStop(0.62, colorHex + 'cc');
      grad.addColorStop(0.85, colorHex + '33');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    } else {
      const grad = ctx.createRadialGradient(cx, cy, 12, cx, cy, 128);
      grad.addColorStop(0, colorHex + 'bb');
      grad.addColorStop(0.28, colorHex + '77');
      grad.addColorStop(0.65, colorHex + '25');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    }

    const tex = new THREE.CanvasTexture(canvas);
    state.celestialTextureCache[key] = tex;
    return tex;
  }

  function getSunTexture(
    state: NonNullable<typeof threeRef.current>,
    colorHex: string,
    catId: string
  ) {
    const key = 'sun_' + (catId || colorHex);
    if (state.celestialTextureCache[key]) return state.celestialTextureCache[key];

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    let stops = ['#fffbe6', '#ffea00', '#ff8800', '#ea580c', '#7c2d12'];
    let granuleColor = '#fffbe6';
    let flareColor = 'rgba(255, 136, 0, 0)';

    if (catId === 'cat-ai') {
      stops = ['#ffffff', '#e9d5ff', '#c084fc', '#9333ea', '#581c87'];
      granuleColor = '#faf5ff';
      flareColor = 'rgba(192, 132, 252, 0.4)';
    } else if (catId === 'cat-video') {
      stops = ['#fff1f2', '#fb7185', '#e11d48', '#be123c', '#881337'];
      granuleColor = '#ffe4e6';
      flareColor = 'rgba(225, 29, 72, 0.4)';
    } else if (catId === 'cat-db') {
      stops = ['#ffffff', '#bae6fd', '#38bdf8', '#0284c7', '#0369a1'];
      granuleColor = '#f0f9ff';
      flareColor = 'rgba(56, 189, 248, 0.4)';
    } else if (catId === 'cat-framework') {
      stops = ['#fef9c3', '#bef264', '#22c55e', '#16a34a', '#14532d'];
      granuleColor = '#fef08a';
      flareColor = 'rgba(34, 197, 94, 0.4)';
    }

    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, stops[4]);
    grad.addColorStop(0.2, stops[2]);
    grad.addColorStop(0.5, stops[0]);
    grad.addColorStop(0.8, stops[2]);
    grad.addColorStop(1, stops[4]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    for (let i = 0; i < 300; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 256;
      const r = 3 + Math.random() * 16;
      const spotGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
      spotGrad.addColorStop(0, granuleColor);
      spotGrad.addColorStop(0.35, stops[1]);
      spotGrad.addColorStop(0.7, stops[2]);
      spotGrad.addColorStop(1, flareColor);
      ctx.fillStyle = spotGrad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    state.celestialTextureCache[key] = tex;
    return tex;
  }

  function getPlanetTexture(
    state: NonNullable<typeof threeRef.current>,
    subId: string,
    colorHex: string
  ) {
    const key = 'planet_' + subId;
    if (state.celestialTextureCache[key]) return state.celestialTextureCache[key];

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    if (subId === 'sub-llm') {
      const bands = ['#1e1b4b', '#4338ca', '#7c3aed', '#c084fc', '#e9d5ff', '#6d28d9', '#312e81'];
      let y = 0;
      for (let i = 0; i < 14; i++) {
        const h = (256 / 14) + (Math.sin(i) * 3);
        ctx.fillStyle = bands[i % bands.length];
        ctx.fillRect(0, y, 512, h + 2);
        y += h;
      }
      for (let i = 0; i < 30; i++) {
        ctx.fillStyle = 'rgba(253, 224, 71, 0.18)';
        ctx.beginPath();
        ctx.ellipse(Math.random() * 512, 40 + Math.random() * 170, 35 + Math.random() * 40, 6 + Math.random() * 8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (subId === 'sub-rag') {
      const bands = ['#042f2e', '#0f766e', '#14b8a6', '#2dd4bf', '#99f6e4', '#0d9488'];
      let y = 0;
      for (let i = 0; i < 12; i++) {
        const h = 256 / 12;
        ctx.fillStyle = bands[i % bands.length];
        ctx.fillRect(0, y, 512, h + 2);
        y += h;
      }
      ctx.fillStyle = 'rgba(204, 251, 241, 0.35)';
      ctx.fillRect(0, 0, 512, 45);
      ctx.fillRect(0, 211, 512, 45);
    } else if (subId === 'sub-video-edit') {
      const lavaBg = ctx.createLinearGradient(0, 0, 0, 256);
      lavaBg.addColorStop(0, '#1c1917');
      lavaBg.addColorStop(0.5, '#7f1d1d');
      lavaBg.addColorStop(1, '#1c1917');
      ctx.fillStyle = lavaBg;
      ctx.fillRect(0, 0, 512, 256);
      for (let i = 0; i < 50; i++) {
        ctx.strokeStyle = (i % 3 === 0) ? '#fde047' : ((i % 2 === 0) ? '#ef4444' : '#f97316');
        ctx.lineWidth = 2.5 + Math.random() * 3.5;
        ctx.beginPath();
        let px = Math.random() * 512, py = Math.random() * 256;
        ctx.moveTo(px, py);
        for (let step = 0; step < 5; step++) {
          px += (Math.random() - 0.5) * 60;
          py += (Math.random() - 0.5) * 40;
          ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
    } else if (subId === 'sub-video-ai') {
      const bands = ['#4c0519', '#9f1239', '#e11d48', '#fb7185', '#fecdd3', '#fda4af'];
      let y = 0;
      for (let i = 0; i < 16; i++) {
        const h = 256 / 16;
        ctx.fillStyle = bands[i % bands.length];
        ctx.fillRect(0, y, 512, h + 2);
        y += h;
      }
      const stormGrad = ctx.createRadialGradient(220, 130, 5, 220, 130, 48);
      stormGrad.addColorStop(0, '#fff1f2');
      stormGrad.addColorStop(0.3, '#f43f5e');
      stormGrad.addColorStop(0.7, '#881337');
      stormGrad.addColorStop(1, 'rgba(76, 5, 25, 0)');
      ctx.fillStyle = stormGrad;
      ctx.beginPath();
      ctx.ellipse(220, 130, 55, 32, -0.15, 0, Math.PI * 2);
      ctx.fill();
    } else if (subId === 'sub-orm') {
      ctx.fillStyle = '#032b43';
      ctx.fillRect(0, 0, 512, 256);
      ctx.fillStyle = '#0284c7';
      for (let i = 0; i < 16; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * 512, 40 + Math.random() * 170, 25 + Math.random() * 35, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      for (let i = 0; i < 28; i++) {
        ctx.beginPath();
        ctx.ellipse(Math.random() * 512, Math.random() * 256, 40 + Math.random() * 50, 7 + Math.random() * 10, Math.random() * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (subId === 'sub-serverless-db') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 512, 256);
      for (let i = 0; i < 50; i++) {
        ctx.fillStyle = (i % 2 === 0) ? '#38bdf8' : '#e2e8f0';
        ctx.beginPath();
        ctx.arc(Math.random() * 512, Math.random() * 256, 8 + Math.random() * 22, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (subId === 'sub-fullstack') {
      ctx.fillStyle = '#075985';
      ctx.fillRect(0, 0, 512, 256);
      ctx.fillStyle = '#10b981';
      for (let i = 0; i < 18; i++) {
        const cx = Math.random() * 512, cy = 50 + Math.random() * 150;
        ctx.beginPath();
        ctx.arc(cx, cy, 30 + Math.random() * 45, 0, Math.PI * 2);
        ctx.fill();
        for (let j = 0; j < 4; j++) {
          ctx.beginPath();
          ctx.arc(cx + (Math.random() - 0.5) * 50, cy + (Math.random() - 0.5) * 35, 14 + Math.random() * 20, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      for (let i = 0; i < 22; i++) {
        ctx.beginPath();
        ctx.ellipse(Math.random() * 512, Math.random() * 256, 45 + Math.random() * 55, 8 + Math.random() * 12, (Math.random() - 0.5) * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      const bands = ['#064e3b', '#047857', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];
      let y = 0;
      for (let i = 0; i < 14; i++) {
        const h = 256 / 14;
        ctx.fillStyle = bands[i % bands.length];
        ctx.fillRect(0, y, 512, h + 2);
        y += h;
      }
      ctx.fillStyle = 'rgba(190, 242, 100, 0.35)';
      ctx.fillRect(0, 0, 512, 35);
      ctx.fillRect(0, 221, 512, 35);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    state.celestialTextureCache[key] = tex;
    return tex;
  }

  function getPlanetaryRingTexture(
    state: NonNullable<typeof threeRef.current>,
    colorHex: string,
    ringType = 'cassini'
  ) {
    const key = `ring_${colorHex}_${ringType}`;
    if (state.celestialTextureCache[key]) return state.celestialTextureCache[key];

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    const cx = 128, cy = 128;

    if (ringType === 'thin') {
      const grad = ctx.createRadialGradient(cx, cy, 95, cx, cy, 126);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.25, colorHex + 'cc');
      grad.addColorStop(0.5, colorHex + 'ff');
      grad.addColorStop(0.85, colorHex + '99');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    } else if (ringType === 'debris') {
      const grad = ctx.createRadialGradient(cx, cy, 80, cx, cy, 126);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.3, colorHex + 'aa');
      grad.addColorStop(0.6, colorHex + '44');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 180; i++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = 85 + Math.random() * 38;
        ctx.fillStyle = (i % 2 === 0) ? '#ea580c' : '#292524';
        ctx.fillRect(cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist, 1.8, 1.8);
      }
    } else {
      const grad = ctx.createRadialGradient(cx, cy, 68, cx, cy, 126);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.12, 'rgba(0,0,0,0)');
      grad.addColorStop(0.2, colorHex + '66');
      grad.addColorStop(0.45, colorHex + 'ee');
      grad.addColorStop(0.54, 'rgba(0,0,0,0.04)'); // Celah Cassini
      grad.addColorStop(0.68, colorHex + 'cc');
      grad.addColorStop(0.92, colorHex + '77');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    }

    const tex = new THREE.CanvasTexture(canvas);
    state.celestialTextureCache[key] = tex;
    return tex;
  }

  function getMoonTexture(
    state: NonNullable<typeof threeRef.current>,
    repoId: string,
    colorHex: string
  ) {
    const key = 'moon_' + repoId;
    if (state.celestialTextureCache[key]) return state.celestialTextureCache[key];

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    if (repoId === 'repo-vllm') {
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(0, 0, 256, 128);
      ctx.fillStyle = '#b45309';
      for (let i = 0; i < 28; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * 256, Math.random() * 128, 3 + Math.random() * 8, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (repoId === 'repo-openmontage') {
      ctx.fillStyle = '#fde047';
      ctx.fillRect(0, 0, 256, 128);
      for (let i = 0; i < 22; i++) {
        const cx = Math.random() * 256, cy = Math.random() * 128;
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(cx, cy, 5 + Math.random() * 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(cx, cy, 2 + Math.random() * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (repoId === 'repo-openshorts') {
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(0, 0, 256, 128);
      ctx.fillStyle = '#0284c7';
      for (let i = 0; i < 24; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * 256, Math.random() * 128, 2.5 + Math.random() * 6, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (repoId === 'repo-drizzle') {
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(0, 0, 256, 128);
      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = 1.8;
      for (let i = 0; i < 20; i++) {
        ctx.beginPath();
        let x = Math.random() * 256, y = Math.random() * 128;
        ctx.moveTo(x, y);
        ctx.bezierCurveTo(x + 40, y + 25, x + 80, y - 20, x + 120, y + 10);
        ctx.stroke();
      }
    } else if (repoId === 'repo-neon') {
      const grad = ctx.createLinearGradient(0, 0, 0, 128);
      grad.addColorStop(0, '#9a3412');
      grad.addColorStop(0.5, '#ea580c');
      grad.addColorStop(1, '#c2410c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 128);
      ctx.fillStyle = '#0369a1';
      ctx.beginPath();
      ctx.ellipse(80, 25, 38, 14, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (repoId === 'repo-nextjs') {
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(0, 0, 256, 128);
      ctx.fillStyle = '#7c2d12';
      ctx.beginPath();
      ctx.arc(128, 64, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fed7aa';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else {
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(128, 0, 128, 128);
      ctx.fillStyle = '#38bdf8';
      for (let i = 0; i < 22; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * 120, Math.random() * 128, 2.5 + Math.random() * 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    state.celestialTextureCache[key] = tex;
    return tex;
  }

  function getMeteorTexture(
    state: NonNullable<typeof threeRef.current>,
    colorHex: string
  ) {
    if (state.celestialTextureCache['meteor_' + colorHex]) return state.celestialTextureCache['meteor_' + colorHex];

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Rich saturated cosmic mineral base with glowing molten core
    const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.35, colorHex || '#f97316');
    grad.addColorStop(0.75, '#292524');
    grad.addColorStop(1, '#0c0a09');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    // Glowing hot fissures and crystal facets
    for (let i = 0; i < 35; i++) {
      const x = Math.random() * 128;
      const y = Math.random() * 128;
      ctx.fillStyle = (i % 3 === 0) ? '#ffffff' : (i % 2 === 0 ? colorHex : '#ffaa00');
      ctx.beginPath();
      ctx.arc(x, y, 1.5 + Math.random() * 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    state.celestialTextureCache['meteor_' + colorHex] = tex;
    return tex;
  }

  function getMeteorTailTexture(
    state: NonNullable<typeof threeRef.current>,
    tailType = 'fire',
    colorHex = '#f97316'
  ) {
    const key = `tail_${tailType}_${colorHex}`;
    if (state.celestialTextureCache[key]) return state.celestialTextureCache[key];

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#ffffff');

    if (tailType === 'ion') {
      grad.addColorStop(0.18, '#38bdf8');
      grad.addColorStop(0.5, '#0284c7');
      grad.addColorStop(0.85, 'rgba(3, 105, 161, 0.25)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else if (tailType === 'emerald') {
      grad.addColorStop(0.18, '#34d399');
      grad.addColorStop(0.5, '#059669');
      grad.addColorStop(0.85, 'rgba(4, 120, 87, 0.25)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else if (tailType === 'spark') {
      grad.addColorStop(0.18, '#fbbf24');
      grad.addColorStop(0.5, '#d97706');
      grad.addColorStop(0.85, 'rgba(180, 83, 9, 0.25)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else if (tailType === 'cosmic') {
      grad.addColorStop(0.18, '#c084fc');
      grad.addColorStop(0.5, '#9333ea');
      grad.addColorStop(0.85, 'rgba(88, 28, 135, 0.25)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else {
      grad.addColorStop(0.18, '#f97316');
      grad.addColorStop(0.48, '#dc2626');
      grad.addColorStop(0.85, 'rgba(153, 27, 27, 0.25)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 256);

    for (let i = 0; i < 40; i++) {
      const x = Math.random() * 128;
      const y = Math.random() * 200;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, 1.5, 1.5);
    }

    const tex = new THREE.CanvasTexture(canvas);
    state.celestialTextureCache[key] = tex;
    return tex;
  }

  function createTextSprite(text: string, colorHex: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = 'rgba(10, 15, 29, 0.85)';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(8, 8, 240, 48, 12);
        ctx.fill();
        ctx.strokeStyle = colorHex;
        ctx.lineWidth = 3;
        ctx.stroke();
      } else {
        ctx.fillRect(8, 8, 240, 48);
      }

      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 128, 32);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.92,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(52, 13, 1);
    sprite.raycast = () => {};
    return sprite;
  }

  // Camera & Filter Helpers
  const handleResetCamera = () => {
    if (!threeRef.current) return;
    clearHighlight(threeRef.current);
    flyToMacro(threeRef.current);
  };

  const handleTopDownCamera = () => {
    if (!threeRef.current) return;
    flyToTopDown(threeRef.current);
  };

  const handleUpdateStarScale = (val: number) => {
    setStarScaleMultiplier(val);
    if (!threeRef.current) return;
    threeRef.current.nodeObjects.forEach(node => {
      if (node.group) {
        gsap.to(node.group.scale, {
          x: val,
          y: val,
          z: val,
          duration: 0.3,
          ease: "power2.out",
          overwrite: "auto"
        });
      }
    });
  };

  const handleUpdateLinkGlow = (val: number) => {
    setLinkGlowOpacity(val);
    if (!threeRef.current) return;
    if (threeRef.current.edgesMeshGroup.children.length > 0) {
      threeRef.current.edgesMeshGroup.children.forEach(c => {
        const line = c as THREE.LineSegments;
        if (line.material) {
          (line.material as THREE.LineBasicMaterial).opacity = val;
        }
      });
    }
  };

  const handleUpdateNeonShadow = (val: number) => {
    setNodeNeonShadowOpacity(val);
    if (!threeRef.current) return;
    threeRef.current.nodeObjects.forEach(node => {
      if (node.innerCorona) {
        (node.innerCorona.material as THREE.SpriteMaterial).opacity = val * (node.type === 'category' ? 0.95 : 0.45);
      }
      if (node.outerCorona) {
        (node.outerCorona.material as THREE.SpriteMaterial).opacity = val * 0.65;
      }
    });
  };

  const toggleNodeType = (typeKey: string) => {
    setActiveTypes(prev => {
      const next = { ...prev, [typeKey]: !prev[typeKey] };
      applyFilters(next);
      return next;
    });
  };

  const toggleAllTypes = (enable: boolean) => {
    const next = {
      category: enable,
      subCategory: enable,
      repository: enable,
      language: enable,
      topic: enable
    };
    setActiveTypes(next);
    applyFilters(next);
  };

  const applyFilters = (types: Record<string, boolean>) => {
    if (!threeRef.current) return;
    const { nodeObjects } = threeRef.current;

    nodeObjects.forEach(node => {
      const isVisible = types[node.type] ?? true;
      if (node.group) node.group.visible = isVisible;
    });

    // Re-render garis konektor sehingga garis ke node yang dinonaktifkan langsung hilang
    renderGalaxyEdges(threeRef.current);

    // Perbarui visibilitas label kategori
    const catNodes = threeRef.current.nodeObjects.filter(n => n.type === 'category');
    threeRef.current.labelsGroup.children.forEach((sprite, idx) => {
      if (catNodes[idx] && catNodes[idx].group) {
        sprite.visible = catNodes[idx].group.visible;
      }
    });

    // Jika node yang sedang di-highlight disembunyikan, bersihkan highlight
    if (threeRef.current.selectedHighlightNode) {
      if (threeRef.current.selectedHighlightNode.group?.visible) {
        applyHighlight(threeRef.current, threeRef.current.selectedHighlightNode);
      } else {
        clearHighlight(threeRef.current);
      }
    }
  };

  // Data kategori & sub-kategori untuk Hierarchical Accordion
  const clustersData = useMemo(() => {
    if (propCategories && propCategories.length > 0) {
      return propCategories;
    }
    const catNodes = threeRef.current?.nodeObjects.filter(n => n.type === 'category') || [];
    return catNodes.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.id,
      icon: 'sparkles',
      subCategories: (threeRef.current?.nodeObjects.filter(s => s.type === 'subCategory' && s.catId === c.id) || []).map(s => ({
        id: s.id,
        name: s.name,
        slug: s.id
      }))
    }));
  }, [propCategories, stats]);

  // Node type counts for sidebar badges
  const typeCounts = useMemo(() => {
    if (!threeRef.current) {
      return { category: 4, subCategory: 8, repository: 7, language: 5, topic: 8 };
    }
    const counts: Record<string, number> = { category: 0, subCategory: 0, repository: 0, language: 0, topic: 0 };
    threeRef.current.nodeObjects.forEach(n => {
      counts[n.type] = (counts[n.type] || 0) + 1;
    });
    return counts;
  }, [stats]);

  const typeConfigItems = [
    { key: 'category', label: 'Group (☀️ Matahari)', color: '#c084fc', shapeIcon: '☀️' },
    { key: 'subCategory', label: 'Sub-Group (🪐 Planet)', color: '#38bdf8', shapeIcon: '🪐' },
    { key: 'repository', label: 'Repository (🌙 Bulan)', color: '#10b981', shapeIcon: '🌙' },
    { key: 'language', label: 'Language (☄️ Komet)', color: '#f59e0b', shapeIcon: '☄️' },
    { key: 'topic', label: 'Topic (🌠 Meteor)', color: '#f97316', shapeIcon: '🌠' }
  ];

  return (
    <div className="flex-1 relative overflow-hidden bg-[#05070b] h-full min-h-[640px] w-full rounded-2xl border border-white/10 select-none">
      {/* 3D WebGL Canvas Layer */}
      <div 
        ref={containerRef} 
        id="threejs-canvas-wrapper" 
        className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing w-full h-full" 
      />

      {/* Top Bar for 3D Graph (Kontrol Kamera & Active Highlight Banner) */}
      <div 
        style={{
          left: isFiltersCollapsed ? undefined : `${sidebarWidth + 16}px`,
          transition: isResizing ? 'none' : undefined
        }}
        className={cn(
          "absolute top-4 right-4 z-20 flex items-center gap-3 pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isFiltersCollapsed ? "left-14 justify-between" : "justify-between"
        )}
      >
        <div className="w-1" />

        {/* Center: Active Highlight Banner */}
        {highlightedNode && (
          <div className="pointer-events-auto flex items-center space-x-2.5 px-4 py-2 rounded-xl bg-purple-950/90 border border-purple-500/50 backdrop-blur-md text-xs shadow-2xl text-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span>
              Highlight Konektor: <strong className="text-cyan-300">{highlightedNode.name}</strong>
            </span>
            <span className="text-purple-300 font-mono text-[11px]">
              {connectedCount} Terhubung ({activeLinkCount} Neon Links)
            </span>
            <button
              onClick={() => threeRef.current && clearHighlight(threeRef.current)}
              className="ml-2 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer text-[10px] font-mono"
            >
              ✕ Reset
            </button>
          </div>
        )}

        {/* Right: Camera Controls Dropdown */}
        <div className="pointer-events-auto relative camera-controls-dropdown shrink-0">
          <button
            id="cameraControlsDropdownBtn"
            onClick={() => setIsControlsMenuOpen(prev => !prev)}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-[#090d16]/92 backdrop-blur-2xl hover:bg-white/10 text-slate-200 text-xs font-medium border border-white/15 shadow-xl cursor-pointer transition-colors"
          >
            <Compass className="w-4 h-4 text-purple-400" />
            <span>Kontrol Kamera</span>
            <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform duration-200", isControlsMenuOpen && "rotate-180")} />
          </button>

          {isControlsMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 glass-card rounded-xl border border-white/15 shadow-2xl p-1.5 space-y-1 z-30 dropdown-airfall bg-slate-900/95 backdrop-blur-xl">
              <button
                onClick={() => {
                  handleResetCamera();
                  setIsControlsMenuOpen(false);
                }}
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-white/10 hover:text-white transition-colors cursor-pointer text-left"
              >
                <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                <span className="flex-1 font-medium">Reset Camera</span>
              </button>

              <button
                id="topDownCameraBtn"
                onClick={() => {
                  handleTopDownCamera();
                  setIsControlsMenuOpen(false);
                }}
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-white/10 hover:text-white transition-colors cursor-pointer text-left"
              >
                <Eye className="w-3.5 h-3.5 text-sky-400" />
                <span className="flex-1 font-medium">Tampak Atas (Top-Down)</span>
              </button>

              <button
                onClick={() => setAutoRotate(prev => !prev)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-white/10 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center space-x-2.5">
                  {autoRotate ? <Play className="w-3.5 h-3.5 text-purple-400" /> : <Pause className="w-3.5 h-3.5 text-slate-400" />}
                  <span className="text-slate-200 font-medium">Auto-Rotate</span>
                </div>
                <span className={cn(
                  "text-[10px] font-mono px-2 py-0.5 rounded-full border",
                  autoRotate 
                    ? "bg-purple-500/20 text-purple-300 border-purple-400/40" 
                    : "bg-white/5 text-slate-400 border-white/10"
                )}>
                  {autoRotate ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Uncollapse Hover Area on Left Edge when Collapsed (Muncul HANYA saat didekati / hover) */}
      {isFiltersCollapsed && (
        <div 
          className="galaxy-uncollapse-zone cursor-pointer"
          onClick={() => setIsFiltersCollapsed(false)}
        >
          <button
            id="uncollapseFiltersBtn"
            onClick={(e) => {
              e.stopPropagation();
              setIsFiltersCollapsed(false);
            }}
            title="Buka Filters (Ctrl+B)"
            className="galaxy-uncollapse-btn absolute left-3.5 top-3.5 w-7 h-7 rounded-lg bg-[#0e1726]/95 backdrop-blur-md border border-sky-400/50 text-sky-400 hover:text-white hover:bg-sky-500/30 shadow-lg shadow-sky-950/60 flex items-center justify-center cursor-pointer transition-all active:scale-95"
          >
            <PanelLeftOpen className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>
      )}

      {/* Docked Left Sidebar for Filters (Menempel di tepi kanvas, frosted glass buram pekat, smooth slide motion & resizable) */}
      <aside 
        id="galaxyFiltersSidebar"
        style={{ 
          position: 'absolute',
          width: `${sidebarWidth}px`,
          transition: isResizing ? 'none' : undefined
        }}
        className={cn(
          "!absolute top-0 left-0 bottom-0 bg-[#090d16]/92 backdrop-blur-3xl border-r border-white/12 rounded-l-2xl z-20 flex flex-col shadow-[8px_0_32px_rgba(0,0,0,0.65)] select-none galaxy-filters-sidebar",
          isFiltersCollapsed && "collapsed"
        )}
      >
        {/* Drag-to-Resize Right Edge Handle */}
        <div
          id="galaxySidebarResizeHandle"
          onMouseDown={handleResizeStart}
          onDoubleClick={() => setSidebarWidth(320)}
          title="Tarik pinggir untuk mengubah ukuran menu filter (Double-click untuk reset)"
          className={cn(
            "absolute -right-1 top-0 bottom-0 w-2.5 cursor-col-resize z-40 select-none group/resize-handle flex items-center justify-center transition-colors",
            isResizing ? "bg-sky-500/20" : "hover:bg-sky-400/20 active:bg-sky-500/30"
          )}
        >
          <div 
            className={cn(
              "w-[2px] h-10 rounded-full transition-all duration-150",
              isResizing ? "bg-sky-400 scale-y-125 shadow-[0_0_8px_rgba(56,189,248,0.8)]" : "bg-white/20 group-hover/resize-handle:bg-sky-400/80 group-hover/resize-handle:scale-y-110"
            )} 
          />
        </div>

        {/* Floating Collapse Button on Sidebar Right Edge (Muncul HANYA saat didekati / hover) */}
        <button
          id="collapseFiltersBtn"
          onClick={() => setIsFiltersCollapsed(true)}
          title="Tutup Filters (Ctrl+B)"
          className="galaxy-sidebar-toggle-btn absolute -right-[1px] top-3.5 z-50 w-7 h-7 rounded-lg bg-[#0e1726]/95 backdrop-blur-md border border-sky-400/50 text-sky-400 hover:text-white hover:bg-sky-500/30 shadow-lg shadow-sky-950/60 flex items-center justify-center cursor-pointer transition-all active:scale-95"
        >
          <Columns2 className="w-4 h-4 stroke-[2.2]" />
        </button>

        {/* Filters Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 shrink-0 bg-white/[0.02]">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-400" />
            <span>FILTERS</span>
          </span>
          <div className="space-x-1.5 text-[11px] font-mono pr-2">
            <button onClick={() => toggleAllTypes(true)} className="text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer">
              All
            </button>
            <span className="text-slate-600">/</span>
            <button onClick={() => toggleAllTypes(false)} className="text-slate-400 hover:text-slate-200 hover:underline cursor-pointer">
              None
            </button>
          </div>
        </div>

          {/* Filters Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {/* Node Types Pills with Counters & Colors */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Node Types</div>
              <div className="space-y-1.5">
                {typeConfigItems.map(c => {
                  const count = typeCounts[c.key as keyof typeof typeCounts] || 0;
                  const isActive = activeTypes[c.key] ?? true;

                  return (
                    <button
                      key={c.key}
                      onClick={() => toggleNodeType(c.key)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors border cursor-pointer ${
                        isActive ? 'bg-white/10 border-white/10' : 'bg-white/5 border-white/5 opacity-50'
                      }`}
                    >
                      <span className="flex items-center space-x-2">
                        <span className="text-sm font-bold" style={{ color: c.color }}>
                          {c.shapeIcon}
                        </span>
                        <span className="text-slate-200">{c.label}</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Galaxy Clusters Hierarchical Accordion (Grup -> Sub-grup -> Repositori) */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                <span>Galaxy Clusters</span>
                {highlightedNode && (
                  <button
                    onClick={() => {
                      if (threeRef.current) {
                        clearHighlight(threeRef.current);
                      }
                    }}
                    className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="space-y-1.5 text-xs max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                {clustersData.map(cat => {
                  const isCatExpanded = expandedClusters[cat.id] ?? false;
                  const catNode = threeRef.current?.nodeObjects.find(n => n.type === 'category' && n.id === cat.id);
                  const isCatHighlighted = highlightedNode?.id === cat.id;

                  return (
                    <div key={cat.id} className="space-y-1 rounded-xl bg-white/[0.02] border border-white/5 p-1">
                      {/* Category Level (Grup Matahari ☀️) */}
                      <div className="flex items-center justify-between gap-1">
                        <button
                          type="button"
                          onClick={() => setExpandedClusters(prev => ({ ...prev, [cat.id]: !prev[cat.id] }))}
                          className="flex-1 flex items-center space-x-2 px-2 py-1.5 rounded-lg text-left hover:bg-white/5 transition-colors cursor-pointer min-w-0"
                        >
                          <ChevronDown
                            className={cn(
                              "w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200",
                              isCatExpanded && "rotate-180 text-purple-400"
                            )}
                          />
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                            style={{
                              backgroundColor: catNode?.color || '#c084fc',
                              boxShadow: isCatHighlighted ? `0 0 10px ${catNode?.color || '#c084fc'}` : 'none'
                            }}
                          />
                          <span className="truncate font-semibold text-slate-200 text-xs">{cat.name}</span>
                        </button>

                        {/* Tombol Highlight Kluster (tanpa zoom-in) */}
                        <button
                          type="button"
                          title={`Highlight Grup ${cat.name}`}
                          onClick={() => {
                            if (!threeRef.current || !catNode) return;
                            if (isCatHighlighted) {
                              clearHighlight(threeRef.current);
                            } else {
                              if (!activeTypes.category) {
                                setActiveTypes(prev => {
                                  const next = { ...prev, category: true };
                                  applyFilters(next);
                                  return next;
                                });
                              }
                              applyHighlight(threeRef.current, catNode);
                            }
                          }}
                          className={cn(
                            "px-2 py-1 rounded text-[10px] font-mono shrink-0 transition-all cursor-pointer border",
                            isCatHighlighted
                              ? "bg-purple-600/30 border-purple-500 text-white shadow-md shadow-purple-500/20"
                              : "bg-white/5 border-white/10 text-slate-400 hover:text-purple-300 hover:bg-white/10"
                          )}
                        >
                          {isCatHighlighted ? 'Active' : '☀️'}
                        </button>
                      </div>

                      {/* SubCategory Level (Sub-Grup Planet 🪐) */}
                      {isCatExpanded && cat.subCategories && cat.subCategories.length > 0 && (
                        <div className="ml-3 pl-2.5 border-l border-white/10 space-y-1 my-1">
                          {cat.subCategories.map(sub => {
                            const isSubExpanded = expandedSubGroups[sub.id] ?? false;
                            const subNode = threeRef.current?.nodeObjects.find(n => n.type === 'subCategory' && n.id === sub.id);
                            const isSubHighlighted = highlightedNode?.id === sub.id;

                            // Repositori di bawah sub-kategori ini
                            const subRepos = propRepositories.filter(
                              r => r.subCategoryId === sub.id || (r.categoryId === cat.id && r.subCategoryName?.toLowerCase() === sub.name.toLowerCase())
                            );

                            return (
                              <div key={sub.id} className="space-y-0.5">
                                <div className="flex items-center justify-between gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (subRepos.length > 0) {
                                        setExpandedSubGroups(prev => ({ ...prev, [sub.id]: !prev[sub.id] }));
                                      }
                                    }}
                                    className="flex-1 flex items-center space-x-1.5 px-2 py-1 rounded-md text-left hover:bg-white/5 transition-colors cursor-pointer min-w-0"
                                  >
                                    {subRepos.length > 0 ? (
                                      <ChevronDown
                                        className={cn(
                                          "w-3 h-3 text-slate-500 shrink-0 transition-transform duration-200",
                                          isSubExpanded && "rotate-180 text-sky-400"
                                        )}
                                      />
                                    ) : (
                                      <span className="w-3 shrink-0" />
                                    )}
                                    <span className="text-[11px] text-sky-300 truncate">🪐 {sub.name}</span>
                                  </button>

                                  <div className="flex items-center space-x-1 shrink-0">
                                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-slate-500 border border-white/5">
                                      {subRepos.length}
                                    </span>
                                    {subNode && (
                                      <button
                                        type="button"
                                        title={`Highlight Sub-grup ${sub.name}`}
                                        onClick={() => {
                                          if (!threeRef.current) return;
                                          if (isSubHighlighted) {
                                            clearHighlight(threeRef.current);
                                          } else {
                                            applyHighlight(threeRef.current, subNode);
                                          }
                                        }}
                                        className={cn(
                                          "px-1.5 py-0.5 rounded text-[9px] font-mono transition-all cursor-pointer border",
                                          isSubHighlighted
                                            ? "bg-sky-500/30 border-sky-400 text-sky-200"
                                            : "bg-white/5 border-white/5 text-slate-500 hover:text-sky-300"
                                        )}
                                      >
                                        🪐
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Repositories Level (Repositori Bulan 🌙 -> Pop up GitHub README) */}
                                {isSubExpanded && subRepos.length > 0 && (
                                  <div className="ml-3 pl-2 border-l border-white/10 space-y-0.5 my-0.5">
                                    {subRepos.map(repo => {
                                      const repoNode = threeRef.current?.nodeObjects.find(
                                        n => n.type === 'repository' && (n.id === repo.id || n.repoFullName === repo.fullName)
                                      );
                                      const isRepoHighlighted = highlightedNode?.id === repo.id || highlightedNode?.repoFullName === repo.fullName;

                                      return (
                                        <button
                                          key={repo.id}
                                          type="button"
                                          onClick={() => {
                                            if (onSelectRepo && (repo.fullName || repo.name)) {
                                              onSelectRepo(repo.fullName || repo.name);
                                            }
                                            if (threeRef.current && repoNode) {
                                              applyHighlight(threeRef.current, repoNode);
                                            }
                                          }}
                                          title={`Buka README ${repo.fullName || repo.name}`}
                                          className={cn(
                                            "w-full flex items-center justify-between px-2 py-1 rounded text-left transition-all cursor-pointer group/repo border",
                                            isRepoHighlighted
                                              ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-200 font-medium"
                                              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
                                          )}
                                        >
                                          <div className="flex items-center space-x-1.5 min-w-0">
                                            <GitBranch className="w-3 h-3 text-emerald-400 shrink-0 group-hover/repo:scale-110 transition-transform" />
                                            <span className="text-[11px] truncate group-hover/repo:text-emerald-300">
                                              {repo.name}
                                            </span>
                                          </div>
                                          <span className="text-[9px] font-mono text-amber-400/80 shrink-0 ml-1">
                                            {formatCompactNumber(repo.starsCount)} ★
                                          </span>
                                        </button>
                                      );
                                    })}
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
            </div>

            {/* Display Settings Dropdown Accordion */}
            <div className="pt-2 border-t border-white/10 text-xs space-y-2">
              <button
                type="button"
                id="displaySettingsToggleBtn"
                onClick={() => setIsDisplaySettingsOpen(prev => !prev)}
                className="w-full flex items-center justify-between text-[11px] font-mono text-slate-300 hover:text-white uppercase tracking-wider cursor-pointer py-1.5 px-1 rounded-lg hover:bg-white/5 transition-all"
              >
                <div className="flex items-center space-x-2">
                  <Sliders className="w-3.5 h-3.5 text-purple-400" />
                  <span className="font-semibold">Display Settings</span>
                </div>
                <ChevronDown
                  className={cn(
                    "w-3.5 h-3.5 transition-transform duration-200 text-slate-400",
                    isDisplaySettingsOpen && "rotate-180 text-purple-400"
                  )}
                />
              </button>

              {isDisplaySettingsOpen && (
                <div className="space-y-3 pt-1 pb-1 px-1 dropdown-airfall">
                  {/* Star Scale Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                      <span>Star Scale</span>
                      <span>{starScaleMultiplier.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.5"
                      step="0.1"
                      value={starScaleMultiplier}
                      onChange={e => handleUpdateStarScale(parseFloat(e.target.value))}
                      className="w-full accent-purple-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Edge Glow Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                      <span>Link Glow</span>
                      <span>{linkGlowOpacity.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={linkGlowOpacity}
                      onChange={e => handleUpdateLinkGlow(parseFloat(e.target.value))}
                      className="w-full accent-cyan-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Neon Sun Glow Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                      <span>Neon Sun Glow</span>
                      <span>{nodeNeonShadowOpacity.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={nodeNeonShadowOpacity}
                      onChange={e => handleUpdateNeonShadow(parseFloat(e.target.value))}
                      className="w-full accent-fuchsia-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Toggle Labels */}
                  <label className="flex items-center space-x-2.5 text-xs text-slate-300 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={showLabels}
                      onChange={e => {
                        setShowLabels(e.target.checked);
                        if (threeRef.current) threeRef.current.labelsGroup.visible = e.target.checked;
                      }}
                      className="rounded accent-purple-500"
                    />
                    <span>Show Orbit Labels</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </aside>

      {/* Node Tooltip Card on Hover (Positioned with style={{ position: 'absolute' }}) */}
      <div
        ref={tooltipRef}
        id="nodeHoverTooltip"
        style={{ position: 'absolute' }}
        className="!absolute pointer-events-none hidden z-30 p-3 rounded-xl border border-white/20 shadow-2xl text-xs space-y-1 max-w-xs transition-opacity duration-150 backdrop-blur-md bg-slate-900/90 text-white"
      >
        <div className="flex items-center space-x-2">
          <span ref={tooltipBadgeRef} id="tooltipTypeBadge" className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase" />
          <span ref={tooltipTitleRef} id="tooltipTitle" className="font-bold text-white truncate" />
        </div>
        <p ref={tooltipDescRef} id="tooltipDesc" className="text-[11px] text-slate-300 leading-tight" />
        <div ref={tooltipMetaRef} id="tooltipMeta" className="pt-1.5 border-t border-white/10 text-[10px] font-mono text-slate-400 flex items-center justify-between gap-2" />
      </div>

      {/* Modal Detail on Double Click */}
      {modalNode && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl border border-white/20 max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setModalNode(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
                style={{ backgroundColor: modalNode.color + '20', color: modalNode.color }}
              >
                {modalNode.type === 'repository' ? (
                  <GitBranch className="w-5 h-5" />
                ) : modalNode.type === 'category' ? (
                  <Folder className="w-5 h-5" />
                ) : (
                  <Star className="w-5 h-5" />
                )}
              </div>
              <div>
                <span 
                  className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold"
                  style={{ backgroundColor: modalNode.color + '25', color: modalNode.color }}
                >
                  {modalNode.type}
                </span>
                <h3 className="text-base font-bold text-white">{modalNode.name}</h3>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{modalNode.desc}</p>

            <div className="pt-3 border-t border-white/10 flex justify-end space-x-2">
              <button
                onClick={() => setModalNode(null)}
                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GalaxyGraphView;
