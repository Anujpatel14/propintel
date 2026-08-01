'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ExternalLink, Loader2, CreditCard, ShieldCheck, AlertTriangle } from 'lucide-react';
import SpotlightCard from '@/components/ui/SpotlightCard';
import PageHeader from '@/components/dashboard/PageHeader';
import {
  switchUserPlan,
  getUserSubscriptionDetails,
  openBillingPortal,
} from '@/app/actions/billingActions';
import { getUserOrders } from '@/app/actions/orderActions';

const FALLBACK_META: Record<string, { label: string; price: string; blurb: string }> = {
  FREE: {
    label: 'Free Starter',
    price: '$0',
    blurb: 'Limits property analysis archives to 3 saved deals.',
  },
  PRO: {
    label: 'Professional (PRO)',
    price: '$49',
    blurb: 'Unlimited property lookups, AI deal reports, and CRM pipeline access.',
  },
  ENTERPRISE: {
    label: 'Enterprise',
    price: '$99',
    blurb: 'Multi-agent accounts, custom report branding, and API endpoints.',
  },
};

type CatalogPlan = {
  id: string;
  code: string;
  name: string;
  priceMonthly: number;
  blurb: string | null;
};

interface OrderRow {
  id: string;
  amount: number;
  plan: string;
  description: string | null;
  status: string;
  stripeInvoiceId: string | null;
  receiptUrl?: string | null;
  createdAt: Date | string;
}

function BillingPageInner() {
  const searchParams = useSearchParams();
  const [currentPlan, setCurrentPlan] = useState('FREE');
  const [status, setStatus] = useState('INACTIVE');
  const [catalog, setCatalog] = useState<CatalogPlan[]>([]);
  const [stripeConfigured, setStripeConfigured] = useState(false);
  const [hasStripeCustomer, setHasStripeCustomer] = useState(false);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    const [details, orderResult] = await Promise.all([
      getUserSubscriptionDetails(),
      getUserOrders(),
    ]);
    setCurrentPlan(details.plan);
    setStatus(details.status);
    setCatalog(details.plans || []);
    setStripeConfigured(details.stripeConfigured);
    setHasStripeCustomer(details.hasStripeCustomer);
    if (orderResult.success) setOrders(orderResult.orders);
  };

  useEffect(() => {
    const checkout = searchParams.get('checkout');
    if (checkout === 'success') {
      setNotice('Payment successful. Your plan will update once Stripe confirms the subscription.');
    } else if (checkout === 'canceled') {
      setNotice('Checkout was canceled. No charge was made.');
    }

    (async () => {
      try {
        await refresh();
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingPlan(false);
      }
    })();
  }, [searchParams]);

  const handleSwitchPlan = async (planName: string) => {
    if (planName === currentPlan) return;
    setIsLoading(planName);
    setError(null);
    setNotice(null);
    try {
      const result = await switchUserPlan(planName);
      if (!result.success) {
        setError(result.error || 'Could not change plan');
        return;
      }
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      if ('warning' in result && result.warning) {
        setNotice(result.warning);
      }
      if (result.subscription) {
        setCurrentPlan(result.subscription.plan);
        setStatus(result.subscription.status);
      }
      const orderResult = await getUserOrders();
      if (orderResult.success) setOrders(orderResult.orders);
    } catch (e) {
      console.error(e);
      setError('Something went wrong switching plans.');
    } finally {
      setIsLoading(null);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    setError(null);
    try {
      const result = await openBillingPortal();
      if (result.success && result.url) {
        window.location.href = result.url;
        return;
      }
      setError(result.error || 'Could not open billing portal');
    } catch {
      setError('Could not open billing portal');
    } finally {
      setPortalLoading(false);
    }
  };

  const currentCatalog = catalog.find((p) => p.code === currentPlan);
  const meta = currentCatalog
    ? {
        label: currentCatalog.name,
        price: `$${currentCatalog.priceMonthly}`,
        blurb: currentCatalog.blurb || '',
      }
    : FALLBACK_META[currentPlan] || FALLBACK_META.FREE;

  const otherPlans = catalog.filter((p) => p.code !== currentPlan);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        title="Billing & subscriptions"
        description="Manage plan tiers, pay securely with Stripe, and review invoices."
      />

      {notice && (
        <div className="rounded-xl border border-teal-700/20 bg-teal-700/10 px-4 py-3 text-xs text-teal-800">
          {notice}
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

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
              {otherPlans.map((p) => {
                const isFree = p.code === 'FREE' || p.priceMonthly === 0;
                const isDark = p.code === 'ENTERPRISE';
                return (
                  <SpotlightCard
                    key={p.id}
                    className="flex min-h-52 flex-col justify-between border-[var(--border)] bg-white p-5"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between gap-2">
                        <span
                          className={`text-xs font-bold ${isFree ? 'text-[var(--muted)]' : 'text-teal-800'}`}
                        >
                          {p.name}
                        </span>
                        <span className="text-xs font-bold">${p.priceMonthly}/mo</span>
                      </div>
                      <p className="text-[11px] text-[var(--muted)]">
                        {p.blurb || 'Subscription plan managed by PropIntel admin.'}
                      </p>
                      {!isFree && stripeConfigured && (
                        <p className="text-[10px] font-semibold text-teal-800">
                          Secured by Stripe Checkout
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSwitchPlan(p.code)}
                      disabled={isLoading !== null}
                      className={
                        isFree
                          ? 'flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] py-2.5 text-xs font-bold text-[var(--muted)] disabled:opacity-50'
                          : `${isDark ? 'btn-ink' : 'btn-primary'} flex w-full cursor-pointer items-center justify-center gap-2 py-2.5 text-xs disabled:opacity-50`
                      }
                    >
                      {isLoading === p.code ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isFree ? (
                        'Downgrade to Free'
                      ) : stripeConfigured ? (
                        `Subscribe to ${p.name}`
                      ) : (
                        `Switch to ${p.name}`
                      )}
                    </button>
                  </SpotlightCard>
                );
              })}
            </div>
          </div>

          <div className="surface-card p-6">
            <h3 className="mb-4 text-sm font-bold">Order & invoice history</h3>
            {orders.length === 0 ? (
              <p className="text-xs text-[var(--muted)]">
                No invoices yet. Plan changes and Stripe payments appear here automatically.
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
                          {o.receiptUrl ? (
                            <a
                              href={o.receiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[var(--muted)] hover:text-foreground"
                            >
                              <ExternalLink className="h-3.5 w-3.5" /> Receipt
                            </a>
                          ) : (
                            <button
                              type="button"
                              className="inline-flex cursor-pointer items-center gap-1 text-[var(--muted)] hover:text-foreground"
                              onClick={() => window.print()}
                              title="Print receipt"
                            >
                              <ExternalLink className="h-3.5 w-3.5" /> Receipt
                            </button>
                          )}
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
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              <CreditCard className="h-3.5 w-3.5" /> Payment method
            </h3>
            {stripeConfigured ? (
              <>
                <p className="text-xs text-[var(--muted)]">
                  Card updates, invoices, and cancellations are handled in the Stripe Customer Portal.
                </p>
                <button
                  type="button"
                  onClick={handlePortal}
                  disabled={portalLoading || !hasStripeCustomer}
                  className="btn-primary flex w-full cursor-pointer items-center justify-center gap-2 py-2.5 text-xs disabled:opacity-50"
                >
                  {portalLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Manage billing in Stripe <ExternalLink className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
                {!hasStripeCustomer && (
                  <p className="text-[10px] text-[var(--muted)]">
                    Subscribe to a paid plan first to create your Stripe customer profile.
                  </p>
                )}
              </>
            ) : (
              <div className="flex gap-2 rounded-xl border border-amber-500/30 bg-amber-50 p-3 text-xs text-amber-900">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Stripe credentials are not in .env yet. Paid plan switches activate locally for
                  development; add keys to enable live Checkout.
                </span>
              </div>
            )}
          </SpotlightCard>
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex justify-center py-20 text-[var(--muted)]">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      }
    >
      <BillingPageInner />
    </React.Suspense>
  );
}
