'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Building,
  TrendingUp,
  DollarSign,
  Layers,
  Plus,
  PlusCircle,
} from 'lucide-react';
import { AreaChart } from '@/components/ui/Charts';
import SpotlightCard from '@/components/ui/SpotlightCard';

const WEALTH_PROJECTION = [
  { label: 'Y1', value: 12000 },
  { label: 'Y2', value: 25000 },
  { label: 'Y3', value: 41000 },
  { label: 'Y4', value: 60000 },
  { label: 'Y5', value: 85000 },
  { label: 'Y6', value: 115000 },
  { label: 'Y7', value: 152000 },
  { label: 'Y8', value: 198000 },
  { label: 'Y9', value: 254000 },
  { label: 'Y10', value: 320000 },
];

const RECENT_ACTIVITIES = [
  { action: 'Analysis created', details: 'Buy & Hold — 1402 Oak Ridge Dr', time: '10m ago' },
  { action: 'Report exported', details: 'PDF dossier for 778 Highland Ave', time: '2h ago' },
  { action: 'Lead moved', details: '922 Cherry Ln → Offer Made', time: '4h ago' },
  { action: 'AI insights', details: 'Risk assessment for 311 Maple St', time: '1d ago' },
  { action: 'Coaching booked', details: 'Strategy call with mentor', time: '2d ago' },
];

const KPIS = [
  {
    label: 'Saved deals',
    value: '14',
    hint: '+3 this week',
    icon: Building,
  },
  {
    label: 'Monthly cash flow',
    value: '$4,250',
    hint: 'Avg $304 / door',
    icon: DollarSign,
  },
  {
    label: 'Average cap rate',
    value: '7.4%',
    hint: 'Above market 6.1%',
    icon: TrendingUp,
  },
  {
    label: 'Active leads',
    value: '8',
    hint: '$25k potential fees',
    icon: Layers,
  },
];

export default function DashboardOverviewPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-display text-3xl tracking-tight text-foreground md:text-4xl">
            Investor dashboard
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Portfolio pulse, pipeline health, and underwriting shortcuts.
          </p>
        </div>
        <Link href="/dashboard/analyzer" className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-sm">
          <Plus className="h-4 w-4" /> New underwrite
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <SpotlightCard className="flex items-start justify-between p-5">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                    {kpi.label}
                  </div>
                  <div className="mt-1 text-2xl font-extrabold tracking-tight">{kpi.value}</div>
                  <p className="mt-1 text-[11px] font-semibold text-teal-800">{kpi.hint}</p>
                </div>
                <div className="rounded-xl bg-teal-700/10 p-2.5 text-teal-800">
                  <Icon className="h-5 w-5" />
                </div>
              </SpotlightCard>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="surface-card p-6 lg:col-span-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold">10-year cumulative cash flow</h2>
              <p className="text-xs text-[var(--muted)]">
                Modeled from active average returns and appreciation.
              </p>
            </div>
            <span className="rounded-md bg-teal-700/10 px-2 py-1 text-[10px] font-bold uppercase text-teal-800">
              Projection
            </span>
          </div>
          <AreaChart data={WEALTH_PROJECTION} height={260} color="#0f766e" />
        </div>

        <div className="space-y-5 lg:col-span-4">
          <div className="surface-card space-y-3 p-5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Quick actions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/dashboard/analyzer"
                className="flex flex-col items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3 text-center transition hover:border-teal-700/25"
              >
                <PlusCircle className="h-5 w-5 text-teal-700" />
                <span className="text-xs font-semibold">Analyze</span>
              </Link>
              <Link
                href="/dashboard/crm"
                className="flex flex-col items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3 text-center transition hover:border-teal-700/25"
              >
                <Layers className="h-5 w-5 text-teal-700" />
                <span className="text-xs font-semibold">CRM</span>
              </Link>
            </div>
          </div>

          <div className="surface-card space-y-4 p-5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Recent activity
            </h3>
            <div className="max-h-[240px] space-y-4 overflow-y-auto pr-1">
              {RECENT_ACTIVITIES.map((act) => (
                <div key={act.action + act.time} className="flex justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-foreground">{act.action}</div>
                    <div className="mt-0.5 leading-snug text-[var(--muted)]">{act.details}</div>
                  </div>
                  <span className="shrink-0 text-[10px] text-[var(--muted-foreground)]">{act.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
