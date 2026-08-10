'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MESSAGES = [
  { role: 'ai' as const, text: 'Analyzing 1402 Oak Ridge Dr…' },
  { role: 'user' as const, text: 'Buy & hold — $220k purchase' },
  { role: 'ai' as const, text: 'Cash flow +$312/mo · Cap 7.2% · DSCR 1.35' },
  { role: 'ai' as const, text: 'Verdict: Strong buy — healthy equity cushion.' },
];

/** Animated AI underwriting preview — used in platform / insights sections. */
export default function FloatingDealCard() {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (visible >= MESSAGES.length) return;
    const t = setTimeout(() => setVisible((v) => v + 1), visible === 0 ? 600 : 1100);
    return () => clearTimeout(t);
  }, [visible]);

  useEffect(() => {
    if (visible < MESSAGES.length) return;
    const t = setTimeout(() => setVisible(0), 4200);
    return () => clearTimeout(t);
  }, [visible]);

  return (
    <motion.div
      className="landing-glass relative w-full max-w-[360px] rounded-[1.5rem] p-5"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wide text-[#1d4ed8]">
          <span className="animate-pulse-dot inline-block h-2 w-2 rounded-full bg-[#1d4ed8]" />
          LIVE ANALYSIS
        </div>
        <span className="text-[10px] font-medium tracking-wider text-[#5b6578]">AI ENGINE</span>
      </div>

      <div className="flex min-h-[220px] flex-col gap-2.5">
        <AnimatePresence mode="popLayout">
          {MESSAGES.slice(0, visible).map((msg, i) => (
            <motion.div
              key={`${msg.text}-${i}`}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-snug ${
                msg.role === 'ai'
                  ? 'self-start bg-[#0b1220] text-[#f8fafc]'
                  : 'self-end bg-white text-[#0b1220] shadow-sm'
              }`}
            >
              {msg.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-[rgba(11,18,32,0.08)] bg-white/60 px-3 py-2.5">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#dbe7ff]">
          <motion.div
            className="h-full rounded-full bg-[#1d4ed8]"
            initial={{ width: '8%' }}
            animate={{ width: visible >= MESSAGES.length ? '100%' : `${18 + visible * 22}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <span className="text-[10px] font-semibold text-[#1d4ed8]">AI</span>
      </div>
    </motion.div>
  );
}
