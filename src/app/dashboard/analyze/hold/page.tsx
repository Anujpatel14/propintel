'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Cpu, FileDown, Loader2, Save } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { AiVerdictCard } from '@/components/dashboard/AiVerdictCard';
import { holdMetrics, money, pct } from '@/lib/calculators';
import { savePropertyAnalysis } from '@/app/actions/analysisActions';
import {
  analyzeDealAction,
  type AiVerdictPreview,
} from '@/app/actions/analyzeActions';
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

function HoldAnalyzeInner() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const [address, setAddress] = useState('123 Main St');
  const [city, setCity] = useState('Austin');
  const [state, setState] = useState('TX');
  const [zip, setZip] = useState('78701');
  const [purchasePrice, setPurchasePrice] = useState(320000);
  const [rehabCost, setRehabCost] = useState(15000);
  const [arv, setArv] = useState(380000);
  const [rent, setRent] = useState(2400);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [mortgageRate, setMortgageRate] = useState(6.5);
  const [mortgageTerm, setMortgageTerm] = useState(30);
  const [taxes, setTaxes] = useState(350);
  const [insurance, setInsurance] = useState(140);
  const [hoa, setHoa] = useState(0);
  const [utilities, setUtilities] = useState(0);
  const [vacancyRate, setVacancyRate] = useState(5);
  const [maintenanceRate, setMaintenanceRate] = useState(5);
  const [closingCostPercent, setClosingCostPercent] = useState(3);
  const [saving, setSaving] = useState(false);
  const [aiRunning, setAiRunning] = useState(false);
  const [aiPreview, setAiPreview] = useState<AiVerdictPreview | null>(null);
  const [propertyId] = useState(searchParams.get('propertyId') || '');

  useEffect(() => {
    const a = searchParams.get('address');
    const z = searchParams.get('zip');
    const v = searchParams.get('value');
    const r = searchParams.get('rent');
    if (a) {
      setAddress(a);
      const parts = a.split(',').map((p) => p.trim());
      if (parts[1]) setCity(parts[1].replace(/\s+[A-Z]{2}\s*\d*.*$/, '').trim() || parts[1]);
      const st = a.match(/\b([A-Z]{2})\b/);
      if (st) setState(st[1]);
    }
    if (z) setZip(z);
    if (v && Number(v) > 0) {
      const n = Number(v);
      setPurchasePrice(n);
      setArv(Math.round(n * 1.15));
      setTaxes(Math.max(50, Math.round((n * 0.012) / 12)));
    }
    if (r && Number(r) > 0) setRent(Number(r));
  }, [searchParams]);

  const m = useMemo(
    () =>
      holdMetrics({
        purchasePrice,
        rehabCost,
        rent,
        downPaymentPercent,
        mortgageRate,
        mortgageTerm,
        taxes,
        insurance,
        hoa,
        vacancyRate,
        maintenanceRate,
        utilities,
        closingCostPercent,
      }),
    [
      purchasePrice,
      rehabCost,
      rent,
      downPaymentPercent,
      mortgageRate,
      mortgageTerm,
      taxes,
      insurance,
      hoa,
      vacancyRate,
      maintenanceRate,
      utilities,
      closingCostPercent,
    ]
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
        rent,
        cashFlow: m.cashFlow,
        roi: m.roi,
        capRate: m.capRate,
        dscr: m.dscr,
        cashOnCash: m.cashOnCash,
        modelType: 'hold',
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
      await savePropertyAnalysis({
        address,
        city,
        state,
        zip,
        purchasePrice,
        rehabCost,
        arv,
        rent,
        downPayment: downPaymentPercent,
        taxes: taxes * 12,
        insurance: insurance * 12,
        hoa,
        vacancyRate,
        maintenanceRate,
        mortgageRate,
        mortgageTerm,
        strategyType: 'hold',
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
      { label: 'Cash flow', value: money(m.cashFlow) },
      { label: 'Cap rate', value: pct(m.capRate) },
      { label: 'DSCR', value: m.dscr.toFixed(2) },
      { label: 'Cash on cash', value: pct(m.cashOnCash) },
    ];
    const inputs = [
      { label: 'Purchase', value: purchasePrice },
      { label: 'Rehab', value: rehabCost },
      { label: 'Rent', value: rent },
    ];
    exportToPDF({
      address,
      type: 'Buy & Hold',
      metrics,
      inputs,
      aiAnalysis: aiPreview?.reportText || aiPreview?.headline || undefined,
    });
    await createReportAction({
      type: 'FINANCIAL',
      title: `Buy & Hold — ${address}`,
      address,
      payload: { metrics, propertyId: propertyId || null },
    });
    toast.success('PDF downloaded', 'Also in Reports → History');
  };

  const resultRows = [
    { label: 'Monthly cash flow', value: money(m.cashFlow), tone: m.cashFlow >= 0 ? 'good' : 'bad' },
    { label: 'Cap rate', value: pct(m.capRate) },
    { label: 'Cash on cash', value: pct(m.cashOnCash) },
    { label: 'DSCR', value: m.dscr.toFixed(2) },
    { label: 'ROI (est.)', value: pct(m.roi) },
    { label: 'Mortgage / mo', value: money(m.mortgage) },
    { label: 'Break-even rent', value: money(m.breakEvenRent) },
    { label: 'Cash invested', value: money(m.totalCashIn) },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Buy & Hold analysis"
        description="Calculator → results → AI → save deal → report. Uses your property data, not live ATTOM."
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
            <Field label="Purchase price" value={purchasePrice} onChange={(n) => { setPurchasePrice(n); setAiPreview(null); }} />
            <Field label="ARV" value={arv} onChange={setArv} />
            <Field label="Rehab" value={rehabCost} onChange={(n) => { setRehabCost(n); setAiPreview(null); }} />
            <Field label="Monthly rent" value={rent} onChange={(n) => { setRent(n); setAiPreview(null); }} />
            <Field label="Down payment" value={downPaymentPercent} onChange={setDownPaymentPercent} suffix="%" />
            <Field label="Mortgage rate" value={mortgageRate} onChange={setMortgageRate} suffix="%" />
            <Field label="Term (years)" value={mortgageTerm} onChange={setMortgageTerm} />
            <Field label="Taxes / mo" value={taxes} onChange={setTaxes} />
            <Field label="Insurance / mo" value={insurance} onChange={setInsurance} />
            <Field label="HOA / mo" value={hoa} onChange={setHoa} />
            <Field label="Utilities / mo" value={utilities} onChange={setUtilities} />
            <Field label="Vacancy" value={vacancyRate} onChange={setVacancyRate} suffix="%" />
            <Field label="Maintenance" value={maintenanceRate} onChange={setMaintenanceRate} suffix="%" />
            <Field label="Closing costs" value={closingCostPercent} onChange={setClosingCostPercent} suffix="%" />
          </div>
        </SpotlightCard>

        <SpotlightCard className="p-5 lg:col-span-2">
          <h2 className="mb-4 font-display text-lg">Results</h2>
          <div className="space-y-0">
            {resultRows.map((row) => (
              <div
                key={row.label}
                className="flex items-baseline justify-between gap-3 border-b border-[var(--border)] py-3 last:border-0"
              >
                <span className="text-xs text-[var(--muted)]">{row.label}</span>
                <span
                  className={`text-sm font-semibold ${
                    row.tone === 'good'
                      ? 'text-teal-800'
                      : row.tone === 'bad'
                        ? 'text-red-700'
                        : 'text-foreground'
                  }`}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </SpotlightCard>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl">AI summary</h2>
          {!aiPreview ? (
            <button
              type="button"
              disabled={aiRunning}
              onClick={() => void runAi()}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {aiRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cpu className="h-4 w-4" />}
              Generate AI summary
            </button>
          ) : null}
        </div>
        {aiPreview ? (
          <AiVerdictCard analysis={aiPreview} />
        ) : (
          <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
            Run AI after you like the calculator results. Saving a deal will include the AI verdict if present.
          </p>
        )}
      </section>
    </div>
  );
}

export default function HoldAnalyzePage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-sm text-[var(--muted)]">Loading…</div>}>
      <HoldAnalyzeInner />
    </React.Suspense>
  );
}
