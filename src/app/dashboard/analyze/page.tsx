'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Home,
  Hammer,
  Building,
  Search,
  Building2,
  FolderOpen,
  FileText,
  Layers,
  PieChart,
  Sparkles,
  Calculator,
} from 'lucide-react';

const MODES = [
  {
    href: '/dashboard/analyze/hold',
    icon: Home,
    title: 'Buy & Hold',
    blurb: 'Cash flow, cap rate, DSCR, CoC — then AI, save deal, and PDF on one screen.',
    outputs: ['Cash flow', 'Cap', 'DSCR', 'CoC', 'AI'],
    accent: 'from-neutral-500/20 to-neutral-400/5',
  },
  {
    href: '/dashboard/analyze/flip',
    icon: Hammer,
    title: 'Fix & Flip',
    blurb: 'Rehab underwriting with profit, ROI, MAO, AI verdict, and one-click save.',
    outputs: ['Profit', 'ROI', 'MAO', 'AI'],
    accent: 'from-neutral-400/15 to-neutral-500/5',
  },
  {
    href: '/dashboard/analyze/rental',
    icon: Building,
    title: 'Rental (long-term)',
    blurb: 'Rent vs expenses, multi-year projection chart, AI, and save as a rental deal.',
    outputs: ['Cash flow', 'Projection', 'AI'],
    accent: 'from-neutral-500/15 to-neutral-400/5',
  },
];

const FLOW = [
  { href: '/dashboard/explore', icon: Search, title: 'Explore', text: 'Find via ATTOM', step: '01' },
  { href: '/dashboard/properties', icon: Building2, title: 'Properties', text: 'Save inventory', step: '02' },
  { href: '/dashboard/analyze', icon: Calculator, title: 'Analyze', text: 'Calc + AI', step: '03', active: true },
  { href: '/dashboard/deals', icon: FolderOpen, title: 'Deals', text: 'Saved analyses', step: '04' },
  { href: '/dashboard/crm', icon: Layers, title: 'CRM', text: 'Pipeline', step: '05' },
  { href: '/dashboard/reports', icon: FileText, title: 'Reports', text: 'PDF export', step: '06' },
  { href: '/dashboard/portfolio', icon: PieChart, title: 'Portfolio', text: 'Whole book', step: '07' },
];

export default function AnalyzeHubPage() {
  return (
    <div className="mx-auto max-w-[1200px] space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#dbe7ff] px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-[#1639a8] uppercase">
            Underwrite · Calculator + AI
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-[#0b1220] sm:text-4xl">
            Analyze
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-[var(--muted)]">
            Underwrite from your database — calculator, results, AI, save deal, and report on one
            page. Explorer is for discovery only.
          </p>
        </div>
        <Link
          href="/dashboard/properties"
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3.5 py-2 text-sm font-semibold shadow-sm hover:bg-[var(--surface-soft)]"
        >
          <Building2 className="h-4 w-4 text-blue-800" /> Pick from My Properties
        </Link>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[#0b1220] p-5 text-white sm:p-6"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_80%_at_100%_0%,rgba(59,130,246,0.35),transparent_55%)]" />
        <div className="relative mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-200" />
          <p className="text-[10px] font-bold tracking-[0.16em] text-blue-200/80 uppercase">
            Investor workflow
          </p>
        </div>
        <div className="relative grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {FLOW.map((step) => {
            const Icon = step.icon;
            return (
              <Link
                key={step.href + step.title}
                href={step.href}
                className={`rounded-2xl border px-3 py-3 transition ${
                  step.active
                    ? 'border-white/30 bg-white/15'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-white/45">{step.step}</span>
                  <Icon className="h-3.5 w-3.5 text-blue-200" />
                </div>
                <p className="mt-2 text-xs font-semibold">{step.title}</p>
                <p className="mt-0.5 text-[11px] text-white/55">{step.text}</p>
              </Link>
            );
          })}
        </div>
      </motion.section>

      <div className="grid gap-4 md:grid-cols-3">
        {MODES.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.href}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
            >
              <Link href={c.href} className="group block h-full">
                <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.04)] transition group-hover:border-blue-700/35 group-hover:shadow-md">
                  <div
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${c.accent} opacity-80`}
                  />
                  <div className="relative">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1d4ed8] text-white shadow-sm">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h2 className="mt-4 font-display text-xl font-bold tracking-tight text-[#0b1220]">
                      {c.title}
                    </h2>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--muted)]">
                      {c.blurb}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {c.outputs.map((o) => (
                        <span
                          key={o}
                          className="rounded-lg bg-white/80 px-2 py-0.5 text-[10px] font-bold tracking-wide text-blue-900 uppercase ring-1 ring-blue-700/10"
                        >
                          {o}
                        </span>
                      ))}
                    </div>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-900">
                      Open analyzer{' '}
                      <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <p className="text-sm text-[var(--muted)]">
        <span className="font-semibold text-foreground">Property</span> = asset in My Properties ·{' '}
        <span className="font-semibold text-foreground">Deal</span> = the analysis you save here.
      </p>
    </div>
  );
}
