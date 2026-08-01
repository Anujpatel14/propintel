'use client';

import React, { useEffect, useMemo, useState, useTransition } from 'react';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Search,
  UserPlus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SpotlightCard from '@/components/ui/SpotlightCard';
import PageHeader from '@/components/dashboard/PageHeader';
import { SkeletonRows, SkeletonValue } from '@/components/ui/Skeleton';
import {
  getAdminPlansAndSubscribers,
  upsertSubscriptionPlan,
  deleteSubscriptionPlan,
  adminAssignUserPlan,
} from '@/app/actions/planActions';
import { getAdminUsers } from '@/app/actions/adminExpandActions';

type Plan = {
  id: string;
  code: string;
  name: string;
  priceMonthly: number;
  priceAnnual: number | null;
  blurb: string | null;
  features: string | null;
  isActive: boolean;
  sortOrder: number;
  stripePriceMonthly: string | null;
  stripePriceAnnual: string | null;
};

type AssignUser = {
  id: string;
  email: string;
  name: string | null;
  subscription: { plan: string; status: string } | null;
};

const emptyForm = {
  id: undefined as string | undefined,
  code: '',
  name: '',
  priceMonthly: 0,
  priceAnnual: '' as string | number,
  blurb: '',
  features: '',
  isActive: true,
  sortOrder: 0,
  stripePriceMonthly: '',
  stripePriceAnnual: '',
};

export default function AdminSubscriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [users, setUsers] = useState<AssignUser[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [assignUserId, setAssignUserId] = useState('');
  const [assignPlan, setAssignPlan] = useState('PRO');
  const [userQuery, setUserQuery] = useState('');
  const [assignNotice, setAssignNotice] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [, startTransition] = useTransition();

  const load = async () => {
    setLoading(true);
    try {
      const [planResult, userResult] = await Promise.all([
        getAdminPlansAndSubscribers(),
        getAdminUsers(),
      ]);
      setPlans(planResult.plans);
      setUsers(
        userResult.users.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          subscription: u.subscription
            ? { plan: u.subscription.plan, status: u.subscription.status }
            : null,
        }))
      );
      const firstActive = planResult.plans.find((p) => p.isActive);
      if (firstActive) setAssignPlan((prev) => prev || firstActive.code);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.name || '').toLowerCase().includes(q) ||
        (u.subscription?.plan || '').toLowerCase().includes(q)
    );
  }, [users, userQuery]);

  const selectedUser = users.find((u) => u.id === assignUserId) || null;

  const openCreate = () => {
    setForm({
      ...emptyForm,
      sortOrder: plans.length,
      code: '',
      name: '',
    });
    setModalOpen(true);
  };

  const openEdit = (p: Plan) => {
    setForm({
      id: p.id,
      code: p.code,
      name: p.name,
      priceMonthly: p.priceMonthly,
      priceAnnual: p.priceAnnual ?? '',
      blurb: p.blurb || '',
      features: p.features || '',
      isActive: p.isActive,
      sortOrder: p.sortOrder,
      stripePriceMonthly: p.stripePriceMonthly || '',
      stripePriceAnnual: p.stripePriceAnnual || '',
    });
    setModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await upsertSubscriptionPlan({
        id: form.id,
        code: form.code,
        name: form.name,
        priceMonthly: Number(form.priceMonthly),
        priceAnnual: form.priceAnnual === '' ? null : Number(form.priceAnnual),
        blurb: form.blurb,
        features: form.features,
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder),
        stripePriceMonthly: form.stripePriceMonthly,
        stripePriceAnnual: form.stripePriceAnnual,
      });
      setModalOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteSubscriptionPlan(id);
      await load();
    });
  };

  const handleAssign = () => {
    if (!assignUserId || !assignPlan) return;
    setAssignNotice(null);
    setAssignError(null);
    setAssigning(true);
    startTransition(async () => {
      try {
        const res = await adminAssignUserPlan(assignUserId, assignPlan, 'ACTIVE');
        if (!res.success) {
          setAssignError(res.error || 'Could not assign plan');
        } else {
          const label = selectedUser?.name || selectedUser?.email || 'User';
          setAssignNotice(`Assigned ${assignPlan} to ${label}.`);
          setAssignUserId('');
          setUserQuery('');
          await load();
        }
      } catch (e) {
        setAssignError(e instanceof Error ? e.message : 'Assign failed');
      } finally {
        setAssigning(false);
      }
    });
  };

  const activePlans = plans.filter((p) => p.isActive).length;
  const paidPlans = plans.filter((p) => p.isActive && p.priceMonthly > 0).length;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        title="Subscriptions & plans"
        description="Manage the plan catalog and assign a plan to any user."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="btn-primary inline-flex cursor-pointer items-center gap-2 px-4 py-2.5 text-xs"
          >
            <Plus className="h-4 w-4" /> Add plan
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SpotlightCard className="p-5">
          <div className="text-[10px] font-bold uppercase text-[var(--muted-foreground)]">
            Plans in catalog
          </div>
          <div className="mt-1 text-2xl font-extrabold">
            {loading ? <SkeletonValue /> : plans.length}
          </div>
        </SpotlightCard>
        <SpotlightCard className="p-5">
          <div className="text-[10px] font-bold uppercase text-[var(--muted-foreground)]">
            Active plans
          </div>
          <div className="mt-1 text-2xl font-extrabold">
            {loading ? <SkeletonValue /> : activePlans}
          </div>
        </SpotlightCard>
        <SpotlightCard className="p-5">
          <div className="text-[10px] font-bold uppercase text-[var(--muted-foreground)]">
            Paid tiers
          </div>
          <div className="mt-1 text-2xl font-extrabold">
            {loading ? <SkeletonValue /> : paidPlans}
          </div>
        </SpotlightCard>
      </div>

      <SpotlightCard className="space-y-4 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-teal-700/10 p-2.5 text-teal-800">
            <UserPlus className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold">Assign plan to user</h2>
            <p className="mt-0.5 text-xs text-[var(--muted)]">
              Search any account, pick a plan, and apply it immediately.
            </p>
          </div>
        </div>

        {(assignNotice || assignError) && (
          <div
            className={`rounded-xl px-3 py-2 text-xs ${
              assignError
                ? 'border border-red-200 bg-red-50 text-red-800'
                : 'border border-teal-700/20 bg-teal-700/10 text-teal-900'
            }`}
          >
            {assignError || assignNotice}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:items-end">
          <label className="relative space-y-1.5 text-[10px] font-bold uppercase text-[var(--muted)] lg:col-span-4">
            Search users
            <span className="relative block">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted)]" />
              <input
                className="glass-input w-full bg-white py-2.5 pr-3 pl-9 text-xs font-normal normal-case"
                placeholder="Name, email, or current plan…"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
              />
            </span>
          </label>

          <label className="space-y-1.5 text-[10px] font-bold uppercase text-[var(--muted)] lg:col-span-4">
            User
            <select
              className="glass-input w-full bg-white px-3 py-2.5 text-xs font-normal normal-case"
              value={assignUserId}
              onChange={(e) => setAssignUserId(e.target.value)}
            >
              <option value="">Select user…</option>
              {filteredUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {(u.name || u.email) +
                    (u.subscription ? ` · ${u.subscription.plan}` : ' · no plan')}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5 text-[10px] font-bold uppercase text-[var(--muted)] lg:col-span-2">
            Plan
            <select
              className="glass-input w-full bg-white px-3 py-2.5 text-xs font-normal normal-case"
              value={assignPlan}
              onChange={(e) => setAssignPlan(e.target.value)}
            >
              {plans
                .filter((p) => p.isActive)
                .map((p) => (
                  <option key={p.id} value={p.code}>
                    {p.name} (${p.priceMonthly}/mo)
                  </option>
                ))}
            </select>
          </label>

          <button
            type="button"
            onClick={handleAssign}
            disabled={!assignUserId || assigning}
            className="btn-primary inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 px-4 py-2.5 text-xs disabled:opacity-50 lg:col-span-2"
          >
            {assigning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Assign
          </button>
        </div>

        {selectedUser && (
          <p className="text-[11px] text-[var(--muted)]">
            Selected:{' '}
            <span className="font-semibold text-foreground">
              {selectedUser.name || selectedUser.email}
            </span>
            {' · '}
            current plan{' '}
            <span className="font-semibold text-teal-800">
              {selectedUser.subscription?.plan || 'none'}
            </span>
            {selectedUser.subscription?.status
              ? ` (${selectedUser.subscription.status.toLowerCase()})`
              : ''}
          </p>
        )}
      </SpotlightCard>

      <div className="space-y-4">
        <h2 className="text-sm font-bold">Plan catalog</h2>
        {loading && plans.length === 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="surface-card space-y-3 p-5">
                <SkeletonValue className="h-4 w-16" />
                <SkeletonValue className="h-5 w-32" />
                <SkeletonRows rows={3} cols={1} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.id}
                className={`surface-card flex flex-col justify-between p-5 ${!p.isActive ? 'opacity-60' : ''}`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[10px] font-bold tracking-wider text-teal-800 uppercase">
                        {p.code}
                        {!p.isActive ? ' · inactive' : ''}
                      </div>
                      <h3 className="text-base font-bold">{p.name}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-extrabold">${p.priceMonthly}</div>
                      <div className="text-[10px] text-[var(--muted)]">/ month</div>
                      {p.priceAnnual != null && p.priceAnnual > 0 ? (
                        <div className="text-[10px] text-[var(--muted)]">
                          ${p.priceAnnual}/yr
                        </div>
                      ) : null}
                    </div>
                  </div>
                  {p.blurb ? <p className="text-xs text-[var(--muted)]">{p.blurb}</p> : null}
                  {p.features ? (
                    <ul className="space-y-1 text-[11px] text-[var(--muted)]">
                      {p.features
                        .split('\n')
                        .filter(Boolean)
                        .map((f) => (
                          <li key={f} className="flex items-start gap-1.5">
                            <Check className="mt-0.5 h-3 w-3 shrink-0 text-teal-700" />
                            {f}
                          </li>
                        ))}
                    </ul>
                  ) : null}
                  {(p.stripePriceMonthly || p.stripePriceAnnual) && (
                    <div className="space-y-0.5 pt-1 font-mono text-[10px] text-[var(--muted)]">
                      {p.stripePriceMonthly ? <div>mo: {p.stripePriceMonthly}</div> : null}
                      {p.stripePriceAnnual ? <div>yr: {p.stripePriceAnnual}</div> : null}
                    </div>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="inline-flex min-h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] text-xs font-semibold hover:bg-white"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-red-200 px-3 text-xs font-semibold text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {['FREE', 'PRO', 'ENTERPRISE'].includes(p.code) ? 'Disable' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-md sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--border)] bg-white shadow-2xl"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
                <h3 className="text-sm font-bold">{form.id ? 'Edit plan' : 'Add plan'}</h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="cursor-pointer rounded-lg border border-[var(--border)] p-2"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleSavePlan} className="space-y-3 p-5">
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1 text-[10px] font-bold uppercase text-[var(--muted)]">
                    Code
                    <input
                      required
                      disabled={Boolean(
                        form.id && ['FREE', 'PRO', 'ENTERPRISE'].includes(form.code)
                      )}
                      className="glass-input w-full px-3 py-2 text-sm disabled:opacity-60"
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    />
                  </label>
                  <label className="space-y-1 text-[10px] font-bold uppercase text-[var(--muted)]">
                    Name
                    <input
                      required
                      className="glass-input w-full px-3 py-2 text-sm"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1 text-[10px] font-bold uppercase text-[var(--muted)]">
                    Monthly $
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      required
                      className="glass-input w-full px-3 py-2 text-sm"
                      value={form.priceMonthly}
                      onChange={(e) => setForm({ ...form, priceMonthly: Number(e.target.value) })}
                    />
                  </label>
                  <label className="space-y-1 text-[10px] font-bold uppercase text-[var(--muted)]">
                    Annual $
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className="glass-input w-full px-3 py-2 text-sm"
                      value={form.priceAnnual}
                      onChange={(e) => setForm({ ...form, priceAnnual: e.target.value })}
                    />
                  </label>
                </div>
                <label className="block space-y-1 text-[10px] font-bold uppercase text-[var(--muted)]">
                  Description
                  <textarea
                    rows={2}
                    className="glass-input w-full px-3 py-2 text-sm"
                    value={form.blurb}
                    onChange={(e) => setForm({ ...form, blurb: e.target.value })}
                  />
                </label>
                <label className="block space-y-1 text-[10px] font-bold uppercase text-[var(--muted)]">
                  Features (one per line)
                  <textarea
                    rows={4}
                    className="glass-input w-full px-3 py-2 text-sm"
                    value={form.features}
                    onChange={(e) => setForm({ ...form, features: e.target.value })}
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1 text-[10px] font-bold uppercase text-[var(--muted)]">
                    Sort order
                    <input
                      type="number"
                      className="glass-input w-full px-3 py-2 text-sm"
                      value={form.sortOrder}
                      onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                    />
                  </label>
                  <label className="flex items-end gap-2 pb-2 text-xs font-semibold">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-teal-700"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    />
                    Active / visible
                  </label>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-[10px] font-bold uppercase text-[var(--muted)]">
                    Stripe price (monthly)
                    <input
                      className="glass-input w-full px-3 py-2 text-sm"
                      value={form.stripePriceMonthly}
                      onChange={(e) => setForm({ ...form, stripePriceMonthly: e.target.value })}
                      placeholder="price_…"
                    />
                  </label>
                  <label className="space-y-1 text-[10px] font-bold uppercase text-[var(--muted)]">
                    Stripe price (annual)
                    <input
                      className="glass-input w-full px-3 py-2 text-sm"
                      value={form.stripePriceAnnual}
                      onChange={(e) => setForm({ ...form, stripePriceAnnual: e.target.value })}
                      placeholder="price_…"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex w-full cursor-pointer items-center justify-center gap-2 py-3 text-xs disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {saving ? 'Saving…' : 'Save plan'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
