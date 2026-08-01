'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, DollarSign, Users, TrendingDown, AlertTriangle } from 'lucide-react';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { getAdminRevenueMetrics } from '@/app/actions/adminExpandActions';

export default function AdminSubscriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    mrr: 0,
    arr: 0,
    totalSubscribers: 0,
    churnRate: 0,
    failedPayments: 0,
    totalRevenue: 0,
  });
  const [orders, setOrders] = useState<
    Array<{
      id: string;
      amount: number;
      plan: string;
      status: string;
      createdAt: Date | string;
      userId: string;
    }>
  >([]);

  useEffect(() => {
    (async () => {
      try {
        const result = await getAdminRevenueMetrics();
        setMetrics(result.metrics);
        setOrders(result.orders);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-[var(--muted)]">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading revenue…
      </div>
    );
  }

  const cards = [
    { label: 'MRR', value: `$${metrics.mrr.toLocaleString()}`, icon: DollarSign },
    { label: 'ARR', value: `$${metrics.arr.toLocaleString()}`, icon: DollarSign },
    { label: 'Subscribers', value: String(metrics.totalSubscribers), icon: Users },
    { label: 'Failed payments', value: String(metrics.failedPayments), icon: AlertTriangle },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-tight">Subscriptions & revenue</h1>
        <p className="text-sm text-[var(--muted)]">
          MRR/ARR, subscriber counts, and global order log.
        </p>
      </div>

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
          <p className="mt-1 text-xs text-[var(--muted)]">Failed-payment ratio vs total users</p>
        </SpotlightCard>
        <SpotlightCard className="p-5">
          <div className="text-xs font-bold uppercase text-[var(--muted)]">Plan manager</div>
          <div className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between rounded-lg border border-[var(--border)] px-3 py-2">
              <span>PRO monthly</span>
              <span className="font-bold">$49</span>
            </div>
            <div className="flex justify-between rounded-lg border border-[var(--border)] px-3 py-2">
              <span>ENTERPRISE monthly</span>
              <span className="font-bold">$99</span>
            </div>
            <p className="text-[10px] text-[var(--muted-foreground)]">
              Live price edits via CMS coming from `/admin/cms`.
            </p>
          </div>
        </SpotlightCard>
      </div>

      <div className="surface-card overflow-x-auto p-5">
        <h2 className="mb-4 text-sm font-bold">All orders & transactions</h2>
        {orders.length === 0 ? (
          <p className="text-xs text-[var(--muted)]">No orders recorded yet.</p>
        ) : (
          <table className="w-full text-left text-xs">
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
    </div>
  );
}
