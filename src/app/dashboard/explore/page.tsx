'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Search,
  MapPin,
  BedDouble,
  Bath,
  Ruler,
  Loader2,
  ArrowRight,
  Building2,
} from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { SkeletonPropertyCards } from '@/components/ui/Skeleton';
import {
  searchPropertiesAction,
} from '@/app/actions/propertyActions';
import type { MappedProperty } from '@/lib/services/attomMapper';
import { useToast } from '@/components/ui/Toast';

function money(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return '—';
  return `$${Math.round(n).toLocaleString()}`;
}

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
    <div className="space-y-8">
      <PageHeader
        title="Property Explorer"
        description="Search public records. “Save to My Properties” stores the address/facts — not an analysis."
        actions={
          <Link
            href="/dashboard/properties"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-foreground transition hover:border-teal-600/40"
          >
            <Building2 className="h-4 w-4 text-teal-700" />
            My Properties
          </Link>
        }
      />

      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(query);
        }}
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ZIP, city + state, or street address…"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-3 pl-10 pr-4 text-sm text-foreground outline-none ring-teal-700/30 placeholder:text-[var(--muted)] focus:ring-2"
          />
        </div>
        <button
          type="submit"
          disabled={isPending || !query.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-800 px-5 py-3 text-sm font-medium text-white transition hover:bg-teal-700 disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Search
        </button>
      </form>

      <p className="text-xs text-[var(--muted)]">
        Use a <span className="font-medium text-foreground">ZIP</span>,{" "}
        <span className="font-medium text-foreground">City, ST</span> (state required), or a full street address.
        Examples:{" "}
        <button type="button" className="underline hover:text-foreground" onClick={() => { setQuery('80212'); runSearch('80212'); }}>80212</button>
        {' · '}
        <button type="button" className="underline hover:text-foreground" onClick={() => { setQuery('Denver, CO'); runSearch('Denver, CO'); }}>Denver, CO</button>
        {' · '}
        <button type="button" className="underline hover:text-foreground" onClick={() => { setQuery('4529 Winona Court, Denver, CO 80212'); runSearch('4529 Winona Court, Denver, CO 80212'); }}>4529 Winona Court, Denver, CO 80212</button>
      </p>

      {isPending ? <SkeletonPropertyCards count={6} /> : null}

      {message && !isPending ? (
        <p className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted)]">
          {message}
        </p>
      ) : null}

      {!isPending && results.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((p) => (
            <SpotlightCard key={p.attomId} className="flex flex-col p-5">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{p.street || p.address}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--muted)]">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {[p.city, p.state, p.zip].filter(Boolean).join(', ')}
                  </p>
                </div>
                <span className="shrink-0 rounded bg-teal-900/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-teal-800">
                  ATTOM
                </span>
              </div>

              <div className="mb-4 flex flex-wrap gap-3 text-xs text-[var(--muted)]">
                <span className="inline-flex items-center gap-1">
                  <BedDouble className="h-3.5 w-3.5" />
                  {p.bedrooms ?? '—'} bd
                </span>
                <span className="inline-flex items-center gap-1">
                  <Bath className="h-3.5 w-3.5" />
                  {p.bathrooms ?? '—'} ba
                </span>
                <span className="inline-flex items-center gap-1">
                  <Ruler className="h-3.5 w-3.5" />
                  {p.squareFeet ? `${Math.round(p.squareFeet).toLocaleString()} sqft` : '—'}
                </span>
              </div>

              <div className="mt-auto flex items-end justify-between gap-2 border-t border-[var(--border)] pt-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">Est. value</p>
                  <p className="text-lg font-semibold text-foreground">{money(p.estimatedValue)}</p>
                </div>
                <Link
                  href={`/dashboard/explore/${p.attomId}`}
                  className="inline-flex items-center gap-1 rounded-lg bg-teal-800/10 px-3 py-2 text-xs font-medium text-teal-900 transition hover:bg-teal-800 hover:text-white"
                >
                  Details <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </SpotlightCard>
          ))}
        </div>
      ) : null}

      {!searched && !isPending ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] px-6 py-16 text-center">
          <Search className="mx-auto mb-3 h-8 w-8 text-teal-800/40" />
          <p className="font-display text-xl text-foreground">Discover investable properties</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
            Search ATTOM public records by ZIP or address. Import keeps a copy in your workspace for Analyzer, AI, and CRM.
          </p>
        </div>
      ) : null}
    </div>
  );
}
