'use client';

import React, { useEffect, useState, useTransition } from 'react';
import {
  Loader2,
  DollarSign,
  Users,
  TrendingDown,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SpotlightCard from '@/components/ui/SpotlightCard';
import PageHeader from '@/components/dashboard/PageHeader';
import {
  getAdminPlansAndSubscribers,
  upsertSubscriptionPlan,
  deleteSubscriptionPlan,
  adminAssignUserPlan,
} from '@/app/actions/planActions';

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

type SubRow = {
  id: string;
  plan: string;
  status: string;
  user: { id: string; email: string; name: string | null };
};

type OrderRow = {
  id: string;
  amount: number;
  plan: string;
  status: string;
  createdAt: Date | string;
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
  const [subscriptions, setSubscriptions] = useState<SubRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [metrics, setMetrics] = useState({
    mrr: 0,
    arr: 0,
    totalSubscribers: 0,
    totalUsers: 0,
    failedPayments: 0,
    churnRate: 0,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [assignUserId, setAssignUserId] = useState('');
  const [assignPlan, setAssignPlan] = useState('PRO');
  const [, startTransition] = useTransition();

  const load = async () => {
    const result = await getAdminPlansAndSubscribers();
    setPlans(result.plans);
    setSubscriptions(result.subscriptions);
    setOrders(result.orders);
    setMetrics(result.metrics);
    if (result.plans[0] && !assignPlan) setAssignPlan(result.plans[0].code);
  };

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
    startTransition(async () => {
      await adminAssignUserPlan(assignUserId, assignPlan, 'ACTIVE');
      await load();
    });
  };

  const cards = [
    { label: 'MRR', value: `$${metrics.mrr.toLocaleString()}`, icon: DollarSign },
    { label: 'ARR', value: `$${metrics.arr.toLocaleString()}`, icon: DollarSign },
    { label: 'Paid subscribers', value: String(metrics.totalSubscribers), icon: Users },
    { label: 'Failed payments', value: String(metrics.failedPayments), icon: AlertTriangle },
  ];

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-8">
        <PageHeader
          title="Subscriptions & plans"
          description="Manage plan catalog, assign tiers, and review revenue."
        />
        <div className="flex justify-center py-20 text-[var(--muted)]">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        title="Subscriptions & plans"
        description="Create and edit plans, assign users, and track orders."
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <SpotlightCard key={c.label} className="flex justify-between p-5">
              <div>
                <div className="text-[10px] font-bold uppercase text-[var(--muted-foreground)]">
                  {c.label}
                </div>
                <div className="mt-1 text-2xl font-extrabold">{c.value}</div>
              </div>
              <Icon className="h-5 w-5 text-teal-700" />
            </SpotlightCard>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SpotlightCard className="p-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-[var(--muted)]">
            <TrendingDown className="h-4 w-4" /> Churn signal
          </div>
          <div className="mt-2 text-3xl font-extrabold">{metrics.churnRate}%</div>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Canceled subscriptions vs total subscription rows
          </p>
        </SpotlightCard>

        <SpotlightCard className="space-y-3 p-5">
          <div className="text-xs font-bold uppercase text-[var(--muted)]">Assign plan to user</div>
          <select
            className="glass-input w-full bg-white px-3 py-2.5 text-xs"
            value={assignUserId}
            onChange={(e) => setAssignUserId(e.target.value)}
          >
            <option value="">Select subscriber…</option>
            {subscriptions.map((s) => (
              <option key={s.user.id} value={s.user.id}>
                {s.user.name || s.user.email} ({s.plan})
              </option>
            ))}
          </select>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              className="glass-input flex-1 bg-white px-3 py-2.5 text-xs"
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
            <button
              type="button"
              onClick={handleAssign}
              disabled={!assignUserId}
              className="btn-primary cursor-pointer px-4 py-2.5 text-xs disabled:opacity-50"
            >
              Assign
            </button>
          </div>
        </SpotlightCard>
      </div>

      {/* Plan catalog */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold">Plan catalog</h2>
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
                  </div>
                </div>
                {p.blurb ? <p className="text-xs text-[var(--muted)]">{p.blurb}</p> : null}
                {p.features ? (
                  <ul className="space-y-1 text-[11px] text-[var(--muted)]">
                    {p.features.split('\n').filter(Boolean).map((f) => (
                      <li key={f} className="flex items-start gap-1.5">
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-teal-700" />
                        {f}
                      </li>
                    ))}
                  </ul>
                ) : null}
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
      </div>

      <div className="surface-card overflow-x-auto p-5">
        <h2 className="mb-4 text-sm font-bold">Subscriber roster</h2>
        {subscriptions.length === 0 ? (
          <p className="text-xs text-[var(--muted)]">No subscriptions yet.</p>
        ) : (
          <table className="w-full min-w-[560px] text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)] uppercase">
                <th className="py-2">User</th>
                <th className="px-3 py-2">Plan</th>
                <th className="px-3 py-2">Status</th>
                <th className="py-2">Quick change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {subscriptions.map((s) => (
                <tr key={s.id}>
                  <td className="py-2.5">
                    <div className="font-semibold">{s.user.name || s.user.email}</div>
                    <div className="text-[10px] text-[var(--muted)]">{s.user.email}</div>
                  </td>
                  <td className="px-3 py-2.5 font-bold text-teal-800">{s.plan}</td>
                  <td className="px-3 py-2.5 uppercase">{s.status}</td>
                  <td className="py-2.5">
                    <select
                      className="glass-input min-h-10 bg-white px-2 py-1.5 text-[11px]"
                      value={s.plan}
                      onChange={(e) => {
                        startTransition(async () => {
                          await adminAssignUserPlan(s.user.id, e.target.value, 'ACTIVE');
                          await load();
                        });
                      }}
                    >
                      {plans
                        .filter((p) => p.isActive || p.code === s.plan)
                        .map((p) => (
                          <option key={p.id} value={p.code}>
                            {p.code}
                          </option>
                        ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="surface-card overflow-x-auto p-5">
        <h2 className="mb-4 text-sm font-bold">All orders & transactions</h2>
        {orders.length === 0 ? (
          <p className="text-xs text-[var(--muted)]">No orders recorded yet.</p>
        ) : (
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)] uppercase">
                <th className="py-2">Txn</th>
                <th className="px-3 py-2">Plan</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Status</th>
                <th className="py-2">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="py-2.5 font-mono text-[10px]">{o.id.slice(0, 8)}</td>
                  <td className="px-3 py-2.5">{o.plan}</td>
                  <td className="px-3 py-2.5 font-bold text-teal-800">${o.amount.toFixed(2)}</td>
                  <td className="px-3 py-2.5 uppercase">{o.status}</td>
                  <td className="py-2.5 text-[var(--muted)]">
                    {new Date(o.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                      disabled={Boolean(form.id && ['FREE', 'PRO', 'ENTERPRISE'].includes(form.code))}
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
