'use client';

import React, { useRef, useEffect } from 'react';

interface ThreeBackdropProps {
  theme?: 'aurora' | 'sunset' | 'frost';
  isPlaying?: boolean;
}

export function ThreeBackdrop({ theme = 'aurora', isPlaying = true }: ThreeBackdropProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying]);

  return (
    <>
      {/* Background Video Looping */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover pointer-events-none z-0 glass-bg-video"
      >
        <source src="/bg-video.mp4" type="video/mp4" />
      </video>

      {/* Ambient Glowing Glass Orbs for Depth */}
      <div className="glass-orb-1" />
      <div className="glass-orb-2" />
      <div className="glass-orb-3" />
    </>
  );
}

