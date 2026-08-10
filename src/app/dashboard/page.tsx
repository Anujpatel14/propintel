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
  Search,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Calculator,
  Eye,
  MoreHorizontal,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  BarChart,
  DonutChart,
  MiniSparkline,
} from '@/components/ui/Charts';
import { Skeleton, SkeletonRows, SkeletonValue } from '@/components/ui/Skeleton';
import { getInvestorDashboard } from '@/app/actions/dashboardActions';
import { PIPELINE_STATUS_LABELS, type PipelineStatus } from '@/lib/pipelineStatus';

type DashboardData = Awaited<ReturnType<typeof getInvestorDashboard>>;

function money(n: number) {
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1000) return `$${Math.round(n / 1000)}k`;
  return `$${Math.round(n).toLocaleString()}`;
}

function moneyFull(n: number) {
  if (!Number.isFinite(n)) return '$0';
  return `$${Math.round(n).toLocaleString()}`;
}

export default function DashboardOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [range, setRange] = useState<'5Y' | '10Y'>('10Y');

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
  const sparks = data?.sparks;

  const kpis = [
    {
      label: 'Saved deals',
      value: metrics ? String(metrics.savedDeals) : null,
      hint: metrics?.savedDealsHint,
      delta: metrics?.savedDealsDelta ?? 0,
      icon: Building,
      spark: sparks?.deals || [],
      sparkColor: '#1d4ed8',
    },
    {
      label: 'Monthly cash flow',
      value: metrics ? moneyFull(metrics.monthlyCashFlow) : null,
      hint: metrics?.cashFlowHint,
      delta: metrics?.cashFlowPositive ? 12 : -4,
      icon: DollarSign,
      spark: sparks?.cashFlow || [],
      sparkColor: metrics?.cashFlowPositive === false ? '#e11d48' : '#059669',
    },
    {
      label: 'Average cap rate',
      value: metrics ? `${metrics.avgCapRate}%` : null,
      hint: metrics?.capHint,
      delta: metrics && metrics.avgCapRate > 0 ? 6 : 0,
      icon: TrendingUp,
      spark: sparks?.cap || [],
      sparkColor: '#3b82f6',
    },
    {
      label: 'Active CRM leads',
      value: metrics ? String(metrics.activeLeads) : null,
      hint: metrics?.leadsHint,
      delta: metrics && metrics.activeLeads > 0 ? 8 : 0,
      icon: Layers,
      spark: sparks?.leads || [],
      sparkColor: '#f59e0b',
    },
  ];

  const projection =
    data?.projection && range === '5Y' ? data.projection.slice(0, 5) : data?.projection || [];

  const pipelineSlices =
    data?.pipelineMix.map((s) => ({
      ...s,
      label: PIPELINE_STATUS_LABELS[s.label as PipelineStatus] || s.label,
    })) || [];

  const strategySlices = data?.strategyMix || [];
  const mixSlices = strategySlices.length ? strategySlices : pipelineSlices;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--sky)] px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-[var(--sky-fg)] uppercase">
            <Sparkles className="h-3.5 w-3.5" />
            Investor overview
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[var(--ink)] sm:text-4xl">
            Portfolio analytics
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-[var(--muted)]">
            Cash flow projections, deal mix, and pipeline health — modeled from your PropIntel
            underwrites.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/reports"
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold text-[var(--muted)] transition hover:border-[color-mix(in_srgb,var(--cobalt)_35%,transparent)] hover:text-foreground"
          >
            <FileText className="h-4 w-4" />
            Reports
          </Link>
          <Link
            href="/dashboard/analyze"
            className="btn-primary inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm"
          >
            <Plus className="h-4 w-4" /> New analysis
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          const up = (kpi.delta || 0) >= 0;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]"
            >
              <div className="pointer-events-none absolute -top-10 -right-8 h-28 w-28 rounded-full bg-[rgba(29,78,216,0.06)] blur-2xl" />
              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-[var(--muted)]">
                    {kpi.label}
                    <MoreHorizontal className="h-3.5 w-3.5 opacity-40" />
                  </div>
                  <div className="mt-2 font-display text-3xl tracking-tight text-[var(--ink)]">
                    {loading || kpi.value == null ? <SkeletonValue /> : kpi.value}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        up
                          ? 'bg-[var(--success-soft)] text-[var(--success-fg)]'
                          : 'bg-[var(--danger-soft)] text-[var(--danger-fg)]'
                      }`}
                    >
                      {up ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {up ? '+' : ''}
                      {kpi.delta}%
                    </span>
                    <span className="text-[11px] text-[var(--muted)]">
                      {loading ? <Skeleton className="inline-block h-3 w-24" /> : kpi.hint}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--sky)] text-[var(--cobalt)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  {!loading && kpi.spark.length > 1 ? (
                    <MiniSparkline values={kpi.spark} color={kpi.sparkColor} positive={up} />
                  ) : null}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] sm:p-6 xl:col-span-8"
        >
          <div className="mb-2 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold tracking-wide text-[var(--muted)]">
                Projected portfolio cash
              </div>
              <div className="mt-1 flex flex-wrap items-end gap-3">
                <div className="font-display text-3xl font-bold tracking-tight text-[var(--ink)] sm:text-4xl">
                  {loading || !metrics ? (
                    <SkeletonValue />
                  ) : (
                    moneyFull(metrics.year10Projection)
                  )}
                </div>
                {!loading && metrics ? (
                  <div className="mb-1 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--success-soft)] px-2.5 py-1 text-[11px] font-bold text-[var(--success-fg)]">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      10-yr model
                    </span>
                    <span className="inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--success-fg)_35%,transparent)] px-2.5 py-1 text-[11px] font-bold text-[var(--success-fg)]">
                      {moneyFull(metrics.monthlyCashFlow)}/mo avg
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-full border border-[var(--border)] bg-[var(--surface-soft)] p-1">
                {(['5Y', '10Y'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRange(r)}
                    className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                      range === r
                        ? 'bg-[var(--ink)] text-[var(--background)]'
                        : 'text-[var(--muted)] hover:text-foreground'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted)]">
                <Eye className="h-4 w-4" />
              </span>
            </div>
          </div>

          {loading || !data ? (
            <div className="space-y-3 py-6">
              <Skeleton className="h-56 w-full rounded-2xl" />
            </div>
          ) : (
            <AreaChart
              data={projection}
              height={280}
              color="var(--cobalt)"
              gradientId="dash-cashflow"
              showGlow
            />
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[var(--hero-from)] via-[var(--hero-via)] to-[var(--hero-to)] p-5 text-white shadow-[var(--shadow-lift)] sm:p-6 xl:col-span-4"
        >
          <div className="text-[11px] font-bold tracking-[0.14em] text-white/60 uppercase">
            Underwrite faster
          </div>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">
            Switch into deal mode
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/70">
            Pull comps from Explorer, run Buy & Hold or Flip math, then push the deal straight into
            CRM.
          </p>
          <div className="mt-6 space-y-2">
            {[
              { href: '/dashboard/explore', label: 'Property Explorer', icon: Search },
              { href: '/dashboard/analyze', label: 'Analyze deal', icon: Calculator },
              { href: '/dashboard/crm', label: 'CRM pipeline', icon: Layers },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center justify-between rounded-2xl bg-[rgba(255,255,255,0.1)] px-3.5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-[rgba(255,255,255,0.18)]"
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon className="h-4 w-4 text-[#93c5fd]" />
                    {item.label}
                  </span>
                  <ArrowUpRight className="h-4 w-4 opacity-70 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              );
            })}
          </div>
          <div className="mt-auto pt-6">
            <div className="rounded-2xl bg-[rgba(255,255,255,0.1)] p-4 backdrop-blur">
              <div className="text-[10px] font-bold tracking-wider text-white/55 uppercase">
                Inventory value
              </div>
              <div className="mt-1 font-display text-2xl font-bold">
                {loading || !metrics ? '—' : moneyFull(metrics.inventoryValue)}
              </div>
              <div className="mt-1 text-[11px] text-white/60">
                Underwritten {loading || !metrics ? '—' : moneyFull(metrics.underwrittenValue)}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] sm:p-6 lg:col-span-4"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-[var(--ink)]">Deal performance</h3>
              <p className="text-xs text-[var(--muted)]">Cash flow, flip profit & fees</p>
            </div>
          </div>
          {loading || !data ? (
            <Skeleton className="h-44 w-full rounded-2xl" />
          ) : (
            <>
              <BarChart data={data.performanceBars} height={170} />
              <div className="mt-3 grid grid-cols-2 gap-2">
                {data.performanceBars.map((b) => (
                  <div
                    key={b.label}
                    className="rounded-xl bg-[var(--surface-soft)] px-3 py-2 text-[11px] font-semibold text-[var(--muted)]"
                  >
                    {b.label}
                    <div
                      className={`mt-0.5 text-sm font-bold ${
                        b.value >= 0 ? 'text-[var(--success-fg)]' : 'text-[var(--danger-fg)]'
                      }`}
                    >
                      {b.value >= 0 ? '+' : ''}
                      {moneyFull(b.value)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] sm:p-6 lg:col-span-4"
        >
          <div className="mb-2">
            <h3 className="font-display text-lg font-bold text-[var(--ink)]">Allocation</h3>
            <p className="text-xs text-[var(--muted)]">
              {strategySlices.length ? 'Strategy mix across saved deals' : 'CRM pipeline mix'}
            </p>
          </div>
          {loading || !data ? (
            <Skeleton className="mx-auto h-48 w-48 rounded-full" />
          ) : mixSlices.length === 0 ? (
            <p className="py-16 text-center text-sm text-[var(--muted)]">
              Save a deal or add a CRM lead to see allocation.
            </p>
          ) : (
            <>
              <DonutChart
                slices={mixSlices}
                centerLabel="Total"
                centerValue={String(
                  mixSlices.reduce((s, x) => s + x.value, 0)
                )}
                size={210}
              />
              <div className="mt-3 space-y-2">
                {mixSlices.map((s) => (
                  <div key={s.label} className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-2 font-semibold text-[var(--ink)]">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: s.color }}
                      />
                      {s.label}
                    </span>
                    <span className="font-bold text-[var(--muted)]">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26 }}
          className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] sm:p-6 lg:col-span-4"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-[var(--ink)]">Recent activity</h3>
              <p className="text-xs text-[var(--muted)]">Latest underwrites & pipeline moves</p>
            </div>
            <Link
              href="/dashboard/crm"
              className="text-xs font-bold text-[var(--cobalt)] hover:underline"
            >
              Open CRM
            </Link>
          </div>
          {loading ? (
            <SkeletonRows rows={5} cols={2} />
          ) : !data || data.recentActivity.length === 0 ? (
            <p className="py-10 text-center text-sm text-[var(--muted)]">
              No activity yet — run an analysis to start.
            </p>
          ) : (
            <div className="max-h-[320px] space-y-1 overflow-y-auto pr-1">
              {data.recentActivity.map((act, idx) => (
                <div
                  key={act.id}
                  className="flex items-start gap-3 rounded-2xl px-2 py-2.5 transition hover:bg-[var(--surface-soft)]"
                >
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold text-white ${
                      idx % 3 === 0
                        ? 'bg-[var(--cobalt)]'
                        : idx % 3 === 1
                          ? 'bg-emerald-600'
                          : 'bg-[var(--ink)] text-[var(--background)]'
                    }`}
                  >
                    {act.action.slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-[var(--ink)]">{act.action}</div>
                    <div className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-[var(--muted)]">
                      {act.details}
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] font-medium text-[var(--muted-foreground)]">
                    {act.time}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
