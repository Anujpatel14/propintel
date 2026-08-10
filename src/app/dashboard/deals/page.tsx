'use client';

import React, { useEffect, useState } from 'react';
import {
  Search,
  Trash2,
  ArrowRightLeft,
  X,
  Loader2,
  MapPin,
  Eye,
  Star,
  Archive,
  Copy,
  FileDown,
} from 'lucide-react';
import SpotlightCard from '@/components/ui/SpotlightCard';
import PageHeader from '@/components/dashboard/PageHeader';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { IconTooltip } from '@/components/ui/IconTooltip';
import { useToast } from '@/components/ui/Toast';
import {
  getUserAnalyses,
  deleteAnalysis,
  toggleFavoriteAnalysis,
  archiveAnalysis,
  duplicateAnalysis,
  updateAnalysisPipelineStatus,
} from '@/app/actions/analysisActions';
import { exportToPDF } from '@/lib/services/reports';
import { createReportAction } from '@/app/actions/reportActions';
import Link from 'next/link';
import { PipelineStatusSelect } from '@/components/dashboard/PipelineStatusSelect';
import type { PipelineStatus } from '@/lib/pipelineStatus';

interface SavedDeal {
  id: string;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  type: string;
  analysisType: 'PROPERTY' | 'FLIP';
  purchasePrice: number;
  rehabCost: number;
  arv: number;
  rent: number;
  downPayment: number;
  cashFlow: number;
  roi: number;
  capRate: number;
  dscr: number;
  cashOnCash: number;
  profit: number | null;
  mao: number | null;
  financingCost: number | null;
  holdingCost: number | null;
  sellingCost: number | null;
  vacancyRate: number | null;
  maintenanceRate: number | null;
  mortgageRate: number | null;
  mortgageTerm: number | null;
  aiVerdict: string | null;
  aiHeadline: string | null;
  isFavorite: boolean;
  isArchived: boolean;
  pipelineStatus: string;
  aiPayload: {
    summary?: Array<{ label: string; value: string }>;
    strengths?: Array<{ title: string; detail: string }>;
    risks?: Array<{ title: string; detail: string }>;
    reportText?: string | null;
  } | null;
  createdAt: string;
}

type DealTab = 'all' | 'favorites' | 'archived' | 'deleted';


function money(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
}

function parseAiPayload(raw: string | null | undefined) {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SavedDeal['aiPayload'];
  } catch {
    return null;
  }
}

export default function SavedDealsPage() {
  const toast = useToast();
  const [deals, setDeals] = useState<SavedDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState<DealTab>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [activeDeal, setActiveDeal] = useState<SavedDeal | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const loadDeals = async (activeTab: DealTab = tab, opts?: { silent?: boolean }) => {
    if (!opts?.silent) setIsLoading(true);
    try {
      const { propertyAnalyses, flipAnalyses } = await getUserAnalyses({ tab: activeTab });

      const propertyDeals: SavedDeal[] = propertyAnalyses.map((a) => ({
        id: a.id,
        address: [a.address, a.city, a.state].filter(Boolean).join(', '),
        city: a.city,
        state: a.state,
        zip: a.zip,
        type: a.strategyType === 'rental' ? 'Rental L/T' : 'Buy & Hold',
        analysisType: 'PROPERTY' as const,
        purchasePrice: a.purchasePrice,
        rehabCost: a.rehabCost,
        arv: a.arv,
        rent: a.rent,
        downPayment: a.downPayment,
        cashFlow: a.cashFlow ?? 0,
        roi: a.roi ?? 0,
        capRate: a.capRate ?? 0,
        dscr: a.dscr ?? 0,
        cashOnCash: a.cashOnCash ?? 0,
        profit: null,
        mao: null,
        financingCost: null,
        holdingCost: null,
        sellingCost: null,
        vacancyRate: a.vacancyRate,
        maintenanceRate: a.maintenanceRate,
        mortgageRate: a.mortgageRate,
        mortgageTerm: a.mortgageTerm,
        aiVerdict: a.aiVerdict,
        aiHeadline: a.aiHeadline,
        isFavorite: a.isFavorite,
        isArchived: a.isArchived,
        pipelineStatus: a.pipelineStatus || 'UNDER_REVIEW',
        aiPayload: parseAiPayload(a.aiPayloadJson),
        createdAt: new Date(a.createdAt).toISOString(),
      }));

      const flipDeals: SavedDeal[] = flipAnalyses.map((a) => ({
        id: a.id,
        address: a.address,
        type: 'Fix & Flip',
        analysisType: 'FLIP' as const,
        purchasePrice: a.purchasePrice,
        rehabCost: a.rehabCost,
        arv: a.arv,
        rent: 0,
        downPayment: 0,
        cashFlow: 0,
        roi: a.roi ?? 0,
        capRate: 0,
        dscr: 0,
        cashOnCash: 0,
        profit: a.profit ?? null,
        mao: a.mao ?? null,
        financingCost: a.financingCost ?? null,
        holdingCost: a.holdingCost ?? null,
        sellingCost: a.sellingCost ?? null,
        vacancyRate: null,
        maintenanceRate: null,
        mortgageRate: null,
        mortgageTerm: null,
        aiVerdict: a.aiVerdict,
        aiHeadline: a.aiHeadline,
        isFavorite: a.isFavorite,
        isArchived: a.isArchived,
        pipelineStatus: a.pipelineStatus || 'UNDER_REVIEW',
        aiPayload: parseAiPayload(a.aiPayloadJson),
        createdAt: new Date(a.createdAt).toISOString(),
      }));

      const combined = [...propertyDeals, ...flipDeals].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setDeals(combined);
    } catch (e) {
      console.error(e);
      toast.error('Could not load deals');
    } finally {
      if (!opts?.silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDeals(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (!showComparison && !activeDeal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowComparison(false);
        setActiveDeal(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showComparison, activeDeal]);

  const handleSelectDeal = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : prev.length < 3
          ? [...prev, id]
          : prev
    );
  };

  const handleDeleteDeal = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const deal = deals.find((d) => d.id === id);
    if (!deal || busyKey) return;
    const key = `del:${id}`;
    setBusyKey(key);
    const prev = deals;
    if (activeDeal?.id === id) setActiveDeal(null);
    setDeals((list) => list.filter((d) => d.id !== id));
    setSelectedIds((ids) => ids.filter((item) => item !== id));
    try {
      await deleteAnalysis(id, deal.analysisType);
      toast.success(tab === 'deleted' ? 'Removed permanently' : 'Moved to Deleted');
    } catch {
      setDeals(prev);
      toast.error('Could not delete deal');
    } finally {
      setBusyKey(null);
    }
  };

  const handleFavorite = async (deal: SavedDeal, e: React.MouseEvent) => {
    e.stopPropagation();
    if (busyKey) return;
    const key = `fav:${deal.id}`;
    setBusyKey(key);
    const nextFav = !deal.isFavorite;
    setDeals((list) =>
      list
        .map((d) => (d.id === deal.id ? { ...d, isFavorite: nextFav } : d))
        .filter((d) => !(tab === 'favorites' && !d.isFavorite))
    );
    try {
      const res = await toggleFavoriteAnalysis(deal.id, deal.analysisType);
      if (!res.success) throw new Error('failed');
      toast.success(nextFav ? 'Added to Favorites' : 'Removed from Favorites');
    } catch {
      setDeals((list) =>
        list.map((d) => (d.id === deal.id ? { ...d, isFavorite: deal.isFavorite } : d))
      );
      toast.error('Could not update favorite');
      await loadDeals(tab, { silent: true });
    } finally {
      setBusyKey(null);
    }
  };

  const handleArchive = async (deal: SavedDeal, e: React.MouseEvent) => {
    e.stopPropagation();
    if (busyKey) return;
    const archiving = tab !== 'archived';
    setBusyKey(`arc:${deal.id}`);
    const prev = deals;
    setDeals((list) => list.filter((d) => d.id !== deal.id));
    try {
      const res = await archiveAnalysis(deal.id, deal.analysisType, archiving);
      if (!res.success) throw new Error('failed');
      toast.success(archiving ? 'Archived' : 'Restored from archive');
    } catch {
      setDeals(prev);
      toast.error('Could not archive deal');
    } finally {
      setBusyKey(null);
    }
  };

  const handleDuplicate = async (deal: SavedDeal, e: React.MouseEvent) => {
    e.stopPropagation();
    if (busyKey) return;
    setBusyKey(`dup:${deal.id}`);
    try {
      const res = await duplicateAnalysis(deal.id, deal.analysisType);
      if (!res.success || !res.copy) throw new Error(res.error || 'failed');
      const copy = res.copy;
      if (tab === 'all' || tab === 'favorites') {
        const mapped: SavedDeal =
          res.analysisType === 'PROPERTY'
            ? {
                id: copy.id,
                address: [copy.address, (copy as { city?: string }).city, (copy as { state?: string }).state]
                  .filter(Boolean)
                  .join(', '),
                city: (copy as { city?: string }).city,
                state: (copy as { state?: string }).state,
                zip: (copy as { zip?: string }).zip,
                type:
                  (copy as { strategyType?: string }).strategyType === 'rental'
                    ? 'Rental L/T'
                    : 'Buy & Hold',
                analysisType: 'PROPERTY',
                purchasePrice: copy.purchasePrice,
                rehabCost: copy.rehabCost,
                arv: copy.arv,
                rent: (copy as { rent?: number }).rent ?? 0,
                downPayment: (copy as { downPayment?: number }).downPayment ?? 0,
                cashFlow: (copy as { cashFlow?: number | null }).cashFlow ?? 0,
                roi: (copy as { roi?: number | null }).roi ?? 0,
                capRate: (copy as { capRate?: number | null }).capRate ?? 0,
                dscr: (copy as { dscr?: number | null }).dscr ?? 0,
                cashOnCash: (copy as { cashOnCash?: number | null }).cashOnCash ?? 0,
                profit: null,
                mao: null,
                financingCost: null,
                holdingCost: null,
                sellingCost: null,
                vacancyRate: (copy as { vacancyRate?: number }).vacancyRate ?? null,
                maintenanceRate: (copy as { maintenanceRate?: number }).maintenanceRate ?? null,
                mortgageRate: (copy as { mortgageRate?: number }).mortgageRate ?? null,
                mortgageTerm: (copy as { mortgageTerm?: number }).mortgageTerm ?? null,
                aiVerdict: (copy as { aiVerdict?: string | null }).aiVerdict ?? null,
                aiHeadline: (copy as { aiHeadline?: string | null }).aiHeadline ?? null,
                isFavorite: false,
                isArchived: false,
                pipelineStatus:
                  (copy as { pipelineStatus?: string }).pipelineStatus || 'UNDER_REVIEW',
                aiPayload: parseAiPayload((copy as { aiPayloadJson?: string | null }).aiPayloadJson),
                createdAt: new Date().toISOString(),
              }
            : {
                id: copy.id,
                address: copy.address,
                type: 'Fix & Flip',
                analysisType: 'FLIP',
                purchasePrice: copy.purchasePrice,
                rehabCost: copy.rehabCost,
                arv: copy.arv,
                rent: 0,
                downPayment: 0,
                cashFlow: 0,
                roi: (copy as { roi?: number | null }).roi ?? 0,
                capRate: 0,
                dscr: 0,
                cashOnCash: 0,
                profit: (copy as { profit?: number | null }).profit ?? null,
                mao: (copy as { mao?: number | null }).mao ?? null,
                financingCost: (copy as { financingCost?: number | null }).financingCost ?? null,
                holdingCost: (copy as { holdingCost?: number | null }).holdingCost ?? null,
                sellingCost: (copy as { sellingCost?: number | null }).sellingCost ?? null,
                vacancyRate: null,
                maintenanceRate: null,
                mortgageRate: null,
                mortgageTerm: null,
                aiVerdict: (copy as { aiVerdict?: string | null }).aiVerdict ?? null,
                aiHeadline: (copy as { aiHeadline?: string | null }).aiHeadline ?? null,
                isFavorite: false,
                isArchived: false,
                pipelineStatus:
                  (copy as { pipelineStatus?: string }).pipelineStatus || 'UNDER_REVIEW',
                aiPayload: parseAiPayload((copy as { aiPayloadJson?: string | null }).aiPayloadJson),
                createdAt: new Date().toISOString(),
              };
        setDeals((list) => [mapped, ...list]);
      }
      toast.success('Deal duplicated', 'Open the copy from All deals');
    } catch {
      toast.error('Could not duplicate deal');
    } finally {
      setBusyKey(null);
    }
  };

  const handlePdf = async (deal: SavedDeal, e: React.MouseEvent) => {
    e.stopPropagation();
    if (busyKey) return;
    setBusyKey(`pdf:${deal.id}`);
    try {
      const metrics =
        deal.analysisType === 'FLIP'
          ? [
              { label: 'Profit', value: money(deal.profit || 0) },
              { label: 'ROI', value: `${deal.roi.toFixed(1)}%` },
              { label: 'MAO', value: money(deal.mao || 0) },
            ]
          : [
              { label: 'Cash flow', value: money(deal.cashFlow) },
              { label: 'Cap rate', value: `${deal.capRate.toFixed(1)}%` },
              { label: 'DSCR', value: deal.dscr.toFixed(2) },
              { label: 'CoC', value: `${deal.cashOnCash.toFixed(1)}%` },
            ];
      exportToPDF({
        address: deal.address,
        type: deal.type,
        metrics,
        inputs: [
          { label: 'Purchase', value: deal.purchasePrice },
          { label: 'Rehab', value: deal.rehabCost },
          { label: 'ARV', value: deal.arv },
        ],
        aiAnalysis:
          deal.aiPayload?.reportText || deal.aiHeadline || 'Saved deal export from PropIntel.',
      });
      await createReportAction({
        type:
          deal.analysisType === 'FLIP'
            ? 'FLIP'
            : deal.type.includes('Rental')
              ? 'RENTAL'
              : 'PROPERTY',
        title: `${deal.type} — ${deal.address}`,
        address: deal.address,
        payload: { dealId: deal.id, metrics },
      });
      toast.success('PDF downloaded', 'Also saved under Reports → History');
    } catch {
      toast.error('PDF download failed');
    } finally {
      setBusyKey(null);
    }
  };

  const filteredDeals = deals.filter((d) =>
    d.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedDeals = deals.filter((d) => selectedIds.includes(d.id));
  const TABS: { id: DealTab; label: string }[] = [
    { id: 'all', label: 'All deals' },
    { id: 'favorites', label: 'Favorites' },
    { id: 'archived', label: 'Archived' },
    { id: 'deleted', label: 'Deleted' },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        title="Deals"
        description="Your financial analyses of properties (numbers + AI). Separate from My Properties inventory."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/deals/compare"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            >
              <ArrowRightLeft className="h-4 w-4" /> Compare
            </Link>
            {selectedIds.length >= 2 ? (
              <button
                type="button"
                onClick={() => setShowComparison(true)}
                className="btn-ink inline-flex cursor-pointer items-center gap-2 px-4 py-2.5 text-sm"
              >
                <ArrowRightLeft className="h-4 w-4" /> Compare selected ({selectedIds.length})
              </button>
            ) : null}
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              tab === t.id
                ? 'bg-blue-800 text-white'
                : 'border border-[var(--border)] text-[var(--muted)] hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
        <Link
          href="/dashboard/analyze"
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:text-foreground"
        >
          New analysis
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute top-3 left-3 h-4 w-4 text-[var(--muted)]" />
        <input
          type="text"
          placeholder="Search by address…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="glass-input w-full py-2.5 pr-4 pl-10 text-sm"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="surface-card space-y-4 p-5">
              <SkeletonRows rows={4} cols={1} />
            </div>
          ))}
        </div>
      ) : filteredDeals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white py-16 text-center text-sm text-[var(--muted)]">
          {tab === 'all'
            ? 'No saved analyses yet. Run Analyze and hit Save Deal.'
            : `No deals in ${tab}.`}
        </div>
      ) : (
        <div
          className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
        >
          {filteredDeals.map((deal) => {
            const isChecked = selectedIds.includes(deal.id);

            return (
              <SpotlightCard
                key={deal.id}
                className={`p-5 transition-shadow hover:shadow-[var(--shadow-lift)] ${
                  isChecked ? 'border-blue-700/35 bg-blue-700/[0.04]' : ''
                }`}
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveDeal(deal)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveDeal(deal);
                    }
                  }}
                  className="flex cursor-pointer flex-col gap-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-700/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex rounded-md bg-[var(--surface-soft)] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[var(--muted)] uppercase">
                          {deal.type}
                        </span>
                        {deal.aiVerdict && (
                          <span className="inline-flex rounded-md bg-blue-700/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-blue-800 uppercase">
                            {deal.aiVerdict}
                          </span>
                        )}
                        <PipelineStatusSelect
                          compact
                          value={deal.pipelineStatus || 'UNDER_REVIEW'}
                          onChange={async (next: PipelineStatus) => {
                            const res = await updateAnalysisPipelineStatus(
                              deal.id,
                              deal.analysisType,
                              next
                            );
                            if (!res.success) {
                              toast.error(res.error || 'Could not update status');
                              return;
                            }
                            setDeals((list) =>
                              list.map((d) =>
                                d.id === deal.id ? { ...d, pipelineStatus: next } : d
                              )
                            );
                            toast.success('Status updated', 'CRM pipeline moved too');
                          }}
                        />
                      </div>
                      <h3 className="flex items-start gap-1.5 text-sm leading-snug font-bold text-foreground">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-700" />
                        <span className="line-clamp-2">{deal.address}</span>
                      </h3>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <IconTooltip label={deal.isFavorite ? 'Remove favorite' : 'Favorite'}>
                        <button
                          type="button"
                          disabled={!!busyKey}
                          onClick={(e) => void handleFavorite(deal, e)}
                          className={`rounded-lg p-2 transition-colors disabled:opacity-50 ${
                            deal.isFavorite
                              ? 'text-amber-600'
                              : 'text-[var(--muted)] hover:text-amber-600'
                          }`}
                          aria-label={deal.isFavorite ? 'Remove favorite' : 'Favorite'}
                        >
                          {busyKey === `fav:${deal.id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Star className={`h-4 w-4 ${deal.isFavorite ? 'fill-current' : ''}`} />
                          )}
                        </button>
                      </IconTooltip>
                      <IconTooltip label={tab === 'archived' ? 'Unarchive' : 'Archive'}>
                        <button
                          type="button"
                          disabled={!!busyKey}
                          onClick={(e) => void handleArchive(deal, e)}
                          className="rounded-lg p-2 text-[var(--muted)] transition-colors hover:text-foreground disabled:opacity-50"
                          aria-label={tab === 'archived' ? 'Unarchive' : 'Archive'}
                        >
                          {busyKey === `arc:${deal.id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Archive className="h-4 w-4" />
                          )}
                        </button>
                      </IconTooltip>
                      <IconTooltip label="Duplicate deal">
                        <button
                          type="button"
                          disabled={!!busyKey}
                          onClick={(e) => void handleDuplicate(deal, e)}
                          className="rounded-lg p-2 text-[var(--muted)] transition-colors hover:text-foreground disabled:opacity-50"
                          aria-label="Duplicate deal"
                        >
                          {busyKey === `dup:${deal.id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </IconTooltip>
                      <IconTooltip label="Download PDF">
                        <button
                          type="button"
                          disabled={!!busyKey}
                          onClick={(e) => void handlePdf(deal, e)}
                          className="rounded-lg p-2 text-[var(--muted)] transition-colors hover:text-foreground disabled:opacity-50"
                          aria-label="Download PDF"
                        >
                          {busyKey === `pdf:${deal.id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FileDown className="h-4 w-4" />
                          )}
                        </button>
                      </IconTooltip>
                      <IconTooltip label={tab === 'deleted' ? 'Delete forever' : 'Move to Deleted'}>
                        <button
                          type="button"
                          disabled={!!busyKey}
                          onClick={(e) => void handleDeleteDeal(deal.id, e)}
                          className="shrink-0 cursor-pointer rounded-lg p-2 text-[var(--muted)] transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          aria-label="Delete deal"
                        >
                          {busyKey === `del:${deal.id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </IconTooltip>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/60 px-3 py-3 text-center">
                    <div>
                      <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--muted)]">
                        Purchase
                      </div>
                      <div className="mt-1 text-xs font-bold text-foreground">
                        ${(deal.purchasePrice / 1000).toFixed(0)}k
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--muted)]">
                        Rehab
                      </div>
                      <div className="mt-1 text-xs font-bold text-foreground">
                        ${(deal.rehabCost / 1000).toFixed(0)}k
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--muted)]">
                        {deal.analysisType === 'FLIP' ? 'ROI' : 'CoC'}
                      </div>
                      <div className="mt-1 text-xs font-extrabold text-blue-800">
                        {(deal.analysisType === 'FLIP' ? deal.roi : deal.cashOnCash || deal.roi).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {deal.analysisType === 'PROPERTY' ? (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <div className="flex justify-between gap-2">
                        <span className="text-[var(--muted)]">Cash flow</span>
                        <span className="font-semibold">${deal.cashFlow.toFixed(0)}/mo</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-[var(--muted)]">DSCR</span>
                        <span className="font-semibold">{deal.dscr.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-[var(--muted)]">Cap rate</span>
                        <span className="font-semibold">{deal.capRate.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-[var(--muted)]">ARV</span>
                        <span className="font-semibold">{money(deal.arv)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <div className="flex justify-between gap-2">
                        <span className="text-[var(--muted)]">Profit</span>
                        <span className="font-semibold">
                          {deal.profit != null ? money(deal.profit) : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-[var(--muted)]">MAO</span>
                        <span className="font-semibold">
                          {deal.mao != null ? money(deal.mao) : '—'}
                        </span>
                      </div>
                      <div className="col-span-2 flex justify-between gap-2">
                        <span className="text-[var(--muted)]">ARV</span>
                        <span className="font-semibold">{money(deal.arv)}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
                    <label
                      className="inline-flex cursor-pointer items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleSelectDeal(deal.id)}
                        className="h-4 w-4 rounded border-[var(--border)] accent-blue-700"
                      />
                      <span className="text-xs text-[var(--muted)]">Compare</span>
                    </label>
                    <Link
                      href={`/dashboard/deals/${deal.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800 hover:underline"
                    >
                      <Eye className="h-3.5 w-3.5" /> Open deal
                    </Link>
                  </div>
                </div>
              </SpotlightCard>
            );
          })}
        </div>
      )}

      {activeDeal && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={() => setActiveDeal(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="deal-detail-title"
        >
          <div
            className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-[var(--border)] bg-white shadow-[var(--shadow-lift)] sm:max-w-3xl sm:rounded-2xl lg:max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-[var(--border)] bg-white/95 px-5 py-4 backdrop-blur sm:px-8">
              <div className="min-w-0 space-y-1">
                <span className="inline-flex rounded-md bg-blue-700/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-blue-800 uppercase">
                  {activeDeal.type}
                </span>
                <h3 id="deal-detail-title" className="text-base font-bold leading-snug text-foreground sm:text-lg">
                  {activeDeal.address}
                </h3>
                <p className="text-[11px] text-[var(--muted)]">
                  Saved {new Date(activeDeal.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveDeal(null)}
                className="cursor-pointer rounded-lg bg-[var(--surface-soft)] p-2 text-[var(--muted)] hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 px-5 py-5 sm:px-8 sm:py-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8 lg:space-y-0">
              <div className="space-y-5">
                <section>
                  <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    Costs
                  </h4>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
                    <DetailStat label="Purchase price" value={money(activeDeal.purchasePrice)} />
                    <DetailStat label="Rehab budget" value={money(activeDeal.rehabCost)} />
                    <DetailStat label="ARV" value={money(activeDeal.arv)} />
                    {activeDeal.analysisType === 'PROPERTY' && (
                      <DetailStat
                        label="Down payment"
                        value={`${activeDeal.downPayment}%`}
                      />
                    )}
                  </div>
                </section>

                {activeDeal.analysisType === 'PROPERTY' ? (
                  <>
                    <section>
                      <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                        Returns
                      </h4>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
                        <DetailStat
                          label="Monthly cash flow"
                          value={`$${activeDeal.cashFlow.toFixed(2)}`}
                          emphasize
                        />
                        <DetailStat
                          label="Cash-on-cash"
                          value={`${activeDeal.cashOnCash.toFixed(2)}%`}
                          emphasize
                        />
                        <DetailStat label="Cap rate" value={`${activeDeal.capRate.toFixed(2)}%`} />
                        <DetailStat label="DSCR" value={activeDeal.dscr.toFixed(2)} />
                        <DetailStat label="ROI signal" value={`${activeDeal.roi.toFixed(2)}%`} />
                        <DetailStat label="Est. rent" value={`$${activeDeal.rent.toFixed(0)}/mo`} />
                      </div>
                    </section>
                    <section>
                      <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                        Assumptions
                      </h4>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
                        <DetailStat
                          label="Mortgage"
                          value={
                            activeDeal.mortgageRate != null
                              ? `${activeDeal.mortgageRate}% · ${activeDeal.mortgageTerm ?? 30}yr`
                              : '—'
                          }
                        />
                        <DetailStat
                          label="Vacancy"
                          value={
                            activeDeal.vacancyRate != null ? `${activeDeal.vacancyRate}%` : '—'
                          }
                        />
                        <DetailStat
                          label="Maintenance"
                          value={
                            activeDeal.maintenanceRate != null
                              ? `${activeDeal.maintenanceRate}%`
                              : '—'
                          }
                        />
                        {activeDeal.zip ? (
                          <DetailStat label="ZIP" value={activeDeal.zip} />
                        ) : null}
                      </div>
                    </section>
                  </>
                ) : (
                  <section>
                    <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                      Flip results
                    </h4>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
                      <DetailStat
                        label="Projected profit"
                        value={activeDeal.profit != null ? money(activeDeal.profit) : '—'}
                        emphasize
                      />
                      <DetailStat
                        label="Flip ROI"
                        value={`${activeDeal.roi.toFixed(2)}%`}
                        emphasize
                      />
                      <DetailStat
                        label="MAO (70% rule)"
                        value={activeDeal.mao != null ? money(activeDeal.mao) : '—'}
                      />
                      <DetailStat
                        label="Financing cost"
                        value={
                          activeDeal.financingCost != null ? money(activeDeal.financingCost) : '—'
                        }
                      />
                      <DetailStat
                        label="Holding cost"
                        value={
                          activeDeal.holdingCost != null ? money(activeDeal.holdingCost) : '—'
                        }
                      />
                      <DetailStat
                        label="Selling cost"
                        value={
                          activeDeal.sellingCost != null ? money(activeDeal.sellingCost) : '—'
                        }
                      />
                    </div>
                  </section>
                )}
              </div>

              {(activeDeal.aiVerdict || activeDeal.aiHeadline) && (
                <section className="lg:sticky lg:top-[4.5rem]">
                  <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    AI verdict
                  </h4>
                  <div className="space-y-3 rounded-xl border border-blue-700/20 bg-blue-700/5 p-4 sm:p-5">
                    {activeDeal.aiVerdict && (
                      <div className="text-sm font-extrabold text-blue-900 sm:text-base">
                        {activeDeal.aiVerdict}
                      </div>
                    )}
                    {activeDeal.aiHeadline && (
                      <p className="text-xs leading-relaxed text-[var(--muted)] sm:text-sm">
                        {activeDeal.aiHeadline}
                      </p>
                    )}
                    {activeDeal.aiPayload?.strengths && activeDeal.aiPayload.strengths.length > 0 && (
                      <div>
                        <div className="mb-1 text-[10px] font-bold uppercase text-blue-800">
                          Strengths
                        </div>
                        <ul className="space-y-1.5 text-xs text-[var(--muted)] sm:text-[13px]">
                          {activeDeal.aiPayload.strengths.map((s, i) => (
                            <li key={`${s.title}-${i}`}>
                              <span className="font-semibold text-foreground">{s.title}:</span>{' '}
                              {s.detail}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {activeDeal.aiPayload?.risks && activeDeal.aiPayload.risks.length > 0 && (
                      <div>
                        <div className="mb-1 text-[10px] font-bold uppercase text-amber-900">
                          Risks
                        </div>
                        <ul className="space-y-1.5 text-xs text-[var(--muted)] sm:text-[13px]">
                          {activeDeal.aiPayload.risks.map((r, i) => (
                            <li key={`${r.title}-${i}`}>
                              <span className="font-semibold text-foreground">{r.title}:</span>{' '}
                              {r.detail}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--border)] px-5 py-4 sm:px-8">
              <button
                type="button"
                onClick={() => setActiveDeal(null)}
                className="cursor-pointer rounded-xl border border-[var(--border)] px-4 py-2.5 text-xs font-semibold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleDeleteDeal(activeDeal.id)}
                className="cursor-pointer rounded-xl border border-red-200 px-4 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-50"
              >
                Delete deal
              </button>
            </div>
          </div>
        </div>
      )}

      {showComparison && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-md sm:p-6"
          onClick={() => setShowComparison(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative max-h-[90dvh] w-full max-w-4xl space-y-6 overflow-y-auto rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-lift)] sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
                <ArrowRightLeft className="h-5 w-5 text-blue-800" /> Compare deals
              </h3>
              <button
                type="button"
                onClick={() => setShowComparison(false)}
                className="cursor-pointer rounded-lg bg-[var(--surface-soft)] p-1.5 text-[var(--muted)] transition-all hover:bg-[var(--surface)] hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="py-3 text-xs font-semibold text-[var(--muted)] uppercase">
                      Metric
                    </th>
                    {selectedDeals.map((d) => (
                      <th key={d.id} className="px-4 py-3 font-bold text-foreground">
                        {d.address.split(',')[0]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  <CompareRow label="Strategy" values={selectedDeals.map((d) => d.type)} />
                  <CompareRow
                    label="Purchase price"
                    values={selectedDeals.map((d) => money(d.purchasePrice))}
                  />
                  <CompareRow
                    label="Rehab budget"
                    values={selectedDeals.map((d) => money(d.rehabCost))}
                  />
                  <CompareRow
                    label="ROI"
                    values={selectedDeals.map((d) => `${d.roi.toFixed(1)}%`)}
                    emphasize
                  />
                  <CompareRow
                    label="Monthly cash flow"
                    values={selectedDeals.map((d) =>
                      d.analysisType === 'PROPERTY' ? `$${d.cashFlow.toFixed(2)}/mo` : '—'
                    )}
                  />
                  <CompareRow
                    label="Cap rate"
                    values={selectedDeals.map((d) =>
                      d.capRate > 0 ? `${d.capRate.toFixed(2)}%` : '—'
                    )}
                  />
                  <CompareRow
                    label="DSCR"
                    values={selectedDeals.map((d) =>
                      d.dscr > 0 ? d.dscr.toFixed(2) : '—'
                    )}
                  />
                </tbody>
              </table>
            </div>

            <div className="flex justify-end border-t border-[var(--border)] pt-4">
              <button
                type="button"
                onClick={() => setShowComparison(false)}
                className="btn-primary cursor-pointer px-6 py-2.5 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailStat({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/40 px-3 py-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
        {label}
      </div>
      <div
        className={`mt-0.5 text-sm font-bold ${emphasize ? 'text-blue-800' : 'text-foreground'}`}
      >
        {value}
      </div>
    </div>
  );
}

function CompareRow({
  label,
  values,
  emphasize,
}: {
  label: string;
  values: string[];
  emphasize?: boolean;
}) {
  return (
    <tr>
      <td className="py-3 text-xs font-medium text-[var(--muted)] uppercase">{label}</td>
      {values.map((v, i) => (
        <td
          key={`${label}-${i}`}
          className={`px-4 py-3 font-semibold ${emphasize ? 'text-blue-800' : 'text-foreground'}`}
        >
          {v}
        </td>
      ))}
    </tr>
  );
}
