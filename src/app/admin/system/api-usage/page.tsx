'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Cpu, RefreshCw } from 'lucide-react';
import SpotlightCard from '@/components/ui/SpotlightCard';
import PageHeader from '@/components/dashboard/PageHeader';
import { SkeletonRows, SkeletonValue } from '@/components/ui/Skeleton';
import { getAdminApiUsage } from '@/app/actions/adminExpandActions';

export default function AdminApiUsagePage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalAiRequests: 0,
    totalAnalyses: 0,
    estimatedTokens: 0,
    estimatedCost: 0,
    avgLatencyMs: null as number | null,
    propertyLookups: 0,
    fallbackRate: 0,
    model: 'openrouter/free',
  });
  const [logs, setLogs] = useState<
    Array<{
      id: string;
      action: string;
      details: string | null;
      createdAt: Date | string;
      user: { email: string };
    }>
  >([]);

  const load = async () => {
    setLoading(true);
    try {
      const result = await getAdminApiUsage();
      setMetrics(result.metrics);
      setLogs(result.recentLogs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const kpis = [
    { label: 'AI requests', value: String(metrics.totalAiRequests) },
    { label: 'Est. tokens', value: metrics.estimatedTokens.toLocaleString() },
    { label: 'Est. cost', value: `$${metrics.estimatedCost.toFixed(2)}` },
    {
      label: 'Avg latency',
      value: metrics.avgLatencyMs != null ? `${metrics.avgLatencyMs}ms` : '—',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        title="AI & API usage"
        description="Token estimates, model settings, and recent AI activity."
        actions={
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-semibold disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <SpotlightCard key={k.label} className="p-5">
            <div className="text-[10px] font-bold uppercase text-[var(--muted-foreground)]">
              {k.label}
            </div>
            <div className="mt-1 text-2xl font-extrabold">
              {loading ? <SkeletonValue /> : k.value}
            </div>
          </SpotlightCard>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="surface-card space-y-4 p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <Cpu className="h-4 w-4 text-teal-700" /> Model & rate limits
          </h2>
          <label className="block space-y-1 text-xs">
            <span className="font-semibold uppercase text-[var(--muted)]">Active model</span>
            {loading ? (
              <SkeletonValue className="h-10 w-full" />
            ) : (
              <select
                className="glass-input w-full bg-white px-3 py-2"
                defaultValue={metrics.model}
                disabled
              >
                <option value={metrics.model}>{metrics.model}</option>
              </select>
            )}
          </label>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-[var(--border)] p-3">
              <div className="text-[var(--muted)]">Analyses</div>
              <div className="mt-1 text-lg font-extrabold">
                {loading ? <SkeletonValue className="h-6 w-12" /> : metrics.totalAnalyses}
              </div>
            </div>
            <div className="rounded-xl border border-[var(--border)] p-3">
              <div className="text-[var(--muted)]">Property lookups</div>
              <div className="mt-1 text-lg font-extrabold">
                {loading ? <SkeletonValue className="h-6 w-12" /> : metrics.propertyLookups}
              </div>
            </div>
            <div className="col-span-2 rounded-xl border border-[var(--border)] p-3">
              <div className="text-[var(--muted)]">AI verdict share of logged actions</div>
              <div className="mt-1 text-lg font-extrabold">
                {loading ? <SkeletonValue className="h-6 w-16" /> : `${metrics.fallbackRate}%`}
              </div>
            </div>
          </div>
        </div>

        <div className="surface-card space-y-3 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold">Recent AI activity</h2>
            <Link
              href="/admin/system/ai-activity"
              className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-bold text-teal-800 hover:underline"
            >
              Show all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {loading ? (
            <SkeletonRows rows={5} cols={2} />
          ) : logs.length === 0 ? (
            <p className="text-xs text-[var(--muted)]">No AI activity logged yet.</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {logs.map((log) => (
                <li key={log.id} className="rounded-xl border border-[var(--border)] p-3">
                  <div className="font-semibold">{log.action}</div>
                  <div className="text-[var(--muted)]">
                    {log.user.email} · {log.details || '—'}
                  </div>
                  <div className="mt-1 text-[10px] text-[var(--muted-foreground)]">
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
