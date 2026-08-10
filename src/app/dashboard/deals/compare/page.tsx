'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRightLeft, Check } from 'lucide-react';
import { getUserAnalyses } from '@/app/actions/analysisActions';
import PageHeader from '@/components/dashboard/PageHeader';
import { SkeletonCards, SkeletonRows } from '@/components/ui/Skeleton';

interface CompareDeal {
  id: string;
  address: string;
  type: string;
  purchasePrice: number;
  rehabCost: number;
  arv: number;
  rent: number;
  cashFlow: number;
  capRate: number;
  dscr: number;
  cashOnCash: number;
  roi: number;
}

const METRICS: {
  key: keyof CompareDeal;
  label: string;
  format: (v: number) => string;
  higherBetter: boolean;
}[] = [
  {
    key: 'purchasePrice',
    label: 'Purchase price',
    format: (v) => `$${v.toLocaleString()}`,
    higherBetter: false,
  },
  {
    key: 'rehabCost',
    label: 'Rehab',
    format: (v) => `$${v.toLocaleString()}`,
    higherBetter: false,
  },
  { key: 'arv', label: 'ARV', format: (v) => `$${v.toLocaleString()}`, higherBetter: true },
  {
    key: 'rent',
    label: 'Monthly rent',
    format: (v) => `$${v.toLocaleString()}`,
    higherBetter: true,
  },
  {
    key: 'cashFlow',
    label: 'Cash flow',
    format: (v) => `$${v.toFixed(0)}/mo`,
    higherBetter: true,
  },
  {
    key: 'capRate',
    label: 'Cap rate',
    format: (v) => `${v.toFixed(2)}%`,
    higherBetter: true,
  },
  { key: 'dscr', label: 'DSCR', format: (v) => v.toFixed(2), higherBetter: true },
  {
    key: 'cashOnCash',
    label: 'Cash-on-cash',
    format: (v) => `${v.toFixed(2)}%`,
    higherBetter: true,
  },
  { key: 'roi', label: 'ROI', format: (v) => `${v.toFixed(2)}%`, higherBetter: true },
];

export default function CompareDealsPage() {
  const [deals, setDeals] = useState<CompareDeal[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { propertyAnalyses, flipAnalyses } = await getUserAnalyses();
        const mapped: CompareDeal[] = [
          ...propertyAnalyses.map((a) => ({
            id: a.id,
            address: [a.address, a.city, a.state].filter(Boolean).join(', '),
            type: 'Buy & Hold',
            purchasePrice: a.purchasePrice,
            rehabCost: a.rehabCost,
            arv: a.arv,
            rent: a.rent,
            cashFlow: a.cashFlow ?? 0,
            capRate: a.capRate ?? 0,
            dscr: a.dscr ?? 0,
            cashOnCash: a.cashOnCash ?? 0,
            roi: a.roi ?? 0,
          })),
          ...flipAnalyses.map((a) => ({
            id: a.id,
            address: a.address,
            type: 'Fix & Flip',
            purchasePrice: a.purchasePrice,
            rehabCost: a.rehabCost,
            arv: a.arv,
            rent: 0,
            cashFlow: 0,
            capRate: 0,
            dscr: 0,
            cashOnCash: 0,
            roi: a.roi ?? 0,
          })),
        ];
        setDeals(mapped);
        setSelected(mapped.slice(0, Math.min(2, mapped.length)).map((d) => d.id));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const selectedDeals = deals.filter((d) => selected.includes(d.id));

  const bestIdFor = (key: keyof CompareDeal, higherBetter: boolean) => {
    if (selectedDeals.length < 2) return null;
    const numeric = selectedDeals.map((d) => ({ id: d.id, value: Number(d[key]) || 0 }));
    const best = higherBetter
      ? numeric.reduce((a, b) => (b.value > a.value ? b : a))
      : numeric.reduce((a, b) => (b.value < a.value ? b : a));
    return best.id;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        title="Compare deals"
        description="Compare up to 4 saved analyses side-by-side. Stronger metrics highlight automatically."
        actions={
          <Link
            href="/dashboard/deals"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          >
            Back to Deals
          </Link>
        }
      />

      {loading ? (
        <>
          <SkeletonCards count={6} />
          <div className="surface-card space-y-4 p-6">
            <SkeletonRows rows={6} cols={3} />
          </div>
        </>
      ) : deals.length === 0 ? (
        <div className="surface-card py-16 text-center text-sm text-[var(--muted)]">
          Save analyses in the Property Analyzer first, then compare them here.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {deals.map((deal) => {
              const checked = selected.includes(deal.id);
              return (
                <button
                  key={deal.id}
                  type="button"
                  onClick={() => toggle(deal.id)}
                  className={`cursor-pointer rounded-xl border p-4 text-left transition ${
                    checked
                      ? 'border-blue-700/40 bg-blue-700/5'
                      : 'border-[var(--border)] bg-white hover:border-blue-700/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[9px] font-bold uppercase text-[var(--muted)]">
                        {deal.type}
                      </span>
                      <div className="mt-1 text-sm font-bold">{deal.address}</div>
                    </div>
                    {checked && <Check className="h-4 w-4 shrink-0 text-blue-700" />}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedDeals.length >= 2 && (
            <div className="surface-card overflow-x-auto p-6">
              <div className="mb-4 flex items-center gap-2 text-sm font-bold">
                <ArrowRightLeft className="h-4 w-4 text-blue-700" /> Comparison
              </div>
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="py-3 text-xs font-semibold uppercase text-[var(--muted-foreground)]">
                      Metric
                    </th>
                    {selectedDeals.map((d) => (
                      <th key={d.id} className="px-4 py-3 font-bold">
                        {d.address.split(',')[0]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {METRICS.map((m) => {
                    const bestId = bestIdFor(m.key, m.higherBetter);
                    return (
                      <tr key={m.key}>
                        <td className="py-3 text-xs font-medium uppercase text-[var(--muted)]">
                          {m.label}
                        </td>
                        {selectedDeals.map((d) => (
                          <td
                            key={d.id}
                            className={`px-4 py-3 font-semibold ${
                              bestId === d.id ? 'text-blue-800' : 'text-foreground'
                            }`}
                          >
                            {m.format(Number(d[m.key]) || 0)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {selectedDeals.length < 2 && (
            <p className="text-center text-xs text-[var(--muted)]">
              Select at least 2 deals to see the comparison table.
            </p>
          )}
        </>
      )}
    </div>
  );
}
