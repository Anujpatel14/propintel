'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Cpu } from 'lucide-react';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { getAdminApiUsage } from '@/app/actions/adminExpandActions';

export default function AdminApiUsagePage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalAiRequests: 0,
    totalAnalyses: 0,
    estimatedTokens: 0,
    estimatedCost: 0,
    avgLatencyMs: 0,
    propertyLookups: 0,
    fallbackRate: 0,
    model: 'gpt-4o-mini',
  });
  const [logs, setLogs] = useState<
    Array<{ id: string; action: string; details: string | null; createdAt: Date | string; user: { email: string } }>
  >([]);

  useEffect(() => {
    (async () => {
      try {
        const result = await getAdminApiUsage();
        setMetrics(result.metrics);
        setLogs(result.recentLogs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-[var(--muted)]">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading API usage…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-tight">AI & API usage</h1>
        <p className="text-sm text-[var(--muted)]">
          Token estimates, model config, and property lookup fallback rates.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <SpotlightCard className="p-5">
          <div className="text-[10px] font-bold uppercase text-[var(--muted-foreground)]">AI requests</div>
          <div className="mt-1 text-2xl font-extrabold">{metrics.totalAiRequests}</div>
        </SpotlightCard>
        <SpotlightCard className="p-5">
          <div className="text-[10px] font-bold uppercase text-[var(--muted-foreground)]">Est. tokens</div>
          <div className="mt-1 text-2xl font-extrabold">{metrics.estimatedTokens.toLocaleString()}</div>
        </SpotlightCard>
        <SpotlightCard className="p-5">
          <div className="text-[10px] font-bold uppercase text-[var(--muted-foreground)]">Est. cost</div>
          <div className="mt-1 text-2xl font-extrabold">${metrics.estimatedCost.toFixed(2)}</div>
        </SpotlightCard>
        <SpotlightCard className="p-5">
          <div className="text-[10px] font-bold uppercase text-[var(--muted-foreground)]">Avg latency</div>
          <div className="mt-1 text-2xl font-extrabold">{metrics.avgLatencyMs}ms</div>
        </SpotlightCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="surface-card space-y-4 p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <Cpu className="h-4 w-4 text-teal-700" /> Model & rate limits
          </h2>
          <label className="block space-y-1 text-xs">
            <span className="font-semibold uppercase text-[var(--muted)]">Active model</span>
            <select className="glass-input w-full bg-white px-3 py-2" defaultValue={metrics.model} disabled>
              <option value="gpt-4o-mini">gpt-4o-mini</option>
              <option value="gpt-4o">gpt-4o</option>
              <option value="claude-3-5-sonnet">claude-3-5-sonnet</option>
            </select>
          </label>
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="rounded-lg border border-[var(--border)] p-3">
              <div className="text-[var(--muted)]">FREE</div>
              <div className="font-bold">5 / mo</div>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-3">
              <div className="text-[var(--muted)]">PRO</div>
              <div className="font-bold">200 / mo</div>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-3">
              <div className="text-[var(--muted)]">ENTERPRISE</div>
              <div className="font-bold">Unlimited</div>
            </div>
          </div>
          <p className="text-[10px] text-[var(--muted-foreground)]">
            Property lookup fallback rate: {metrics.fallbackRate}% · Lookups logged:{' '}
            {metrics.propertyLookups}
          </p>
        </div>

        <div className="surface-card p-5">
          <h2 className="mb-3 text-sm font-bold">Recent AI / analysis events</h2>
          <div className="max-h-[320px] space-y-3 overflow-y-auto text-xs">
            {logs.length === 0 ? (
              <p className="text-[var(--muted)]">No events yet.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="border-b border-[var(--border)] pb-2">
                  <div className="font-semibold">{log.user.email}</div>
                  <div className="text-[var(--muted)]">
                    {log.action}
                    {log.details ? ` — ${log.details}` : ''}
                  </div>
                  <div className="text-[10px] text-[var(--muted-foreground)]">
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
