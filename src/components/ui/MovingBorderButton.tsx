'use client';

import React, { useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';

interface MovingBorderButtonProps {
  children: React.ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

export default function MovingBorderButton({
  children,
  className = '',
  href,
  onClick,
  type = 'button',
  disabled,
}: MovingBorderButtonProps) {
  const ref = useRef<HTMLElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const background = useMotionTemplate`radial-gradient(140px circle at ${x}px ${y}px, rgba(15,118,110,0.35), transparent 60%)`;

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    x.set(e.clientX - rect.left);
    y.set(e.clientY - rect.top);
  };

  const shared =
    `relative inline-flex items-center justify-center overflow-hidden rounded-[0.9rem] px-7 py-3.5 text-sm font-bold text-teal-950 transition ${className}`;

  const inner = (
    <>
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-[0.95rem] opacity-70"
        style={{ background }}
      />
      <span className="absolute inset-[1.5px] rounded-[0.82rem] bg-gradient-to-br from-teal-500 to-teal-700" />
      <span className="relative z-10 flex items-center gap-2 text-teal-50">{children}</span>
    </>
  );

  if (href) {
    return (
      <a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        onMouseMove={onMove}
        className={shared}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseMove={onMove}
      className={`${shared} disabled:opacity-50`}
    >
      {inner}
    </button>
  );
}
