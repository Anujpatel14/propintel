'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  Calculator,
  Download,
  Loader2,
  MapPin,
  Ruler,
} from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { SkeletonPropertyDetail } from '@/components/ui/Skeleton';
import {
  getPropertyDetailAction,
  importPropertyAction,
} from '@/app/actions/propertyActions';
import type { MappedProperty } from '@/lib/services/attomMapper';
import { useToast } from '@/components/ui/Toast';

function money(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return '—';
  return `$${Math.round(n).toLocaleString()}`;
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

type ImportMode = 'save' | 'analyze' | null;

export default function PropertyExploreDetailPage() {
  const toast = useToast();
  const params = useParams();
  const router = useRouter();
  const attomId = String(params.attomId || '');
  const [property, setProperty] = useState<MappedProperty | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [importMode, setImportMode] = useState<ImportMode>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const res = await getPropertyDetailAction(attomId);
      if (cancelled) return;
      if (!res.success || !res.property) {
        setError(res.error || 'Property not found');
        setProperty(null);
      } else {
        setProperty(res.property);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [attomId]);

  const handleImport = async (thenAnalyze: boolean) => {
    if (importMode) return;
    setImportMode(thenAnalyze ? 'analyze' : 'save');
    try {
      const res = await importPropertyAction(attomId);
      if (!res.success || !res.property) {
        toast.error(res.error || 'Import failed');
        return;
      }
      if (thenAnalyze) {
        toast.success('Saved to My Properties', 'Opening Analyze…');
        const p = res.property;
        const q = new URLSearchParams({
          address: p.address,
          zip: p.zip || '',
          from: 'property',
          propertyId: res.propertyId || '',
          value: String(p.estimatedValue ?? ''),
          rent: String(p.estimatedRent ?? ''),
          mode: 'hold',
        });
        router.push(`/dashboard/analyze/hold?${q.toString()}`);
      } else {
        toast.success('Saved to My Properties', 'Open it anytime from the sidebar');
        router.push('/dashboard/properties');
      }
    } finally {
      setImportMode(null);
    }
  };

  if (loading) {
    return <SkeletonPropertyDetail />;
  }

  if (error || !property) {
    return (
      <div className="space-y-6">
        <PageHeader title="Property details" />
        <p className="text-sm text-[var(--muted)]">{error || 'Not found'}</p>
        <Link href="/dashboard/explore" className="text-sm text-blue-800 underline">
          Back to explorer
        </Link>
      </div>
    );
  }

  const p = property;
  const busy = importMode !== null;
  const monthlyTax =
    p.taxAmount != null ? Math.round(p.taxAmount / 12) : null;
  const rentYield =
    p.estimatedValue && p.estimatedRent
      ? ((p.estimatedRent * 12) / p.estimatedValue) * 100
      : null;

  return (
    <div className="space-y-8">
      <PageHeader
        title={p.street || p.address}
        description={[p.city, p.state, p.zip].filter(Boolean).join(', ')}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/explore"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleImport(false)}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-800/30 bg-blue-800/10 px-3 py-2 text-sm font-medium text-blue-900 disabled:opacity-60"
            >
              {importMode === 'save' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {importMode === 'save' ? 'Saving…' : 'Save to My Properties'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleImport(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {importMode === 'analyze' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Calculator className="h-4 w-4" />
              )}
              {importMode === 'analyze' ? 'Opening…' : 'Analyze deal'}
            </button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <SpotlightCard className="p-5 lg:col-span-2">
          <h2 className="mb-4 font-display text-xl text-foreground">Overview</h2>
          <div className="mb-6 flex flex-wrap gap-4 text-sm text-[var(--muted)]">
            <span className="inline-flex items-center gap-1.5">
              <BedDouble className="h-4 w-4" /> {p.bedrooms ?? '—'} beds
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Bath className="h-4 w-4" /> {p.bathrooms ?? '—'} baths
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Ruler className="h-4 w-4" />
              {p.squareFeet ? `${Math.round(p.squareFeet).toLocaleString()} sqft` : '—'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="h-4 w-4" /> {p.propertyType || '—'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> Built {p.yearBuilt ?? '—'}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Lot size" value={p.lotSize ? `${Math.round(p.lotSize).toLocaleString()} sqft` : '—'} />
            <Stat label="Stories" value={p.stories ?? '—'} />
            <Stat label="Garage" value={p.garage || '—'} />
            <Stat label="Heating" value={p.heating || '—'} />
            <Stat label="Cooling" value={p.cooling || '—'} />
            <Stat label="Owner occupied" value={p.ownerOccupied == null ? '—' : p.ownerOccupied ? 'Yes' : 'No'} />
            <Stat label="APN" value={p.apn || '—'} />
            <Stat label="ATTOM ID" value={p.attomId} />
            <Stat
              label="Coordinates"
              value={
                p.latitude != null && p.longitude != null
                  ? `${p.latitude.toFixed(5)}, ${p.longitude.toFixed(5)}`
                  : '—'
              }
            />
          </div>
          {p.legalDescription ? (
            <p className="mt-6 border-t border-[var(--border)] pt-4 text-xs leading-relaxed text-[var(--muted)]">
              {p.legalDescription}
            </p>
          ) : null}
        </SpotlightCard>

        <SpotlightCard className="overflow-hidden p-0">
          <div className="border-b border-[var(--border)] bg-gradient-to-br from-white/[0.05] to-transparent px-5 py-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-blue-800/80">
              Financial summary
            </p>
            <p className="mt-1 font-display text-3xl tracking-tight text-foreground">
              {money(p.estimatedValue)}
            </p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">Estimated market value</p>
          </div>
          <div className="space-y-0 px-5 py-2">
            {(
              [
                { label: 'Market value', value: money(p.marketValue) },
                { label: 'Assessed value', value: money(p.assessedValue) },
                { label: 'Est. monthly rent', value: money(p.estimatedRent) },
                {
                  label: 'Gross rent yield',
                  value: rentYield != null ? `${rentYield.toFixed(1)}%` : '—',
                },
                {
                  label: 'Annual tax',
                  value:
                    p.taxAmount != null
                      ? `${money(p.taxAmount)}${p.taxYear ? ` · ${p.taxYear}` : ''}`
                      : '—',
                },
                {
                  label: 'Est. monthly tax',
                  value: monthlyTax != null ? money(monthlyTax) : '—',
                },
                {
                  label: 'Last sale',
                  value:
                    p.lastSaleAmount != null
                      ? `${money(p.lastSaleAmount)}${p.lastSaleDate ? ` · ${p.lastSaleDate}` : ''}`
                      : '—',
                },
              ] as const
            ).map((row) => (
              <div
                key={row.label}
                className="flex items-baseline justify-between gap-3 border-b border-[var(--border)] py-3 last:border-0"
              >
                <span className="text-xs text-[var(--muted)]">{row.label}</span>
                <span className="text-right text-sm font-semibold text-foreground">{row.value}</span>
              </div>
            ))}
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
}
