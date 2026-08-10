'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { AiVerdictCard } from '@/components/dashboard/AiVerdictCard';
import {
  AnalyzeActions,
  AnalyzeAddressField,
  AnalyzeField,
  MetricTile,
  SectionLabel,
} from '@/components/dashboard/AnalyzeUI';
import { BarChart } from '@/components/ui/Charts';
import { flipMetrics, money, pct } from '@/lib/calculators';
import { saveFlipAnalysis } from '@/app/actions/analysisActions';
import { analyzeDealAction, type AiVerdictPreview } from '@/app/actions/analyzeActions';
import { createReportAction } from '@/app/actions/reportActions';
import { exportToPDF } from '@/lib/services/reports';
import { useToast } from '@/components/ui/Toast';

export default function FlipAnalyzePage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-sm text-[var(--muted)]">Loading…</div>}>
      <FlipAnalyzeInner />
    </React.Suspense>
  );
}

function FlipAnalyzeInner() {
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
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

  useEffect(() => {
    const a = searchParams.get('address');
    const v = searchParams.get('value');
    if (a) setAddress(a);
    if (v && Number.isFinite(Number(v))) setPurchasePrice(Number(v));
  }, [searchParams]);

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

  const stackBars = useMemo(
    () => [
      { label: 'Buy', value: Math.round(purchasePrice), tone: 'flat' as const },
      { label: 'Rehab', value: Math.round(rehabCost), tone: 'flat' as const },
      { label: 'Fin', value: Math.round(financingCost), tone: 'down' as const },
      { label: 'Hold', value: Math.round(holdingCost), tone: 'down' as const },
      { label: 'Sell', value: Math.round(m.sellingCost), tone: 'down' as const },
      { label: 'ARV', value: Math.round(arv), tone: 'up' as const },
    ],
    [purchasePrice, rehabCost, financingCost, holdingCost, m.sellingCost, arv]
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
      toast.success('Deal saved', 'Added to Deals + CRM underwriting');
      router.push('/dashboard/deals');
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
    <div className="mx-auto max-w-[1200px] space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#dbe7ff] px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-[#1639a8] uppercase">
            Fix & Flip · Underwriting
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-[#0b1220]">
            Fix & Flip analysis
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-[var(--muted)]">
            Calculator, results, AI, save deal, and PDF on one page.
          </p>
        </div>
        <AnalyzeActions
          aiRunning={aiRunning}
          saving={saving}
          onAi={() => void runAi()}
          onSave={() => void saveDeal()}
          onReport={() => void generateReport()}
        />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[#0b1220] p-5 text-white sm:p-6"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_80%_at_100%_0%,rgba(59,130,246,0.35),transparent_55%)]" />
        <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-[10px] font-bold tracking-[0.14em] text-blue-200/80 uppercase">
              Profit
            </p>
            <p
              className={`mt-1 font-display text-3xl font-bold ${
                m.profit >= 0 ? 'text-emerald-300' : 'text-rose-300'
              }`}
            >
              {money(m.profit)}
            </p>
            <p className="mt-1 truncate text-xs text-white/55">{address}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-[0.14em] text-blue-200/80 uppercase">
              ROI
            </p>
            <p className="mt-1 font-display text-2xl font-bold">{pct(m.roi)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-[0.14em] text-blue-200/80 uppercase">
              MAO
            </p>
            <p className="mt-1 font-display text-2xl font-bold">{money(m.mao)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-[0.14em] text-blue-200/80 uppercase">
              Total cost
            </p>
            <p className="mt-1 font-display text-2xl font-bold">{money(m.totalCost)}</p>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricTile label="ARV" value={money(arv)} />
        <MetricTile label="Selling cost $" value={money(m.sellingCost)} />
        <MetricTile
          label="Spread (ARV − cost)"
          value={money(arv - m.totalCost)}
          tone={arv - m.totalCost >= 0 ? 'good' : 'bad'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 rounded-3xl border border-[var(--border)] bg-white p-5 lg:col-span-3">
          <SectionLabel>Deal inputs</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <AnalyzeAddressField
              value={address}
              onChange={(v) => {
                setAddress(v);
                setAiPreview(null);
              }}
            />
            <AnalyzeField
              label="Purchase"
              prefix="$"
              value={purchasePrice}
              onChange={(n) => {
                setPurchasePrice(n);
                setAiPreview(null);
              }}
            />
            <AnalyzeField
              label="Repair / rehab"
              prefix="$"
              value={rehabCost}
              onChange={(n) => {
                setRehabCost(n);
                setAiPreview(null);
              }}
            />
            <AnalyzeField
              label="ARV"
              prefix="$"
              value={arv}
              onChange={(n) => {
                setArv(n);
                setAiPreview(null);
              }}
            />
            <AnalyzeField
              label="Financing cost"
              prefix="$"
              value={financingCost}
              onChange={setFinancingCost}
            />
            <AnalyzeField
              label="Holding cost"
              prefix="$"
              value={holdingCost}
              onChange={setHoldingCost}
            />
            <AnalyzeField
              label="Selling cost"
              value={sellingCostPercent}
              onChange={setSellingCostPercent}
              suffix="%"
            />
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-[var(--border)] bg-white p-5 lg:col-span-2">
          <SectionLabel>Cost stack vs ARV</SectionLabel>
          <p className="text-sm text-[var(--muted)]">Blue = buy/rehab · red = soft costs · green = ARV</p>
          <BarChart data={stackBars} height={220} />
          <div className="rounded-2xl bg-[#f3f6fb] px-4 py-3 text-xs text-[var(--muted)]">
            Profit = ARV − total cost →{' '}
            <span
              className={`font-semibold ${m.profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}
            >
              {money(m.profit)}
            </span>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl border border-[var(--border)] bg-white">
        <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[linear-gradient(180deg,var(--panel-grad-top),var(--panel-grad-bottom))] px-5 py-4">
          <Sparkles className="h-4 w-4 text-blue-800" />
          <h2 className="font-display text-lg font-bold">AI summary</h2>
        </div>
        <div className="p-5">
          {aiPreview ? (
            <AiVerdictCard analysis={aiPreview} />
          ) : (
            <p className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-10 text-center text-sm text-[var(--muted)]">
              Run AI when the math looks right, then save the deal.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
