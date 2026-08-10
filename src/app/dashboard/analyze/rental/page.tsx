'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { AreaChart, BarChart } from '@/components/ui/Charts';
import { money, pct, rentalMetrics } from '@/lib/calculators';
import { savePropertyAnalysis } from '@/app/actions/analysisActions';
import { analyzeDealAction, type AiVerdictPreview } from '@/app/actions/analyzeActions';
import { createReportAction } from '@/app/actions/reportActions';
import { exportToPDF } from '@/lib/services/reports';
import { useToast } from '@/components/ui/Toast';

export default function RentalAnalyzePage() {
  const toast = useToast();
  const router = useRouter();
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

  const cumulativeSeries = useMemo(
    () =>
      m.projection.map((row) => ({
        label: `Y${row.year}`,
        value: Math.round(row.cumulative),
      })),
    [m.projection]
  );

  const cashFlowSeries = useMemo(
    () =>
      m.projection.map((row) => ({
        label: `Y${row.year}`,
        value: Math.round(row.cashFlow),
        tone: (row.cashFlow >= 0 ? 'up' : 'down') as 'up' | 'down',
      })),
    [m.projection]
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
      toast.success('Deal saved', 'Added to Deals + CRM underwriting');
      router.push('/dashboard/deals');
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

  const endCumulative = m.projection[m.projection.length - 1]?.cumulative ?? 0;

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#dbe7ff] px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-[#1639a8] uppercase">
            Rental · Projection
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-[#0b1220]">
            Rental analysis
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-[var(--muted)]">
            Calculator, projection chart, AI, save deal, and PDF — one workflow.
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
              Cash flow / mo
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
              {years}-yr cumulative
            </p>
            <p className="mt-1 font-display text-2xl font-bold">{money(endCumulative)}</p>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="DSCR" value={m.dscr.toFixed(2)} />
        <MetricTile label="Monthly rent" value={money(rent)} />
        <MetricTile label="Expenses / mo" value={money(expenses)} />
        <MetricTile label="Mortgage / mo" value={money(mortgage)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 rounded-3xl border border-[var(--border)] bg-white p-5 lg:col-span-2">
          <SectionLabel>Calculator</SectionLabel>
          <div className="grid gap-3">
            <AnalyzeAddressField value={address} onChange={setAddress} />
            <AnalyzeField
              label="Purchase price"
              prefix="$"
              value={purchasePrice}
              onChange={setPurchasePrice}
            />
            <AnalyzeField label="Monthly rent" prefix="$" value={rent} onChange={setRent} />
            <AnalyzeField
              label="Monthly expenses"
              prefix="$"
              value={expenses}
              onChange={setExpenses}
            />
            <AnalyzeField label="Mortgage / mo" prefix="$" value={mortgage} onChange={setMortgage} />
            <AnalyzeField
              label="Cash down"
              prefix="$"
              value={downPayment}
              onChange={setDownPayment}
            />
            <AnalyzeField label="Projection years" value={years} onChange={setYears} />
            <AnalyzeField
              label="Rent growth"
              value={rentGrowth}
              onChange={setRentGrowth}
              suffix="%"
            />
          </div>
        </div>

        <div className="space-y-5 rounded-3xl border border-[var(--border)] bg-white p-5 lg:col-span-3">
          <div>
            <SectionLabel>Cumulative cash flow</SectionLabel>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Growth over {years} years at {rentGrowth}% rent increases
            </p>
            <div className="mt-3">
              <AreaChart
                data={cumulativeSeries}
                height={200}
                color="#1d4ed8"
                gradientId="rental-cum"
                showGlow
              />
            </div>
          </div>

          <div>
            <SectionLabel>Monthly cash flow by year</SectionLabel>
            <div className="mt-2">
              <BarChart data={cashFlowSeries} height={160} />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-soft)] text-[10px] font-bold tracking-wide text-[var(--muted)] uppercase">
                  <th className="px-3 py-2.5">Year</th>
                  <th className="px-3 py-2.5">Rent / mo</th>
                  <th className="px-3 py-2.5">Cash flow / mo</th>
                  <th className="px-3 py-2.5">Cumulative</th>
                </tr>
              </thead>
              <tbody>
                {m.projection.map((row) => (
                  <tr key={row.year} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-3 py-2.5 font-medium">{row.year}</td>
                    <td className="px-3 py-2.5">{money(row.rent)}</td>
                    <td
                      className={`px-3 py-2.5 font-semibold ${
                        row.cashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {money(row.cashFlow)}
                    </td>
                    <td className="px-3 py-2.5 font-semibold">{money(row.cumulative)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              Optional AI verdict before you save the rental deal.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
