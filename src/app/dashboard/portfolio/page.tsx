'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Calculator,
  FolderOpen,
  Loader2,
  MapPin,
} from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { SkeletonCards } from '@/components/ui/Skeleton';
import { getPortfolioSummaryAction } from '@/app/actions/analysisActions';

function money(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
}

export default function PortfolioPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Awaited<ReturnType<typeof getPortfolioSummaryAction>> | null>(
    null
  );

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
      <div className="space-y-8">
        <PageHeader title="Portfolio" description="Loading your properties and deals…" />
        <SkeletonCards count={4} />
      </div>
    );
  }

  if (!data?.success) {
    return (
      <div className="space-y-4">
        <PageHeader title="Portfolio" />
        <p className="text-sm text-[var(--muted)]">Could not load portfolio.</p>
      </div>
    );
  }

  const { kpis, properties, holds, flips } = data;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Portfolio"
        description="Book-level view of My Properties (assets) and Deals (analyses). All from your database — not ATTOM."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/properties"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            >
              <Building2 className="h-4 w-4" /> Properties
            </Link>
            <Link
              href="/dashboard/deals"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            >
              <FolderOpen className="h-4 w-4" /> Deals
            </Link>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            { label: 'Properties', value: String(kpis.propertyCount) },
            { label: 'Active deals', value: String(kpis.dealCount) },
            { label: 'Est. property value', value: money(kpis.totalPropertyValue) },
            { label: 'Monthly cash flow', value: money(kpis.monthlyCashFlow) },
          ] as const
        ).map((k) => (
          <SpotlightCard key={k.label} className="p-4">
            <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">{k.label}</p>
            <p className="mt-1 font-display text-2xl text-foreground">{k.value}</p>
          </SpotlightCard>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SpotlightCard className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg">Properties</h2>
            <Link href="/dashboard/properties/new" className="text-xs text-teal-800 underline">
              Add
            </Link>
          </div>
          {properties.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No properties yet. Import from Explorer or add manually.</p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {properties.slice(0, 8).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/properties/${p.id}`}
                      className="truncate text-sm font-medium hover:text-teal-900"
                    >
                      {p.address}
                    </Link>
                    <p className="flex items-center gap-1 text-xs text-[var(--muted)]">
                      <MapPin className="h-3 w-3" />
                      {[p.city, p.state].filter(Boolean).join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{money(p.estimatedValue || 0)}</span>
                    <Link
                      href={`/dashboard/analyze/hold?address=${encodeURIComponent(p.address)}&zip=${encodeURIComponent(p.zip || '')}&value=${p.estimatedValue || ''}&rent=${p.estimatedRent || ''}&propertyId=${p.id}`}
                      className="rounded-lg bg-teal-800 p-1.5 text-white"
                      title="Analyze"
                    >
                      <Calculator className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SpotlightCard>

        <SpotlightCard className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg">Recent deals</h2>
            <Link href="/dashboard/deals" className="text-xs text-teal-800 underline">
              View all
            </Link>
          </div>
          {[...holds, ...flips].length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No deals yet. Analyze a property and hit Save deal.</p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {[
                ...holds.map((h) => ({
                  id: h.id,
                  address: h.address,
                  type: h.strategyType === 'rental' ? 'Rental' : 'Hold',
                  metric: h.cashFlow != null ? `${money(h.cashFlow)}/mo` : '—',
                })),
                ...flips.map((f) => ({
                  id: f.id,
                  address: f.address,
                  type: 'Flip',
                  metric: f.profit != null ? money(f.profit) : '—',
                })),
              ]
                .slice(0, 8)
                .map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <Link
                        href={`/dashboard/deals/${d.id}`}
                        className="truncate text-sm font-medium hover:text-teal-900"
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
        </SpotlightCard>
      </div>

      {!loading && data ? null : (
        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}
    </div>
  );
}
