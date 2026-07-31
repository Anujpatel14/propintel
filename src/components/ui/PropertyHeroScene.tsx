'use client';

import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * Full-bleed animated property neighborhood for the hero.
 * Houses, skyline, and soft parallax — the visual plane itself, not overlay cards.
 */
export default function PropertyHeroScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 20 });
  const sy = useSpring(my, { stiffness: 40, damping: 20 });

  const farX = useTransform(sx, (v) => v * -18);
  const midX = useTransform(sx, (v) => v * -32);
  const nearX = useTransform(sx, (v) => v * -48);
  const farY = useTransform(sy, (v) => v * -8);
  const midY = useTransform(sy, (v) => v * -14);
  const nearY = useTransform(sy, (v) => v * -22);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      mx.set((e.clientX - rect.left) / rect.width - 0.5);
      my.set((e.clientY - rect.top) / rect.height - 0.5);
    };

    el.addEventListener('mousemove', onMove);
    return () => el.removeEventListener('mousemove', onMove);
  }, [mx, my]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {/* Sky wash */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#dfecea] via-[#eef3f1] to-[#f3f5f4]" />
      <div className="absolute inset-0 blueprint-grid opacity-60" />

      {/* Soft sun glow */}
      <motion.div
        className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#f5e6c8]/50 blur-3xl"
        style={{ x: farX, y: farY }}
      />

      {/* Distant hills */}
      <motion.svg
        className="absolute bottom-[28%] left-[-5%] w-[110%] opacity-40"
        viewBox="0 0 1400 220"
        style={{ x: farX, y: farY }}
      >
        <path
          d="M0 160 C180 90 320 180 480 120 C640 60 760 150 920 100 C1080 50 1220 130 1400 80 L1400 220 L0 220 Z"
          fill="#b7cdc4"
        />
      </motion.svg>

      {/* Mid skyline */}
      <motion.div
        className="absolute bottom-[18%] left-0 right-0 flex items-end justify-center gap-3 px-4 md:gap-5"
        style={{ x: midX, y: midY }}
      >
        <Building shape="tower" delay={0.1} h={140} w={56} />
        <Building shape="flat" delay={0.2} h={96} w={72} />
        <Building shape="house" delay={0.05} h={110} w={90} />
        <Building shape="tower" delay={0.25} h={168} w={48} />
        <Building shape="house" delay={0.15} h={118} w={100} />
        <Building shape="flat" delay={0.3} h={88} w={80} />
        <Building shape="tower" delay={0.18} h={150} w={52} className="hidden sm:block" />
        <Building shape="house" delay={0.22} h={104} w={86} className="hidden md:block" />
      </motion.div>

      {/* Near street / lawn */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[22%] bg-gradient-to-t from-[#c9d8d1] via-[#d7e4de] to-transparent"
        style={{ x: nearX, y: nearY }}
      />

      {/* Near property silhouettes */}
      <motion.div
        className="absolute bottom-[8%] left-[6%] hidden md:block"
        style={{ x: nearX, y: nearY }}
      >
        <HouseIllustration className="animate-float-slow opacity-90" />
      </motion.div>
      <motion.div
        className="absolute bottom-[6%] right-[8%] hidden lg:block"
        style={{ x: nearX, y: nearY }}
      >
        <HouseIllustration flipped className="animate-float opacity-85" />
      </motion.div>

      {/* Soft ground fog */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#f3f5f4] via-[#f3f5f4]/80 to-transparent" />

      {/* Edge vignette for text readability */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#f3f5f4]/95 via-[#f3f5f4]/35 to-[#f3f5f4]/70" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#f3f5f4]/50 via-transparent to-[#f3f5f4]" />
    </div>
  );
}

function Building({
  shape,
  h,
  w,
  delay = 0,
  className = '',
}: {
  shape: 'tower' | 'flat' | 'house';
  h: number;
  w: number;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={`relative ${className}`}
      style={{ width: w, height: h }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {shape === 'house' ? (
        <svg viewBox="0 0 100 110" className="h-full w-full drop-shadow-sm">
          <polygon points="8,48 50,12 92,48" fill="#0f766e" opacity="0.85" />
          <rect x="14" y="48" width="72" height="58" rx="3" fill="#134e4a" />
          <rect x="40" y="72" width="20" height="34" fill="#f3f5f4" opacity="0.9" />
          <rect x="22" y="58" width="16" height="14" fill="#dfecea" opacity="0.85" />
          <rect x="62" y="58" width="16" height="14" fill="#dfecea" opacity="0.85" />
        </svg>
      ) : shape === 'tower' ? (
        <svg viewBox="0 0 60 160" className="h-full w-full drop-shadow-sm">
          <rect x="8" y="0" width="44" height="160" rx="2" fill="#1a3d36" />
          {Array.from({ length: 8 }).map((_, i) => (
            <g key={i}>
              <rect x="14" y={12 + i * 18} width="10" height="8" fill="#9ec5bc" opacity="0.7" />
              <rect x="36" y={12 + i * 18} width="10" height="8" fill="#9ec5bc" opacity="0.7" />
            </g>
          ))}
        </svg>
      ) : (
        <svg viewBox="0 0 90 100" className="h-full w-full drop-shadow-sm">
          <rect x="0" y="20" width="90" height="80" rx="2" fill="#245c52" />
          <rect x="0" y="10" width="90" height="14" fill="#0f766e" />
          {Array.from({ length: 3 }).map((_, row) =>
            Array.from({ length: 4 }).map((_, col) => (
              <rect
                key={`${row}-${col}`}
                x={10 + col * 20}
                y={32 + row * 22}
                width="12"
                height="10"
                fill="#cfe3dc"
                opacity="0.75"
              />
            ))
          )}
        </svg>
      )}
    </motion.div>
  );
}

function HouseIllustration({
  flipped = false,
  className = '',
}: {
  flipped?: boolean;
  className?: string;
}) {
  return (
    <svg
      width="220"
      height="160"
      viewBox="0 0 220 160"
      className={`${className} ${flipped ? 'scale-x-[-1]' : ''}`}
    >
      <ellipse cx="110" cy="148" rx="90" ry="10" fill="#9fb8ae" opacity="0.45" />
      <polygon points="30,78 110,18 190,78" fill="#0f766e" />
      <rect x="42" y="78" width="136" height="70" rx="4" fill="#134e4a" />
      <rect x="92" y="98" width="36" height="50" fill="#f7f9f8" />
      <rect x="56" y="92" width="24" height="20" rx="2" fill="#dfecea" />
      <rect x="140" y="92" width="24" height="20" rx="2" fill="#dfecea" />
      <circle cx="122" cy="124" r="2.5" fill="#0f766e" />
      <rect x="150" y="48" width="18" height="28" fill="#245c52" />
    </svg>
  );
}
