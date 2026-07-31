'use client';

import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * Atmospheric full-bleed hero plane — soft hills, sky wash, property villa silhouette.
 * Mouse parallax for depth (Aceternity / React Bits style presence).
 */
export default function AtmosphericHero() {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 35, damping: 22 });
  const sy = useSpring(my, { stiffness: 35, damping: 22 });

  const farX = useTransform(sx, (v) => v * -20);
  const midX = useTransform(sx, (v) => v * -36);
  const nearX = useTransform(sx, (v) => v * -55);
  const farY = useTransform(sy, (v) => v * -10);
  const midY = useTransform(sy, (v) => v * -16);
  const nearY = useTransform(sy, (v) => v * -24);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      mx.set((e.clientX - r.left) / r.width - 0.5);
      my.set((e.clientY - r.top) / r.height - 0.5);
    };
    el.addEventListener('mousemove', onMove);
    return () => el.removeEventListener('mousemove', onMove);
  }, [mx, my]);

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden" aria-hidden>
      {/* Soft sky gradient — Nurse-inspired pastel atmosphere */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#c9d9cf] via-[#d8e4dc] to-[#b7c9bb]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(255,210,180,0.35),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,rgba(255,255,255,0.25),transparent_45%)]" />

      {/* Property photograph — real visual anchor */}
      <motion.div className="absolute inset-0" style={{ x: farX, y: farY }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2400&q=80"
          alt=""
          className="animate-kenburns h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#3d5a4c]/75 via-[#3d5a4c]/35 to-[#3d5a4c]/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2a3d34]/70 via-transparent to-[#3d5a4c]/25" />
      </motion.div>

      {/* Soft fog layers */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[45%] bg-gradient-to-t from-[#dfe8e2]/90 via-[#dfe8e2]/40 to-transparent"
        style={{ x: midX, y: midY }}
      />

      {/* Floating architectural accents */}
      <motion.div className="absolute bottom-[18%] left-[8%] hidden opacity-80 lg:block" style={{ x: nearX, y: nearY }}>
        <div className="h-28 w-40 rounded-2xl border border-white/25 bg-white/10 shadow-xl backdrop-blur-md" />
      </motion.div>
      <motion.div
        className="absolute bottom-[22%] right-[38%] hidden opacity-70 md:block"
        style={{ x: midX, y: midY }}
      >
        <div className="h-16 w-24 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm" />
      </motion.div>
    </div>
  );
}
