'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Cpu, FileDown, Loader2, Save } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { AiVerdictCard } from '@/components/dashboard/AiVerdictCard';
import { flipMetrics, money, pct } from '@/lib/calculators';
import { saveFlipAnalysis } from '@/app/actions/analysisActions';
import { analyzeDealAction, type AiVerdictPreview } from '@/app/actions/analyzeActions';
import { createReportAction } from '@/app/actions/reportActions';
import { exportToPDF } from '@/lib/services/reports';
import { useToast } from '@/components/ui/Toast';

function Field({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  suffix?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs text-[var(--muted)]">{label}</span>
      <div className="relative">
        <input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-800/30"
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)]">
            {suffix}
          </span>
        ) : null}
      </div>
    </label>
  );
}

export default function FlipAnalyzePage() {
  const toast = useToast();
  const [address, setAddress] = useState('456 Flip Ave');
  const [purchasePrice, setPurchasePrice] = useState(180000);
  const [rehabCost, setRehabCost] = useState(45000);
  const [arv, setArv] = useState(295000);
  const [financingCost, setFinancingCost] = useState(8000);
  const [holdingCost, setHoldingCost] = useState(6000);
  const [sellingCostPercent, setSellingCostPercent] = useState(6);
  const [saving, setSaving] = useState(false);
  const [aiRunning, setAiRunning] = useState(false);
  const [aiPreview, setAiPreview] = useState<AiVerdictPreview | null>(null);

  const m = useMemo(
    () =>
      flipMetrics({
        purchasePrice,
        rehabCost,
        arv,
        financingCost,
        holdingCost,
        sellingCostPercent,
      }),
    [purchasePrice, rehabCost, arv, financingCost, holdingCost, sellingCostPercent]
  );

  const runAi = async () => {
    if (aiRunning) return;
    setAiRunning(true);
    try {
      const res = await analyzeDealAction({
        address,
        purchasePrice,
        rehabCost,
        arv,
        rent: 0,
        cashFlow: m.profit / 12,
        roi: m.roi,
        capRate: 0,
        dscr: 0,
        cashOnCash: m.roi,
        modelType: 'flip',
      });
      if (!res.success || !res.analysis) {
        toast.error(res.error || 'AI analysis failed');
        return;
      }
      setAiPreview(res.analysis);
      toast.success('AI summary ready');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'AI failed');
    } finally {
      setAiRunning(false);
    }
  };

  const saveDeal = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await saveFlipAnalysis({
        address,
        purchasePrice,
        rehabCost,
        arv,
        financingCost,
        holdingCost,
        sellingCost: m.sellingCost,
        ai: aiPreview
          ? {
              verdict: aiPreview.verdict,
              headline: aiPreview.headline,
              summary: aiPreview.summary,
              strengths: aiPreview.strengths,
              risks: aiPreview.risks,
              provider: aiPreview.provider,
              modelName: aiPreview.modelName,
              reportText: aiPreview.reportText,
            }
          : null,
      });
      toast.success('Deal saved', 'Open it under Deals');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const generateReport = async () => {
    const metrics = [
      { label: 'Profit', value: money(m.profit) },
      { label: 'ROI', value: pct(m.roi) },
      { label: 'MAO', value: money(m.mao) },
    ];
    exportToPDF({
      address,
      type: 'Fix & Flip',
      metrics,
      inputs: [
        { label: 'Purchase', value: purchasePrice },
        { label: 'Rehab', value: rehabCost },
        { label: 'ARV', value: arv },
      ],
      aiAnalysis: aiPreview?.reportText || aiPreview?.headline || undefined,
    });
    await createReportAction({
      type: 'FLIP',
      title: `Flip — ${address}`,
      address,
      payload: { metrics },
    });
    toast.success('PDF downloaded');
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Fix & Flip analysis"
        description="Calculator, results, AI, save deal, and PDF on one page."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/analyze"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            >
              <ArrowLeft className="h-4 w-4" /> Analyze hub
            </Link>
            <button
              type="button"
              disabled={aiRunning}
              onClick={() => void runAi()}
              className="inline-flex items-center gap-2 rounded-lg border border-teal-800/30 bg-teal-800/10 px-3 py-2 text-sm font-medium text-teal-900 disabled:opacity-60"
            >
              {aiRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cpu className="h-4 w-4" />}
              Run AI
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void saveDeal()}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save deal
            </button>
            <button
              type="button"
              onClick={() => void generateReport()}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            >
              <FileDown className="h-4 w-4" /> Report PDF
            </button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <SpotlightCard className="space-y-4 p-5 lg:col-span-3">
          <h2 className="font-display text-lg">Calculator</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 sm:col-span-2">
              <span className="text-xs text-[var(--muted)]">Address</span>
              <input
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setAiPreview(null);
                }}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              />
            </label>
            <Field label="Purchase" value={purchasePrice} onChange={(n) => { setPurchasePrice(n); setAiPreview(null); }} />
            <Field label="Repair / rehab" value={rehabCost} onChange={(n) => { setRehabCost(n); setAiPreview(null); }} />
            <Field label="ARV" value={arv} onChange={(n) => { setArv(n); setAiPreview(null); }} />
            <Field label="Financing cost" value={financingCost} onChange={setFinancingCost} />
            <Field label="Holding cost" value={holdingCost} onChange={setHoldingCost} />
            <Field label="Selling cost" value={sellingCostPercent} onChange={setSellingCostPercent} suffix="%" />
          </div>
        </SpotlightCard>
        <SpotlightCard className="p-5 lg:col-span-2">
          <h2 className="mb-4 font-display text-lg">Results</h2>
          {(
            [
              { label: 'Profit', value: money(m.profit), tone: m.profit >= 0 ? 'good' : 'bad' },
              { label: 'ROI', value: pct(m.roi) },
              { label: 'MAO', value: money(m.mao) },
              { label: 'Selling cost $', value: money(m.sellingCost) },
              { label: 'Total cost', value: money(m.totalCost) },
            ] as const
          ).map((row) => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-3 border-b border-[var(--border)] py-3 last:border-0"
            >
              <span className="text-xs text-[var(--muted)]">{row.label}</span>
              <span
                className={`text-sm font-semibold ${
                  'tone' in row && row.tone === 'good'
                    ? 'text-teal-800'
                    : 'tone' in row && row.tone === 'bad'
                      ? 'text-red-700'
                      : ''
                }`}
              >
                {row.value}
              </span>
            </div>
          ))}
        </SpotlightCard>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-xl">AI summary</h2>
        {aiPreview ? (
          <AiVerdictCard analysis={aiPreview} />
        ) : (
          <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
            Run AI when the math looks right, then save the deal.
          </p>
        )}
      </section>
    </div>
  );
}
