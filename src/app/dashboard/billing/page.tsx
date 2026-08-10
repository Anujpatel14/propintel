'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Check,
  ExternalLink,
  Loader2,
  AlertTriangle,
  CreditCard,
  Sparkles,
  Shield,
  Zap,
  Receipt,
} from 'lucide-react';
import { Skeleton, SkeletonCards, SkeletonValue } from '@/components/ui/Skeleton';
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

  const planIcon = (code: string) => {
    if (code === 'ENTERPRISE') return Shield;
    if (code === 'PRO' || code === 'PROFESSIONAL') return Zap;
    return Sparkles;
  };

  const statusTone =
    status === 'ACTIVE'
      ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
      : status === 'PAST_DUE'
        ? 'bg-amber-50 text-amber-900 ring-amber-200'
        : 'bg-slate-100 text-slate-700 ring-slate-200';

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-[#dbe7ff] px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-[#1639a8] uppercase">
          Subscription · Stripe
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-[#0b1220] sm:text-4xl">
          Billing
        </h1>
        <p className="mt-1.5 text-sm text-[var(--muted)]">
          Your plan, upgrades, and recent payments — managed securely through Stripe.
        </p>
      </div>

      {notice && (
        <div
          className={`rounded-2xl px-4 py-3 text-sm ${
            noticeTone === 'ok'
              ? 'border border-blue-700/20 bg-blue-50 text-blue-900'
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
        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Current plan hero */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[#0b1220] p-6 text-white sm:p-8"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_80%_at_100%_0%,rgba(59,130,246,0.35),transparent_55%),radial-gradient(60%_50%_at_0%_100%,rgba(29,78,216,0.25),transparent_50%)]" />
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />
        {loading ? (
          <div className="relative space-y-3">
            <Skeleton className="h-3 w-24 bg-white/10" />
            <Skeleton className="h-10 w-48 bg-white/10" />
            <Skeleton className="h-4 w-64 bg-white/10" />
          </div>
        ) : (
          <div className="relative flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-bold tracking-[0.16em] text-blue-200/80 uppercase">
                  Current plan
                </p>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ring-inset ${statusTone}`}
                >
                  {status}
                </span>
              </div>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                {current?.name || currentPlan}
              </h2>
              <p className="mt-2 max-w-md text-sm text-white/65">
                {current?.blurb || 'PropIntel subscription'}
                {currentPlan !== 'FREE' && status === 'ACTIVE' ? (
                  <>
                    {' '}
                    · Billed{' '}
                    <span className="font-semibold text-white">
                      {currentBillingInterval === 'year' ? 'annually' : 'monthly'}
                    </span>
                  </>
                ) : null}
              </p>
              {currentPeriodEnd && status !== 'CANCELED' && currentPlan !== 'FREE' && (
                <p className="mt-3 text-xs text-white/55">
                  {cancelAtPeriodEnd ? (
                    <>
                      Cancels on{' '}
                      <span className="font-semibold text-white">
                        {new Date(currentPeriodEnd).toLocaleDateString()}
                      </span>
                      — then you’ll move to Free.
                    </>
                  ) : (
                    <>
                      Renews{' '}
                      <span className="font-semibold text-white">
                        {new Date(currentPeriodEnd).toLocaleDateString()}
                      </span>
                      . Plan changes only charge the prorated difference.
                    </>
                  )}
                </p>
              )}
              {status === 'PAST_DUE' && (
                <p className="mt-3 text-xs font-medium text-amber-200">
                  Payment failed. Update your card under Manage billing to keep {currentPlan} access.
                </p>
              )}
              {status === 'CANCELED' && (
                <p className="mt-3 text-xs text-white/55">
                  Subscription ended. You’re on Free features until you subscribe again.
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="font-display text-4xl font-bold tracking-tight">
                ${current?.priceMonthly ?? 0}
                <span className="text-base font-normal text-white/50">/mo</span>
              </p>
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={handleRefreshPlan}
                  disabled={confirming}
                  className="rounded-xl border border-white/20 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur hover:bg-white/10 disabled:opacity-50"
                >
                  Refresh plan
                </button>
                {stripeConfigured && (
                  <button
                    type="button"
                    onClick={handlePortal}
                    disabled={portalLoading || !hasStripeCustomer}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-[#0b1220] hover:bg-blue-50 disabled:opacity-50"
                  >
                    {portalLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="h-3.5 w-3.5" />
                        Manage in Stripe <ExternalLink className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.section>

      {/* Plans */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-bold">Change plan</h3>
            <p className="text-xs text-[var(--muted)]">Upgrade, switch interval, or cancel at period end</p>
          </div>
          <div className="flex rounded-xl border border-[var(--border)] bg-white p-1 text-xs font-semibold shadow-sm">
            {(['month', 'year'] as const).map((iv) => (
              <button
                key={iv}
                type="button"
                onClick={() => setBillingInterval(iv)}
                className={`rounded-lg px-3.5 py-1.5 transition ${
                  billingInterval === iv
                    ? 'bg-[#0b1220] text-white'
                    : 'text-[var(--muted)] hover:text-foreground'
                }`}
              >
                {iv === 'month' ? 'Monthly' : 'Annual · save 20%'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {loading ? (
            <SkeletonCards count={3} className="md:col-span-3 md:grid-cols-3" />
          ) : (
            catalog.map((p, idx) => {
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
              const Icon = planIcon(p.code);
              const featured = !isFree && (p.code === 'PRO' || p.code === 'PROFESSIONAL' || idx === 1);

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className={`relative flex flex-col overflow-hidden rounded-2xl border bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.04)] ${
                    isFullyCurrent
                      ? 'border-blue-700/50 ring-2 ring-blue-700/15'
                      : featured
                        ? 'border-blue-200'
                        : 'border-[var(--border)]'
                  }`}
                >
                  {featured && !isFullyCurrent && (
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--hero-from)] to-[var(--hero-to)]" />
                  )}
                  <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl" />
                  <div className="relative flex items-start justify-between gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eff4ff] text-blue-800">
                      <Icon className="h-5 w-5" />
                    </span>
                    {isFullyCurrent && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-700/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-800">
                        <Check className="h-3 w-3" /> Current
                      </span>
                    )}
                    {needsIntervalSwitch && (
                      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-900">
                        Switch billing
                      </span>
                    )}
                  </div>
                  <h4 className="relative mt-4 font-display text-xl font-bold tracking-tight">
                    {p.name}
                  </h4>
                  <p className="relative mt-1.5 min-h-[2.5rem] text-xs leading-relaxed text-[var(--muted)]">
                    {p.blurb || 'PropIntel subscription'}
                  </p>
                  <div className="relative mt-4">
                    <span className="font-display text-3xl font-bold tracking-tight">${price}</span>
                    <span className="text-sm text-[var(--muted)]">
                      /{billingInterval === 'year' && !isFree ? 'mo yearly' : 'mo'}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={isFullyCurrent || switching !== null}
                    onClick={() => handleSwitchPlan(p.code)}
                    className={`relative mt-5 w-full rounded-xl px-4 py-2.5 text-xs font-semibold disabled:opacity-50 ${
                      isFullyCurrent
                        ? 'border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted)]'
                        : isFree
                          ? 'border border-[var(--border)] hover:bg-[var(--surface-soft)]'
                          : 'bg-[#1d4ed8] text-white shadow-sm hover:bg-[#1e40af]'
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
                </motion.div>
              );
            })
          )}
        </div>
      </section>

      {/* Orders */}
      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
        <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[linear-gradient(180deg,#f8fafc,white)] px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eff4ff] text-blue-800">
            <Receipt className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-display text-base font-bold">Recent payments</h3>
            <p className="text-xs text-[var(--muted)]">Invoices and receipts from Stripe</p>
          </div>
        </div>
        {loading ? (
          <div className="p-5">
            <SkeletonCards count={3} className="lg:grid-cols-1" />
          </div>
        ) : orders.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-soft)] text-[var(--muted)]">
              <Receipt className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-medium text-[#0b1220]">No payments yet</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Subscribe to a paid plan and receipts will show up here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {orders.slice(0, 8).map((o) => (
              <li
                key={o.id}
                className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm transition hover:bg-[var(--surface-soft)]/60"
              >
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
                      className="text-[11px] font-medium text-blue-800 hover:underline"
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
        <div className="mx-auto max-w-7xl space-y-8 py-8">
          <SkeletonValue className="h-8 w-48" />
          <SkeletonCards count={3} className="lg:grid-cols-1" />
        </div>
      }
    >
      <BillingPageInner />
    </React.Suspense>
  );
}
