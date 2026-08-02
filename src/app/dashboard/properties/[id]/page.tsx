'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Calculator,
  Loader2,
  MapPin,
  Save,
  Trash2,
} from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { SkeletonPropertyDetail } from '@/components/ui/Skeleton';
import {
  deleteMyPropertyAction,
  getMyPropertyAction,
  updateMyPropertyAction,
} from '@/app/actions/propertyActions';

function money(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return '—';
  return `$${Math.round(n).toLocaleString()}`;
}

export default function PropertyDetailPage() {
  const params = useParams();
  const id = String(params.id || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [property, setProperty] = useState<{
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
    taxAmount: number | null;
    propertyType: string | null;
    notes: string | null;
    source: string;
    latitude: number | null;
    longitude: number | null;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await getMyPropertyAction(id);
      if (cancelled) return;
      if (!res.success || !res.property) {
        setError(res.error || 'Not found');
        setProperty(null);
      } else {
        setProperty(res.property);
        setNotes(res.property.notes || '');
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <SkeletonPropertyDetail />;

  if (error || !property) {
    return (
      <div className="space-y-4">
        <PageHeader title="Property" />
        <p className="text-sm text-[var(--muted)]">{error || 'Not found'}</p>
        <Link href="/dashboard/properties" className="text-sm text-teal-800 underline">
          Back
        </Link>
      </div>
    );
  }

  const p = property;
  const calcQs = new URLSearchParams({
    address: p.address,
    zip: p.zip || '',
    from: 'property',
    propertyId: p.id,
    value: String(p.estimatedValue ?? ''),
    rent: String(p.estimatedRent ?? ''),
  });

  const saveNotes = () => {
    startTransition(async () => {
      setMsg(null);
      const res = await updateMyPropertyAction(p.id, { notes });
      setMsg(res.success ? 'Notes saved.' : res.error || 'Failed');
    });
  };

  const remove = () => {
    startTransition(async () => {
      await deleteMyPropertyAction(p.id);
      window.location.href = '/dashboard/properties';
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={p.address}
        description={[p.city, p.state, p.zip].filter(Boolean).join(', ')}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/properties"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <Link
              href={`/dashboard/analyze/hold?${calcQs.toString()}`}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-800 px-3 py-2 text-sm font-medium text-white"
            >
              <Calculator className="h-4 w-4" /> Analyze
            </Link>
            {p.attomId ? (
              <Link
                href={`/dashboard/explore/${p.attomId}`}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
              >
                ATTOM record
              </Link>
            ) : null}
            <button
              type="button"
              disabled={isPending}
              onClick={remove}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <SpotlightCard className="space-y-4 p-5 lg:col-span-2">
          <h2 className="font-display text-xl">Property information</h2>
          <p className="flex items-center gap-1 text-sm text-[var(--muted)]">
            <MapPin className="h-4 w-4" /> {[p.city, p.state, p.zip].filter(Boolean).join(', ')}
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {(
              [
                ['Type', p.propertyType || '—'],
                ['Beds', p.bedrooms ?? '—'],
                ['Baths', p.bathrooms ?? '—'],
                ['Sqft', p.squareFeet ? Math.round(p.squareFeet).toLocaleString() : '—'],
                ['Year built', p.yearBuilt ?? '—'],
                ['Source', p.source],
              ] as const
            ).map(([label, value]) => (
              <div key={label}>
                <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">{label}</p>
                <p className="mt-0.5 text-sm font-medium">{value}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-[var(--border)] pt-4">
            <h3 className="mb-2 text-sm font-medium">Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              placeholder="Seller notes, walkthrough, comps…"
            />
            <button
              type="button"
              disabled={isPending}
              onClick={saveNotes}
              className="mt-2 inline-flex items-center gap-2 rounded-lg border border-teal-800/30 bg-teal-800/10 px-3 py-2 text-sm font-medium text-teal-900"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save notes
            </button>
            {msg ? <p className="mt-2 text-sm text-teal-800">{msg}</p> : null}
          </div>
        </SpotlightCard>

        <SpotlightCard className="overflow-hidden p-0">
          <div className="border-b border-[var(--border)] bg-gradient-to-br from-teal-900/[0.07] to-transparent px-5 py-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-teal-800/80">
              Financial summary
            </p>
            <p className="mt-1 font-display text-3xl tracking-tight">{money(p.estimatedValue)}</p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">Estimated value</p>
          </div>
          <div className="px-5 py-2">
            {(
              [
                ['Est. rent / mo', money(p.estimatedRent)],
                ['Annual tax', money(p.taxAmount)],
                [
                  'Map',
                  p.latitude != null && p.longitude != null
                    ? `${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)}`
                    : '—',
                ],
              ] as const
            ).map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between gap-3 border-b border-[var(--border)] py-3 last:border-0"
              >
                <span className="text-xs text-[var(--muted)]">{label}</span>
                <span className="text-sm font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
}
