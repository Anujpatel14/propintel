'use client';

import React, { useEffect, useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import SpotlightCard from '@/components/ui/SpotlightCard';
import {
  switchUserPlan,
  getUserSubscriptionDetails,
} from '@/app/actions/billingActions';
import { getUserOrders } from '@/app/actions/orderActions';

const PLAN_META: Record<string, { label: string; price: string; blurb: string }> = {
  FREE: {
    label: 'Free Starter',
    price: '$0',
    blurb:
      'Limits property analysis archives to 3 saved deals. No AI tools, PDF report compilations, or CRM pipeline boards.',
  },
  PRO: {
    label: 'Professional (PRO)',
    price: '$49',
    blurb: 'Unlimited property lookups, AI deal reports, and CRM pipeline access.',
  },
  ENTERPRISE: {
    label: 'Enterprise',
    price: '$99',
    blurb: 'Multi-agent accounts, custom report branding, and API endpoints for investment funds.',
  },
};

interface OrderRow {
  id: string;
  amount: number;
  plan: string;
  description: string | null;
  status: string;
  stripeInvoiceId: string | null;
  createdAt: Date | string;
}

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState('PRO');
  const [status, setStatus] = useState('ACTIVE');
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);

  const refresh = async () => {
    const [details, orderResult] = await Promise.all([
      getUserSubscriptionDetails(),
      getUserOrders(),
    ]);
    setCurrentPlan(details.plan);
    setStatus(details.status);
    if (orderResult.success) setOrders(orderResult.orders);
  };

  useEffect(() => {
    (async () => {
      try {
        await refresh();
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingPlan(false);
      }
    })();
  }, []);

  const handleSwitchPlan = async (planName: 'FREE' | 'PRO' | 'ENTERPRISE') => {
    if (planName === currentPlan) return;
    setIsLoading(planName);
    try {
      const result = await switchUserPlan(planName);
      if (result.success) {
        setCurrentPlan(result.subscription.plan);
        setStatus(result.subscription.status);
        const orderResult = await getUserOrders();
        if (orderResult.success) setOrders(orderResult.orders);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(null);
    }
  };

  const meta = PLAN_META[currentPlan] || PLAN_META.PRO;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="border-b border-[var(--border)] pb-6">
        <h1 className="text-2xl font-extrabold text-foreground md:text-3xl">
          Billing & Subscriptions
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Manage plan tiers, review order history, and download receipts.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div className="glass-panel flex flex-col items-start justify-between gap-6 rounded-2xl border border-teal-700/20 bg-teal-700/5 p-6 md:flex-row md:items-center">
            {isLoadingPlan ? (
              <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading subscription…
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-teal-700/20 px-2.5 py-0.5 text-[10px] font-extrabold text-teal-800 uppercase">
                      {status}
                    </span>
                    <span className="text-xs font-semibold text-[var(--muted-foreground)]">
                      Monthly billing cycle
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Current plan: {meta.label}</h3>
                  <p className="text-xs text-[var(--muted)]">{meta.blurb}</p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-3xl font-extrabold text-foreground">
                    {meta.price}
                    <span className="text-xs font-normal text-[var(--muted-foreground)]">/mo</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">Upgrade or Change Plan</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {currentPlan !== 'PRO' && (
                <SpotlightCard className="flex h-56 flex-col justify-between border-[var(--border)] bg-white p-5">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs font-bold text-teal-800">Professional</span>
                      <span className="text-xs font-bold">$49/mo</span>
                    </div>
                    <p className="text-[11px] text-[var(--muted)]">{PLAN_META.PRO.blurb}</p>
                  </div>
                  <button
                    onClick={() => handleSwitchPlan('PRO')}
                    disabled={isLoading !== null}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-teal-700 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                  >
                    {isLoading === 'PRO' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upgrade to Pro'}
                  </button>
                </SpotlightCard>
              )}
              {currentPlan !== 'ENTERPRISE' && (
                <SpotlightCard className="flex h-56 flex-col justify-between border-[var(--border)] bg-white p-5">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs font-bold text-teal-800">Enterprise</span>
                      <span className="text-xs font-bold">$99/mo</span>
                    </div>
                    <p className="text-[11px] text-[var(--muted)]">{PLAN_META.ENTERPRISE.blurb}</p>
                  </div>
                  <button
                    onClick={() => handleSwitchPlan('ENTERPRISE')}
                    disabled={isLoading !== null}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#0e1a16] py-2.5 text-xs font-bold text-foreground disabled:opacity-50"
                  >
                    {isLoading === 'ENTERPRISE' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Subscribe to Enterprise'
                    )}
                  </button>
                </SpotlightCard>
              )}
              {currentPlan !== 'FREE' && (
                <div className="glass-card flex h-56 flex-col justify-between rounded-2xl border border-[var(--border)] bg-white p-5">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs font-bold text-[var(--muted)]">Free Starter</span>
                      <span className="text-xs font-bold">$0/mo</span>
                    </div>
                    <p className="text-[11px] text-[var(--muted-foreground)]">{PLAN_META.FREE.blurb}</p>
                  </div>
                  <button
                    onClick={() => handleSwitchPlan('FREE')}
                    disabled={isLoading !== null}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] py-2.5 text-xs text-[var(--muted)] disabled:opacity-50"
                  >
                    {isLoading === 'FREE' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Cancel Plan / Downgrade'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="surface-card p-6">
            <h3 className="mb-4 text-sm font-bold">Order & invoice history</h3>
            {orders.length === 0 ? (
              <p className="text-xs text-[var(--muted)]">
                No invoices yet. Plan changes will appear here automatically.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)] uppercase">
                      <th className="py-2 pr-3">Invoice</th>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Description</th>
                      <th className="px-3 py-2">Amount</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="py-2 pl-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td className="py-3 pr-3 font-semibold">
                          {o.stripeInvoiceId || o.id.slice(0, 8)}
                        </td>
                        <td className="px-3 py-3 text-[var(--muted)]">
                          {new Date(o.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-3">{o.description || `${o.plan} Plan`}</td>
                        <td className="px-3 py-3 font-bold text-teal-800">
                          ${o.amount.toFixed(2)}
                        </td>
                        <td className="px-3 py-3">
                          <span className="rounded bg-teal-700/10 px-1.5 py-0.5 text-[9px] font-extrabold text-teal-800 uppercase">
                            {o.status}
                          </span>
                        </td>
                        <td className="py-3 pl-3 text-right">
                          <button
                            type="button"
                            className="inline-flex cursor-pointer items-center gap-1 text-[var(--muted)] hover:text-foreground"
                            onClick={() => window.print()}
                            title="Download receipt"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <SpotlightCard className="space-y-3 p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Payment details
            </h3>
            <p className="text-xs text-[var(--muted)]">
              Sandbox mode — no live card on file. Billing email uses your account email. Connect
              Stripe keys to enable real payment methods and tax IDs.
            </p>
          </SpotlightCard>
        </div>
      </div>
    </div>
  );
}
