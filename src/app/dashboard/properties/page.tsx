'use client';

import React, { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Building2,
  Calculator,
  LayoutGrid,
  List,
  MapPin,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { SkeletonPropertyCards } from '@/components/ui/Skeleton';
import { deleteMyPropertyAction, listMyPropertiesAction } from '@/app/actions/propertyActions';

type ImportedProperty = {
  id: string;
  attomId: string | null;
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
  propertyType: string | null;
  notes: string | null;
  source: string;
  createdAt: string | Date;
};

function money(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return '—';
  return `$${Math.round(n).toLocaleString()}`;
}

function analyzeQs(p: ImportedProperty) {
  return new URLSearchParams({
    address: p.address,
    zip: p.zip || '',
    from: 'property',
    propertyId: p.id,
    value: String(p.estimatedValue ?? ''),
    rent: String(p.estimatedRent ?? ''),
  }).toString();
}

export default function MyPropertiesPage() {
  const [properties, setProperties] = useState<ImportedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const [sort, setSort] = useState<'newest' | 'value' | 'address'>('newest');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listMyPropertiesAction();
      if (res.success) setProperties(res.properties as ImportedProperty[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = properties.filter((p) => {
      if (!q) return true;
      return (
        p.address.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.zip.includes(q) ||
        (p.notes || '').toLowerCase().includes(q)
      );
    });
    list = [...list].sort((a, b) => {
      if (sort === 'value') return (b.estimatedValue || 0) - (a.estimatedValue || 0);
      if (sort === 'address') return a.address.localeCompare(b.address);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
  }, [properties, query, sort]);

  const remove = (id: string) => {
    startTransition(async () => {
      await deleteMyPropertyAction(id);
      await load();
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Properties"
        description="Physical assets in your database (ATTOM import or manual). Underwriting lives in Deals after you Analyze."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/explore"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            >
              <Search className="h-4 w-4" /> Explore
            </Link>
            <Link
              href="/dashboard/properties/new"
              className="inline-flex items-center gap-2 rounded-lg bg-teal-800 px-3 py-2 text-sm font-medium text-white"
            >
              <Plus className="h-4 w-4" /> Add property
            </Link>
          </div>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search address, city, ZIP, notes…"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-10 pr-3 text-sm"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
        >
          <option value="newest">Newest</option>
          <option value="value">Highest value</option>
          <option value="address">Address A–Z</option>
        </select>
        <div className="flex rounded-xl border border-[var(--border)] p-1">
          <button
            type="button"
            onClick={() => setView('cards')}
            className={`rounded-lg p-2 ${view === 'cards' ? 'bg-teal-800 text-white' : 'text-[var(--muted)]'}`}
            aria-label="Card view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setView('table')}
            className={`rounded-lg p-2 ${view === 'table' ? 'bg-teal-800 text-white' : 'text-[var(--muted)]'}`}
            aria-label="Table view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? <SkeletonPropertyCards count={4} /> : null}

      {!loading && filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] px-6 py-16 text-center">
          <Building2 className="mx-auto mb-3 h-8 w-8 text-teal-800/40" />
          <p className="font-display text-xl text-foreground">
            {properties.length ? 'No matches' : 'No properties yet'}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
            Import from Property Explorer or add one manually.
          </p>
        </div>
      ) : null}

      {!loading && view === 'cards' && filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <SpotlightCard key={p.id} className="flex flex-col p-5">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/properties/${p.id}`}
                    className="truncate font-medium text-foreground hover:text-teal-900"
                  >
                    {p.address}
                  </Link>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--muted)]">
                    <MapPin className="h-3 w-3" />
                    {[p.city, p.state, p.zip].filter(Boolean).join(', ')}
                  </p>
                </div>
                <span className="shrink-0 rounded bg-[var(--surface)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--muted)]">
                  {p.source}
                </span>
              </div>
              <p className="mb-4 text-xs text-[var(--muted)]">
                {[
                  p.bedrooms != null ? `${p.bedrooms}bd` : null,
                  p.bathrooms != null ? `${p.bathrooms}ba` : null,
                  p.squareFeet ? `${Math.round(p.squareFeet).toLocaleString()} sqft` : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || '—'}
              </p>
              <div className="mt-auto flex items-end justify-between gap-2 border-t border-[var(--border)] pt-3">
                <div>
                  <p className="text-[10px] uppercase text-[var(--muted)]">Est. value</p>
                  <p className="text-lg font-semibold">{money(p.estimatedValue)}</p>
                </div>
                <div className="flex gap-1">
                  <Link
                    href={`/dashboard/analyze/hold?${analyzeQs(p)}`}
                    className="inline-flex items-center rounded-lg bg-teal-800 px-2.5 py-2 text-xs font-medium text-white"
                    title="Analyze"
                  >
                    <Calculator className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href={`/dashboard/properties/${p.id}`}
                    className="inline-flex items-center rounded-lg border border-[var(--border)] px-2.5 py-2 text-xs"
                  >
                    View
                  </Link>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => remove(p.id)}
                    className="inline-flex items-center rounded-lg border border-red-200 px-2.5 py-2 text-xs text-red-700 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </SpotlightCard>
          ))}
        </div>
      ) : null}

      {!loading && view === 'table' && filtered.length > 0 ? (
        <SpotlightCard className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--muted)]">
                <th className="px-4 py-3 font-medium">Address</th>
                <th className="px-4 py-3 font-medium">Beds/Baths</th>
                <th className="px-4 py-3 font-medium">Value</th>
                <th className="px-4 py-3 font-medium">Rent</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/properties/${p.id}`} className="font-medium hover:text-teal-900">
                      {p.address}
                    </Link>
                    <p className="text-xs text-[var(--muted)]">
                      {[p.city, p.state, p.zip].filter(Boolean).join(', ')}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {p.bedrooms ?? '—'} / {p.bathrooms ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-medium">{money(p.estimatedValue)}</td>
                  <td className="px-4 py-3">{money(p.estimatedRent)}</td>
                  <td className="px-4 py-3 text-xs uppercase text-[var(--muted)]">{p.source}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/analyze/hold?${analyzeQs(p)}`}
                        className="text-xs text-teal-800 underline"
                      >
                        Analyze
                      </Link>
                      <Link href={`/dashboard/properties/${p.id}`} className="text-xs text-teal-800 underline">
                        Open
                      </Link>
                      <button
                        type="button"
                        className="text-xs text-red-700 underline"
                        onClick={() => remove(p.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SpotlightCard>
      ) : null}
    </div>
  );
}
