'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  Calculator,
  DollarSign,
  FolderOpen,
  MapPin,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  AreaChart,
  BarChart,
  DonutChart,
  DualLineChart,
  MiniSparkline,
} from '@/components/ui/Charts';
import { Skeleton, SkeletonValue } from '@/components/ui/Skeleton';
import { getPortfolioSummaryAction } from '@/app/actions/analysisActions';

type PortfolioData = Awaited<ReturnType<typeof getPortfolioSummaryAction>>;

function money(n: number) {
  if (!Number.isFinite(n)) return '$0';
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1000) return `$${Math.round(n / 1000)}k`;
  return `$${Math.round(n).toLocaleString()}`;
}

function moneyFull(n: number) {
  if (!Number.isFinite(n)) return '$0';
  return `$${Math.round(n).toLocaleString()}`;
}

export default function PortfolioPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PortfolioData | null>(null);
  const [chartRange, setChartRange] = useState<'6M' | '12M'>('12M');

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await getPortfolioSummaryAction();
        setData(res);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1400px] space-y-6">
        <SkeletonValue className="h-8 w-48" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  if (!data?.success) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-bold">Portfolio</h1>
        <p className="text-sm text-[var(--muted)]">Could not load portfolio.</p>
      </div>
    );
  }

  const { kpis, properties, holds, flips, charts } = data;
  const slice = (arr: typeof charts.valueSeries) =>
    chartRange === '6M' ? arr.slice(-6) : arr;

  const valueSeries = slice(charts.valueSeries);
  const purchasesSeries = slice(charts.purchasesSeries);
  const salesSeries = slice(charts.salesSeries);
  const earningsSeries = slice(charts.earningsSeries);
  const growthSeries = slice(charts.growthSeries);

  const growthPositive = kpis.lastYearGrowthPct >= 0;
  const earningsPositive = kpis.lastYearEarnings >= 0;

  const kpiCards = [
    {
      label: 'Portfolio value',
      value: moneyFull(kpis.totalPropertyValue),
      hint: `${kpis.propertyCount} properties`,
      delta: kpis.lastYearGrowthPct,
      icon: Building2,
      spark: charts.sparks.value,
      sparkColor: '#1d4ed8',
    },
    {
      label: 'Last year growth',
      value: `${growthPositive ? '+' : ''}${kpis.lastYearGrowthPct}%`,
      hint: 'Trailing 12 months',
      delta: kpis.lastYearGrowthPct,
      icon: TrendingUp,
      spark: charts.sparks.growth,
      sparkColor: growthPositive ? '#059669' : '#e11d48',
    },
    {
      label: 'Last year earnings',
      value: moneyFull(kpis.lastYearEarnings),
      hint: 'Cash flow + flip profit',
      delta: earningsPositive ? 8 : -4,
      icon: DollarSign,
      spark: charts.sparks.earnings,
      sparkColor: earningsPositive ? '#059669' : '#e11d48',
    },
    {
      label: 'Monthly cash flow',
      value: moneyFull(kpis.monthlyCashFlow),
      hint: `${kpis.dealCount} active deals`,
      delta: kpis.monthlyCashFlow >= 0 ? 6 : -3,
      icon: Wallet,
      spark: charts.sparks.purchases,
      sparkColor: kpis.monthlyCashFlow >= 0 ? '#3b82f6' : '#e11d48',
    },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#dbe7ff] px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-[#1639a8] uppercase">
            Book · Assets & deals
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-[#0b1220] sm:text-4xl">
            Portfolio
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-[var(--muted)]">
            Growth, purchases, sales, and earnings from your saved properties and deals — not live
            market feeds.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/properties"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3.5 py-2 text-sm font-semibold shadow-sm hover:bg-[var(--surface-soft)]"
          >
            <Building2 className="h-4 w-4 text-blue-800" /> Properties
          </Link>
          <Link
            href="/dashboard/deals"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1d4ed8] px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1e40af]"
          >
            <FolderOpen className="h-4 w-4" /> Deals
          </Link>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((k, i) => {
          const Icon = k.icon;
          const up = k.delta >= 0;
          return (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[0_1px_0_rgba(15,23,42,0.04)]"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_100%_0%,rgba(29,78,216,0.06),transparent_55%)]" />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold tracking-[0.12em] text-[var(--muted)] uppercase">
                    {k.label}
                  </p>
                  <p className="mt-1.5 font-display text-2xl font-bold tracking-tight text-[#0b1220]">
                    {k.value}
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--muted)]">{k.hint}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eff4ff] text-blue-800">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span
                    className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      up ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {up ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {Math.abs(k.delta).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="relative mt-3">
                <MiniSparkline values={k.spark} color={k.sparkColor} positive={up} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main value chart + allocation */}
      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-5 lg:col-span-2"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_10%_0%,rgba(29,78,216,0.07),transparent_50%)]" />
          <div className="relative flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold tracking-[0.14em] text-[var(--muted)] uppercase">
                Portfolio value
              </p>
              <div className="mt-1 flex flex-wrap items-baseline gap-3">
                <h2 className="font-display text-3xl font-bold tracking-tight text-[#0b1220]">
                  {moneyFull(kpis.totalPropertyValue)}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 text-sm font-semibold ${
                    growthPositive ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {growthPositive ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  {growthPositive ? '+' : ''}
                  {kpis.lastYearGrowthPct}% YoY
                </span>
              </div>
            </div>
            <div className="flex rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-1 text-xs font-semibold">
              {(['6M', '12M'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setChartRange(r)}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    chartRange === r
                      ? 'bg-[#0b1220] text-white shadow-sm'
                      : 'text-[var(--muted)] hover:text-foreground'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="relative mt-4">
            {valueSeries.some((d) => d.value > 0) ? (
              <AreaChart
                data={valueSeries}
                height={260}
                color="#1d4ed8"
                gradientId="portfolio-value"
                showGlow
              />
            ) : (
              <div className="flex h-[260px] items-center justify-center rounded-xl border border-dashed border-[var(--border)] text-sm text-[var(--muted)]">
                Add properties to see value over time
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-[var(--border)] bg-white p-5"
        >
          <p className="text-[10px] font-bold tracking-[0.14em] text-[var(--muted)] uppercase">
            Allocation by market
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">Est. value share by city</p>
          <div className="mt-4">
            {charts.allocation.length > 0 ? (
              <DonutChart
                slices={charts.allocation}
                centerLabel="Markets"
                centerValue={String(charts.allocation.length)}
                size={200}
              />
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-[var(--muted)]">
                No markets yet
              </div>
            )}
          </div>
          <ul className="mt-4 space-y-2">
            {charts.allocation.map((s) => (
              <li key={s.label} className="flex items-center justify-between gap-2 text-xs">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: s.color }}
                  />
                  <span className="truncate font-medium">{s.label}</span>
                </span>
                <span className="shrink-0 font-semibold">{money(s.value)}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Purchases vs sales + monthly growth + earnings */}
      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="rounded-2xl border border-[var(--border)] bg-white p-5 lg:col-span-1"
        >
          <p className="text-[10px] font-bold tracking-[0.14em] text-[var(--muted)] uppercase">
            Purchases vs sales
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Deal purchase price vs flip ARV (exit)
          </p>
          <div className="mt-3">
            {purchasesSeries.some((d) => d.value > 0) || salesSeries.some((d) => d.value > 0) ? (
              <DualLineChart
                seriesA={purchasesSeries}
                seriesB={salesSeries}
                labelA="Purchases"
                labelB="Sales (ARV)"
                colorA="#1d4ed8"
                colorB="#f59e0b"
                height={200}
              />
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-[var(--muted)]">
                Save deals to track buy / sell activity
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-[var(--border)] bg-white p-5"
        >
          <p className="text-[10px] font-bold tracking-[0.14em] text-[var(--muted)] uppercase">
            Monthly growth
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">Change in booked portfolio value</p>
          <div className="mt-3">
            {growthSeries.some((d) => d.value !== 0) ? (
              <BarChart data={growthSeries} height={200} />
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-[var(--muted)]">
                Growth appears as you add assets
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="rounded-2xl border border-[var(--border)] bg-white p-5"
        >
          <p className="text-[10px] font-bold tracking-[0.14em] text-[var(--muted)] uppercase">
            Earnings
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Hold annual cash flow + flip profit by month
          </p>
          <div className="mt-3">
            {earningsSeries.some((d) => d.value !== 0) ? (
              <BarChart data={earningsSeries} height={200} />
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-[var(--muted)]">
                Analyze & save deals to see earnings
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl bg-[#f3f6fb] px-3 py-2 text-xs">
            <span className="text-[var(--muted)]">12-mo total</span>
            <span
              className={`font-bold ${earningsPositive ? 'text-emerald-700' : 'text-rose-700'}`}
            >
              {earningsPositive ? '+' : ''}
              {moneyFull(kpis.lastYearEarnings)}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Lists */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold">Properties</h2>
              <p className="text-xs text-[var(--muted)]">Saved assets in your book</p>
            </div>
            <Link
              href="/dashboard/properties/new"
              className="text-xs font-semibold text-blue-800 hover:underline"
            >
              Add
            </Link>
          </div>
          {properties.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
              No properties yet. Import from Explorer or add manually.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {properties.slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/properties/${p.id}`}
                      className="truncate text-sm font-medium hover:text-blue-900"
                    >
                      {p.address}
                    </Link>
                    <p className="flex items-center gap-1 text-xs text-[var(--muted)]">
                      <MapPin className="h-3 w-3" />
                      {[p.city, p.state].filter(Boolean).join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{moneyFull(p.estimatedValue || 0)}</span>
                    <Link
                      href={`/dashboard/analyze/hold?address=${encodeURIComponent(p.address)}&zip=${encodeURIComponent(p.zip || '')}&value=${p.estimatedValue || ''}&rent=${p.estimatedRent || ''}&propertyId=${p.id}`}
                      className="rounded-lg bg-blue-800 p-1.5 text-white"
                      title="Analyze"
                    >
                      <Calculator className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold">Recent deals</h2>
              <p className="text-xs text-[var(--muted)]">Hold, rental & flip analyses</p>
            </div>
            <Link
              href="/dashboard/deals"
              className="text-xs font-semibold text-blue-800 hover:underline"
            >
              View all
            </Link>
          </div>
          {[...holds, ...flips].length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
              No deals yet. Analyze a property and hit Save deal.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {[
                ...holds.map((h) => ({
                  id: h.id,
                  address: h.address,
                  type: h.strategyType === 'rental' ? 'Rental' : 'Hold',
                  metric: h.cashFlow != null ? `${moneyFull(h.cashFlow)}/mo` : '—',
                  createdAt: h.createdAt,
                })),
                ...flips.map((f) => ({
                  id: f.id,
                  address: f.address,
                  type: 'Flip',
                  metric: f.profit != null ? moneyFull(f.profit) : '—',
                  createdAt: f.createdAt,
                })),
              ]
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                )
                .slice(0, 6)
                .map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <Link
                        href={`/dashboard/deals/${d.id}`}
                        className="truncate text-sm font-medium hover:text-blue-900"
                      >
                        {d.address}
                      </Link>
                      <p className="text-xs text-[var(--muted)]">{d.type}</p>
                    </div>
                    <span className="text-sm font-semibold">{d.metric}</span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
