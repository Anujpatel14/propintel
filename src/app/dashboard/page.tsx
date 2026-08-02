'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Building,
  TrendingUp,
  DollarSign,
  Layers,
  Plus,
  PlusCircle,
  Search,
} from 'lucide-react';
import { AreaChart } from '@/components/ui/Charts';
import PageHeader from '@/components/dashboard/PageHeader';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { Skeleton, SkeletonRows, SkeletonValue } from '@/components/ui/Skeleton';
import { getInvestorDashboard } from '@/app/actions/dashboardActions';

type DashboardData = Awaited<ReturnType<typeof getInvestorDashboard>>;

export default function DashboardOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const result = await getInvestorDashboard();
        setData(result);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const metrics = data?.metrics;
  const kpis = [
    {
      label: 'Saved deals',
      value: metrics ? String(metrics.savedDeals) : null,
      hint: metrics?.savedDealsHint,
      icon: Building,
    },
    {
      label: 'Monthly cash flow',
      value: metrics ? `$${metrics.monthlyCashFlow.toLocaleString()}` : null,
      hint: metrics?.cashFlowHint,
      icon: DollarSign,
    },
    {
      label: 'Average cap rate',
      value: metrics ? `${metrics.avgCapRate}%` : null,
      hint: metrics?.capHint,
      icon: TrendingUp,
    },
    {
      label: 'Active leads',
      value: metrics ? String(metrics.activeLeads) : null,
      hint: metrics?.leadsHint,
      icon: Layers,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        title="Investor dashboard"
        description="Portfolio pulse, pipeline health, and underwriting shortcuts."
        actions={
          <Link
            href="/dashboard/analyze"
            className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-sm"
          >
            <Plus className="h-4 w-4" /> New analysis
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => {
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
                  <div className="mt-1 text-2xl font-extrabold tracking-tight">
                    {loading || kpi.value == null ? <SkeletonValue /> : kpi.value}
                  </div>
                  <p className="mt-1 text-[11px] font-semibold text-teal-800">
                    {loading ? <Skeleton className="h-3 w-28" /> : kpi.hint}
                  </p>
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
                Modeled from your saved buy & hold average cash flow.
              </p>
            </div>
            <span className="rounded-md bg-teal-700/10 px-2 py-1 text-[10px] font-bold uppercase text-teal-800">
              Projection
            </span>
          </div>
          {loading || !data ? (
            <div className="space-y-3 py-6">
              <Skeleton className="h-48 w-full rounded-xl" />
              <div className="flex justify-between gap-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-3 w-6" />
                ))}
              </div>
            </div>
          ) : (
            <AreaChart data={data.projection} height={260} color="#0f766e" />
          )}
        </div>

        <div className="space-y-5 lg:col-span-4">
          <div className="surface-card space-y-3 p-5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Quick actions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/dashboard/explore"
                className="flex flex-col items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3 text-center transition hover:border-teal-700/25"
              >
                <Search className="h-5 w-5 text-teal-700" />
                <span className="text-xs font-semibold">Explore</span>
              </Link>
              <Link
                href="/dashboard/analyze"
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
              <Link
                href="/dashboard/portfolio"
                className="flex flex-col items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3 text-center transition hover:border-teal-700/25"
              >
                <TrendingUp className="h-5 w-5 text-teal-700" />
                <span className="text-xs font-semibold">Portfolio</span>
              </Link>
            </div>
          </div>

          <div className="surface-card space-y-4 p-5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Recent activity
            </h3>
            {loading ? (
              <SkeletonRows rows={5} cols={2} />
            ) : !data || data.recentActivity.length === 0 ? (
              <p className="text-xs text-[var(--muted)]">No activity yet — run an analysis to start.</p>
            ) : (
              <div className="max-h-[240px] space-y-4 overflow-y-auto pr-1">
                {data.recentActivity.map((act) => (
                  <div key={act.id} className="flex justify-between gap-3 text-xs">
                    <div>
                      <div className="font-semibold text-foreground">{act.action}</div>
                      <div className="mt-0.5 leading-snug text-[var(--muted)]">{act.details}</div>
                    </div>
                    <span className="shrink-0 text-[10px] text-[var(--muted-foreground)]">
                      {act.time}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
