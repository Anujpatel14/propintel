'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search,
  MapPin,
  BedDouble,
  Bath,
  Ruler,
  Loader2,
  ArrowRight,
  Building2,
  Calculator,
  Sparkles,
  Home,
} from 'lucide-react';
import { SkeletonPropertyCards } from '@/components/ui/Skeleton';
import { searchPropertiesAction } from '@/app/actions/propertyActions';
import type { MappedProperty } from '@/lib/services/attomMapper';
import { useToast } from '@/components/ui/Toast';

function money(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return '—';
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

function analyzeQs(p: MappedProperty) {
  return new URLSearchParams({
    address: p.address || p.street || '',
    zip: p.zip || '',
    from: 'explore',
    value: String(p.estimatedValue ?? ''),
    rent: String(p.estimatedRent ?? ''),
  }).toString();
}

const QUICK = [
  { label: '80212', q: '80212' },
  { label: 'Denver', q: 'Denver' },
  { label: 'Denver, CO', q: 'Denver, CO' },
  { label: 'Austin, TX', q: 'Austin, TX' },
  {
    label: 'Full address',
    q: '4529 Winona Court, Denver, CO 80212',
  },
];

export default function PropertyExplorerPage() {
  const toast = useToast();
  const [query, setQuery] = useState('80212');
  const [results, setResults] = useState<MappedProperty[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [isPending, startTransition] = useTransition();

  const runSearch = (q: string) => {
    startTransition(async () => {
      setMessage(null);
      const res = await searchPropertiesAction({ query: q, pagesize: 24 });
      setSearched(true);
      if (!res.configured) {
        setResults([]);
        const msg = 'Property search isn’t configured on the server yet.';
        setMessage(msg);
        toast.error('Search unavailable', msg);
        return;
      }
      setResults(res.properties);
      if (res.message) {
        setMessage(res.message);
        if (!res.properties.length) {
          toast.info('No results', res.message);
        }
      } else if (!res.properties.length) {
        const msg =
          'No properties found. Try a ZIP (e.g. 80212), city + state, or full address.';
        setMessage(msg);
        toast.info('No results', msg);
      } else {
        toast.success(`Found ${res.properties.length} properties`);
      }
    });
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#dbe7ff] px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-[#1639a8] uppercase">
            Discovery · ATTOM
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-[#0b1220] sm:text-4xl">
            Property Explorer
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-[var(--muted)]">
            Search public records by ZIP, city, or street — then import to My Properties and
            underwrite.
          </p>
        </div>
        <Link
          href="/dashboard/properties"
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3.5 py-2 text-sm font-semibold shadow-sm hover:bg-[var(--surface-soft)]"
        >
          <Building2 className="h-4 w-4 text-blue-800" /> My Properties
        </Link>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[#0b1220] p-5 text-white sm:p-6"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_80%_at_100%_0%,rgba(59,130,246,0.4),transparent_55%),radial-gradient(50%_60%_at_0%_100%,rgba(29,78,216,0.25),transparent_50%)]" />
        <div className="relative">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-bold tracking-[0.14em] text-blue-200/80 uppercase">
            <Sparkles className="h-3.5 w-3.5" /> Search market
          </div>
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              runSearch(query);
            }}
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ZIP, city, or street address…"
                className="w-full rounded-2xl border border-white/15 bg-white/10 py-3.5 pr-4 pl-10 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/30 focus:bg-white/15"
              />
            </div>
            <button
              type="submit"
              disabled={isPending || !query.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-[#0b1220] transition hover:bg-blue-50 disabled:opacity-60"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Search
            </button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            {QUICK.map((item) => (
              <button
                key={item.q}
                type="button"
                onClick={() => {
                  setQuery(item.q);
                  runSearch(item.q);
                }}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/80 transition hover:bg-white/15 hover:text-white"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </motion.section>

      {searched && !isPending ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-[var(--muted)]">
            {results.length > 0 ? (
              <>
                Showing{' '}
                <span className="font-semibold text-[#0b1220]">{results.length}</span> properties
                {query.trim() ? (
                  <>
                    {' '}
                    for <span className="font-semibold text-[#0b1220]">“{query.trim()}”</span>
                  </>
                ) : null}
              </>
            ) : (
              'No matches for this search'
            )}
          </p>
          {results.length > 0 ? (
            <p className="text-[11px] text-[var(--muted)]">
              Open Details to import · or Analyze to underwrite
            </p>
          ) : null}
        </div>
      ) : null}

      {isPending ? <SkeletonPropertyCards count={6} /> : null}

      {message && !isPending && results.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {message}
        </div>
      ) : null}

      {!isPending && results.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((p, i) => {
            const pricePerSqft =
              p.estimatedValue && p.squareFeet && p.squareFeet > 0
                ? Math.round(p.estimatedValue / p.squareFeet)
                : null;
            return (
              <motion.div
                key={p.attomId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.04)] transition hover:border-blue-700/30 hover:shadow-md"
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_100%_0%,rgba(29,78,216,0.06),transparent_55%)] opacity-0 transition group-hover:opacity-100" />
                <div className="relative mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold tracking-tight text-[#0b1220]">
                      {p.street || p.address}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-[var(--muted)]">
                      <MapPin className="h-3 w-3 shrink-0 text-blue-800" />
                      {[p.city, p.state, p.zip].filter(Boolean).join(', ')}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-[#eff4ff] px-2 py-0.5 text-[10px] font-bold tracking-wide text-blue-800 uppercase">
                    ATTOM
                  </span>
                </div>

                <div className="relative mb-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--surface-soft)] px-2.5 py-1.5 text-xs font-medium text-[#0b1220]">
                    <BedDouble className="h-3.5 w-3.5 text-blue-800" />
                    {p.bedrooms ?? '—'} bd
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--surface-soft)] px-2.5 py-1.5 text-xs font-medium text-[#0b1220]">
                    <Bath className="h-3.5 w-3.5 text-blue-800" />
                    {p.bathrooms ?? '—'} ba
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--surface-soft)] px-2.5 py-1.5 text-xs font-medium text-[#0b1220]">
                    <Ruler className="h-3.5 w-3.5 text-blue-800" />
                    {p.squareFeet
                      ? `${Math.round(p.squareFeet).toLocaleString('en-US')} sqft`
                      : '—'}
                  </span>
                  {p.yearBuilt ? (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--surface-soft)] px-2.5 py-1.5 text-xs font-medium text-[#0b1220]">
                      <Home className="h-3.5 w-3.5 text-blue-800" />
                      {p.yearBuilt}
                    </span>
                  ) : null}
                </div>

                <div className="relative mt-auto flex items-end justify-between gap-3 border-t border-[var(--border)] pt-4">
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.12em] text-[var(--muted)] uppercase">
                      Est. value
                    </p>
                    <p className="font-display text-xl font-bold tracking-tight text-[#0b1220]">
                      {money(p.estimatedValue)}
                    </p>
                    {pricePerSqft != null ? (
                      <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                        ${pricePerSqft.toLocaleString('en-US')}/sqft
                        {p.estimatedRent ? ` · rent ${money(p.estimatedRent)}/mo` : ''}
                      </p>
                    ) : p.estimatedRent ? (
                      <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                        Est. rent {money(p.estimatedRent)}/mo
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <Link
                      href={`/dashboard/analyze/hold?${analyzeQs(p)}`}
                      className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-white px-2.5 py-2 text-xs font-semibold hover:bg-[var(--surface-soft)]"
                      title="Analyze"
                    >
                      <Calculator className="h-3.5 w-3.5 text-blue-800" />
                    </Link>
                    <Link
                      href={`/dashboard/explore/${p.attomId}`}
                      className="inline-flex items-center gap-1 rounded-xl bg-[#1d4ed8] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1e40af]"
                    >
                      Details <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : null}

      {!searched && !isPending ? (
        <div className="rounded-3xl border border-dashed border-[var(--border)] bg-white/60 px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eff4ff] text-blue-800">
            <Search className="h-6 w-6" />
          </div>
          <p className="font-display text-xl font-bold text-[#0b1220]">
            Discover investable properties
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
            Search ATTOM by ZIP or city. Import keeps a copy in your workspace for Analyzer, AI, and
            CRM.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {QUICK.slice(0, 3).map((item) => (
              <button
                key={item.q}
                type="button"
                onClick={() => {
                  setQuery(item.q);
                  runSearch(item.q);
                }}
                className="rounded-xl border border-[var(--border)] bg-white px-3.5 py-2 text-xs font-semibold shadow-sm hover:border-blue-700/30"
              >
                Try {item.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
