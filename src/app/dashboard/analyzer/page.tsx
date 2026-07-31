'use client';

import React, { useState } from 'react';
import {
  Calculator,
  MapPin,
  Search,
  FileText,
  Cpu,
  Save,
  Check,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { lookupProperty } from '@/lib/services/properties';
import { analyzeDeal } from '@/lib/services/ai';
import { exportToPDF } from '@/lib/services/reports';
import { savePropertyAnalysis, saveFlipAnalysis } from '@/app/actions/analysisActions';
import SpotlightCard from '@/components/ui/SpotlightCard';

type ModelType = 'hold' | 'flip' | 'rental';

export default function PropertyAnalyzerPage() {
  const [modelType, setModelType] = useState<ModelType>('hold');
  const [address, setAddress] = useState('1402 Oak Ridge Dr, Dallas, TX');
  const [zip, setZip] = useState('75201');
  const [purchasePrice, setPurchasePrice] = useState(220000);
  const [rehabCost, setRehabCost] = useState(30000);
  const [arv, setArv] = useState(310000);
  const [rent, setRent] = useState(1950);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [mortgageRate, setMortgageRate] = useState(6.5);
  const [mortgageTerm, setMortgageTerm] = useState(30);
  const [taxes, setTaxes] = useState(180);
  const [insurance, setInsurance] = useState(100);
  const [hoa, setHoa] = useState(0);
  const [vacancyRate, setVacancyRate] = useState(5);
  const [maintenanceRate, setMaintenanceRate] = useState(5);
  const [appreciationRate, setAppreciationRate] = useState(3.5);
  const [rentGrowthRate, setRentGrowthRate] = useState(2.5);
  const [projectionYears, setProjectionYears] = useState(10);

  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [searchSuccessMsg, setSearchSuccessMsg] = useState('');

  // Load user underwriting defaults when available
  React.useEffect(() => {
    (async () => {
      try {
        const { getUnderwritingSettings } = await import('@/app/actions/settingsActions');
        const result = await getUnderwritingSettings();
        if (result.success && result.settings) {
          const s = result.settings;
          setDownPaymentPercent(s.defaultDownPayment);
          setMortgageRate(s.defaultMortgageRate);
          setMortgageTerm(s.defaultMortgageTerm);
          setVacancyRate(s.defaultVacancyRate);
          setMaintenanceRate(s.defaultMaintenanceRate);
        }
      } catch {
        /* defaults stay as-is */
      }
    })();
  }, []);

  const handlePropertyLookup = async () => {
    setIsSearching(true);
    setSearchSuccessMsg('');
    try {
      const data = await lookupProperty(address, zip);
      setPurchasePrice(data.estimatedValue);
      setRent(data.estimatedRent);
      setArv(Math.round(data.estimatedValue * 1.3));
      setTaxes(Math.round(data.estimatedValue * 0.0008));
      setSearchSuccessMsg(
        `Comps found: ${data.beds}bd / ${data.baths}ba, ${data.sqft.toLocaleString()} sqft, built ${data.yearBuilt}. Inputs updated.`
      );
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const downPayment = purchasePrice * (downPaymentPercent / 100);
  const loanAmount = purchasePrice - downPayment;
  const monthlyRate = mortgageRate / 100 / 12;
  const totalMonths = mortgageTerm * 12;
  const mortgagePayment =
    monthlyRate === 0
      ? loanAmount / totalMonths
      : (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1);

  const vacancyCost = rent * (vacancyRate / 100);
  const maintenanceCost = rent * (maintenanceRate / 100);
  const totalOperatingExpenses = taxes + insurance + hoa + vacancyCost + maintenanceCost;
  const cashFlow = rent - mortgagePayment - totalOperatingExpenses;
  const noi = (rent - totalOperatingExpenses) * 12;
  const totalInvestment = downPayment + rehabCost;
  const cashOnCash = totalInvestment > 0 ? ((cashFlow * 12) / totalInvestment) * 100 : 0;
  const capRate = purchasePrice > 0 ? (noi / purchasePrice) * 100 : 0;
  const annualDebtService = mortgagePayment * 12;
  const dscr = annualDebtService > 0 ? noi / annualDebtService : 0;

  const flipFinancing = loanAmount * 0.04;
  const flipSelling = arv * 0.06;
  const flipHolding = arv * 0.03;
  const flipProfit = arv - purchasePrice - rehabCost - flipFinancing - flipSelling - flipHolding;
  const flipMao = arv * 0.7 - rehabCost;
  const flipRoi = totalInvestment > 0 ? (flipProfit / totalInvestment) * 100 : 0;

  // Long-term rental projection (simplified)
  let projectedEquity = downPayment + rehabCost;
  let cumulativeCash = 0;
  let futureValue = purchasePrice + rehabCost;
  let futureRent = rent;
  for (let y = 1; y <= projectionYears; y++) {
    futureRent *= 1 + rentGrowthRate / 100;
    const yearCash = (futureRent - mortgagePayment - totalOperatingExpenses) * 12;
    cumulativeCash += yearCash;
    futureValue *= 1 + appreciationRate / 100;
  }
  const remainingLoanEstimate = Math.max(0, loanAmount * (1 - projectionYears / mortgageTerm));
  projectedEquity = futureValue - remainingLoanEstimate;
  const totalReturn = projectedEquity + cumulativeCash - totalInvestment;
  const annualizedReturn =
    totalInvestment > 0
      ? (Math.pow((totalInvestment + totalReturn) / totalInvestment, 1 / projectionYears) - 1) * 100
      : 0;

  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    setAiReport(null);
    try {
      const report = await analyzeDeal({
        address,
        purchasePrice,
        rehabCost,
        arv,
        rent,
        cashFlow,
        roi: modelType === 'flip' ? flipRoi : cashOnCash,
        capRate,
        dscr,
        cashOnCash,
      });
      setAiReport(report);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportPDF = () => {
    const typeLabel =
      modelType === 'hold' ? 'Buy & Hold' : modelType === 'flip' ? 'Fix & Flip' : 'Rental Projection';

    const reportData = {
      address,
      type: typeLabel,
      metrics: [
        { label: 'Projected cash flow', value: `$${cashFlow.toFixed(2)}/mo` },
        { label: 'ROI (Cash-on-Cash)', value: `${cashOnCash.toFixed(2)}%` },
        { label: 'Cap Rate', value: `${capRate.toFixed(2)}%` },
      ],
      inputs: [
        { label: 'Purchase price', value: `$${purchasePrice.toLocaleString()}` },
        { label: 'Rehab budget', value: `$${rehabCost.toLocaleString()}` },
        { label: 'Down payment', value: `$${downPayment.toLocaleString()} (${downPaymentPercent}%)` },
        { label: 'Mortgage rate', value: `${mortgageRate}% (${mortgageTerm}yr)` },
        { label: 'Est. rent', value: `$${rent}/mo` },
        { label: 'Operating expenses', value: `$${totalOperatingExpenses.toFixed(2)}/mo` },
      ],
      aiAnalysis: aiReport || 'AI analysis not generated for this report yet.',
    };

    if (modelType === 'flip') {
      reportData.metrics = [
        { label: 'Projected net profit', value: `$${flipProfit.toLocaleString()}` },
        { label: 'ROI (Flip yield)', value: `${flipRoi.toFixed(2)}%` },
        { label: 'Max Allowable Offer (MAO)', value: `$${flipMao.toLocaleString()}` },
      ];
    }

    if (modelType === 'rental') {
      reportData.metrics = [
        { label: `${projectionYears}yr equity est.`, value: `$${Math.round(projectedEquity).toLocaleString()}` },
        { label: 'Cumulative cash flow', value: `$${Math.round(cumulativeCash).toLocaleString()}` },
        { label: 'Annualized return', value: `${annualizedReturn.toFixed(2)}%` },
      ];
    }

    exportToPDF(reportData);
  };

  const parseAddressParts = () => {
    const parts = address.split(',').map((s) => s.trim());
    const city = parts[1] || 'Unknown';
    const statePart = parts[2] || 'TX';
    const state = statePart.substring(0, 2).toUpperCase();
    return { city, state };
  };

  const handleSaveDeal = async () => {
    setIsSaving(true);
    try {
      if (modelType === 'flip') {
        await saveFlipAnalysis({
          address,
          purchasePrice,
          rehabCost,
          arv,
          financingCost: flipFinancing,
          holdingCost: flipHolding,
          sellingCost: flipSelling,
        });
      } else {
        const { city, state } = parseAddressParts();
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
        });
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs: { id: ModelType; label: string }[] = [
    { id: 'hold', label: 'Buy & Hold' },
    { id: 'flip', label: 'Fix & Flip' },
    { id: 'rental', label: 'Rental L/T' },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-[var(--border)] pb-6 md:flex-row md:items-center">
        <div>
          <h1 className="font-display text-3xl tracking-tight md:text-4xl">Property analyzer</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Underwrite cash flow, flips, and long-term rental growth.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportPDF}
            className="btn-secondary inline-flex items-center gap-2 px-4 py-2.5 text-xs"
          >
            <FileText className="h-4 w-4 text-teal-700" /> Export PDF
          </button>
          <button
            onClick={handleSaveDeal}
            disabled={isSaving}
            className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-xs disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saveSuccess ? (
              <Check className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saveSuccess ? 'Saved' : 'Save deal'}
          </button>
        </div>
      </div>

      <div className="relative flex max-w-lg rounded-xl border border-[var(--border)] bg-white p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setModelType(tab.id)}
            className={`relative z-10 flex-1 rounded-lg py-2.5 text-xs font-bold transition ${
              modelType === tab.id ? 'text-teal-50' : 'text-[var(--muted)] hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <div
          className="absolute top-1 bottom-1 rounded-lg bg-teal-700 transition-all duration-300"
          style={{
            width: `calc(${100 / tabs.length}% - 4px)`,
            left: `calc(${tabs.findIndex((t) => t.id === modelType) * (100 / tabs.length)}% + 2px)`,
          }}
        />
      </div>

      <div className="surface-card flex flex-col items-stretch gap-4 p-5 md:flex-row md:items-end">
        <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-1.5 md:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Street address
            </span>
            <div className="relative">
              <MapPin className="absolute top-3 left-3 h-4 w-4 text-[var(--muted)]" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full glass-input py-2.5 pr-4 pl-10 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">ZIP</span>
            <input
              type="text"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              className="w-full glass-input px-4 py-2.5 text-sm"
            />
          </div>
        </div>
        <button
          onClick={handlePropertyLookup}
          disabled={isSearching}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0e1a16] px-5 py-3.5 text-xs font-bold text-white transition hover:bg-teal-900 disabled:opacity-50"
        >
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Lookup comps
        </button>
      </div>

      {searchSuccessMsg && (
        <div className="rounded-xl border border-teal-700/20 bg-teal-700/5 px-4 py-3 text-xs text-teal-900">
          <strong>Comp finder:</strong> {searchSuccessMsg}
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div className="surface-card space-y-6 p-6">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Calculator className="h-5 w-5 text-teal-700" />
              Cost & loan configuration
            </h2>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <MoneyField label="Purchase price" value={purchasePrice} onChange={setPurchasePrice} />
              <MoneyField label="Rehab budget" value={rehabCost} onChange={setRehabCost} />
              <MoneyField label="Est. ARV" value={arv} onChange={setArv} />
              <NumberField label="Down payment %" value={downPaymentPercent} onChange={setDownPaymentPercent} />
              <NumberField label="Mortgage rate %" value={mortgageRate} onChange={setMortgageRate} step={0.1} />
              <NumberField label="Term (years)" value={mortgageTerm} onChange={setMortgageTerm} />
              <MoneyField label="Monthly rent" value={rent} onChange={setRent} />
              <MoneyField label="Monthly taxes" value={taxes} onChange={setTaxes} />
              <MoneyField label="Monthly insurance" value={insurance} onChange={setInsurance} />
              <MoneyField label="Monthly HOA" value={hoa} onChange={setHoa} />
              <NumberField label="Vacancy %" value={vacancyRate} onChange={setVacancyRate} />
              <NumberField label="Maintenance %" value={maintenanceRate} onChange={setMaintenanceRate} />

              {modelType === 'rental' && (
                <>
                  <NumberField
                    label="Appreciation % / yr"
                    value={appreciationRate}
                    onChange={setAppreciationRate}
                    step={0.1}
                  />
                  <NumberField
                    label="Rent growth % / yr"
                    value={rentGrowthRate}
                    onChange={setRentGrowthRate}
                    step={0.1}
                  />
                  <NumberField
                    label="Projection years"
                    value={projectionYears}
                    onChange={setProjectionYears}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5 lg:col-span-4">
          <SpotlightCard className="space-y-5 p-6">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Analysis summary
            </h3>

            {modelType === 'hold' && (
              <MetricList
                rows={[
                  {
                    label: 'Monthly cash flow',
                    value: `$${cashFlow.toFixed(2)}`,
                    tone: cashFlow >= 0 ? 'good' : 'bad',
                  },
                  { label: 'Cash-on-cash', value: `${cashOnCash.toFixed(2)}%` },
                  { label: 'Cap rate', value: `${capRate.toFixed(2)}%` },
                  {
                    label: 'DSCR',
                    value: dscr.toFixed(2),
                    tone: dscr >= 1.25 ? 'good' : 'warn',
                  },
                ]}
                footnote={`Capital required: $${totalInvestment.toLocaleString()}`}
              />
            )}

            {modelType === 'flip' && (
              <MetricList
                rows={[
                  {
                    label: 'Net profit',
                    value: `$${Math.round(flipProfit).toLocaleString()}`,
                    tone: flipProfit >= 0 ? 'good' : 'bad',
                  },
                  { label: 'Flip ROI', value: `${flipRoi.toFixed(2)}%` },
                  { label: 'MAO (70% rule)', value: `$${Math.round(flipMao).toLocaleString()}` },
                ]}
                footnote={
                  <span className="flex items-start gap-2 text-left">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#c4a050]" />
                    MAO uses ARV × 70% − rehab.
                  </span>
                }
              />
            )}

            {modelType === 'rental' && (
              <MetricList
                rows={[
                  {
                    label: 'Monthly cash flow',
                    value: `$${cashFlow.toFixed(2)}`,
                    tone: cashFlow >= 0 ? 'good' : 'bad',
                  },
                  {
                    label: `${projectionYears}yr equity`,
                    value: `$${Math.round(projectedEquity).toLocaleString()}`,
                  },
                  {
                    label: 'Cumulative CF',
                    value: `$${Math.round(cumulativeCash).toLocaleString()}`,
                  },
                  {
                    label: 'Annualized return',
                    value: `${annualizedReturn.toFixed(2)}%`,
                    tone: 'good',
                  },
                ]}
                footnote={`DSCR ${dscr.toFixed(2)} · Cap ${capRate.toFixed(2)}%`}
              />
            )}

            <button
              onClick={handleAIAnalysis}
              disabled={isAnalyzing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0e1a16] py-3 text-xs font-bold text-white transition hover:bg-teal-900 disabled:opacity-50"
            >
              {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cpu className="h-4 w-4" />}
              {isAnalyzing ? 'Underwriting…' : 'Run AI deal analysis'}
            </button>
          </SpotlightCard>
        </div>
      </div>

      {aiReport && (
        <div className="surface-card relative overflow-hidden p-7">
          <div className="mb-4 flex items-center justify-between border-b border-[var(--border)] pb-4">
            <h3 className="flex items-center gap-2 text-lg font-bold">
              <Cpu className="h-5 w-5 text-teal-700" /> AI underwriting verdict
            </h3>
            <span className="text-[10px] font-semibold uppercase text-[var(--muted-foreground)]">
              Generative report
            </span>
          </div>
          <div
            className="prose max-w-none space-y-3 text-sm leading-relaxed text-[var(--muted)]"
            dangerouslySetInnerHTML={{
              __html: aiReport
                .replace(/## (.*)/g, '<h4 class="text-foreground font-bold text-base mt-4">$1</h4>')
                .replace(/### (.*)/g, '<h5 class="text-foreground font-bold text-sm mt-3">$1</h5>')
                .replace(/\* \*\*(.*?)\*\*:(.*)/g, '<li><strong class="text-teal-800">$1:</strong>$2</li>')
                .replace(/\* (.*)/g, '<li>$1</li>')
                .replace(/\n\n/g, '<br/>')
                .replace(/---/g, '<hr class="border-[var(--border)] my-4" />'),
            }}
          />
        </div>
      )}
    </div>
  );
}

function MoneyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">{label}</span>
      <div className="relative">
        <span className="absolute top-2.5 left-3 text-sm text-[var(--muted)]">$</span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full glass-input py-2 pr-3 pl-7 text-sm"
        />
      </div>
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step?: number;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">{label}</span>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full glass-input px-3 py-2 text-sm"
      />
    </label>
  );
}

function MetricList({
  rows,
  footnote,
}: {
  rows: { label: string; value: string; tone?: 'good' | 'bad' | 'warn' }[];
  footnote?: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between border-b border-[var(--border)] pb-2 text-sm"
        >
          <span className="text-[var(--muted)]">{row.label}</span>
          <span
            className={`font-extrabold ${
              row.tone === 'good'
                ? 'text-teal-800'
                : row.tone === 'bad'
                  ? 'text-red-700'
                  : row.tone === 'warn'
                    ? 'text-[#8a6a28]'
                    : 'text-foreground'
            }`}
          >
            {row.value}
          </span>
        </div>
      ))}
      {footnote && <div className="pt-1 text-center text-[10px] text-[var(--muted-foreground)]">{footnote}</div>}
    </div>
  );
}
