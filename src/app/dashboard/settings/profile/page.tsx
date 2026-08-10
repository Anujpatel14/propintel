'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Loader2, Target, User } from 'lucide-react';
import {
  getProfileSettings,
  updateProfileSettings,
} from '@/app/actions/settingsActions';
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

  const initials = (form.name || form.email || 'I')
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#dbe7ff] px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-[#1639a8] uppercase">
            Settings · Profile
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-[#0b1220]">
            Investor profile
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-[var(--muted)]">
            Public investor details and deal criteria — separate from account login security.
          </p>
        </div>
        <SettingsTabs />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[#0b1220] p-5 text-white sm:p-6"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_80%_at_100%_0%,rgba(59,130,246,0.35),transparent_55%)]" />
        <div className="relative flex flex-wrap items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-lg font-bold">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl font-bold">
              {loading ? '…' : form.name || 'Your name'}
            </p>
            <p className="text-sm text-white/65">
              {form.investorType || 'Investor'}
              {form.company ? ` · ${form.company}` : ''}
            </p>
          </div>
          <Link
            href="/dashboard/settings/account"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-[#0b1220] hover:bg-blue-50"
          >
            Account security <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </motion.div>

      <div className="rounded-2xl border border-blue-700/20 bg-blue-50/80 px-4 py-3 text-xs text-blue-900 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <p>
          Email, password, and sign-in methods live under <strong>Account</strong> — not on this
          profile form.
        </p>
        <Link
          href="/dashboard/settings/account"
          className="mt-2 inline-flex items-center gap-1 font-bold text-blue-800 hover:underline sm:mt-0"
        >
          Open account <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.04)] sm:p-6">
            <div className="mb-5 flex items-start gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eff4ff] text-blue-800">
                <User className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold">Personal details</h2>
                <p className="text-xs text-[var(--muted)]">
                  How you appear across coaching, CRM notes, and reports.
                </p>
              </div>
            </div>

            {loading ? (
              <SkeletonFields count={5} cols={2} />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Full name">
                  <input
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-blue-700/40 focus:ring-2 focus:ring-blue-700/10"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </Field>
                <Field label="Phone">
                  <input
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-blue-700/40 focus:ring-2 focus:ring-blue-700/10"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </Field>
                <Field label="Company">
                  <input
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-blue-700/40 focus:ring-2 focus:ring-blue-700/10"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                  />
                </Field>
                <Field label="Login email (read-only)">
                  <input
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2.5 text-sm opacity-70"
                    value={form.email}
                    disabled
                  />
                </Field>
                <Field label="Office address" className="sm:col-span-2">
                  <input
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-blue-700/40 focus:ring-2 focus:ring-blue-700/10"
                    value={form.officeAddress}
                    onChange={(e) => setForm({ ...form, officeAddress: e.target.value })}
                  />
                </Field>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.04)] sm:p-6">
            <div className="mb-5 flex items-start gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eff4ff] text-blue-800">
                <Target className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold">Investment criteria</h2>
                <p className="text-xs text-[var(--muted)]">
                  Defaults and filters when underwriting and screening deals.
                </p>
              </div>
            </div>

            {loading ? (
              <SkeletonFields count={6} cols={2} />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Primary strategy">
                  <select
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm"
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
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-blue-700/40 focus:ring-2 focus:ring-blue-700/10"
                    placeholder="Dallas · 75201 · Austin"
                    value={form.targetMarkets}
                    onChange={(e) => setForm({ ...form, targetMarkets: e.target.value })}
                  />
                </Field>
                <Field label="Min cash flow ($/mo)">
                  <input
                    type="number"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                    value={form.minCashFlow}
                    onChange={(e) => setForm({ ...form, minCashFlow: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Target ROI %">
                  <input
                    type="number"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                    value={form.targetRoi}
                    onChange={(e) => setForm({ ...form, targetRoi: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Target cap rate %">
                  <input
                    type="number"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                    value={form.targetCapRate}
                    onChange={(e) => setForm({ ...form, targetCapRate: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Max rehab budget ($)">
                  <input
                    type="number"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                    value={form.maxRehabBudget}
                    onChange={(e) =>
                      setForm({ ...form, maxRehabBudget: Number(e.target.value) })
                    }
                  />
                </Field>
              </div>
            )}
          </section>
        </div>

        <button
          type="submit"
          disabled={saving || loading}
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-[#1d4ed8] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1e40af] disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4" />
          ) : null}
          {saved ? 'Saved' : saving ? 'Saving…' : 'Save profile'}
        </button>
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
      <span className="text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}
