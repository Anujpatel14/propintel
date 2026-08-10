'use client';

import React, { useEffect, useState } from 'react';
import { Check, Calculator, FileText } from 'lucide-react';
import {
  getUnderwritingSettings,
  updateUnderwritingSettings,
} from '@/app/actions/settingsActions';
import PageHeader from '@/components/dashboard/PageHeader';
import SettingsTabs from '@/components/dashboard/SettingsTabs';
import { SkeletonFields } from '@/components/ui/Skeleton';

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
    brandColor: '#1d4ed8',
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
            brandColor: s.brandColor || '#1d4ed8',
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

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        title="Underwriting preferences"
        description="Default deal assumptions and branded PDF export — independent from your investor profile."
        actions={<SettingsTabs />}
      />

      <form onSubmit={handleSave} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="surface-card space-y-5 p-6">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <Calculator className="h-4 w-4 text-blue-700" /> Default assumptions
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Pre-filled when you open the Property Analyzer. Change anytime.
            </p>
          </div>

          {loading ? (
            <SkeletonFields count={7} cols={2} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    className="glass-input w-full px-3 py-2.5 text-sm"
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
                  />
                </label>
              ))}
            </div>
          )}
        </section>

        <section className="surface-card space-y-5 p-6">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <FileText className="h-4 w-4 text-blue-700" /> PDF report branding
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Applied when exporting underwriting dossiers for buyers or partners.
            </p>
          </div>

          {loading ? (
            <SkeletonFields count={5} cols={2} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  Logo URL
                </span>
                <input
                  className="glass-input w-full px-3 py-2.5 text-sm"
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
                  className="glass-input w-full px-3 py-2.5 text-sm"
                  value={form.customPdfHeader}
                  onChange={(e) => setForm({ ...form, customPdfHeader: e.target.value })}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  Subtitle
                </span>
                <input
                  className="glass-input w-full px-3 py-2.5 text-sm"
                  value={form.customPdfSubtitle}
                  onChange={(e) => setForm({ ...form, customPdfSubtitle: e.target.value })}
                />
              </label>
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  Brand accent color
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="h-11 w-14 cursor-pointer rounded-lg border border-[var(--border)]"
                    value={form.brandColor}
                    onChange={(e) => setForm({ ...form, brandColor: e.target.value })}
                  />
                  <input
                    className="glass-input flex-1 px-3 py-2.5 text-sm"
                    value={form.brandColor}
                    onChange={(e) => setForm({ ...form, brandColor: e.target.value })}
                  />
                </div>
              </label>
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  Disclaimer
                </span>
                <textarea
                  rows={4}
                  className="glass-input w-full px-3 py-2.5 text-sm"
                  value={form.customPdfDisclaimer}
                  onChange={(e) => setForm({ ...form, customPdfDisclaimer: e.target.value })}
                />
              </label>

              <div
                className="rounded-xl border border-[var(--border)] p-4 sm:col-span-2"
                style={{ borderTopColor: form.brandColor, borderTopWidth: 3 }}
              >
                <div className="text-[10px] font-bold uppercase text-[var(--muted)]">Preview</div>
                <div className="mt-1 text-sm font-bold" style={{ color: form.brandColor }}>
                  {form.customPdfHeader || 'Report title'}
                </div>
                <div className="text-xs text-[var(--muted)]">{form.customPdfSubtitle}</div>
              </div>
            </div>
          )}
        </section>

        <div className="lg:col-span-2">
          <button
            type="submit"
            disabled={saving || loading}
            className="btn-primary inline-flex min-h-11 cursor-pointer items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-50"
          >
            {saved ? <Check className="h-4 w-4" /> : null}
            {saved ? 'Saved' : saving ? 'Saving…' : 'Save preferences'}
          </button>
        </div>
      </form>
    </div>
  );
}
