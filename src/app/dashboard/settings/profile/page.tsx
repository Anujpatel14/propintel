'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Check, User, Shield } from 'lucide-react';
import {
  getProfileSettings,
  updateProfileSettings,
} from '@/app/actions/settingsActions';
import PageHeader from '@/components/dashboard/PageHeader';
import SettingsTabs from '@/components/dashboard/SettingsTabs';

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

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-8">
        <PageHeader
          title="Profile settings"
          description="Personal info, investor strategy, and target criteria."
          actions={<SettingsTabs />}
        />
        <div className="flex items-center justify-center py-20 text-[var(--muted)]">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading profile…
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        title="Profile settings"
        description="Personal info, investor strategy, and target criteria."
        actions={<SettingsTabs />}
      />

      <form onSubmit={handleSave} className="mx-auto max-w-3xl space-y-6">
        <div className="surface-card space-y-5 p-6">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <User className="h-4 w-4 text-teal-700" /> Personal information
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Full name">
              <input
                className="glass-input w-full px-3 py-2 text-sm"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </Field>
            <Field label="Email">
              <input
                className="glass-input w-full px-3 py-2 text-sm opacity-70"
                value={form.email}
                disabled
              />
            </Field>
            <Field label="Phone">
              <input
                className="glass-input w-full px-3 py-2 text-sm"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <Field label="Company">
              <input
                className="glass-input w-full px-3 py-2 text-sm"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </Field>
            <Field label="Office address" className="md:col-span-2">
              <input
                className="glass-input w-full px-3 py-2 text-sm"
                value={form.officeAddress}
                onChange={(e) => setForm({ ...form, officeAddress: e.target.value })}
              />
            </Field>
          </div>
        </div>

        <div className="surface-card space-y-5 p-6">
          <h2 className="text-sm font-bold">Investor strategy profile</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Primary strategy">
              <select
                className="glass-input w-full bg-white px-3 py-2 text-sm"
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
            <Field label="Target markets (cities / ZIPs)">
              <input
                className="glass-input w-full px-3 py-2 text-sm"
                placeholder="Dallas, TX · 75201 · Austin"
                value={form.targetMarkets}
                onChange={(e) => setForm({ ...form, targetMarkets: e.target.value })}
              />
            </Field>
            <Field label="Min cash flow ($/mo)">
              <input
                type="number"
                className="glass-input w-full px-3 py-2 text-sm"
                value={form.minCashFlow}
                onChange={(e) => setForm({ ...form, minCashFlow: Number(e.target.value) })}
              />
            </Field>
            <Field label="Target ROI %">
              <input
                type="number"
                className="glass-input w-full px-3 py-2 text-sm"
                value={form.targetRoi}
                onChange={(e) => setForm({ ...form, targetRoi: Number(e.target.value) })}
              />
            </Field>
            <Field label="Target cap rate %">
              <input
                type="number"
                className="glass-input w-full px-3 py-2 text-sm"
                value={form.targetCapRate}
                onChange={(e) => setForm({ ...form, targetCapRate: Number(e.target.value) })}
              />
            </Field>
            <Field label="Max rehab budget ($)">
              <input
                type="number"
                className="glass-input w-full px-3 py-2 text-sm"
                value={form.maxRehabBudget}
                onChange={(e) => setForm({ ...form, maxRehabBudget: Number(e.target.value) })}
              />
            </Field>
          </div>
        </div>

        <div className="surface-card space-y-3 p-6">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <Shield className="h-4 w-4 text-teal-700" /> Security & sessions
          </h2>
          <p className="text-xs text-[var(--muted)]">
            Password reset, 2FA, OAuth, and &ldquo;Stay signed in&rdquo; are managed in Clerk. Open
            your account menu or the Clerk user profile to update security settings.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
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
      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}
