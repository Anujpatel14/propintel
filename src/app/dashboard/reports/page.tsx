'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Download,
  FileText,
  Loader2,
  Search,
  Trash2,
} from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import {
  createReportAction,
  deleteReportAction,
  listReportsAction,
  type ReportType,
} from '@/app/actions/reportActions';
import { getUserAnalyses } from '@/app/actions/analysisActions';
import { exportToPDF } from '@/lib/services/reports';

const TEMPLATES: { type: ReportType; title: string; blurb: string }[] = [
  {
    type: 'FINANCIAL',
    title: 'Financial summary',
    blurb: 'Cash flow & returns from your latest buy-and-hold / rental analysis.',
  },
  {
    type: 'PROPERTY',
    title: 'Property report',
    blurb: 'Purchase inputs + underwriting metrics for one property analysis.',
  },
  {
    type: 'RENTAL',
    title: 'Rental report',
    blurb: 'Uses your most recent rental strategy deal from Saved Deals.',
  },
  {
    type: 'FLIP',
    title: 'Flip report',
    blurb: 'Rehab, ARV, profit, ROI, and MAO from your latest flip analysis.',
  },
  {
    type: 'PORTFOLIO',
    title: 'Portfolio report',
    blurb: 'Totals across all active saved deals (hold + flip).',
  },
];

type ReportRow = {
  id: string;
  type: string;
  title: string;
  address: string | null;
  status: string;
  payloadJson: string | null;
  createdAt: string | Date;
};

export default function ReportsPage() {
  const toast = useToast();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<ReportType | 'ALL'>('ALL');
  const [q, setQ] = useState('');
  const [generatingType, setGeneratingType] = useState<ReportType | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listReportsAction({ type: typeFilter, q });
      if (res.success) setReports(res.reports as ReportRow[]);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, q]);

  useEffect(() => {
    void load();
  }, [load]);

  const generate = async (type: ReportType) => {
    if (generatingType) return;
    setGeneratingType(type);
    try {
      const { propertyAnalyses, flipAnalyses } = await getUserAnalyses({ tab: 'all' });
      const hold = propertyAnalyses[0];
      const flip = flipAnalyses[0];

      let title = `${type.replace('_', ' ')} report`;
      let address: string | undefined;
      let payload: Record<string, unknown> = { generatedAt: new Date().toISOString() };
      let pdfMetrics: { label: string; value: string | number }[] = [];
      let pdfInputs: { label: string; value: string | number }[] = [];

      if (type === 'FLIP') {
        if (!flip) {
          toast.error('No flip deal yet', 'Save a flip in Calculators first.');
          return;
        }
        title = `Flip report — ${flip.address}`;
        address = flip.address;
        payload = {
          ...payload,
          purchasePrice: flip.purchasePrice,
          rehabCost: flip.rehabCost,
          arv: flip.arv,
          profit: flip.profit,
          roi: flip.roi,
          mao: flip.mao,
        };
        pdfMetrics = [
          { label: 'Profit', value: `$${Math.round(flip.profit || 0).toLocaleString()}` },
          { label: 'ROI', value: `${(flip.roi || 0).toFixed(1)}%` },
          { label: 'MAO', value: `$${Math.round(flip.mao || 0).toLocaleString()}` },
        ];
        pdfInputs = [
          { label: 'Purchase', value: flip.purchasePrice },
          { label: 'Rehab', value: flip.rehabCost },
          { label: 'ARV', value: flip.arv },
        ];
      } else if (type === 'PORTFOLIO') {
        title = `Portfolio report — ${propertyAnalyses.length + flipAnalyses.length} deals`;
        payload = {
          ...payload,
          holdCount: propertyAnalyses.length,
          flipCount: flipAnalyses.length,
          totalPurchase: [...propertyAnalyses, ...flipAnalyses].reduce(
            (s, d) => s + (d.purchasePrice || 0),
            0
          ),
        };
        pdfMetrics = [
          { label: 'Hold deals', value: propertyAnalyses.length },
          { label: 'Flip deals', value: flipAnalyses.length },
        ];
        pdfInputs = [{ label: 'Generated', value: new Date().toLocaleString() }];
      } else {
        const rental = propertyAnalyses.find((a) => a.strategyType === 'rental');
        const source = type === 'RENTAL' ? rental || hold : hold;
        if (!source) {
          toast.error('No analysis yet', 'Save a deal in Calculators or Analyzer first.');
          return;
        }
        const label =
          type === 'RENTAL' || source.strategyType === 'rental' ? 'Rental' : 'Property';
        title = `${label} report — ${source.address}`;
        address = [source.address, source.city, source.state].filter(Boolean).join(', ');
        payload = {
          ...payload,
          purchasePrice: source.purchasePrice,
          rent: source.rent,
          cashFlow: source.cashFlow,
          capRate: source.capRate,
          dscr: source.dscr,
          cashOnCash: source.cashOnCash,
          strategyType: source.strategyType,
        };
        pdfMetrics = [
          { label: 'Cash flow', value: `$${Math.round(source.cashFlow || 0).toLocaleString()}` },
          { label: 'Cap rate', value: `${(source.capRate || 0).toFixed(1)}%` },
          { label: 'DSCR', value: (source.dscr || 0).toFixed(2) },
          { label: 'CoC', value: `${(source.cashOnCash || 0).toFixed(1)}%` },
        ];
        pdfInputs = [
          { label: 'Purchase', value: source.purchasePrice },
          { label: 'Rent', value: source.rent },
          { label: 'Rehab', value: source.rehabCost },
        ];
      }

      const res = await createReportAction({ type, title, address, payload });
      if (!res.success) {
        toast.error('Could not save report history');
        return;
      }

      exportToPDF({
        address: address || title,
        type: type.replace('_', ' '),
        metrics: pdfMetrics,
        inputs: pdfInputs,
        aiAnalysis: 'Generated from PropIntel Deals / Analyze.',
      });

      toast.success('PDF downloaded', 'Also added to History below');
      await load();
    } catch {
      toast.error('Report generation failed');
    } finally {
      setGeneratingType(null);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports"
        description="Download a PDF from a saved analysis. History keeps every export you generate."
      />

      <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted)]">
        Each card is a <span className="font-medium text-foreground">report style</span>. It pulls
        your latest matching deal from{' '}
        <Link href="/dashboard/deals" className="text-blue-800 underline">
          Deals
        </Link>
        , downloads a real PDF, and logs it in History.
      </p>

      <section className="space-y-3">
        <h2 className="font-display text-xl">Report styles</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {TEMPLATES.map((t) => {
            const busy = generatingType === t.type;
            return (
              <SpotlightCard key={t.type} className="flex flex-col p-5">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-900/10 text-blue-900">
                  <FileText className="h-4 w-4" />
                </div>
                <h3 className="font-medium text-foreground">{t.title}</h3>
                <p className="mt-1 flex-1 text-sm text-[var(--muted)]">{t.blurb}</p>
                <button
                  type="button"
                  disabled={!!generatingType}
                  onClick={() => void generate(t.type)}
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {busy ? 'Generating…' : 'Download PDF'}
                </button>
              </SpotlightCard>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-xl">History</h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted)]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Filter reports…"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 pl-9 pr-3 text-sm sm:w-56"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ReportType | 'ALL')}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
            >
              <option value="ALL">All types</option>
              <option value="FINANCIAL">Financial</option>
              <option value="PROPERTY">Property</option>
              <option value="RENTAL">Rental</option>
              <option value="FLIP">Flip</option>
              <option value="PORTFOLIO">Portfolio</option>
            </select>
          </div>
        </div>

        {loading ? <SkeletonRows rows={5} cols={4} /> : null}

        {!loading && reports.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-10 text-center text-sm text-[var(--muted)]">
            No downloads yet. Pick a style above after you have at least one saved deal.
          </p>
        ) : null}

        {!loading && reports.length > 0 ? (
          <SpotlightCard className="divide-y divide-[var(--border)] overflow-hidden p-0">
            {reports.map((r) => (
              <div
                key={r.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{r.title}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {r.type} · {new Date(r.createdAt).toLocaleString()}
                    {r.address ? ` · ${r.address}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!!deletingId}
                  onClick={() => {
                    void (async () => {
                      setDeletingId(r.id);
                      try {
                        await deleteReportAction(r.id);
                        setReports((list) => list.filter((x) => x.id !== r.id));
                        toast.success('Removed from history');
                      } catch {
                        toast.error('Could not remove report');
                      } finally {
                        setDeletingId(null);
                      }
                    })();
                  }}
                  className="inline-flex items-center gap-1 self-start rounded-lg border border-red-200 px-2.5 py-1.5 text-xs text-red-700 sm:self-auto disabled:opacity-50"
                >
                  {deletingId === r.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}{' '}
                  Remove
                </button>
              </div>
            ))}
          </SpotlightCard>
        ) : null}
      </section>
    </div>
  );
}
