'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Search } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { getAdminAiActivity } from '@/app/actions/adminExpandActions';

type LogRow = {
  id: string;
  action: string;
  details: string | null;
  createdAt: Date | string;
  user: { email: string; name: string | null };
};

export default function AdminAiActivityPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [actions, setActions] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [applied, setApplied] = useState({
    search: '',
    action: 'all',
    from: '',
    to: '',
  });

  const load = async (filters = applied) => {
    setLoading(true);
    try {
      const result = await getAdminAiActivity({
        search: filters.search || undefined,
        action: filters.action === 'all' ? undefined : filters.action,
        from: filters.from || undefined,
        to: filters.to || undefined,
        take: 200,
      });
      setLogs(result.logs);
      setTotal(result.total);
      setActions(result.actions);
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
    const next = { search, action, from, to };
    setApplied(next);
    load(next).catch(console.error);
  };

  const clearFilters = () => {
    const next = { search: '', action: 'all', from: '', to: '' };
    setSearch('');
    setAction('all');
    setFrom('');
    setTo('');
    setApplied(next);
    load(next).catch(console.error);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        title="AI activity"
        description="Search and filter analysis, lookup, and AI verdict events."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/system/api-usage"
              className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-semibold"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to usage
            </Link>
            <button
              type="button"
              onClick={() => load()}
              disabled={loading}
              className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-semibold disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        }
      />

      <form
        onSubmit={applyFilters}
        className="surface-card grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-end"
      >
        <label className="relative space-y-1.5 text-[10px] font-bold uppercase text-[var(--muted)] lg:col-span-4">
          Search
          <span className="relative block">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted)]" />
            <input
              className="glass-input w-full bg-white py-2.5 pr-3 pl-9 text-xs font-normal normal-case"
              placeholder="Email, name, action, details…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </span>
        </label>

        <label className="space-y-1.5 text-[10px] font-bold uppercase text-[var(--muted)] lg:col-span-2">
          Action
          <select
            className="glass-input w-full bg-white px-3 py-2.5 text-xs font-normal normal-case"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          >
            <option value="all">All actions</option>
            {actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5 text-[10px] font-bold uppercase text-[var(--muted)] lg:col-span-2">
          From
          <input
            type="date"
            className="glass-input w-full bg-white px-3 py-2.5 text-xs font-normal normal-case"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>

        <label className="space-y-1.5 text-[10px] font-bold uppercase text-[var(--muted)] lg:col-span-2">
          To
          <input
            type="date"
            className="glass-input w-full bg-white px-3 py-2.5 text-xs font-normal normal-case"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>

        <div className="flex gap-2 lg:col-span-2">
          <button
            type="submit"
            className="btn-primary min-h-10 flex-1 cursor-pointer px-3 py-2.5 text-xs"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="min-h-10 cursor-pointer rounded-xl border border-[var(--border)] px-3 py-2.5 text-xs font-semibold"
          >
            Clear
          </button>
        </div>
      </form>

      <div className="surface-card space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold">Results</h2>
          <p className="text-[11px] text-[var(--muted)]">
            {loading ? 'Loading…' : `${logs.length} shown · ${total} total match`}
          </p>
        </div>

        {loading ? (
          <SkeletonRows rows={8} cols={3} />
        ) : logs.length === 0 ? (
          <p className="text-xs text-[var(--muted)]">No AI activity matches these filters.</p>
        ) : (
          <ul className="space-y-2 text-xs">
            {logs.map((log) => (
              <li key={log.id} className="rounded-xl border border-[var(--border)] p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{log.action}</div>
                    <div className="text-[var(--muted)]">
                      {log.user.name || log.user.email}
                      {log.user.name ? ` · ${log.user.email}` : ''}
                    </div>
                    <div className="mt-1 text-[var(--muted)]">{log.details || '—'}</div>
                  </div>
                  <span className="shrink-0 text-[10px] text-[var(--muted-foreground)]">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
