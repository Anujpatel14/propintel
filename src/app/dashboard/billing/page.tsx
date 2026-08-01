'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, ExternalLink, Loader2, AlertTriangle } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import {
  switchUserPlan,
  getUserSubscriptionDetails,
  openBillingPortal,
  confirmCheckoutAction,
} from '@/app/actions/billingActions';
import { getUserOrders } from '@/app/actions/orderActions';

/** Keep payment history readable — never show internal sync/debug copy. */
function formatPaymentDescription(description: string | null | undefined, plan: string) {
  const raw = (description || '').trim();
  if (!raw) return `${plan} plan`;
  const lower = raw.toLowerCase();
  if (
    lower.includes('sync bug') ||
    lower.includes('repaired') ||
    lower.includes('webhook') ||
    lower.includes('checkout sync') ||
    lower.includes('fallback')
  ) {
    return `${plan} plan subscription`;
  }
  return raw;
}

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentPlan, setCurrentPlan] = useState('FREE');
  const [status, setStatus] = useState('INACTIVE');
  const [catalog, setCatalog] = useState<CatalogPlan[]>([]);
  const [stripeConfigured, setStripeConfigured] = useState(false);
  const [hasStripeCustomer, setHasStripeCustomer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [currentBillingInterval, setCurrentBillingInterval] = useState<'month' | 'year'>('month');
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeTone, setNoticeTone] = useState<'ok' | 'warn'>('ok');
  const [error, setError] = useState<string | null>(null);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);

  const applyDetails = async () => {
    const [details, orderResult] = await Promise.all([
      getUserSubscriptionDetails(),
      getUserOrders(),
    ]);
    setCurrentPlan(details.plan);
    setStatus(details.status);
    setCatalog(details.plans || []);
    setStripeConfigured(details.stripeConfigured);
    setHasStripeCustomer(details.hasStripeCustomer);
    setCurrentPeriodEnd(details.currentPeriodEnd);
    setCancelAtPeriodEnd(Boolean(details.cancelAtPeriodEnd));
    const iv = details.billingInterval === 'year' ? 'year' : 'month';
    setCurrentBillingInterval(iv);
    setBillingInterval(iv);
    if (orderResult.success) setOrders(orderResult.orders);
    return details;
  };

  useEffect(() => {
    const checkout = searchParams.get('checkout');
    const sessionId = searchParams.get('session_id');
    const planHint = searchParams.get('plan');

    (async () => {
      try {
        if (checkout === 'canceled') {
          setNoticeTone('warn');
          setNotice('Checkout canceled — nothing was charged.');
          await applyDetails();
          return;
        }

        if (checkout === 'success') {
          setConfirming(true);
          setNoticeTone('ok');
          setNotice('Payment received. Confirming your plan…');

          // Try webhook race first, then Stripe API fallback (up to ~12s)
          let confirmed = false;
          for (let attempt = 0; attempt < 4; attempt++) {
            const result = await confirmCheckoutAction({
              sessionId,
              planHint,
            });
            if (result.synced && result.plan !== 'FREE' && result.status === 'ACTIVE') {
              setCurrentPlan(result.plan);
              setStatus(result.status);
              setHasStripeCustomer(true);
              if (result.webhookSeen) {
                setNotice(`You’re on the ${result.plan} plan. Your payment is confirmed.`);
              } else if (result.source === 'checkout_session' || result.source === 'customer_subscription') {
                setNotice(`You’re on the ${result.plan} plan. Your payment is confirmed.`);
              } else {
                setNotice(`You’re on the ${result.plan} plan.`);
              }
              confirmed = true;
              break;
            }
            if (attempt < 3) await new Promise((r) => setTimeout(r, 2500));
          }

          await applyDetails();

          if (!confirmed) {
            setNoticeTone('warn');
            setNotice(
              'Payment went through, but your plan hasn’t updated yet. Tap “Refresh plan” in a moment, or contact support if it still looks wrong.'
            );
          }

          // Clean success query params so refresh doesn’t re-run the loop forever
          router.replace('/dashboard/billing');
          return;
        }

        await applyDetails();
      } catch (e) {
        console.error(e);
        setError('Could not load billing details.');
      } finally {
        setConfirming(false);
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSwitchPlan = async (planName: string) => {
    const samePlanAndInterval =
      planName === currentPlan &&
      status === 'ACTIVE' &&
      billingInterval === currentBillingInterval;
    if (samePlanAndInterval) return;
    setSwitching(planName);
    setError(null);
    setNotice(null);
    try {
      const result = await switchUserPlan(planName, billingInterval);
      if (!result.success) {
        setError(result.error || 'Could not change plan');
        return;
      }
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      if ('warning' in result && result.warning) {
        setNoticeTone('warn');
        setNotice(result.warning);
      }
      if ('notice' in result && result.notice) {
        setNoticeTone('ok');
        setNotice(result.notice);
      }
      if (result.subscription) {
        setCurrentPlan(result.subscription.plan);
        setStatus(result.subscription.status);
        const iv =
          result.subscription.billingInterval === 'year' ? 'year' : 'month';
        setCurrentBillingInterval(iv);
        setBillingInterval(iv);
      }
      await applyDetails();
    } catch {
      setError('Something went wrong switching plans.');
    } finally {
      setSwitching(null);
    }
  };

  const handleRefreshPlan = async () => {
    setConfirming(true);
    setError(null);
    try {
      const result = await confirmCheckoutAction({
        planHint: currentPlan !== 'FREE' ? currentPlan : 'PRO',
      });
      await applyDetails();
      if (result.synced && result.status === 'ACTIVE' && result.plan !== 'FREE') {
        setNoticeTone('ok');
        setNotice(`Your plan is ${result.plan}.`);
      } else {
        setNoticeTone('warn');
        setNotice('No active paid subscription found yet. If you just paid, wait a moment and refresh again.');
      }
    } catch {
      setError('Could not refresh plan from Stripe.');
    } finally {
      setConfirming(false);
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

  const current = catalog.find((p) => p.code === currentPlan);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="Billing"
        description="Your plan, upgrades, and recent payments."
      />

      {notice && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            noticeTone === 'ok'
              ? 'border border-teal-700/20 bg-teal-50 text-teal-900'
              : 'border border-amber-200 bg-amber-50 text-amber-950'
          }`}
        >
          {confirming ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> {notice}
            </span>
          ) : (
            notice
          )}
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Current plan */}
      <section className="rounded-2xl border border-[var(--border)] bg-white p-6">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Current plan
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">
                {current?.name || currentPlan}
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Status: <span className="font-semibold text-foreground">{status}</span>
                {currentPlan !== 'FREE' && status === 'ACTIVE' ? (
                  <>
                    {' '}
                    ·{' '}
                    <span className="font-semibold text-foreground">
                      {currentBillingInterval === 'year' ? 'Annual' : 'Monthly'}
                    </span>
                  </>
                ) : null}
              </p>
              {currentPeriodEnd && status !== 'CANCELED' && currentPlan !== 'FREE' && (
                <p className="mt-2 text-xs text-[var(--muted)]">
                  {cancelAtPeriodEnd ? (
                    <>
                      Cancels on{' '}
                      <span className="font-semibold text-foreground">
                        {new Date(currentPeriodEnd).toLocaleDateString()}
                      </span>
                      — then you’ll move to Free. You can renew anytime from Manage billing.
                    </>
                  ) : (
                    <>
                      Current period renews{' '}
                      <span className="font-semibold text-foreground">
                        {new Date(currentPeriodEnd).toLocaleDateString()}
                      </span>
                      . Plan changes only charge the prorated difference.
                    </>
                  )}
                </p>
              )}
              {status === 'PAST_DUE' && (
                <p className="mt-2 text-xs font-medium text-amber-800">
                  Payment failed. Update your card under Manage billing to keep {currentPlan} access.
                </p>
              )}
              {status === 'CANCELED' && (
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Subscription ended. You’re on Free features until you subscribe again.
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="font-display text-3xl font-bold">
                ${current?.priceMonthly ?? 0}
                <span className="text-sm font-normal text-[var(--muted)]">/mo</span>
              </p>
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={handleRefreshPlan}
                  disabled={confirming}
                  className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-semibold hover:bg-[var(--surface-soft)] disabled:opacity-50"
                >
                  Refresh plan
                </button>
                {stripeConfigured && (
                  <button
                    type="button"
                    onClick={handlePortal}
                    disabled={portalLoading || !hasStripeCustomer}
                    className="btn-primary inline-flex items-center gap-1.5 px-3 py-2 text-xs disabled:opacity-50"
                  >
                    {portalLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        Manage in Stripe <ExternalLink className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Plans */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold">Change plan</h3>
          <div className="flex rounded-xl border border-[var(--border)] bg-white p-1 text-xs font-semibold">
            {(['month', 'year'] as const).map((iv) => (
              <button
                key={iv}
                type="button"
                onClick={() => setBillingInterval(iv)}
                className={`rounded-lg px-3 py-1.5 ${
                  billingInterval === iv
                    ? 'bg-[#171c19] text-white'
                    : 'text-[var(--muted)] hover:text-foreground'
                }`}
              >
                {iv === 'month' ? 'Monthly' : 'Annual'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {catalog.map((p) => {
            const isFree = p.code === 'FREE' || p.priceMonthly === 0;
            const isCurrentPlan = p.code === currentPlan;
            const intervalMatches = billingInterval === currentBillingInterval;
            const isFullyCurrent =
              isCurrentPlan && status === 'ACTIVE' && (isFree || intervalMatches);
            const needsIntervalSwitch =
              isCurrentPlan && status === 'ACTIVE' && !isFree && !intervalMatches;
            const price =
              billingInterval === 'year' && !isFree
                ? Math.round(p.priceMonthly * 0.8)
                : p.priceMonthly;

            return (
              <div
                key={p.id}
                className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-white px-5 py-4 ${
                  isFullyCurrent
                    ? 'border-teal-700/40 ring-1 ring-teal-700/20'
                    : 'border-[var(--border)]'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{p.name}</span>
                    {isFullyCurrent && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-teal-700/10 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                        <Check className="h-3 w-3" /> Current
                      </span>
                    )}
                    {needsIntervalSwitch && (
                      <span className="rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                        Switch billing
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">
                    {p.blurb || 'PropIntel subscription'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold">
                    ${price}
                    <span className="font-normal text-[var(--muted)]">
                      /{billingInterval === 'year' && !isFree ? 'mo yearly' : 'mo'}
                    </span>
                  </span>
                  <button
                    type="button"
                    disabled={isFullyCurrent || switching !== null}
                    onClick={() => handleSwitchPlan(p.code)}
                    className={`min-w-[7.5rem] rounded-xl px-4 py-2.5 text-xs font-semibold disabled:opacity-50 ${
                      isFree
                        ? 'border border-[var(--border)] hover:bg-[var(--surface-soft)]'
                        : 'btn-primary'
                    }`}
                  >
                    {switching === p.code ? (
                      <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                    ) : isFullyCurrent ? (
                      'Active'
                    ) : needsIntervalSwitch ? (
                      billingInterval === 'year' ? 'Switch to annual' : 'Switch to monthly'
                    ) : isFree ? (
                      'Cancel at period end'
                    ) : currentPlan !== 'FREE' && status === 'ACTIVE' ? (
                      p.priceMonthly > (catalog.find((c) => c.code === currentPlan)?.priceMonthly || 0)
                        ? 'Upgrade'
                        : 'Switch plan'
                    ) : stripeConfigured ? (
                      'Subscribe'
                    ) : (
                      'Activate'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Orders */}
      <section className="rounded-2xl border border-[var(--border)] bg-white p-6">
        <h3 className="text-sm font-bold">Recent payments</h3>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted)]">No payments yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--border)]">
            {orders.slice(0, 8).map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {formatPaymentDescription(o.description, o.plan)}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {new Date(o.createdAt).toLocaleDateString()} · {o.status}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold">${o.amount.toFixed(2)}</p>
                  {o.receiptUrl && (
                    <a
                      href={o.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-teal-800 hover:underline"
                    >
                      Receipt
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
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
