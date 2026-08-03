'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Cpu, FileDown, Loader2, Save } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { AiVerdictCard } from '@/components/dashboard/AiVerdictCard';
import { money, pct, rentalMetrics } from '@/lib/calculators';
import { savePropertyAnalysis } from '@/app/actions/analysisActions';
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

export default function RentalAnalyzePage() {
  const toast = useToast();
  const [address, setAddress] = useState('789 Rental Rd');
  const [city, setCity] = useState('Dallas');
  const [state, setState] = useState('TX');
  const [zip, setZip] = useState('75201');
  const [purchasePrice, setPurchasePrice] = useState(275000);
  const [rent, setRent] = useState(2100);
  const [expenses, setExpenses] = useState(450);
  const [mortgage, setMortgage] = useState(1350);
  const [downPayment, setDownPayment] = useState(55000);
  const [years, setYears] = useState(10);
  const [rentGrowth, setRentGrowth] = useState(2.5);
  const [saving, setSaving] = useState(false);
  const [aiRunning, setAiRunning] = useState(false);
  const [aiPreview, setAiPreview] = useState<AiVerdictPreview | null>(null);

  const m = useMemo(
    () =>
      rentalMetrics({
        purchasePrice,
        rent,
        expenses,
        mortgage,
        downPayment,
        years,
        rentGrowth,
      }),
    [purchasePrice, rent, expenses, mortgage, downPayment, years, rentGrowth]
  );

  const runAi = async () => {
    if (aiRunning) return;
    setAiRunning(true);
    try {
      const res = await analyzeDealAction({
        address,
        purchasePrice,
        rehabCost: 0,
        arv: purchasePrice,
        rent,
        cashFlow: m.cashFlow,
        roi: m.cashOnCash,
        capRate: m.capRate,
        dscr: m.dscr,
        cashOnCash: m.cashOnCash,
        modelType: 'rental',
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
      const dpPct = purchasePrice > 0 ? (downPayment / purchasePrice) * 100 : 20;
      await savePropertyAnalysis({
        address,
        city,
        state,
        zip,
        purchasePrice,
        rehabCost: 0,
        arv: purchasePrice,
        rent,
        downPayment: dpPct,
        taxes: expenses * 0.4 * 12,
        insurance: expenses * 0.3 * 12,
        hoa: expenses * 0.3,
        vacancyRate: 5,
        maintenanceRate: 5,
        mortgageRate: 6.5,
        mortgageTerm: 30,
        strategyType: 'rental',
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
    exportToPDF({
      address,
      type: 'Rental',
      metrics: [
        { label: 'Cash flow', value: money(m.cashFlow) },
        { label: 'Cap rate', value: pct(m.capRate) },
        { label: 'DSCR', value: m.dscr.toFixed(2) },
      ],
      inputs: [
        { label: 'Purchase', value: purchasePrice },
        { label: 'Rent', value: rent },
        { label: 'Expenses', value: expenses },
      ],
      aiAnalysis: aiPreview?.reportText || aiPreview?.headline || undefined,
    });
    await createReportAction({
      type: 'RENTAL',
      title: `Rental — ${address}`,
      address,
      payload: {},
    });
    toast.success('PDF downloaded');
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Rental analysis"
        description="Calculator, projection, AI, save deal, and PDF — one workflow."
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
        <SpotlightCard className="space-y-4 p-5 lg:col-span-2">
          <h2 className="font-display text-lg">Calculator</h2>
          <div className="grid gap-3">
            <label className="block space-y-1">
              <span className="text-xs text-[var(--muted)]">Address</span>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              />
            </label>
            <Field label="Purchase price" value={purchasePrice} onChange={setPurchasePrice} />
            <Field label="Monthly rent" value={rent} onChange={setRent} />
            <Field label="Monthly expenses" value={expenses} onChange={setExpenses} />
            <Field label="Mortgage / mo" value={mortgage} onChange={setMortgage} />
            <Field label="Cash down" value={downPayment} onChange={setDownPayment} />
            <Field label="Projection years" value={years} onChange={setYears} />
            <Field label="Rent growth" value={rentGrowth} onChange={setRentGrowth} suffix="%" />
          </div>
          <div className="border-t border-[var(--border)] pt-2">
            {(
              [
                { label: 'Cash flow / mo', value: money(m.cashFlow), good: m.cashFlow >= 0 },
                { label: 'Cap rate', value: pct(m.capRate) },
                { label: 'DSCR', value: m.dscr.toFixed(2) },
                { label: 'Cash on cash', value: pct(m.cashOnCash) },
              ] as const
            ).map((row) => (
              <div key={row.label} className="flex justify-between border-b border-[var(--border)] py-2.5 last:border-0">
                <span className="text-xs text-[var(--muted)]">{row.label}</span>
                <span
                  className={`text-sm font-semibold ${
                    'good' in row ? (row.good ? 'text-teal-800' : 'text-red-700') : ''
                  }`}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </SpotlightCard>

        <SpotlightCard className="overflow-x-auto p-5 lg:col-span-3">
          <h2 className="mb-4 font-display text-lg">Results · projection</h2>
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--muted)]">
                <th className="pb-2 font-medium">Year</th>
                <th className="pb-2 font-medium">Rent / mo</th>
                <th className="pb-2 font-medium">Cash flow / mo</th>
                <th className="pb-2 font-medium">Cumulative</th>
              </tr>
            </thead>
            <tbody>
              {m.projection.map((row) => (
                <tr key={row.year} className="border-b border-[var(--border)] last:border-0">
                  <td className="py-2.5">{row.year}</td>
                  <td className="py-2.5">{money(row.rent)}</td>
                  <td className={`py-2.5 font-medium ${row.cashFlow >= 0 ? 'text-teal-800' : 'text-red-700'}`}>
                    {money(row.cashFlow)}
                  </td>
                  <td className="py-2.5">{money(row.cumulative)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SpotlightCard>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-xl">AI summary</h2>
        {aiPreview ? (
          <AiVerdictCard analysis={aiPreview} />
        ) : (
          <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
            Optional AI verdict before you save the rental deal.
          </p>
        )}
      </section>
    </div>
  );
}
