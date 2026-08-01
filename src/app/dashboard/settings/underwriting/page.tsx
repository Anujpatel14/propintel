'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Check, Calculator, FileText } from 'lucide-react';
import {
  getUnderwritingSettings,
  updateUnderwritingSettings,
} from '@/app/actions/settingsActions';

export default function UnderwritingSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    defaultDownPayment: 20,
    defaultMortgageRate: 6.5,
    defaultMortgageTerm: 30,
    defaultVacancyRate: 5,
    defaultMaintenanceRate: 5,
    defaultClosingCost: 3,
    defaultSellingCommission: 6,
    customLogoUrl: '',
    customPdfHeader: 'PropIntel Investment Report',
    customPdfSubtitle: 'Confidential underwriting dossier',
    customPdfDisclaimer:
      'This analysis is for informational purposes only and does not constitute financial advice.',
    brandColor: '#0f766e',
  });

  useEffect(() => {
    (async () => {
      try {
        const result = await getUnderwritingSettings();
        if (result.success && result.settings) {
          const s = result.settings;
          setForm({
            defaultDownPayment: s.defaultDownPayment,
            defaultMortgageRate: s.defaultMortgageRate,
            defaultMortgageTerm: s.defaultMortgageTerm,
            defaultVacancyRate: s.defaultVacancyRate,
            defaultMaintenanceRate: s.defaultMaintenanceRate,
            defaultClosingCost: s.defaultClosingCost,
            defaultSellingCommission: s.defaultSellingCommission,
            customLogoUrl: s.customLogoUrl || '',
            customPdfHeader: s.customPdfHeader || 'PropIntel Investment Report',
            customPdfSubtitle: s.customPdfSubtitle || 'Confidential underwriting dossier',
            customPdfDisclaimer:
              s.customPdfDisclaimer ||
              'This analysis is for informational purposes only and does not constitute financial advice.',
            brandColor: s.brandColor || '#0f766e',
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUnderwritingSettings(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[var(--muted)]">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading defaults…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight md:text-4xl">
            Underwriting preferences
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Default assumptions and branded PDF export settings.
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <Link
            href="/dashboard/settings/profile"
            className="rounded-lg border border-[var(--border)] px-3 py-2 font-semibold text-[var(--muted)] hover:bg-white"
          >
            Profile
          </Link>
          <Link
            href="/dashboard/settings/underwriting"
            className="rounded-lg bg-teal-700 px-3 py-2 font-bold text-white"
          >
            Underwriting
          </Link>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="surface-card space-y-5 p-6">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <Calculator className="h-4 w-4 text-teal-700" /> Default assumptions
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {(
              [
                ['defaultDownPayment', 'Down payment %'],
                ['defaultMortgageRate', 'Mortgage rate %'],
                ['defaultMortgageTerm', 'Loan term (years)'],
                ['defaultVacancyRate', 'Vacancy %'],
                ['defaultMaintenanceRate', 'Maintenance %'],
                ['defaultClosingCost', 'Closing cost %'],
                ['defaultSellingCommission', 'Selling commission %'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  {label}
                </span>
                <input
                  type="number"
                  step="0.1"
                  className="glass-input w-full px-3 py-2 text-sm"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="surface-card space-y-5 p-6">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <FileText className="h-4 w-4 text-teal-700" /> PDF report branding
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block space-y-1.5 md:col-span-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Logo URL
              </span>
              <input
                className="glass-input w-full px-3 py-2 text-sm"
                placeholder="https://…"
                value={form.customLogoUrl}
                onChange={(e) => setForm({ ...form, customLogoUrl: e.target.value })}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Header title
              </span>
              <input
                className="glass-input w-full px-3 py-2 text-sm"
                value={form.customPdfHeader}
                onChange={(e) => setForm({ ...form, customPdfHeader: e.target.value })}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Subtitle
              </span>
              <input
                className="glass-input w-full px-3 py-2 text-sm"
                value={form.customPdfSubtitle}
                onChange={(e) => setForm({ ...form, customPdfSubtitle: e.target.value })}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Brand accent color
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-10 w-14 cursor-pointer rounded border border-[var(--border)]"
                  value={form.brandColor}
                  onChange={(e) => setForm({ ...form, brandColor: e.target.value })}
                />
                <input
                  className="glass-input flex-1 px-3 py-2 text-sm"
                  value={form.brandColor}
                  onChange={(e) => setForm({ ...form, brandColor: e.target.value })}
                />
              </div>
            </label>
            <label className="block space-y-1.5 md:col-span-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Disclaimer
              </span>
              <textarea
                rows={3}
                className="glass-input w-full px-3 py-2 text-sm"
                value={form.customPdfDisclaimer}
                onChange={(e) => setForm({ ...form, customPdfDisclaimer: e.target.value })}
              />
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
          {saved ? 'Saved' : saving ? 'Saving…' : 'Save preferences'}
        </button>
      </form>
    </div>
  );
}
