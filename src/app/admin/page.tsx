import React from 'react';
import Link from 'next/link';
import {
  Users,
  DollarSign,
  Cpu,
  Calendar,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  CreditCard,
  ScrollText,
  FileEdit,
  Sparkles,
} from 'lucide-react';
import { getAdminDashboardMetrics } from '@/app/actions/adminActions';
import { adminHref } from '@/lib/adminPath';

const QUICK_LINKS = [
  { href: adminHref('/admin/users'), label: 'Users', desc: 'Roles & status', icon: Users },
  { href: adminHref('/admin/subscriptions'), label: 'Subscriptions', desc: 'Plans & MRR', icon: CreditCard },
  { href: adminHref('/admin/coaching'), label: 'Coaching', desc: 'Experts & requests', icon: Calendar },
  { href: adminHref('/admin/deals'), label: 'Deals', desc: 'Pipeline intel', icon: Building2 },
  { href: adminHref('/admin/cms'), label: 'CMS', desc: 'Site content', icon: FileEdit },
  { href: adminHref('/admin/logs'), label: 'Audit logs', desc: 'Platform activity', icon: ScrollText },
] as const;

export default async function AdminPage() {
  const metricsResult = await getAdminDashboardMetrics();
  const metrics = metricsResult.metrics;

  const kpis = [
    {
      label: 'MRR',
      value: `$${metrics.mrr.toLocaleString()}`,
      hint: `${metrics.activeSubscribers} paid seats`,
      icon: DollarSign,
    },
    {
      label: 'Users',
      value: String(metrics.totalUsers),
      hint: `${metrics.investorCount} investors`,
      icon: Users,
    },
    {
      label: 'Analyses',
      value: String(metrics.totalAnalyses),
      hint: `${metrics.totalDeals} CRM deals`,
      icon: Cpu,
    },
    {
      label: 'Coaching queue',
      value: String(metrics.pendingCoaching),
      hint: `${metrics.activeExperts} active experts`,
      icon: Calendar,
    },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--sky)] px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-[var(--sky-fg)] uppercase">
            <ShieldCheck className="h-3.5 w-3.5" />
            Operations · admin
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[var(--ink)] sm:text-4xl">
            Platform control
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-[var(--muted)]">
            Live metrics across users, revenue, underwriting, and coaching — connected to the same
            investor workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold text-[var(--muted)] transition hover:text-foreground"
          >
            Investor view
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link
            href={adminHref('/admin/coaching')}
            className="btn-primary inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm"
          >
            <Calendar className="h-4 w-4" />
            Coaching desk
            {metrics.pendingCoaching > 0 ? (
              <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">
                {metrics.pendingCoaching}
              </span>
            ) : null}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="relative overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]"
            >
              <div className="pointer-events-none absolute -top-10 -right-8 h-28 w-28 rounded-full bg-[rgba(29,78,216,0.08)] blur-2xl" />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold text-[var(--muted)]">{kpi.label}</p>
                  <p className="mt-2 font-display text-3xl tracking-tight text-[var(--ink)]">
                    {kpi.value}
                  </p>
                  <p className="mt-2 text-[11px] text-[var(--muted)]">{kpi.hint}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--sky)] text-[var(--cobalt)]">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-gradient-to-br from-[var(--hero-from)] via-[var(--hero-via)] to-[var(--hero-to)] p-5 text-white shadow-[var(--shadow-lift)] sm:p-6 lg:col-span-5">
          <div className="text-[11px] font-bold tracking-[0.14em] text-white/60 uppercase">
            Connected workspaces
          </div>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">
            Admin ↔ Investor
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/70">
            Promote users, confirm coaching requests, and review underwrites. Changes here show up
            instantly in the investor portal.
          </p>
          <div className="mt-6 space-y-2">
            <Link
              href={adminHref('/admin/users')}
              className="group flex items-center justify-between rounded-2xl bg-[rgba(255,255,255,0.1)] px-3.5 py-3 text-sm font-semibold text-white transition hover:bg-[rgba(255,255,255,0.18)]"
            >
              Manage roles & suspensions
              <ArrowUpRight className="h-4 w-4 opacity-70" />
            </Link>
            <Link
              href={adminHref('/admin/coaching')}
              className="group flex items-center justify-between rounded-2xl bg-[rgba(255,255,255,0.1)] px-3.5 py-3 text-sm font-semibold text-white transition hover:bg-[rgba(255,255,255,0.18)]"
            >
              Experts & booking queue
              <ArrowUpRight className="h-4 w-4 opacity-70" />
            </Link>
            <Link
              href="/dashboard"
              className="group flex items-center justify-between rounded-2xl bg-[rgba(255,255,255,0.1)] px-3.5 py-3 text-sm font-semibold text-white transition hover:bg-[rgba(255,255,255,0.18)]"
            >
              Preview investor experience
              <ArrowUpRight className="h-4 w-4 opacity-70" />
            </Link>
          </div>
          {metrics.suspendedUsers > 0 ? (
            <div className="mt-6 rounded-2xl bg-[rgba(255,255,255,0.1)] p-4 text-sm">
              <Sparkles className="mb-2 h-4 w-4 text-[#93c5fd]" />
              <span className="font-semibold">{metrics.suspendedUsers}</span> suspended account
              {metrics.suspendedUsers === 1 ? '' : 's'} — review in Users.
            </div>
          ) : null}
        </div>

        <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] sm:p-6 lg:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-[var(--ink)]">Quick links</h3>
              <p className="text-xs text-[var(--muted)]">Jump into the tools you use most</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {QUICK_LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-3 transition hover:border-[color-mix(in_srgb,var(--cobalt)_35%,transparent)] hover:bg-[var(--surface)]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--sky)] text-[var(--cobalt)]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-[var(--ink)]">{item.label}</span>
                    <span className="block text-[11px] text-[var(--muted)]">{item.desc}</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-[var(--muted)] opacity-0 transition group-hover:opacity-100" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
