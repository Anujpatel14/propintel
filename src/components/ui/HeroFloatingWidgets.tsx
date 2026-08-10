'use client';

import React from 'react';

/** Static product UI overlays — one-shot CSS entrance, no infinite loops. */
export default function HeroFloatingWidgets() {
  return (
    <div className="pointer-events-none relative mx-auto h-[340px] w-full max-w-[420px] md:h-[420px]">
      {/* Occupancy donut */}
      <div className="hero-widget landing-glass absolute left-0 top-2 w-[148px] rounded-2xl p-4 md:left-2 md:top-4 md:w-[168px]">
        <div className="text-[10px] font-semibold tracking-wide text-[#5b6578]">OCCUPANCY</div>
        <div className="relative mx-auto mt-3 h-[88px] w-[88px]">
          <svg viewBox="0 0 96 96" className="h-full w-full -rotate-90">
            <circle cx="48" cy="48" r="36" fill="none" stroke="#e8eef8" strokeWidth="10" />
            <circle
              cx="48"
              cy="48"
              r="36"
              fill="none"
              stroke="#1d4ed8"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 36}`}
              strokeDashoffset={2 * Math.PI * 36 * (1 - 0.74)}
            />
            <circle
              cx="48"
              cy="48"
              r="36"
              fill="none"
              stroke="#10b981"
              strokeWidth="10"
              strokeDasharray={`${2 * Math.PI * 36 * 0.18} ${2 * Math.PI * 36}`}
              strokeDashoffset={-2 * Math.PI * 36 * 0.74}
              strokeLinecap="round"
              opacity="0.85"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-2xl font-bold tracking-tight text-[#0b1220]">74%</span>
          </div>
        </div>
      </div>

      {/* Portfolio growth card */}
      <div className="hero-widget hero-widget-delay-1 landing-glass absolute right-0 top-16 w-[210px] rounded-2xl p-4 md:right-0 md:top-20 md:w-[240px]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dbe7ff] text-xs font-bold text-[#1d4ed8]">
            BW
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-[#0b1220]">Bruno Walker</div>
            <div className="text-[10px] text-[#5b6578]">Portfolio value</div>
          </div>
        </div>
        <div className="mt-3 font-display text-2xl font-bold tracking-tight text-[#0b1220]">
          $242,401
        </div>
        <div className="mt-3 flex h-12 items-end gap-1">
          {[35, 48, 42, 62, 55, 78, 70, 88, 76, 94].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-[#1d4ed8]/85"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="mt-2 text-[10px] font-semibold text-[#047857]">+18.2% this quarter</div>
      </div>

      {/* Live AI verdict chip */}
      <div className="hero-widget hero-widget-delay-2 landing-glass absolute bottom-4 left-6 right-4 rounded-2xl p-4 md:bottom-8 md:left-10 md:right-8">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider text-[#1d4ed8]">
            <span className="h-2 w-2 rounded-full bg-[#1d4ed8]" />
            LIVE VERDICT
          </div>
          <span className="rounded-md bg-[#d1fae5] px-2 py-0.5 text-[10px] font-bold text-[#047857]">
            STRONG BUY
          </span>
        </div>
        <div className="mt-2 text-sm font-semibold text-[#0b1220]">1402 Oak Ridge Dr · Dallas</div>
        <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-[#5b6578]">
          <span className="rounded-md bg-[#f3f6fb] px-2 py-1 font-medium">CF +$312</span>
          <span className="rounded-md bg-[#f3f6fb] px-2 py-1 font-medium">Cap 7.2%</span>
          <span className="rounded-md bg-[#f3f6fb] px-2 py-1 font-medium">DSCR 1.35</span>
        </div>
      </div>
    </div>
  );
}
