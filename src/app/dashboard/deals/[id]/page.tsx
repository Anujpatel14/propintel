'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, FileDown, Loader2 } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { getAnalysisById } from '@/app/actions/analysisActions';
import { exportToPDF } from '@/lib/services/reports';
import { useToast } from '@/components/ui/Toast';

function money(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return '—';
  return `$${Math.round(n).toLocaleString()}`;
}

export default function DealDetailPage() {
  const toast = useToast();
  const params = useParams();
  const id = String(params.id || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<Awaited<ReturnType<typeof getAnalysisById>> | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await getAnalysisById(id);
      if (cancelled) return;
      if (!res.success) {
        setError(res.error || 'Not found');
        setPayload(null);
      } else {
        setPayload(res);
        setError(null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Deal" description="Loading…" />
        <SkeletonRows rows={8} />
      </div>
    );
  }

  if (error || !payload?.success) {
    return (
      <div className="space-y-4">
        <PageHeader title="Deal" />
        <p className="text-sm text-[var(--muted)]">{error || 'Not found'}</p>
        <Link href="/dashboard/deals" className="text-sm text-teal-800 underline">
          Back to Deals
        </Link>
      </div>
    );
  }

  const a = payload.analysis;
  const isFlip = payload.analysisType === 'FLIP';
  const typeLabel = isFlip
    ? 'Fix & Flip'
    : 'strategyType' in a && a.strategyType === 'rental'
      ? 'Rental'
      : 'Buy & Hold';

  const download = () => {
    if (isFlip) {
      exportToPDF({
        address: a.address,
        type: typeLabel,
        metrics: [
          { label: 'Profit', value: money('profit' in a ? a.profit : null) },
          { label: 'ROI', value: `${(('roi' in a ? a.roi : 0) || 0).toFixed(1)}%` },
          { label: 'MAO', value: money('mao' in a ? a.mao : null) },
        ],
        inputs: [
          { label: 'Purchase', value: a.purchasePrice },
          { label: 'Rehab', value: a.rehabCost },
          { label: 'ARV', value: 'arv' in a ? a.arv : 0 },
        ],
        aiAnalysis: ('aiHeadline' in a ? a.aiHeadline : undefined) || undefined,
      });
    } else {
      exportToPDF({
        address: a.address,
        type: typeLabel,
        metrics: [
          { label: 'Cash flow', value: money('cashFlow' in a ? a.cashFlow : null) },
          { label: 'Cap rate', value: `${(('capRate' in a ? a.capRate : 0) || 0).toFixed(1)}%` },
          { label: 'DSCR', value: ((('dscr' in a ? a.dscr : 0) || 0) as number).toFixed(2) },
        ],
        inputs: [
          { label: 'Purchase', value: a.purchasePrice },
          { label: 'Rent', value: 'rent' in a ? a.rent : 0 },
          { label: 'Rehab', value: a.rehabCost },
        ],
        aiAnalysis: a.aiHeadline || undefined,
      });
    }
    toast.success('PDF downloaded');
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={a.address}
        description={`${typeLabel} deal · saved analysis (not a property record)`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/deals"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            >
              <ArrowLeft className="h-4 w-4" /> Deals
            </Link>
            <button
              type="button"
              onClick={download}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-800 px-3 py-2 text-sm font-medium text-white"
            >
              <FileDown className="h-4 w-4" /> Report PDF
            </button>
            <Link
              href="/dashboard/crm"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            >
              Open CRM
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(isFlip
          ? [
              ['Purchase', money(a.purchasePrice)],
              ['Rehab', money(a.rehabCost)],
              ['ARV', money(a.arv)],
              ['Profit', money(a.profit)],
            ]
          : [
              ['Purchase', money(a.purchasePrice)],
              ['Rent', money('rent' in a ? a.rent : null)],
              ['Cash flow', money('cashFlow' in a ? a.cashFlow : null)],
              ['Cap rate', `${(('capRate' in a ? a.capRate : 0) || 0).toFixed(1)}%`],
            ]
        ).map(([label, value]) => (
          <SpotlightCard key={label} className="p-4">
            <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">{label}</p>
            <p className="mt-1 text-lg font-semibold">{value}</p>
          </SpotlightCard>
        ))}
      </div>

      {(a.aiVerdict || a.aiHeadline) && (
        <SpotlightCard className="p-5">
          <h2 className="font-display text-lg">AI summary</h2>
          {a.aiVerdict ? (
            <p className="mt-2 text-sm font-semibold text-teal-900">{a.aiVerdict}</p>
          ) : null}
          {a.aiHeadline ? <p className="mt-1 text-sm text-[var(--muted)]">{a.aiHeadline}</p> : null}
        </SpotlightCard>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : null}
    </div>
  );
}
