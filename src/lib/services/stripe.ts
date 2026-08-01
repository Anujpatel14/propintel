import Stripe from 'stripe';
import { prisma, withDbRetry } from '../db';
import { logError, logInfo } from '@/lib/logger';

export interface SubscriptionInfo {
  plan: string;
  status: string;
  isPro: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY;
  return Boolean(key?.startsWith('sk_') && !key.includes('replace'));
}

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !key.startsWith('sk_') || key.includes('replace')) return null;
  return new Stripe(key, {
    typescript: true,
  });
}

export async function getUserSubscription(userId: string): Promise<SubscriptionInfo> {
  try {
    const sub = await prisma.subscription.findUnique({ where: { userId } });
    if (!sub) return { plan: 'FREE', status: 'INACTIVE', isPro: false };
    const isPro = sub.status === 'ACTIVE' && sub.plan !== 'FREE';
    return {
      plan: sub.plan,
      status: sub.status,
      isPro,
      stripeCustomerId: sub.stripeCustomerId || undefined,
      stripeSubscriptionId: sub.stripeSubscriptionId || undefined,
    };
  } catch {
    return { plan: 'FREE', status: 'INACTIVE', isPro: false };
  }
}

async function recordPaymentEvent(data: {
  userId?: string | null;
  type: string;
  status?: string;
  amount?: number | null;
  plan?: string | null;
  stripeEventId?: string | null;
  stripeObjectId?: string | null;
  description?: string | null;
  meta?: Record<string, unknown>;
}) {
  try {
    await withDbRetry(() =>
      prisma.paymentEvent.create({
        data: {
          userId: data.userId || null,
          type: data.type,
          status: data.status || 'OK',
          amount: data.amount ?? null,
          plan: data.plan || null,
          stripeEventId: data.stripeEventId || null,
          stripeObjectId: data.stripeObjectId || null,
          description: data.description || null,
          meta: data.meta ? JSON.stringify(data.meta) : null,
        },
      })
    );
  } catch (err) {
    // Unique stripeEventId may collide on retries — ignore
    console.warn('[stripe] payment event write skipped', err);
  }
}

async function ensureStripeCustomer(userId: string, email: string, name?: string | null) {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe is not configured');

  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (sub?.stripeCustomerId) {
    try {
      await stripe.customers.retrieve(sub.stripeCustomerId);
      return sub.stripeCustomerId;
    } catch {
      // recreate below
    }
  }

  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: { propintelUserId: userId },
  });

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan: 'FREE',
      status: 'INACTIVE',
      stripeCustomerId: customer.id,
    },
    update: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

function resolvePriceId(planCode: string): string | null {
  const map: Record<string, string | undefined> = {
    PRO: process.env.STRIPE_PRICE_PRO_MONTHLY,
    ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
  };
  return map[planCode] || null;
}

/**
 * Creates a Stripe Checkout Session for a subscription plan.
 * Throws a clear error when Stripe keys / price IDs are missing.
 */
export async function createCheckoutSession(
  userId: string,
  plan: string,
  origin: string,
  email: string,
  name?: string | null
): Promise<string> {
  const stripe = getStripe();
  if (!stripe) {
    throw new Error(
      'Stripe is not configured. Add STRIPE_SECRET_KEY and price IDs to .env, then restart the server.'
    );
  }

  // Prefer plan catalog Stripe price, fall back to env map
  const catalog = await prisma.subscriptionPlan.findUnique({ where: { code: plan } });
  const priceId = catalog?.stripePriceMonthly || resolvePriceId(plan);
  if (!priceId || priceId.includes('replace')) {
    throw new Error(
      `No Stripe Price ID for plan ${plan}. Set stripePriceMonthly on the plan in Admin → Subscriptions, or STRIPE_PRICE_* in .env.`
    );
  }

  const customerId = await ensureStripeCustomer(userId, email, name);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard/billing?checkout=success&plan=${encodeURIComponent(plan)}`,
    cancel_url: `${origin}/dashboard/billing?checkout=canceled`,
    metadata: { propintelUserId: userId, plan },
    subscription_data: {
      metadata: { propintelUserId: userId, plan },
    },
    allow_promotion_codes: true,
  });

  await recordPaymentEvent({
    userId,
    type: 'CHECKOUT_CREATED',
    plan,
    stripeObjectId: session.id,
    description: `Checkout session for ${plan}`,
    meta: { url: session.url },
  });

  if (!session.url) throw new Error('Stripe did not return a checkout URL');
  return session.url;
}

export async function createBillingPortalSession(userId: string, origin: string): Promise<string> {
  const stripe = getStripe();
  if (!stripe) {
    throw new Error('Stripe is not configured. Add STRIPE_SECRET_KEY to .env.');
  }

  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub?.stripeCustomerId) {
    throw new Error('No Stripe customer on file. Subscribe to a paid plan first.');
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${origin}/dashboard/billing`,
  });

  await recordPaymentEvent({
    userId,
    type: 'PORTAL',
    stripeObjectId: portal.id,
    description: 'Opened Stripe customer portal',
  });

  return portal.url;
}

export async function updateSubscriptionStatus(
  userId: string,
  plan: string,
  status: string,
  stripeIds?: { customerId?: string; subscriptionId?: string }
): Promise<void> {
  await prisma.subscription.upsert({
    where: { userId },
    update: {
      plan,
      status,
      ...(stripeIds?.customerId ? { stripeCustomerId: stripeIds.customerId } : {}),
      ...(stripeIds?.subscriptionId ? { stripeSubscriptionId: stripeIds.subscriptionId } : {}),
      updatedAt: new Date(),
    },
    create: {
      userId,
      plan,
      status,
      stripeCustomerId: stripeIds?.customerId,
      stripeSubscriptionId: stripeIds?.subscriptionId,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId,
      action: 'UPDATE_SUBSCRIPTION',
      details: `Subscribed to ${plan} plan (Status: ${status})`,
    },
  });
}

export async function refundPayment(
  paymentIntentId: string,
  amountCents?: number,
  reason?: string
) {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe is not configured');

  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amountCents,
    reason: (reason as Stripe.RefundCreateParams.Reason) || undefined,
  });

  await recordPaymentEvent({
    type: 'REFUND',
    status: refund.status === 'succeeded' ? 'OK' : 'PENDING',
    amount: refund.amount / 100,
    stripeObjectId: refund.id,
    description: `Refund ${refund.id}`,
    meta: { paymentIntentId, reason },
  });

  return refund;
}

export async function handleStripeWebhookEvent(event: Stripe.Event) {
  await recordPaymentEvent({
    type: 'WEBHOOK',
    stripeEventId: event.id,
    stripeObjectId: typeof event.data.object === 'object' && event.data.object && 'id' in event.data.object
      ? String((event.data.object as { id?: string }).id || '')
      : null,
    description: event.type,
    meta: { livemode: event.livemode },
  });

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.propintelUserId;
      const plan = session.metadata?.plan || 'PRO';
      if (userId) {
        await updateSubscriptionStatus(userId, plan, 'ACTIVE', {
          customerId: typeof session.customer === 'string' ? session.customer : undefined,
          subscriptionId:
            typeof session.subscription === 'string' ? session.subscription : undefined,
        });
        await prisma.order.create({
          data: {
            userId,
            amount: (session.amount_total || 0) / 100,
            plan,
            description: `${plan} subscription via Stripe Checkout`,
            status: 'PAID',
            stripeInvoiceId: typeof session.invoice === 'string' ? session.invoice : null,
            stripePaymentId:
              typeof session.payment_intent === 'string' ? session.payment_intent : null,
            receiptUrl: session.url,
          },
        });
        await recordPaymentEvent({
          userId,
          type: 'CHECKOUT_COMPLETED',
          amount: (session.amount_total || 0) / 100,
          plan,
          stripeObjectId: session.id,
          description: 'Checkout completed',
        });
      }
      break;
    }
    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : null;
      if (customerId) {
        const sub = await prisma.subscription.findFirst({
          where: { stripeCustomerId: customerId },
        });
        if (sub) {
          await prisma.order.create({
            data: {
              userId: sub.userId,
              amount: (invoice.amount_paid || 0) / 100,
              plan: sub.plan,
              description: invoice.description || `Invoice ${invoice.number || invoice.id}`,
              status: 'PAID',
              stripeInvoiceId: invoice.id,
              receiptUrl: invoice.hosted_invoice_url,
            },
          });
          await recordPaymentEvent({
            userId: sub.userId,
            type: 'INVOICE_PAID',
            amount: (invoice.amount_paid || 0) / 100,
            plan: sub.plan,
            stripeObjectId: invoice.id,
            description: 'Invoice paid',
          });
        }
      }
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : null;
      if (customerId) {
        const sub = await prisma.subscription.findFirst({
          where: { stripeCustomerId: customerId },
        });
        if (sub) {
          await prisma.subscription.update({
            where: { userId: sub.userId },
            data: { status: 'PAST_DUE' },
          });
          await recordPaymentEvent({
            userId: sub.userId,
            type: 'INVOICE_FAILED',
            status: 'FAILED',
            amount: (invoice.amount_due || 0) / 100,
            plan: sub.plan,
            stripeObjectId: invoice.id,
            description: 'Invoice payment failed',
          });
        }
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === 'string' ? subscription.customer : null;
      if (customerId) {
        const sub = await prisma.subscription.findFirst({
          where: { stripeCustomerId: customerId },
        });
        if (sub) {
          await updateSubscriptionStatus(sub.userId, 'FREE', 'CANCELED');
        }
      }
      break;
    }
    default:
      void logInfo(`Unhandled Stripe event ${event.type}`, { id: event.id }, 'SYSTEM');
  }
}
