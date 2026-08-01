'use client';

import React, { useEffect, useState, useTransition } from 'react';
import {
  Search,
  Trash2,
  ArrowRightLeft,
  X,
  Loader2,
} from 'lucide-react';
import SpotlightCard from '@/components/ui/SpotlightCard';
import PageHeader from '@/components/dashboard/PageHeader';
import { getUserAnalyses, deleteAnalysis } from '@/app/actions/analysisActions';

interface SavedDeal {
  id: string;
  address: string;
  type: string;
  analysisType: 'PROPERTY' | 'FLIP';
  purchasePrice: number;
  rehabCost: number;
  cashFlow: number;
  roi: number;
  capRate: number;
  dscr: number;
}

export default function SavedDealsPage() {
  const [deals, setDeals] = useState<SavedDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [isPending, startTransition] = useTransition();

  const loadDeals = async () => {
    try {
      const { propertyAnalyses, flipAnalyses } = await getUserAnalyses();

      const propertyDeals: SavedDeal[] = propertyAnalyses.map((a) => ({
        id: a.id,
        address: [a.address, a.city, a.state].filter(Boolean).join(', '),
        type: 'Buy & Hold',
        analysisType: 'PROPERTY' as const,
        purchasePrice: a.purchasePrice,
        rehabCost: a.rehabCost,
        cashFlow: a.cashFlow ?? 0,
        roi: a.cashOnCash ?? a.roi ?? 0,
        capRate: a.capRate ?? 0,
        dscr: a.dscr ?? 0,
      }));

      const flipDeals: SavedDeal[] = flipAnalyses.map((a) => ({
        id: a.id,
        address: a.address,
        type: 'Fix & Flip',
        analysisType: 'FLIP' as const,
        purchasePrice: a.purchasePrice,
        rehabCost: a.rehabCost,
        cashFlow: 0,
        roi: a.roi ?? 0,
        capRate: 0,
        dscr: 0,
      }));

      const combined = [...propertyDeals, ...flipDeals].sort((a, b) =>
        a.address.localeCompare(b.address)
      );
      setDeals(combined);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDeals();
  }, []);

  const handleSelectDeal = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : prev.length < 3
          ? [...prev, id]
          : prev
    );
  };

  const handleDeleteDeal = (id: string) => {
    const deal = deals.find((d) => d.id === id);
    if (!deal) return;

    setDeals((prev) => prev.filter((d) => d.id !== id));
    setSelectedIds((prev) => prev.filter((item) => item !== id));

    startTransition(async () => {
      try {
        await deleteAnalysis(id, deal.analysisType);
      } catch (e) {
        console.error(e);
        await loadDeals();
      }
    });
  };

  const filteredDeals = deals.filter((d) =>
    d.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedDeals = deals.filter((d) => selectedIds.includes(d.id));

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        title="Saved deals database"
        description="Search historical calculations, compare yields, and manage archives."
        actions={
          selectedIds.length >= 2 ? (
            <button
              onClick={() => setShowComparison(true)}
              className="btn-ink inline-flex cursor-pointer items-center gap-2 px-4 py-2.5 text-sm"
            >
              <ArrowRightLeft className="h-4 w-4" /> Compare Selected ({selectedIds.length})
            </button>
          ) : undefined
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute top-3 left-3 h-4 w-4 text-[var(--muted-foreground)]" />
        <input
          type="text"
          placeholder="Search by street address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="glass-input w-full py-2.5 pr-4 pl-10 text-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-[var(--muted)]">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading saved deals…
        </div>
      ) : filteredDeals.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-white py-16 text-center text-sm text-[var(--muted)]">
          No saved analyses yet. Underwrite a deal in the Property Analyzer and hit Save.
        </div>
      ) : (
        <div className={`grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 ${isPending ? 'opacity-80' : ''}`}>
          {filteredDeals.map((deal) => {
            const isChecked = selectedIds.includes(deal.id);

            return (
              <SpotlightCard
                key={deal.id}
                className={`space-y-4 border p-6 ${isChecked ? 'border-teal-700/30 bg-teal-700/5' : 'border-[var(--border)] bg-white'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-[var(--surface-soft)] px-2 py-0.5 text-[9px] font-bold text-[var(--muted)] uppercase">
                        {deal.type}
                      </span>
                      <label className="inline-flex min-h-11 cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectDeal(deal.id)}
                          className="h-4 w-4 rounded border-[var(--border)] accent-teal-700"
                        />
                        <span className="text-xs text-[var(--muted-foreground)]">Compare</span>
                      </label>
                    </div>
                    <h3 className="mt-1 text-sm leading-snug font-bold text-foreground">
                      {deal.address}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleDeleteDeal(deal.id)}
                    className="cursor-pointer rounded-lg bg-[var(--surface-soft)] p-1.5 text-[var(--muted-foreground)] transition-all hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-4 text-center">
                  <div>
                    <span className="text-[9px] font-semibold text-[var(--muted-foreground)] uppercase">
                      Purchase
                    </span>
                    <div className="mt-0.5 text-xs font-bold text-foreground">
                      ${(deal.purchasePrice / 1000).toFixed(0)}k
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] font-semibold text-[var(--muted-foreground)] uppercase">
                      Rehab
                    </span>
                    <div className="mt-0.5 text-xs font-bold text-foreground">
                      ${(deal.rehabCost / 1000).toFixed(0)}k
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] font-semibold text-[var(--muted-foreground)] uppercase">
                      ROI
                    </span>
                    <div className="mt-0.5 text-xs font-extrabold text-teal-800">
                      {deal.roi.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {deal.type === 'Buy & Hold' && (
                  <div className="grid grid-cols-2 gap-4 border-t border-[var(--border)] pt-3 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">Cash Flow:</span>
                      <span className="font-bold text-[var(--muted)]">
                        ${deal.cashFlow.toFixed(0)}/mo
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">DSCR:</span>
                      <span className="font-bold text-[var(--muted)]">{deal.dscr.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </SpotlightCard>
            );
          })}
        </div>
      )}

      {showComparison && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-md sm:p-6"
          onClick={() => setShowComparison(false)}
        >
          <div
            className="glass-panel relative max-h-[90dvh] w-full max-w-4xl space-y-6 overflow-y-auto rounded-2xl border border-[var(--border)] p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
                <ArrowRightLeft className="h-5 w-5 text-teal-800" /> Side-by-Side Comparison Matrix
              </h3>
              <button
                onClick={() => setShowComparison(false)}
                className="cursor-pointer rounded-lg bg-[var(--surface-soft)] p-1.5 text-[var(--muted)] transition-all hover:bg-white hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                      Financial Parameter
                    </th>
                    {selectedDeals.map((d) => (
                      <th key={d.id} className="px-4 py-3 font-bold text-foreground">
                        {d.address.split(',')[0]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  <tr>
                    <td className="py-3 text-xs font-medium text-[var(--muted)] uppercase">
                      Calculation Model
                    </td>
                    {selectedDeals.map((d) => (
                      <td key={d.id} className="px-4 py-3 font-semibold text-[var(--muted)]">
                        {d.type}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 text-xs font-medium text-[var(--muted)] uppercase">
                      Purchase Price
                    </td>
                    {selectedDeals.map((d) => (
                      <td key={d.id} className="px-4 py-3 font-bold text-foreground">
                        ${d.purchasePrice.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 text-xs font-medium text-[var(--muted)] uppercase">
                      Rehab Budget
                    </td>
                    {selectedDeals.map((d) => (
                      <td key={d.id} className="px-4 py-3 font-bold text-foreground">
                        ${d.rehabCost.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 text-xs font-medium text-[var(--muted)] uppercase">
                      Net Return (ROI)
                    </td>
                    {selectedDeals.map((d) => (
                      <td key={d.id} className="px-4 py-3 font-extrabold text-teal-800">
                        {d.roi.toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 text-xs font-medium text-[var(--muted)] uppercase">
                      Monthly Cash Flow
                    </td>
                    {selectedDeals.map((d) => (
                      <td key={d.id} className="px-4 py-3 font-semibold text-[var(--muted)]">
                        {d.cashFlow > 0 ? `$${d.cashFlow.toFixed(2)}/mo` : 'N/A'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 text-xs font-medium text-[var(--muted)] uppercase">
                      Cap Rate
                    </td>
                    {selectedDeals.map((d) => (
                      <td key={d.id} className="px-4 py-3 font-semibold text-[var(--muted)]">
                        {d.capRate > 0 ? `${d.capRate.toFixed(2)}%` : 'N/A'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 text-xs font-medium text-[var(--muted)] uppercase">DSCR</td>
                    {selectedDeals.map((d) => (
                      <td key={d.id} className="px-4 py-3 font-semibold text-[var(--muted)]">
                        {d.dscr > 0 ? d.dscr.toFixed(2) : 'N/A'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end border-t border-[var(--border)] pt-4">
              <button
                onClick={() => setShowComparison(false)}
                className="btn-primary cursor-pointer px-6 py-2.5 text-xs"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
