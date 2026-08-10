'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Cpu, Loader2, Sparkles } from 'lucide-react';
import { AiVerdictCard } from '@/components/dashboard/AiVerdictCard';
import {
  AnalyzeActions,
  AnalyzeAddressField,
  AnalyzeField,
  MetricTile,
  SectionLabel,
} from '@/components/dashboard/AnalyzeUI';
import { BarChart } from '@/components/ui/Charts';
import { holdMetrics, money, pct } from '@/lib/calculators';
import { savePropertyAnalysis } from '@/app/actions/analysisActions';
import {
  analyzeDealAction,
  type AiVerdictPreview,
} from '@/app/actions/analyzeActions';
import { createReportAction } from '@/app/actions/reportActions';
import { exportToPDF } from '@/lib/services/reports';
import { useToast } from '@/components/ui/Toast';

function HoldAnalyzeInner() {
  const toast = useToast();
  const router = useRouter();
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

  const expenseBars = useMemo(
    () =>
      [
        { label: 'Mort', value: Math.round(m.mortgage), tone: 'flat' as const },
        { label: 'Tax', value: Math.round(taxes), tone: 'flat' as const },
        { label: 'Ins', value: Math.round(insurance), tone: 'flat' as const },
        { label: 'HOA', value: Math.round(hoa), tone: 'flat' as const },
        {
          label: 'Vac',
          value: Math.round(rent * (vacancyRate / 100)),
          tone: 'down' as const,
        },
        {
          label: 'Maint',
          value: Math.round(rent * (maintenanceRate / 100)),
          tone: 'down' as const,
        },
      ].filter((d) => d.value > 0),
    [m.mortgage, taxes, insurance, hoa, rent, vacancyRate, maintenanceRate]
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

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#dbe7ff] px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-[#1639a8] uppercase">
            Buy & Hold · Underwriting
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-[#0b1220]">
            Buy & Hold analysis
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-[var(--muted)]">
            Calculator → results → AI → save deal → report. Uses your property data, not live ATTOM.
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
              Monthly cash flow
            </p>
            <p
              className={`mt-1 font-display text-3xl font-bold ${
                m.cashFlow >= 0 ? 'text-emerald-300' : 'text-rose-300'
              }`}
            >
              {money(m.cashFlow)}
            </p>
            <p className="mt-1 truncate text-xs text-white/55">{address}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-[0.14em] text-blue-200/80 uppercase">
              Cap rate
            </p>
            <p className="mt-1 font-display text-2xl font-bold">{pct(m.capRate)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-[0.14em] text-blue-200/80 uppercase">
              Cash on cash
            </p>
            <p className="mt-1 font-display text-2xl font-bold">{pct(m.cashOnCash)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-[0.14em] text-blue-200/80 uppercase">
              DSCR
            </p>
            <p className="mt-1 font-display text-2xl font-bold">{m.dscr.toFixed(2)}</p>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="ROI (est.)" value={pct(m.roi)} />
        <MetricTile label="Mortgage / mo" value={money(m.mortgage)} />
        <MetricTile label="Break-even rent" value={money(m.breakEvenRent)} />
        <MetricTile label="Cash invested" value={money(m.totalCashIn)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 rounded-3xl border border-[var(--border)] bg-white p-5 lg:col-span-3">
          <SectionLabel>Acquisition</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <AnalyzeAddressField
              value={address}
              onChange={(v) => {
                setAddress(v);
                setAiPreview(null);
              }}
            />
            <AnalyzeField
              label="Purchase price"
              prefix="$"
              value={purchasePrice}
              onChange={(n) => {
                setPurchasePrice(n);
                setAiPreview(null);
              }}
            />
            <AnalyzeField label="ARV" prefix="$" value={arv} onChange={setArv} />
            <AnalyzeField
              label="Rehab"
              prefix="$"
              value={rehabCost}
              onChange={(n) => {
                setRehabCost(n);
                setAiPreview(null);
              }}
            />
            <AnalyzeField
              label="Monthly rent"
              prefix="$"
              value={rent}
              onChange={(n) => {
                setRent(n);
                setAiPreview(null);
              }}
            />
          </div>

          <div className="border-t border-[var(--border)] pt-4">
            <SectionLabel>Financing</SectionLabel>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <AnalyzeField
                label="Down payment"
                value={downPaymentPercent}
                onChange={setDownPaymentPercent}
                suffix="%"
              />
              <AnalyzeField
                label="Mortgage rate"
                value={mortgageRate}
                onChange={setMortgageRate}
                suffix="%"
              />
              <AnalyzeField label="Term (years)" value={mortgageTerm} onChange={setMortgageTerm} />
              <AnalyzeField
                label="Closing costs"
                value={closingCostPercent}
                onChange={setClosingCostPercent}
                suffix="%"
              />
            </div>
          </div>

          <div className="border-t border-[var(--border)] pt-4">
            <SectionLabel>Monthly expenses</SectionLabel>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <AnalyzeField label="Taxes / mo" prefix="$" value={taxes} onChange={setTaxes} />
              <AnalyzeField
                label="Insurance / mo"
                prefix="$"
                value={insurance}
                onChange={setInsurance}
              />
              <AnalyzeField label="HOA / mo" prefix="$" value={hoa} onChange={setHoa} />
              <AnalyzeField
                label="Utilities / mo"
                prefix="$"
                value={utilities}
                onChange={setUtilities}
              />
              <AnalyzeField
                label="Vacancy"
                value={vacancyRate}
                onChange={setVacancyRate}
                suffix="%"
              />
              <AnalyzeField
                label="Maintenance"
                value={maintenanceRate}
                onChange={setMaintenanceRate}
                suffix="%"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-[var(--border)] bg-white p-5 lg:col-span-2">
          <SectionLabel>Expense mix / mo</SectionLabel>
          <p className="text-sm text-[var(--muted)]">Where rent goes before cash flow</p>
          {expenseBars.length ? (
            <BarChart data={expenseBars} height={200} />
          ) : (
            <p className="py-10 text-center text-sm text-[var(--muted)]">Enter expenses to chart</p>
          )}
          <div className="rounded-2xl bg-[#f3f6fb] px-4 py-3 text-xs text-[var(--muted)]">
            Rent <span className="font-semibold text-[#0b1220]">{money(rent)}</span> − expenses →{' '}
            <span
              className={`font-semibold ${m.cashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}
            >
              {money(m.cashFlow)}
            </span>{' '}
            cash flow
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl border border-[var(--border)] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[linear-gradient(180deg,var(--panel-grad-top),var(--panel-grad-bottom))] px-5 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-800" />
            <h2 className="font-display text-lg font-bold">AI summary</h2>
          </div>
          {!aiPreview ? (
            <button
              type="button"
              disabled={aiRunning}
              onClick={() => void runAi()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1d4ed8] px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {aiRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cpu className="h-4 w-4" />}
              Generate AI summary
            </button>
          ) : null}
        </div>
        <div className="p-5">
          {aiPreview ? (
            <AiVerdictCard analysis={aiPreview} />
          ) : (
            <p className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-10 text-center text-sm text-[var(--muted)]">
              Run AI after you like the calculator results. Saving a deal includes the AI verdict if
              present.
            </p>
          )}
        </div>
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
