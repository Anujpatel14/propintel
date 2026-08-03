'use client';

import React, { useEffect, useState, useTransition } from 'react';
import {
  DollarSign,
  CreditCard,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Wallet,
  RotateCcw,
} from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { Skeleton, SkeletonRows, SkeletonText, SkeletonValue } from '@/components/ui/Skeleton';
import { usePageTitle } from '@/components/DocumentTitle';
import {
  getAdminPaymentDashboard,
  adminRefundOrder,
} from '@/app/actions/paymentAdminActions';

type Tab = 'overview' | 'transactions' | 'failed' | 'events' | 'customers';
type Dashboard = Awaited<ReturnType<typeof getAdminPaymentDashboard>>;

const TAB_TITLES: Record<Tab, string> = {
  overview: 'Payments overview',
  transactions: 'Transactions',
  failed: 'Failed payments',
  events: 'Stripe events',
  customers: 'Billing customers',
};

export default function AdminPaymentsPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Dashboard | null>(null);
  const [, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  usePageTitle(TAB_TITLES[tab]);

  const load = async () => {
    setLoading(true);
    try {
      const result = await getAdminPaymentDashboard();
      setData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRefund = (orderId: string) => {
    startTransition(async () => {
      const res = await adminRefundOrder(orderId);
      if (res.success) {
        setNotice(res.mode === 'stripe' ? 'Refund issued successfully.' : 'Order marked as refunded.');
        await load();
      } else {
        setNotice(res.error || 'Refund failed');
      }
    });
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'transactions', label: 'Transactions' },
    { key: 'failed', label: 'Failed payments' },
    { key: 'events', label: 'Stripe events' },
    { key: 'customers', label: 'Customers' },
  ];

  const metrics = data?.metrics;
  const stripeConfigured = data?.stripeConfigured ?? false;
  const stripePublishableSet = data?.stripePublishableSet ?? false;
  const stripeWebhookSet = data?.stripeWebhookSet ?? false;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        title="Payments operations"
        description="Everything an admin needs: MRR signals, invoices, failed payments, refunds, and Stripe connection status."
        actions={
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-semibold disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        }
      />

      {notice && (
        <div className="rounded-xl border border-teal-700/20 bg-teal-700/10 px-4 py-3 text-xs text-teal-800">
          {notice}
        </div>
      )}

      {/* Stripe connection — shell always visible; status chips & balances skeleton while loading */}
      <div
        className={`rounded-2xl border p-5 ${
          loading && !data
            ? 'border-[var(--border)] bg-white'
            : stripeConfigured
              ? 'border-teal-700/25 bg-teal-700/5'
              : 'border-amber-500/30 bg-amber-50'
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold">
              <ShieldCheck className="h-4 w-4 text-teal-700" />
              Stripe connection
            </div>
            {loading && !data ? (
              <div className="space-y-2">
                <Skeleton className="h-3 w-full max-w-xl" />
                <Skeleton className="h-3 w-72 max-w-full" />
              </div>
            ) : (
              <p className="text-xs text-[var(--muted)]">
                {stripeConfigured
                  ? 'Live Stripe secret key detected. Checkout, portal, webhooks, and refunds are enabled when price IDs and webhook secret are set.'
                  : 'Stripe credentials are not set yet. Investors can still switch plans locally; add keys in .env to go live.'}
              </p>
            )}
            <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase">
              {loading ? (
                <>
                  <Skeleton className="h-6 w-24 rounded-md" />
                  <Skeleton className="h-6 w-28 rounded-md" />
                  <Skeleton className="h-6 w-28 rounded-md" />
                </>
              ) : (
                <>
                  <Badge ok={stripeConfigured} label="Secret key" />
                  <Badge ok={stripePublishableSet} label="Publishable key" />
                  <Badge ok={stripeWebhookSet} label="Webhook secret" />
                </>
              )}
            </div>
          </div>
          <a
            href="https://dashboard.stripe.com"
            target="_blank"
            rel="noreferrer"
            className="btn-ink inline-flex items-center gap-1.5 px-4 py-2.5 text-xs"
          >
            Open Stripe Dashboard <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:max-w-md">
          <div className="rounded-xl border border-[var(--border)] bg-white p-3">
            <div className="text-[var(--muted)]">Available</div>
            <div className="mt-1 text-lg font-extrabold">
              {loading ? (
                <SkeletonValue className="h-7 w-20" />
              ) : data?.stripeBalance ? (
                `$${data.stripeBalance.available.toFixed(2)}`
              ) : (
                '—'
              )}
            </div>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-white p-3">
            <div className="text-[var(--muted)]">Pending</div>
            <div className="mt-1 text-lg font-extrabold">
              {loading ? (
                <SkeletonValue className="h-7 w-20" />
              ) : data?.stripeBalance ? (
                `$${data.stripeBalance.pending.toFixed(2)}`
              ) : (
                '—'
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`min-h-10 cursor-pointer rounded-xl px-3 py-2 text-xs font-bold ${
              tab === t.key
                ? 'bg-teal-700 text-white'
                : 'border border-[var(--border)] text-[var(--muted)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Kpi
              icon={DollarSign}
              label="MRR (active only)"
              loading={loading}
              value={metrics ? `$${metrics.mrr.toLocaleString()}` : undefined}
            />
            <Kpi
              icon={AlertTriangle}
              label="At-risk MRR (past due)"
              loading={loading}
              value={metrics ? `$${metrics.atRiskMrr.toLocaleString()}` : undefined}
            />
            <Kpi
              icon={Wallet}
              label="Collected revenue"
              loading={loading}
              value={metrics ? `$${metrics.revenue.toLocaleString()}` : undefined}
            />
            <Kpi
              icon={CreditCard}
              label="Paid subscribers"
              loading={loading}
              value={metrics ? String(metrics.activePaid) : undefined}
            />
            <Kpi
              icon={AlertTriangle}
              label="Failed / dunning"
              loading={loading}
              value={
                metrics
                  ? `${metrics.failedCount} fails · ${metrics.pastDueCount} past due`
                  : undefined
              }
            />
            <Kpi
              icon={RotateCcw}
              label="Refunds"
              loading={loading}
              value={
                metrics
                  ? `${metrics.refundedCount} · $${metrics.refundedAmount.toFixed(0)}`
                  : undefined
              }
            />
          </div>
          {!loading && data && data.pastDue.length > 0 && (
            <div className="surface-card space-y-2 p-5 text-xs">
              <h3 className="text-sm font-bold text-amber-900">Past-due customers (dunning)</h3>
              <p className="text-[var(--muted)]">
                These subscriptions failed a charge and are not counted in clean MRR until recovered.
              </p>
              {data.pastDue.map((s) => (
                <div
                  key={s.id}
                  className="flex justify-between rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2"
                >
                  <span>
                    {s.user.email} · {s.plan}
                  </span>
                  <span className="font-bold uppercase text-amber-900">{s.status}</span>
                </div>
              ))}
            </div>
          )}
          {loading && (
            <div className="surface-card space-y-3 p-5">
              <Skeleton className="h-4 w-48" />
              <SkeletonText className="w-full max-w-lg" />
              <SkeletonRows rows={2} cols={2} />
            </div>
          )}
        </div>
      )}

      {tab === 'transactions' && (
        <div className="space-y-4">
          <div className="surface-card overflow-x-auto p-5">
            <h2 className="mb-4 text-sm font-bold">App orders (Neon)</h2>
            {loading ? (
              <SkeletonRows rows={6} cols={5} />
            ) : !data || data.orders.length === 0 ? (
              <p className="text-xs text-[var(--muted)]">No transactions yet.</p>
            ) : (
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)] uppercase">
                    <th className="py-2">Customer</th>
                    <th className="px-3 py-2">Plan</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {data.orders.map((o) => (
                    <tr key={o.id}>
                      <td className="py-2.5">
                        <div className="font-semibold">{o.user.name || o.user.email}</div>
                        <div className="text-[10px] text-[var(--muted)]">{o.user.email}</div>
                      </td>
                      <td className="px-3 py-2.5">{o.plan}</td>
                      <td className="px-3 py-2.5 font-bold text-teal-800">${o.amount.toFixed(2)}</td>
                      <td className="px-3 py-2.5 uppercase">{o.status}</td>
                      <td className="px-3 py-2.5 text-[var(--muted)]">
                        {new Date(o.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right">
                        {o.status !== 'REFUNDED' && (
                          <button
                            type="button"
                            onClick={() => handleRefund(o.id)}
                            className="cursor-pointer rounded-lg border border-red-200 px-2.5 py-1.5 text-[10px] font-bold text-red-700 hover:bg-red-50"
                          >
                            Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {stripeConfigured && (
            <div className="surface-card overflow-x-auto p-5">
              <h2 className="mb-1 text-sm font-bold">Stripe invoices (live)</h2>
              <p className="mb-4 text-[11px] text-[var(--muted)]">
                Pulled directly from Stripe — source of truth for charges.
              </p>
              {loading ? (
                <SkeletonRows rows={4} cols={4} />
              ) : !data?.stripeInvoices?.length ? (
                <p className="text-xs text-[var(--muted)]">No Stripe invoices found yet.</p>
              ) : (
                <table className="w-full min-w-[640px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)] uppercase">
                      <th className="py-2">Customer</th>
                      <th className="px-3 py-2">Description</th>
                      <th className="px-3 py-2">Amount</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="py-2">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {data.stripeInvoices.map((inv) => (
                      <tr key={inv.id}>
                        <td className="py-2.5">{inv.customerEmail || '—'}</td>
                        <td className="px-3 py-2.5">{inv.description}</td>
                        <td className="px-3 py-2.5 font-bold text-teal-800">
                          ${inv.amount.toFixed(2)}
                        </td>
                        <td className="px-3 py-2.5 uppercase">{inv.status}</td>
                        <td className="py-2.5 text-[var(--muted)]">
                          {new Date(inv.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'failed' && (
        <div className="surface-card max-h-[70vh] space-y-3 overflow-y-auto p-5 text-xs">
          {loading ? (
            <SkeletonRows rows={5} cols={3} />
          ) : !data || data.failedEvents.length === 0 ? (
            <p className="text-[var(--muted)]">No failed payment events.</p>
          ) : (
            data.failedEvents.map((e) => (
              <div key={e.id} className="rounded-xl border border-red-200 bg-red-50/50 p-3">
                <div className="font-bold text-red-800">{e.type}</div>
                <div className="text-[var(--muted)]">
                  {e.user?.email || 'Unknown customer'} · {e.description}
                </div>
                <div className="mt-1 text-[10px] text-[var(--muted-foreground)]">
                  {new Date(e.createdAt).toLocaleString()}
                  {e.amount != null ? ` · $${e.amount.toFixed(2)}` : ''}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'events' && (
        <div className="surface-card max-h-[70vh] space-y-2 overflow-y-auto p-5 text-xs">
          {loading ? (
            <SkeletonRows rows={6} cols={3} />
          ) : !data || data.events.length === 0 ? (
            <p className="text-[var(--muted)]">
              No Stripe/payment events yet. They appear after checkout, webhooks, and portal opens.
            </p>
          ) : (
            data.events.map((e) => (
              <div
                key={e.id}
                className="flex flex-col gap-1 rounded-xl border border-[var(--border)] p-3 sm:flex-row sm:justify-between"
              >
                <div>
                  <div className="font-bold">
                    {e.type}{' '}
                    <span className="text-[10px] font-semibold text-[var(--muted)]">{e.status}</span>
                  </div>
                  <div className="text-[var(--muted)]">
                    {e.user?.email || '—'} · {e.description}
                  </div>
                  {e.stripeObjectId ? (
                    <code className="text-[10px] text-teal-800">{e.stripeObjectId}</code>
                  ) : null}
                </div>
                <span className="shrink-0 text-[10px] text-[var(--muted-foreground)]">
                  {new Date(e.createdAt).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'customers' && (
        <div className="surface-card overflow-x-auto p-5">
          {loading ? (
            <SkeletonRows rows={6} cols={4} />
          ) : (
            <table className="w-full min-w-[640px] text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)] uppercase">
                    <th className="py-2">Customer</th>
                    <th className="px-3 py-2">Plan</th>
                    <th className="px-3 py-2">Billing</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="py-2">Stripe customer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {(data?.subscriptions || []).map((s) => (
                    <tr key={s.id}>
                      <td className="py-2.5">
                        <div className="font-semibold">{s.user.name || s.user.email}</div>
                        <div className="text-[10px] text-[var(--muted)]">{s.user.email}</div>
                      </td>
                      <td className="px-3 py-2.5 font-bold text-teal-800">{s.plan}</td>
                      <td className="px-3 py-2.5 capitalize">
                        {'billingInterval' in s && s.billingInterval
                          ? String(s.billingInterval)
                          : 'month'}
                      </td>
                      <td className="px-3 py-2.5 uppercase">{s.status}</td>
                      <td className="py-2.5 font-mono text-[10px]">
                        {s.stripeCustomerId || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
            </table>
          )}
        </div>
      )}

      <div className="surface-card space-y-2 p-5 text-xs text-[var(--muted)]">
        <h3 className="text-sm font-bold text-foreground">Go-live checklist</h3>
        <ol className="list-decimal space-y-1 pl-4">
          <li>Create Products & Prices in Stripe Dashboard (monthly PRO / ENTERPRISE).</li>
          <li>
            Set <code className="font-mono">STRIPE_SECRET_KEY</code>,{' '}
            <code className="font-mono">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>, price IDs on plans
            (Admin → Subscriptions), and <code className="font-mono">STRIPE_WEBHOOK_SECRET</code>.
          </li>
          <li>
            Point webhook to <code className="font-mono">/api/stripe/webhook</code> for{' '}
            <code className="font-mono">checkout.session.completed</code>,{' '}
            <code className="font-mono">invoice.paid</code>,{' '}
            <code className="font-mono">invoice.payment_failed</code>,{' '}
            <code className="font-mono">customer.subscription.deleted</code>.
          </li>
          <li>Enable Customer Portal in Stripe Dashboard for self-serve card updates / cancel.</li>
        </ol>
      </div>
    </div>
  );
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`rounded-md px-2 py-1 ${
        ok ? 'bg-teal-700/15 text-teal-800' : 'bg-amber-500/15 text-amber-900'
      }`}
    >
      {ok ? '✓' : '!'} {label}
    </span>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string;
  loading?: boolean;
}) {
  return (
    <SpotlightCard className="flex justify-between p-5">
      <div>
        <div className="text-[10px] font-bold uppercase text-[var(--muted-foreground)]">{label}</div>
        <div className="mt-1 text-2xl font-extrabold">
          {loading || value == null ? <SkeletonValue /> : value}
        </div>
      </div>
      <Icon className="h-5 w-5 text-teal-700" />
    </SpotlightCard>
  );
}
