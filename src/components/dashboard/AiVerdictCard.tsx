'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, Cpu, Sparkles } from 'lucide-react';
import type { AiVerdictPreview } from '@/app/actions/analyzeActions';

const VERDICT_STYLES: Record<
  string,
  { badge: string; bar: string; label: string }
> = {
  'STRONG BUY': {
    badge: 'bg-blue-700 text-white',
    bar: 'border-blue-700/30 bg-blue-700/5',
    label: 'Strong Buy',
  },
  'ACQUIRE WITH CAUTION': {
    badge: 'bg-amber-600 text-white',
    bar: 'border-[var(--amber-border)] bg-[var(--amber-soft)]',
    label: 'Acquire with caution',
  },
  'PASS OR RE-NEGOTIATE': {
    badge: 'bg-red-700 text-white',
    bar: 'border-[var(--danger-border)] bg-[var(--danger-soft)]',
    label: 'Pass or re-negotiate',
  },
};

export function AiVerdictCard({
  analysis,
  compact,
}: {
  analysis: AiVerdictPreview;
  compact?: boolean;
}) {
  const style = VERDICT_STYLES[analysis.verdict] || VERDICT_STYLES['ACQUIRE WITH CAUTION'];

  return (
    <div className={`overflow-hidden rounded-2xl border ${style.bar}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_70%,transparent)] px-5 py-4">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Cpu className="h-4 w-4 shrink-0 text-[var(--cobalt)]" />
            AI underwriting verdict
          </div>
          <p className="truncate text-xs text-[var(--muted)]">{analysis.address}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${style.badge}`}>
            {style.label}
          </span>
          <span className="rounded-lg border border-[var(--border)] bg-white px-2 py-1 text-[10px] font-semibold uppercase text-[var(--muted)]">
            {analysis.provider === 'openrouter' ? (
              <span className="inline-flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> OpenRouter
              </span>
            ) : (
              'Rule engine'
            )}
          </span>
        </div>
      </div>

      <div className="space-y-5 p-5">
        {analysis.headline && (
          <p className="text-sm leading-relaxed text-foreground">{analysis.headline}</p>
        )}

        {!compact && analysis.summary.length > 0 && (
          <div>
            <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Key metrics
            </h4>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {analysis.summary.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-xs"
                >
                  <span className="text-[var(--muted)]">{row.label}</span>
                  <span className="font-bold text-foreground">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={`grid grid-cols-1 gap-4 ${compact ? '' : 'md:grid-cols-2'}`}>
          <section>
            <h4 className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-800">
              <CheckCircle2 className="h-3.5 w-3.5" /> Strengths
            </h4>
            <ul className="space-y-2">
              {analysis.strengths.map((s, i) => (
                <li
                  key={`${s.title}-${i}`}
                  className="rounded-xl border border-blue-700/15 bg-[var(--surface)] px-3 py-2.5 text-xs"
                >
                  <div className="font-bold text-blue-900">{s.title}</div>
                  <p className="mt-0.5 leading-relaxed text-[var(--muted)]">{s.detail}</p>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h4 className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-900">
              <AlertTriangle className="h-3.5 w-3.5" /> Risks
            </h4>
            <ul className="space-y-2">
              {analysis.risks.map((r, i) => (
                <li
                  key={`${r.title}-${i}`}
                  className="rounded-xl border border-amber-500/20 bg-[var(--surface)] px-3 py-2.5 text-xs"
                >
                  <div className="font-bold text-amber-950">{r.title}</div>
                  <p className="mt-0.5 leading-relaxed text-[var(--muted)]">{r.detail}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <p className="text-[10px] text-[var(--muted-foreground)]">
          {analysis.id.startsWith('preview-')
            ? 'Draft — save to keep this on Saved deals'
            : `Saved ${new Date(analysis.createdAt).toLocaleString()}${
                analysis.modelName ? ` · ${analysis.modelName}` : ''
              }`}
        </p>
      </div>
    </div>
  );
}
