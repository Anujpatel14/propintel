'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Cpu, FileDown, Loader2, Save } from 'lucide-react';

export function AnalyzeField({
  label,
  value,
  onChange,
  suffix,
  prefix,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  suffix?: string;
  prefix?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] font-bold tracking-[0.12em] text-[var(--muted)] uppercase">
        {label}
      </span>
      <div className="relative">
        {prefix ? (
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-semibold text-[var(--muted)]">
            {prefix}
          </span>
        ) : null}
        <input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2.5 text-sm outline-none transition focus:border-blue-700/40 focus:ring-2 focus:ring-blue-700/10 ${
            prefix ? 'pr-3 pl-7' : 'px-3'
          } ${suffix ? 'pr-10' : ''}`}
        />
        {suffix ? (
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold text-[var(--muted)]">
            {suffix}
          </span>
        ) : null}
      </div>
    </label>
  );
}

export function AnalyzeAddressField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block space-y-1.5 sm:col-span-2">
      <span className="text-[10px] font-bold tracking-[0.12em] text-[var(--muted)] uppercase">
        Address
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-blue-700/40 focus:ring-2 focus:ring-blue-700/10"
      />
    </label>
  );
}

export function AnalyzeActions({
  aiRunning,
  saving,
  onAi,
  onSave,
  onReport,
}: {
  aiRunning: boolean;
  saving: boolean;
  onAi: () => void;
  onSave: () => void;
  onReport: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/dashboard/analyze"
        className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-sm font-semibold shadow-sm hover:bg-[var(--surface-soft)]"
      >
        <ArrowLeft className="h-4 w-4" /> Hub
      </Link>
      <button
        type="button"
        disabled={aiRunning}
        onClick={onAi}
        className="inline-flex items-center gap-2 rounded-xl border border-blue-700/25 bg-[#eff4ff] px-3.5 py-2 text-sm font-semibold text-blue-900 disabled:opacity-60"
      >
        {aiRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cpu className="h-4 w-4" />}
        Run AI
      </button>
      <button
        type="button"
        disabled={saving}
        onClick={onSave}
        className="inline-flex items-center gap-2 rounded-xl bg-[var(--cobalt)] px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--cobalt-deep)] disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save deal
      </button>
      <button
        type="button"
        onClick={onReport}
        className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-sm font-semibold shadow-sm hover:bg-[var(--surface-soft)]"
      >
        <FileDown className="h-4 w-4" /> PDF
      </button>
    </div>
  );
}

export function MetricTile({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'good' | 'bad' | 'neutral';
}) {
  const color =
    tone === 'good'
      ? 'text-[var(--success-fg)]'
      : tone === 'bad'
        ? 'text-[var(--danger-fg)]'
        : 'text-[var(--ink)]';
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
      <p className="text-[10px] font-bold tracking-[0.12em] text-[var(--muted)] uppercase">
        {label}
      </p>
      <p className={`mt-1 font-display text-xl font-bold tracking-tight ${color}`}>{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold tracking-[0.14em] text-[var(--sky-fg)] uppercase">
      {children}
    </p>
  );
}
