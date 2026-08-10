'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRightLeft, Check, MapPin } from 'lucide-react';
import { listMyPropertiesAction } from '@/app/actions/propertyActions';
import { SkeletonCards, SkeletonRows } from '@/components/ui/Skeleton';

type CompareProperty = {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;
  yearBuilt: number | null;
  estimatedValue: number | null;
  estimatedRent: number | null;
  taxAmount: number | null;
  propertyType: string | null;
  source: string;
  pipelineStatus?: string | null;
};

const METRICS: {
  key: keyof CompareProperty;
  label: string;
  format: (p: CompareProperty) => string;
  numeric: (p: CompareProperty) => number;
  higherBetter: boolean | null;
}[] = [
  {
    key: 'estimatedValue',
    label: 'Est. value',
    format: (p) =>
      p.estimatedValue != null ? `$${Math.round(p.estimatedValue).toLocaleString()}` : '—',
    numeric: (p) => p.estimatedValue || 0,
    higherBetter: true,
  },
  {
    key: 'estimatedRent',
    label: 'Est. rent / mo',
    format: (p) =>
      p.estimatedRent != null ? `$${Math.round(p.estimatedRent).toLocaleString()}` : '—',
    numeric: (p) => p.estimatedRent || 0,
    higherBetter: true,
  },
  {
    key: 'taxAmount',
    label: 'Annual tax',
    format: (p) =>
      p.taxAmount != null ? `$${Math.round(p.taxAmount).toLocaleString()}` : '—',
    numeric: (p) => p.taxAmount || 0,
    higherBetter: false,
  },
  {
    key: 'bedrooms',
    label: 'Beds',
    format: (p) => (p.bedrooms != null ? String(p.bedrooms) : '—'),
    numeric: (p) => p.bedrooms || 0,
    higherBetter: true,
  },
  {
    key: 'bathrooms',
    label: 'Baths',
    format: (p) => (p.bathrooms != null ? String(p.bathrooms) : '—'),
    numeric: (p) => p.bathrooms || 0,
    higherBetter: true,
  },
  {
    key: 'squareFeet',
    label: 'Sqft',
    format: (p) =>
      p.squareFeet != null ? Math.round(p.squareFeet).toLocaleString() : '—',
    numeric: (p) => p.squareFeet || 0,
    higherBetter: true,
  },
  {
    key: 'yearBuilt',
    label: 'Year built',
    format: (p) => (p.yearBuilt != null ? String(p.yearBuilt) : '—'),
    numeric: (p) => p.yearBuilt || 0,
    higherBetter: true,
  },
  {
    key: 'propertyType',
    label: 'Type',
    format: (p) => p.propertyType || '—',
    numeric: () => 0,
    higherBetter: null,
  },
  {
    key: 'estimatedValue',
    label: 'Gross yield',
    format: (p) => {
      if (!p.estimatedValue || !p.estimatedRent) return '—';
      return `${(((p.estimatedRent * 12) / p.estimatedValue) * 100).toFixed(2)}%`;
    },
    numeric: (p) =>
      p.estimatedValue && p.estimatedRent
        ? (p.estimatedRent * 12) / p.estimatedValue
        : 0,
    higherBetter: true,
  },
  {
    key: 'estimatedValue',
    label: '$ / sqft',
    format: (p) => {
      if (!p.estimatedValue || !p.squareFeet) return '—';
      return `$${Math.round(p.estimatedValue / p.squareFeet)}`;
    },
    numeric: (p) =>
      p.estimatedValue && p.squareFeet ? p.estimatedValue / p.squareFeet : 0,
    higherBetter: false,
  },
];

function ComparePropertiesInner() {
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<CompareProperty[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await listMyPropertiesAction();
        if (res.success) {
          const rows = res.properties as CompareProperty[];
          setProperties(rows);
          const fromQs = (searchParams.get('ids') || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
            .filter((id) => rows.some((r) => r.id === id));
          if (fromQs.length) {
            setSelected(fromQs.slice(0, 4));
          } else {
            setSelected(rows.slice(0, Math.min(2, rows.length)).map((p) => p.id));
          }
        }
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const selectedProps = useMemo(
    () => properties.filter((p) => selected.includes(p.id)),
    [properties, selected]
  );

  const bestIdFor = (numeric: (p: CompareProperty) => number, higherBetter: boolean) => {
    if (selectedProps.length < 2) return null;
    const values = selectedProps.map((p) => ({ id: p.id, value: numeric(p) }));
    const best = higherBetter
      ? values.reduce((a, b) => (b.value > a.value ? b : a))
      : values.reduce((a, b) => (b.value < a.value ? b : a));
    if (best.value === 0 && values.every((v) => v.value === 0)) return null;
    return best.id;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/dashboard/properties"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)] hover:text-blue-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> My Properties
          </Link>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#dbe7ff] px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-[#1639a8] uppercase">
            Compare · up to 4
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-[#0b1220]">
            Compare properties
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-[var(--muted)]">
            Side-by-side inventory metrics — value, rent, yield, size. Stronger cells highlight in
            blue.
          </p>
        </div>
        <p className="text-sm font-semibold text-[var(--muted)]">
          {selected.length} / 4 selected
        </p>
      </div>

      {loading ? (
        <>
          <SkeletonCards count={6} />
          <div className="rounded-2xl border border-[var(--border)] bg-white p-6">
            <SkeletonRows rows={6} cols={3} />
          </div>
        </>
      ) : properties.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] py-16 text-center text-sm text-[var(--muted)]">
          Add properties first, then come back to compare them.
          <div className="mt-3">
            <Link href="/dashboard/explore" className="font-semibold text-blue-800 hover:underline">
              Open Property Explorer
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => {
              const checked = selected.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p.id)}
                  className={`cursor-pointer rounded-2xl border p-4 text-left transition ${
                    checked
                      ? 'border-blue-700/40 bg-blue-700/5 ring-1 ring-blue-700/15'
                      : 'border-[var(--border)] bg-white hover:border-blue-700/25'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-[#0b1220]">{p.address}</div>
                      <p className="mt-1 flex items-center gap-1 text-xs text-[var(--muted)]">
                        <MapPin className="h-3 w-3" />
                        {[p.city, p.state, p.zip].filter(Boolean).join(', ')}
                      </p>
                      <p className="mt-2 text-sm font-semibold">
                        {p.estimatedValue != null
                          ? `$${Math.round(p.estimatedValue).toLocaleString()}`
                          : '—'}
                      </p>
                    </div>
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                        checked
                          ? 'border-blue-700 bg-blue-700 text-white'
                          : 'border-[var(--border)] text-transparent'
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedProps.length >= 2 ? (
            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)]">
              <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[linear-gradient(180deg,#f8fafc,white)] px-5 py-4 text-sm font-bold">
                <ArrowRightLeft className="h-4 w-4 text-blue-700" /> Comparison
              </div>
              <div className="overflow-x-auto p-5">
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="py-3 pr-4 text-xs font-semibold tracking-wide text-[var(--muted)] uppercase">
                        Metric
                      </th>
                      {selectedProps.map((p) => (
                        <th key={p.id} className="px-3 py-3 font-bold text-[#0b1220]">
                          <Link
                            href={`/dashboard/properties/${p.id}`}
                            className="hover:text-blue-800"
                          >
                            {p.address.split(',')[0]}
                          </Link>
                          <div className="mt-0.5 text-[10px] font-medium text-[var(--muted)]">
                            {[p.city, p.state].filter(Boolean).join(', ')}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {METRICS.map((m, idx) => {
                      const bestId =
                        m.higherBetter == null
                          ? null
                          : bestIdFor(m.numeric, m.higherBetter);
                      return (
                        <tr key={`${m.label}-${idx}`}>
                          <td className="py-3 pr-4 text-xs font-medium tracking-wide text-[var(--muted)] uppercase">
                            {m.label}
                          </td>
                          {selectedProps.map((p) => (
                            <td
                              key={p.id}
                              className={`px-3 py-3 font-semibold ${
                                bestId === p.id ? 'text-blue-800' : 'text-foreground'
                              }`}
                            >
                              {m.format(p)}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-center text-sm text-[var(--muted)]">
              Select at least 2 properties to see the comparison table.
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default function ComparePropertiesPage() {
  return (
    <React.Suspense
      fallback={
        <div className="mx-auto max-w-7xl space-y-8 py-8">
          <SkeletonCards count={6} />
        </div>
      }
    >
      <ComparePropertiesInner />
    </React.Suspense>
  );
}
