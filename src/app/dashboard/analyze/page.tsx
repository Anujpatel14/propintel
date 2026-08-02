'use client';

import React from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import SpotlightCard from '@/components/ui/SpotlightCard';

const MODES = [
  {
    href: '/dashboard/analyze/hold',
    icon: Home,
    title: 'Buy & Hold',
    blurb: 'Calculator, cash-flow results, AI summary, save deal, and PDF — one screen.',
    outputs: 'Cash flow · Cap · DSCR · CoC · AI',
  },
  {
    href: '/dashboard/analyze/flip',
    icon: Hammer,
    title: 'Fix & Flip',
    blurb: 'Rehab underwriting with profit, ROI, MAO, AI verdict, and save.',
    outputs: 'Profit · ROI · MAO · AI',
  },
  {
    href: '/dashboard/analyze/rental',
    icon: Building,
    title: 'Rental (long-term)',
    blurb: 'Rent vs expenses, multi-year projection, AI, and save as a rental deal.',
    outputs: 'Cash flow · Projection · AI',
  },
];

const FLOW = [
  { href: '/dashboard/explore', icon: Search, title: '1. Explore', text: 'Find via ATTOM' },
  { href: '/dashboard/properties', icon: Building2, title: '2. Properties', text: 'Save inventory in DB' },
  { href: '/dashboard/analyze', icon: Home, title: '3. Analyze', text: 'Calc + AI on our data' },
  { href: '/dashboard/deals', icon: FolderOpen, title: '4. Deals', text: 'Saved analyses' },
  { href: '/dashboard/crm', icon: Layers, title: '5. CRM', text: 'Pipeline the deal' },
  { href: '/dashboard/reports', icon: FileText, title: '6. Reports', text: 'PDF export' },
  { href: '/dashboard/portfolio', icon: PieChart, title: '7. Portfolio', text: 'Whole book' },
];

export default function AnalyzeHubPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Analyze"
        description="Underwrite a property from your database — calculator, results, AI, save deal, and report on one page. Property Explorer is for discovery only."
      />

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {FLOW.map((step) => {
          const Icon = step.icon;
          return (
            <Link
              key={step.href + step.title}
              href={step.href}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 transition hover:border-teal-800/30"
            >
              <div className="mb-1.5 flex items-center gap-1.5 text-teal-900">
                <Icon className="h-3.5 w-3.5" />
                <span className="text-[10px] font-semibold uppercase tracking-wide">{step.title}</span>
              </div>
              <p className="text-[11px] leading-snug text-[var(--muted)]">{step.text}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {MODES.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.href} href={c.href} className="group block">
              <SpotlightCard className="flex h-full flex-col p-5 transition group-hover:border-teal-800/30">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-900/10 text-teal-900">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="font-display text-xl text-foreground">{c.title}</h2>
                <p className="mt-2 flex-1 text-sm text-[var(--muted)]">{c.blurb}</p>
                <p className="mt-4 text-[10px] uppercase tracking-wide text-teal-800/80">{c.outputs}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-teal-900">
                  Open <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </SpotlightCard>
            </Link>
          );
        })}
      </div>

      <p className="text-sm text-[var(--muted)]">
        <span className="font-medium text-foreground">Property</span> = physical asset in My Properties.{' '}
        <span className="font-medium text-foreground">Deal</span> = the financial analysis you save here.
      </p>
    </div>
  );
}
