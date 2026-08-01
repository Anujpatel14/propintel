'use server';

import { prisma, withDbRetry } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';
import { isStripeConfigured, refundPayment, getStripe } from '@/lib/services/stripe';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== 'ADMIN') throw new Error('Admin only');
  return user;
}

export async function getAdminPaymentDashboard() {
  await requireAdmin();

  const [orders, events, subscriptions, failedEvents, plans] = await Promise.all([
    withDbRetry(() =>
      prisma.order.findMany({
        include: { user: { select: { email: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })
    ),
    withDbRetry(() =>
      prisma.paymentEvent.findMany({
        include: { user: { select: { email: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })
    ),
    withDbRetry(() =>
      prisma.subscription.findMany({
        include: { user: { select: { email: true, name: true, id: true } } },
      })
    ),
    withDbRetry(() =>
      prisma.paymentEvent.findMany({
        where: { OR: [{ status: 'FAILED' }, { type: 'INVOICE_FAILED' }] },
        include: { user: { select: { email: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
    ),
    withDbRetry(() => prisma.subscriptionPlan.findMany()),
  ]);

  const priceByCode = Object.fromEntries(plans.map((p) => [p.code, p.priceMonthly]));
  const paidOrders = orders.filter((o) => o.status === 'PAID' || o.status === 'COMPLETED');
  const refunded = orders.filter((o) => o.status === 'REFUNDED');
  const revenue = paidOrders.reduce((s, o) => s + o.amount, 0);
  const activePaid = subscriptions.filter((s) => s.status === 'ACTIVE' && s.plan !== 'FREE');
  const pastDue = subscriptions.filter((s) => s.status === 'PAST_DUE');
  // Clean MRR: only ACTIVE paid (exclude past_due / dunning at-risk)
  const mrr = activePaid.reduce((s, sub) => s + (priceByCode[sub.plan] || 0), 0);
  const atRiskMrr = pastDue.reduce((s, sub) => s + (priceByCode[sub.plan] || 0), 0);

  const stripe = getStripe();
  let stripeBalance: { available: number; pending: number } | null = null;
  if (stripe) {
    try {
      const bal = await stripe.balance.retrieve();
      const usdAvail = bal.available.find((b) => b.currency === 'usd');
      const usdPend = bal.pending.find((b) => b.currency === 'usd');
      stripeBalance = {
        available: (usdAvail?.amount || 0) / 100,
        pending: (usdPend?.amount || 0) / 100,
      };
    } catch {
      stripeBalance = null;
    }
  }

  return {
    success: true as const,
    stripeConfigured: isStripeConfigured(),
    stripePublishableSet: Boolean(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_') &&
        !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.includes('replace')
    ),
    stripeWebhookSet: Boolean(
      process.env.STRIPE_WEBHOOK_SECRET && !process.env.STRIPE_WEBHOOK_SECRET.includes('replace')
    ),
    stripeBalance,
    metrics: {
      revenue,
      orderCount: orders.length,
      refundedCount: refunded.length,
      refundedAmount: refunded.reduce((s, o) => s + o.amount, 0),
      activePaid: activePaid.length,
      pastDueCount: pastDue.length,
      failedCount: failedEvents.length,
      mrr,
      atRiskMrr,
    },
    orders,
    events,
    failedEvents,
    subscriptions,
    pastDue,
  };
}

export async function adminRefundOrder(orderId: string) {
  await requireAdmin();

  const order = await withDbRetry(() =>
    prisma.order.findUnique({ where: { id: orderId } })
  );
  if (!order) return { success: false as const, error: 'Order not found' };
  if (!order.stripePaymentId) {
    // Local/dev order — mark refunded without Stripe
    await withDbRetry(() =>
      prisma.order.update({
        where: { id: orderId },
        data: { status: 'REFUNDED' },
      })
    );
    await withDbRetry(() =>
      prisma.paymentEvent.create({
        data: {
          userId: order.userId,
          type: 'REFUND',
          status: 'OK',
          amount: order.amount,
          plan: order.plan,
          description: `Local refund for order ${orderId}`,
        },
      })
    );
    revalidatePath('/admin/payments');
    return { success: true as const, mode: 'local' as const };
  }

  if (!isStripeConfigured()) {
    return { success: false as const, error: 'Stripe not configured for live refunds' };
  }

  try {
    await refundPayment(order.stripePaymentId);
    await withDbRetry(() =>
      prisma.order.update({
        where: { id: orderId },
        data: { status: 'REFUNDED' },
      })
    );
    revalidatePath('/admin/payments');
    return { success: true as const, mode: 'stripe' as const };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : 'Refund failed',
    };
  }
}
