'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  AlertTriangle,
  Activity,
  Globe,
  RefreshCw,
} from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { usePageTitle } from '@/components/DocumentTitle';
import {
  getAdminAuditLogs,
  getAdminSystemLogs,
} from '@/app/actions/adminExpandActions';

type Tab = 'activity' | 'requests' | 'errors';

const TAB_TITLES: Record<Tab, string> = {
  activity: 'Audit logs',
  requests: 'Request logs',
  errors: 'Error logs',
};

type FileLogRow = {
  id: string;
  level: string;
  category: string;
  message: string;
  method?: string | null;
  path?: string | null;
  statusCode?: number | null;
  durationMs?: number | null;
  userId?: string | null;
  ip?: string | null;
  stack?: string | null;
  meta?: Record<string, unknown> | string | null;
  dayKey: string;
  requestId?: string | null;
  createdAt: string;
};

type ActivityRow = {
  id: string;
  action: string;
  details: string | null;
  createdAt: Date | string;
  user: { email: string; name: string | null; role?: string };
};

function todayKey() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function levelTone(level: string) {
  switch (level) {
    case 'ERROR':
      return 'bg-red-500/10 text-red-700';
    case 'WARN':
      return 'bg-amber-500/12 text-amber-800';
    case 'REQUEST':
      return 'bg-teal-700/10 text-teal-800';
    default:
      return 'bg-slate-500/10 text-slate-700';
  }
}

function formatMeta(meta: FileLogRow['meta']) {
  if (!meta) return null;
  if (typeof meta === 'string') return meta;
  try {
    return JSON.stringify(meta, null, 2);
  } catch {
    return String(meta);
  }
}

export default function AdminLogsPage() {
  const [tab, setTab] = useState<Tab>('activity');
  const [dayKey, setDayKey] = useState(todayKey);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('all');
  const [loading, setLoading] = useState(true);
  const [fileLogs, setFileLogs] = useState<FileLogRow[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityRow[]>([]);
  const [days, setDays] = useState<Array<{ dayKey: string; count: number }>>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  usePageTitle(TAB_TITLES[tab]);

  const load = async () => {
    setLoading(true);
    try {
      if (tab === 'activity') {
        const result = await getAdminAuditLogs({ take: 250 });
        setActivityLogs(result.logs);
      } else {
        const result = await getAdminSystemLogs({
          dayKey,
          level: tab === 'errors' ? 'ERROR' : level,
          category: tab === 'requests' ? 'REQUEST' : tab === 'errors' ? 'all' : 'all',
          search: search.trim() || undefined,
          take: 250,
        });
        setFileLogs(result.logs as FileLogRow[]);
        setDays(result.days);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, dayKey, level]);

  const filteredActivity = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activityLogs;
    return activityLogs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        (l.details || '').toLowerCase().includes(q) ||
        l.user.email.toLowerCase().includes(q) ||
        (l.user.name || '').toLowerCase().includes(q)
    );
  }, [activityLogs, search]);

  const tabs: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'activity', label: 'Audit log', icon: Activity },
    { key: 'requests', label: 'Requests (files)', icon: Globe },
    { key: 'errors', label: 'Errors (files)', icon: AlertTriangle },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        title="Logs & diagnostics"
        description="Review audit events, request logs, and system errors."
        actions={
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-semibold hover:bg-white disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${
                active
                  ? 'bg-teal-700 text-white'
                  : 'border border-[var(--border)] text-[var(--muted)] hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="surface-card space-y-4 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tab !== 'activity' && (
            <label className="space-y-1 text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase">
              Day
              <select
                className="glass-input w-full bg-white px-3 py-2.5 text-xs font-semibold normal-case tracking-normal"
                value={dayKey}
                onChange={(e) => setDayKey(e.target.value)}
              >
                <option value={todayKey()}>{todayKey()} (today)</option>
                {days
                  .filter((d) => d.dayKey !== todayKey())
                  .map((d) => (
                    <option key={d.dayKey} value={d.dayKey}>
                      {d.dayKey} ({d.count})
                    </option>
                  ))}
              </select>
            </label>
          )}

          {tab === 'requests' && (
            <label className="space-y-1 text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase">
              Level
              <select
                className="glass-input w-full bg-white px-3 py-2.5 text-xs font-semibold normal-case tracking-normal"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                <option value="all">All</option>
                <option value="REQUEST">REQUEST</option>
                <option value="INFO">INFO</option>
                <option value="WARN">WARN</option>
              </select>
            </label>
          )}

          <label className="space-y-1 text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase sm:col-span-2">
            Search
            <div className="relative">
              <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-[var(--muted)]" />
              <input
                className="glass-input w-full py-2.5 pr-3 pl-9 text-sm normal-case tracking-normal"
                placeholder={
                  tab === 'activity'
                    ? 'Action, details, email…'
                    : 'Path, message, request id…'
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') load();
                }}
              />
            </div>
          </label>
        </div>
        <p className="text-[10px] text-[var(--muted-foreground)]">
          {tab === 'activity'
            ? 'Stored in ActivityLog (login, create/update/delete, billing changes).'
            : (
              <>
                Read from <code className="font-mono">logs/{dayKey}.log</code> on disk — not stored
                in Postgres.
              </>
            )}
        </p>
      </div>

      <div className="surface-card p-4 sm:p-5">
        {loading ? (
          <SkeletonRows rows={8} cols={4} />
        ) : tab === 'activity' ? (
          filteredActivity.length === 0 ? (
            <p className="py-10 text-center text-xs text-[var(--muted)]">No audit events yet.</p>
          ) : (
            <div className="max-h-[min(68vh,720px)] space-y-3 overflow-y-auto text-xs">
              {filteredActivity.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col gap-1 border-b border-[var(--border)] pb-3 sm:flex-row sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="font-semibold">
                      {log.user.name || log.user.email}
                      {log.user.role ? (
                        <span className="ml-2 text-[9px] font-bold uppercase text-teal-800">
                          {log.user.role}
                        </span>
                      ) : null}
                    </div>
                    <div className="break-words text-[var(--muted)]">
                      <strong>{log.action}</strong>
                      {log.details ? ` — ${log.details}` : ''}
                    </div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">{log.user.email}</div>
                  </div>
                  <span className="shrink-0 text-[10px] text-[var(--muted-foreground)]">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )
        ) : fileLogs.length === 0 ? (
          <p className="py-10 text-center text-xs text-[var(--muted)]">
            No {tab} entries in logs/{dayKey}.log yet.
          </p>
        ) : (
          <div className="max-h-[min(68vh,720px)] space-y-2 overflow-y-auto text-xs">
            {fileLogs.map((log) => {
              const open = expandedId === log.id;
              const metaText = formatMeta(log.meta);
              return (
                <button
                  key={log.id}
                  type="button"
                  onClick={() => setExpandedId(open ? null : log.id)}
                  className="w-full cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3 text-left transition hover:border-teal-700/25 hover:bg-white"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${levelTone(log.level)}`}
                        >
                          {log.level}
                        </span>
                        <span className="text-[10px] font-semibold text-[var(--muted)]">
                          {log.category}
                        </span>
                        {log.method ? (
                          <span className="font-mono text-[10px] text-teal-800">
                            {log.method} {log.path}
                          </span>
                        ) : null}
                        {log.statusCode ? (
                          <span className="text-[10px] font-bold text-[var(--muted)]">
                            {log.statusCode}
                          </span>
                        ) : null}
                        {log.durationMs != null ? (
                          <span className="text-[10px] text-[var(--muted-foreground)]">
                            {log.durationMs}ms
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 break-words font-semibold text-foreground">{log.message}</p>
                    </div>
                    <span className="shrink-0 text-[10px] text-[var(--muted-foreground)]">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  {open && (
                    <div className="mt-3 space-y-2 border-t border-[var(--border)] pt-3 text-[11px] text-[var(--muted)]">
                      {log.requestId ? (
                        <div>
                          <span className="font-bold text-foreground">Request ID: </span>
                          <code className="font-mono">{log.requestId}</code>
                        </div>
                      ) : null}
                      {log.ip ? (
                        <div>
                          <span className="font-bold text-foreground">IP: </span>
                          {log.ip}
                        </div>
                      ) : null}
                      {log.userId ? (
                        <div>
                          <span className="font-bold text-foreground">User ID: </span>
                          {log.userId}
                        </div>
                      ) : null}
                      {metaText ? (
                        <pre className="overflow-x-auto rounded-lg bg-white p-2 font-mono text-[10px]">
                          {metaText}
                        </pre>
                      ) : null}
                      {log.stack ? (
                        <pre className="max-h-48 overflow-auto rounded-lg bg-red-50 p-2 font-mono text-[10px] text-red-800">
                          {log.stack}
                        </pre>
                      ) : null}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
