'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  RefreshCw,
  Activity,
  Users,
  CalendarDays,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { SkeletonRows, SkeletonValue } from '@/components/ui/Skeleton';
import { usePageTitle } from '@/components/DocumentTitle';
import { getAdminAuditLogs } from '@/app/actions/adminExpandActions';

type ActivityRow = {
  id: string;
  action: string;
  details: string | null;
  createdAt: Date | string;
  user: { email: string; name: string | null; role?: string };
};

type ActionOption = { action: string; count: number };

type Filters = {
  search: string;
  action: string;
  role: string;
  from: string;
  to: string;
};

const EMPTY_FILTERS: Filters = {
  search: '',
  action: 'all',
  role: 'all',
  from: '',
  to: '',
};

function actionTone(action: string) {
  const a = action.toUpperCase();
  if (a.includes('LOGIN') || a.includes('LOGOUT') || a.includes('AUTH')) {
    return 'bg-slate-500/10 text-slate-800';
  }
  if (a.includes('DELETE') || a.includes('CANCEL') || a.includes('FAIL') || a.includes('SUSPEND')) {
    return 'bg-red-500/10 text-red-800';
  }
  if (a.includes('ASSIGN') || a.includes('UPDATE') || a.includes('BILLING') || a.includes('PLAN')) {
    return 'bg-amber-500/12 text-amber-900';
  }
  if (a.includes('CREATE') || a.includes('SAVE') || a.includes('EXPORT')) {
    return 'bg-blue-700/10 text-blue-900';
  }
  return 'bg-blue-700/8 text-blue-900';
}

function formatRelative(date: Date | string) {
  const t = new Date(date).getTime();
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function AdminLogsPage() {
  usePageTitle('Audit logs');

  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<ActivityRow[]>([]);
  const [total, setTotal] = useState(0);
  const [actions, setActions] = useState<ActionOption[]>([]);
  const [metrics, setMetrics] = useState({ today: 0, last7Days: 0, activeUsers7d: 0 });
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async (filters: Filters = applied) => {
    setLoading(true);
    try {
      const result = await getAdminAuditLogs({
        search: filters.search.trim() || undefined,
        action: filters.action === 'all' ? undefined : filters.action,
        role: filters.role === 'all' ? undefined : filters.role,
        from: filters.from || undefined,
        to: filters.to || undefined,
        take: 300,
      });
      setLogs(result.logs);
      setTotal(result.total);
      setActions(result.actions);
      setMetrics(result.metrics);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = (e?: React.FormEvent) => {
    e?.preventDefault();
    setApplied(draft);
    load(draft).catch(console.error);
  };

  const clearFilters = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    load(EMPTY_FILTERS).catch(console.error);
  };

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        applied.search.trim() ||
          applied.action !== 'all' ||
          applied.role !== 'all' ||
          applied.from ||
          applied.to
      ),
    [applied]
  );

  const topActions = actions.slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        title="Audit logs"
        description="Track user and admin actions across the platform — logins, plan changes, analyses, and more."
        actions={
          <button
            type="button"
            onClick={() => load()}
            disabled={loading}
            className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-semibold hover:bg-[var(--surface)] disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SpotlightCard className="flex items-start justify-between p-5">
          <div>
            <div className="text-[10px] font-bold uppercase text-[var(--muted-foreground)]">
              Today
            </div>
            <div className="mt-1 text-2xl font-extrabold">
              {loading ? <SkeletonValue /> : metrics.today.toLocaleString()}
            </div>
            <p className="mt-1 text-[11px] text-[var(--muted)]">Events since midnight</p>
          </div>
          <CalendarDays className="h-5 w-5 text-blue-700" />
        </SpotlightCard>
        <SpotlightCard className="flex items-start justify-between p-5">
          <div>
            <div className="text-[10px] font-bold uppercase text-[var(--muted-foreground)]">
              Last 7 days
            </div>
            <div className="mt-1 text-2xl font-extrabold">
              {loading ? <SkeletonValue /> : metrics.last7Days.toLocaleString()}
            </div>
            <p className="mt-1 text-[11px] text-[var(--muted)]">Total audit events</p>
          </div>
          <Activity className="h-5 w-5 text-blue-700" />
        </SpotlightCard>
        <SpotlightCard className="flex items-start justify-between p-5">
          <div>
            <div className="text-[10px] font-bold uppercase text-[var(--muted-foreground)]">
              Active users (7d)
            </div>
            <div className="mt-1 text-2xl font-extrabold">
              {loading ? <SkeletonValue /> : metrics.activeUsers7d.toLocaleString()}
            </div>
            <p className="mt-1 text-[11px] text-[var(--muted)]">Accounts with activity</p>
          </div>
          <Users className="h-5 w-5 text-blue-700" />
        </SpotlightCard>
      </div>

      {topActions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase">
            <Filter className="mr-1.5 h-3.5 w-3.5" />
            Quick filter
          </span>
          <button
            type="button"
            onClick={() => {
              const next = { ...draft, action: 'all' };
              setDraft(next);
              setApplied(next);
              load(next).catch(console.error);
            }}
            className={`cursor-pointer rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${
              applied.action === 'all'
                ? 'bg-blue-700 text-white'
                : 'border border-[var(--border)] text-[var(--muted)] hover:text-foreground'
            }`}
          >
            All
          </button>
          {topActions.map((a) => (
            <button
              key={a.action}
              type="button"
              onClick={() => {
                const next = { ...draft, action: a.action };
                setDraft(next);
                setApplied(next);
                load(next).catch(console.error);
              }}
              className={`cursor-pointer rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${
                applied.action === a.action
                  ? 'bg-blue-700 text-white'
                  : 'border border-[var(--border)] text-[var(--muted)] hover:text-foreground'
              }`}
            >
              {a.action}
              <span className="ml-1 opacity-70">({a.count})</span>
            </button>
          ))}
        </div>
      )}

      <form onSubmit={applyFilters} className="surface-card space-y-4 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12 xl:items-end">
          <label className="space-y-1.5 text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase xl:col-span-4">
            Search
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <input
                className="glass-input w-full bg-white py-2.5 pr-3 pl-9 text-sm font-normal normal-case tracking-normal"
                placeholder="User, email, action, or details…"
                value={draft.search}
                onChange={(e) => setDraft({ ...draft, search: e.target.value })}
              />
            </div>
          </label>

          <label className="space-y-1.5 text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase xl:col-span-2">
            Action
            <select
              className="glass-input w-full bg-white px-3 py-2.5 text-xs font-normal normal-case tracking-normal"
              value={draft.action}
              onChange={(e) => setDraft({ ...draft, action: e.target.value })}
            >
              <option value="all">All actions</option>
              {actions.map((a) => (
                <option key={a.action} value={a.action}>
                  {a.action} ({a.count})
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5 text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase xl:col-span-2">
            Role
            <select
              className="glass-input w-full bg-white px-3 py-2.5 text-xs font-normal normal-case tracking-normal"
              value={draft.role}
              onChange={(e) => setDraft({ ...draft, role: e.target.value })}
            >
              <option value="all">All roles</option>
              <option value="INVESTOR">Investor</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>

          <label className="space-y-1.5 text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase xl:col-span-2">
            From
            <input
              type="date"
              className="glass-input w-full bg-white px-3 py-2.5 text-xs font-normal normal-case tracking-normal"
              value={draft.from}
              onChange={(e) => setDraft({ ...draft, from: e.target.value })}
            />
          </label>

          <label className="space-y-1.5 text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase xl:col-span-2">
            To
            <input
              type="date"
              className="glass-input w-full bg-white px-3 py-2.5 text-xs font-normal normal-case tracking-normal"
              value={draft.to}
              onChange={(e) => setDraft({ ...draft, to: e.target.value })}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            className="btn-primary min-h-10 cursor-pointer px-4 py-2.5 text-xs"
          >
            Apply filters
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--muted)] hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
          <p className="ml-auto text-[11px] text-[var(--muted)]">
            {loading ? 'Loading…' : `${logs.length} shown · ${total.toLocaleString()} match`}
          </p>
        </div>
      </form>

      <div className="surface-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 sm:px-5">
          <h2 className="text-sm font-bold">Activity stream</h2>
          <span className="text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
            Newest first
          </span>
        </div>

        {loading ? (
          <div className="p-4 sm:p-5">
            <SkeletonRows rows={8} cols={3} />
          </div>
        ) : logs.length === 0 ? (
          <p className="px-5 py-14 text-center text-xs text-[var(--muted)]">
            No audit events match these filters.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {logs.map((log) => {
              const open = expandedId === log.id;
              return (
                <li key={log.id}>
                  <button
                    type="button"
                    onClick={() => setExpandedId(open ? null : log.id)}
                    className="flex w-full cursor-pointer items-start gap-3 px-4 py-3.5 text-left transition hover:bg-[var(--surface-soft)] sm:gap-4 sm:px-5"
                  >
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-700/10 text-blue-800">
                      <Activity className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold tracking-wide uppercase ${actionTone(log.action)}`}
                        >
                          {log.action}
                        </span>
                        {log.user.role ? (
                          <span className="rounded-md bg-[var(--surface-soft)] px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-[var(--muted)] uppercase">
                            {log.user.role}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        {log.user.name || log.user.email}
                      </div>
                      <div className="text-xs text-[var(--muted)]">
                        {log.details || 'No additional details'}
                      </div>
                      {open && (
                        <div className="mt-2 space-y-1 rounded-xl border border-[var(--border)] bg-white p-3 text-[11px] text-[var(--muted)]">
                          <div>
                            <span className="font-bold text-foreground">Email: </span>
                            {log.user.email}
                          </div>
                          <div>
                            <span className="font-bold text-foreground">When: </span>
                            {new Date(log.createdAt).toLocaleString()}
                          </div>
                          <div>
                            <span className="font-bold text-foreground">Event ID: </span>
                            <code className="font-mono text-[10px]">{log.id}</code>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-[11px] font-semibold text-foreground">
                        {formatRelative(log.createdAt)}
                      </span>
                      <span className="hidden text-[10px] text-[var(--muted-foreground)] sm:block">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                      {open ? (
                        <ChevronUp className="mt-1 h-3.5 w-3.5 text-[var(--muted)]" />
                      ) : (
                        <ChevronDown className="mt-1 h-3.5 w-3.5 text-[var(--muted)]" />
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
