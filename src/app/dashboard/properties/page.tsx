'use client';

import React, { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRightLeft,
  Building2,
  Calculator,
  Check,
  FolderPlus,
  LayoutGrid,
  List,
  Loader2,
  MapPin,
  Plus,
  Search,
  Send,
  Trash2,
} from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { SkeletonPropertyCards } from '@/components/ui/Skeleton';
import {
  deleteMyPropertyAction,
  listMyPropertiesAction,
  sendPropertyToDealAction,
  updateMyPropertyAction,
} from '@/app/actions/propertyActions';
import { PipelineStatusSelect } from '@/components/dashboard/PipelineStatusSelect';
import type { PipelineStatus } from '@/lib/pipelineStatus';
import { useToast } from '@/components/ui/Toast';

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
  pipelineStatus?: string | null;
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
  const toast = useToast();
  const router = useRouter();
  const [properties, setProperties] = useState<ImportedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const [sort, setSort] = useState<'newest' | 'value' | 'address'>('newest');
  const [selected, setSelected] = useState<string[]>([]);
  const [sendingId, setSendingId] = useState<string | null>(null);

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

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) {
        toast.error('Compare limit', 'You can compare up to 4 properties');
        return prev;
      }
      return [...prev, id];
    });
  };

  const remove = (id: string) => {
    startTransition(async () => {
      await deleteMyPropertyAction(id);
      setSelected((prev) => prev.filter((x) => x !== id));
      await load();
    });
  };

  const sendToDeal = (id: string, strategy: 'hold' | 'flip' = 'hold') => {
    setSendingId(id);
    startTransition(async () => {
      const res = await sendPropertyToDealAction(id, strategy);
      setSendingId(null);
      if (!res.success) {
        toast.error(res.error || 'Could not create deal');
        return;
      }
      toast.success(res.updated ? 'Deal updated' : 'Sent to Deals');
      router.push(`/dashboard/deals/${res.dealId}`);
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Properties"
        description="Physical assets in your database (ATTOM import or manual). Send to Deals to underwrite, or compare side-by-side."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/properties/compare"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold shadow-sm hover:bg-[var(--surface-soft)]"
            >
              <ArrowRightLeft className="h-4 w-4 text-blue-800" /> Compare
            </Link>
            <Link
              href="/dashboard/explore"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold shadow-sm hover:bg-[var(--surface-soft)]"
            >
              <Search className="h-4 w-4" /> Explore
            </Link>
            <Link
              href="/dashboard/properties/new"
              className="inline-flex items-center gap-2 rounded-xl bg-[#1d4ed8] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1e40af]"
            >
              <Plus className="h-4 w-4" /> Add property
            </Link>
          </div>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search address, city, ZIP, notes…"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2.5 pr-3 pl-10 text-sm"
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
            className={`rounded-lg p-2 ${view === 'cards' ? 'bg-blue-800 text-white' : 'text-[var(--muted)]'}`}
            aria-label="Card view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setView('table')}
            className={`rounded-lg p-2 ${view === 'table' ? 'bg-blue-800 text-white' : 'text-[var(--muted)]'}`}
            aria-label="Table view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? <SkeletonPropertyCards count={4} /> : null}

      {!loading && filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] px-6 py-16 text-center">
          <Building2 className="mx-auto mb-3 h-8 w-8 text-blue-800/40" />
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
          {filtered.map((p) => {
            const checked = selected.includes(p.id);
            return (
              <SpotlightCard
                key={p.id}
                className={`relative flex flex-col p-5 ${
                  checked ? 'ring-2 ring-blue-700/25' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleSelect(p.id)}
                  className={`absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-full border transition ${
                    checked
                      ? 'border-blue-700 bg-blue-700 text-white'
                      : 'border-[var(--border)] bg-white text-transparent hover:border-blue-400'
                  }`}
                  aria-label={checked ? 'Deselect for compare' : 'Select for compare'}
                  title="Select to compare"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <div className="mb-2 flex items-start justify-between gap-2 pr-8">
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/properties/${p.id}`}
                      className="truncate font-medium text-foreground hover:text-blue-900"
                    >
                      {p.address}
                    </Link>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--muted)]">
                      <MapPin className="h-3 w-3" />
                      {[p.city, p.state, p.zip].filter(Boolean).join(', ')}
                    </p>
                  </div>
                  <span className="shrink-0 rounded bg-[var(--surface)] px-2 py-0.5 text-[10px] tracking-wide text-[var(--muted)] uppercase">
                    {p.source}
                  </span>
                </div>
                <div className="mb-3">
                  <PipelineStatusSelect
                    compact
                    value={p.pipelineStatus || 'LEAD'}
                    onChange={async (next: PipelineStatus) => {
                      const res = await updateMyPropertyAction(p.id, { pipelineStatus: next });
                      if (!res.success) {
                        toast.error(res.error || 'Could not update status');
                        return;
                      }
                      setProperties((list) =>
                        list.map((row) =>
                          row.id === p.id ? { ...row, pipelineStatus: next } : row
                        )
                      );
                      toast.success('Status updated', 'CRM pipeline moved too');
                    }}
                  />
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
                    <p className="text-[10px] text-[var(--muted)] uppercase">Est. value</p>
                    <p className="text-lg font-semibold">{money(p.estimatedValue)}</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1">
                    <button
                      type="button"
                      disabled={isPending || sendingId === p.id}
                      onClick={() => sendToDeal(p.id, 'hold')}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#1d4ed8] px-2.5 py-2 text-xs font-semibold text-white disabled:opacity-50"
                      title="Send to deal (Hold)"
                    >
                      {sendingId === p.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      Deal
                    </button>
                    <Link
                      href={`/dashboard/analyze/hold?${analyzeQs(p)}`}
                      className="inline-flex items-center rounded-lg border border-[var(--border)] px-2.5 py-2 text-xs"
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
            );
          })}
        </div>
      ) : null}

      {!loading && view === 'table' && filtered.length > 0 ? (
        <SpotlightCard className="overflow-x-auto p-0">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs tracking-wide text-[var(--muted)] uppercase">
                <th className="w-10 px-4 py-3 font-medium" />
                <th className="px-4 py-3 font-medium">Address</th>
                <th className="px-4 py-3 font-medium">Beds/Baths</th>
                <th className="px-4 py-3 font-medium">Value</th>
                <th className="px-4 py-3 font-medium">Rent</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const checked = selected.includes(p.id);
                return (
                  <tr key={p.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSelect(p.id)}
                        className={`flex h-5 w-5 items-center justify-center rounded border ${
                          checked
                            ? 'border-blue-700 bg-blue-700 text-white'
                            : 'border-[var(--border)]'
                        }`}
                        aria-label="Select for compare"
                      >
                        {checked ? <Check className="h-3 w-3" /> : null}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/properties/${p.id}`}
                        className="font-medium hover:text-blue-900"
                      >
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
                    <td className="px-4 py-3 text-xs text-[var(--muted)] uppercase">{p.source}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-800 underline"
                          disabled={sendingId === p.id}
                          onClick={() => sendToDeal(p.id, 'hold')}
                        >
                          {sendingId === p.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <FolderPlus className="h-3 w-3" />
                          )}
                          Deal
                        </button>
                        <Link
                          href={`/dashboard/analyze/hold?${analyzeQs(p)}`}
                          className="text-xs text-blue-800 underline"
                        >
                          Analyze
                        </Link>
                        <Link
                          href={`/dashboard/properties/${p.id}`}
                          className="text-xs text-blue-800 underline"
                        >
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
                );
              })}
            </tbody>
          </table>
        </SpotlightCard>
      ) : null}

      {/* Floating compare bar */}
      {selected.length > 0 ? (
        <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border)] bg-[#0b1220] px-4 py-3 text-white shadow-2xl">
            <span className="text-sm font-semibold">
              {selected.length} selected
              <span className="ml-1 font-normal text-white/60">(max 4)</span>
            </span>
            <button
              type="button"
              onClick={() => setSelected([])}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white"
            >
              Clear
            </button>
            <Link
              href={`/dashboard/properties/compare?ids=${selected.join(',')}`}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold ${
                selected.length >= 2
                  ? 'bg-white text-[#0b1220] hover:bg-blue-50'
                  : 'cursor-not-allowed bg-white/20 text-white/50'
              }`}
              onClick={(e) => {
                if (selected.length < 2) e.preventDefault();
              }}
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              Compare selected
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
