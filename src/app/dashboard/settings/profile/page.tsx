'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, User, Target, ArrowRight } from 'lucide-react';
import {
  getProfileSettings,
  updateProfileSettings,
} from '@/app/actions/settingsActions';
import PageHeader from '@/components/dashboard/PageHeader';
import SettingsTabs from '@/components/dashboard/SettingsTabs';
import { SkeletonFields } from '@/components/ui/Skeleton';

const STRATEGIES = [
  'Wholesaler',
  'Fix & Flip',
  'Buy & Hold',
  'Commercial',
  'Multi-family',
];

export default function ProfileSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    investorType: 'Buy & Hold',
    officeAddress: '',
    targetMarkets: '',
    minCashFlow: 200,
    targetRoi: 12,
    targetCapRate: 7,
    maxRehabBudget: 50000,
  });

  useEffect(() => {
    (async () => {
      try {
        const result = await getProfileSettings();
        if (result.success) setForm((prev) => ({ ...prev, ...result.profile }));
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
      await updateProfileSettings(form);
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
        title="Investor profile"
        description="Your public investor details and deal criteria — separate from account login security."
        actions={<SettingsTabs />}
      />

      <div className="rounded-xl border border-teal-700/20 bg-teal-700/5 px-4 py-3 text-xs text-teal-900 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <p>
          Email, password, and sign-in methods live under{' '}
          <strong>Account</strong> — not on this profile form.
        </p>
        <Link
          href="/dashboard/settings/account"
          className="mt-2 inline-flex items-center gap-1 font-bold text-teal-800 hover:underline sm:mt-0"
        >
          Open account <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="surface-card space-y-5 p-6">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <User className="h-4 w-4 text-teal-700" /> Personal details
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              How you appear across coaching, CRM notes, and reports.
            </p>
          </div>

          {loading ? (
            <SkeletonFields count={5} cols={2} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <input
                  className="glass-input w-full px-3 py-2.5 text-sm"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </Field>
              <Field label="Phone">
                <input
                  className="glass-input w-full px-3 py-2.5 text-sm"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+1 …"
                />
              </Field>
              <Field label="Company">
                <input
                  className="glass-input w-full px-3 py-2.5 text-sm"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                />
              </Field>
              <Field label="Login email (read-only)">
                <input
                  className="glass-input w-full px-3 py-2.5 text-sm opacity-70"
                  value={form.email}
                  disabled
                />
              </Field>
              <Field label="Office address" className="sm:col-span-2">
                <input
                  className="glass-input w-full px-3 py-2.5 text-sm"
                  value={form.officeAddress}
                  onChange={(e) => setForm({ ...form, officeAddress: e.target.value })}
                />
              </Field>
            </div>
          )}
        </section>

        <section className="surface-card space-y-5 p-6">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <Target className="h-4 w-4 text-teal-700" /> Investment criteria
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Used as defaults and filters when underwriting and screening deals.
            </p>
          </div>

          {loading ? (
            <SkeletonFields count={6} cols={2} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Primary strategy">
                <select
                  className="glass-input w-full bg-white px-3 py-2.5 text-sm"
                  value={form.investorType}
                  onChange={(e) => setForm({ ...form, investorType: e.target.value })}
                >
                  {STRATEGIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Target markets">
                <input
                  className="glass-input w-full px-3 py-2.5 text-sm"
                  placeholder="Dallas · 75201 · Austin"
                  value={form.targetMarkets}
                  onChange={(e) => setForm({ ...form, targetMarkets: e.target.value })}
                />
              </Field>
              <Field label="Min cash flow ($/mo)">
                <input
                  type="number"
                  className="glass-input w-full px-3 py-2.5 text-sm"
                  value={form.minCashFlow}
                  onChange={(e) => setForm({ ...form, minCashFlow: Number(e.target.value) })}
                />
              </Field>
              <Field label="Target ROI %">
                <input
                  type="number"
                  className="glass-input w-full px-3 py-2.5 text-sm"
                  value={form.targetRoi}
                  onChange={(e) => setForm({ ...form, targetRoi: Number(e.target.value) })}
                />
              </Field>
              <Field label="Target cap rate %">
                <input
                  type="number"
                  className="glass-input w-full px-3 py-2.5 text-sm"
                  value={form.targetCapRate}
                  onChange={(e) => setForm({ ...form, targetCapRate: Number(e.target.value) })}
                />
              </Field>
              <Field label="Max rehab budget ($)">
                <input
                  type="number"
                  className="glass-input w-full px-3 py-2.5 text-sm"
                  value={form.maxRehabBudget}
                  onChange={(e) => setForm({ ...form, maxRehabBudget: Number(e.target.value) })}
                />
              </Field>
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
            {saved ? 'Saved' : saving ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}
