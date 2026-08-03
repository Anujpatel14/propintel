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

function envPriceRaw(planCode: string, interval: 'month' | 'year'): string | undefined {
  const map: Record<string, Record<'month' | 'year', string | undefined>> = {
    PRO: {
      month: process.env.STRIPE_PRICE_PRO_MONTHLY,
      year: process.env.STRIPE_PRICE_PRO_ANNUAL,
    },
    ENTERPRISE: {
      month: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
      year: process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL,
    },
  };
  return map[planCode]?.[interval]?.trim();
}

function isStripePriceId(value: string | null | undefined): value is string {
  return Boolean(value && value.startsWith('price_') && !value.includes('replace'));
}

/**
 * Resolves a Stripe Price ID for a plan.
 * Accepts real `price_…` IDs in env/DB, or dollar amounts (e.g. 49) —
 * amounts auto-create a Product + Price in Stripe and persist the ID.
 */
async function ensurePlanPriceId(
  planCode: string,
  interval: 'month' | 'year' = 'month'
): Promise<string> {
  const stripe = getStripe();
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const catalog = await prisma.subscriptionPlan.findUnique({ where: { code: planCode } });
  if (!catalog) {
    throw new Error(`Unknown plan ${planCode}`);
  }

  const stored =
    interval === 'month' ? catalog.stripePriceMonthly : catalog.stripePriceAnnual;
  if (isStripePriceId(stored)) return stored;

  const raw = envPriceRaw(planCode, interval);
  if (isStripePriceId(raw)) {
    await prisma.subscriptionPlan.update({
      where: { code: planCode },
      data:
        interval === 'month'
          ? { stripePriceMonthly: raw }
          : { stripePriceAnnual: raw },
    });
    return raw;
  }

  // Numeric env or catalog dollar amount → create Stripe price
  const envAmount = raw && !Number.isNaN(Number(raw)) ? Number(raw) : null;
  let dollars: number;
  if (interval === 'month') {
    dollars = envAmount ?? catalog.priceMonthly;
  } else {
    // Annual: prefer catalog yearly total; if env is a "monthly equivalent" (< 200), multiply by 12
    if (envAmount != null) {
      dollars = envAmount < 200 ? envAmount * 12 : envAmount;
    } else {
      dollars = catalog.priceAnnual ?? catalog.priceMonthly * 12 * 0.8;
    }
  }

  if (!dollars || dollars <= 0) {
    throw new Error(`No price configured for ${planCode} (${interval})`);
  }

  const product = await stripe.products.create({
    name: `PropIntel ${catalog.name}`,
    description: catalog.blurb || `${catalog.name} subscription`,
    metadata: { propintelPlan: planCode, interval },
  });

  const price = await stripe.prices.create({
    product: product.id,
    currency: 'usd',
    unit_amount: Math.round(dollars * 100),
    recurring: { interval },
    metadata: { propintelPlan: planCode },
  });

  await prisma.subscriptionPlan.update({
    where: { code: planCode },
    data:
      interval === 'month'
        ? { stripePriceMonthly: price.id }
        : { stripePriceAnnual: price.id },
  });

  void logInfo('Created Stripe price for plan', {
    planCode,
    interval,
    priceId: price.id,
    dollars,
  });

  return price.id;
}

/**
 * Creates a Stripe Checkout Session for a NEW subscription (first paid plan).
 * For upgrades/downgrades on an existing Stripe subscription, use changeSubscriptionPlan.
 */
export async function createCheckoutSession(
  userId: string,
  plan: string,
  origin: string,
  email: string,
  name?: string | null,
  interval: 'month' | 'year' = 'month'
): Promise<string> {
  const stripe = getStripe();
  if (!stripe) {
    throw new Error(
      'Stripe is not configured. Add STRIPE_SECRET_KEY to .env, then restart the server.'
    );
  }

  const priceId = await ensurePlanPriceId(plan, interval);
  const customerId = await ensureStripeCustomer(userId, email, name);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard/billing?checkout=success&plan=${encodeURIComponent(plan)}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/dashboard/billing?checkout=canceled`,
    metadata: { propintelUserId: userId, plan, interval },
    subscription_data: {
      metadata: { propintelUserId: userId, plan, interval },
    },
    allow_promotion_codes: true,
  });

  await recordPaymentEvent({
    userId,
    type: 'CHECKOUT_CREATED',
    plan,
    stripeObjectId: session.id,
    description: `Checkout session for ${plan} (${interval})`,
    meta: { url: session.url, interval, priceId },
  });

  if (!session.url) throw new Error('Stripe did not return a checkout URL');
  return session.url;
}

function mapStripeStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case 'active':
    case 'trialing':
      return status === 'trialing' ? 'TRIALING' : 'ACTIVE';
    case 'past_due':
    case 'unpaid':
      return 'PAST_DUE';
    case 'canceled':
    case 'incomplete_expired':
      return 'CANCELED';
    default:
      return status.toUpperCase();
  }
}

function periodEndFromSubscription(subscription: Stripe.Subscription): Date | null {
  const end = (subscription as Stripe.Subscription & { current_period_end?: number })
    .current_period_end;
  return typeof end === 'number' ? new Date(end * 1000) : null;
}

function intervalFromStripeSub(subscription: Stripe.Subscription): 'month' | 'year' {
  const meta = subscription.metadata?.interval;
  if (meta === 'year' || meta === 'month') return meta;
  const recurring = subscription.items.data[0]?.price?.recurring?.interval;
  return recurring === 'year' ? 'year' : 'month';
}

/**
 * Change plan and/or billing interval (month ↔ year) on an existing Stripe subscription.
 * Stripe prorates: only the difference for unused time is charged or credited.
 */
export async function changeSubscriptionPlan(
  userId: string,
  plan: string,
  interval: 'month' | 'year' = 'month'
): Promise<{
  mode: 'upgraded' | 'interval_changed' | 'downgraded' | 'unchanged';
  plan: string;
  interval: 'month' | 'year';
  status: string;
  prorated: boolean;
  message: string;
}> {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe is not configured');

  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub?.stripeSubscriptionId) {
    throw new Error('No active Stripe subscription to change');
  }

  const currentInterval = (sub.billingInterval === 'year' ? 'year' : 'month') as 'month' | 'year';
  const samePlan = sub.plan === plan;
  const sameInterval = currentInterval === interval;

  if (samePlan && sameInterval && sub.status === 'ACTIVE') {
    return {
      mode: 'unchanged',
      plan: sub.plan,
      interval: currentInterval,
      status: sub.status,
      prorated: false,
      message: `You are already on ${sub.plan} (${currentInterval === 'year' ? 'annual' : 'monthly'}).`,
    };
  }

  const priceId = await ensurePlanPriceId(plan, interval);
  const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
  const itemId = stripeSub.items.data[0]?.id;
  if (!itemId) throw new Error('Stripe subscription has no price item to update');

  const catalog = await prisma.subscriptionPlan.findMany();
  const fromPlan = catalog.find((p) => p.code === sub.plan);
  const toPlan = catalog.find((p) => p.code === plan);

  // Normalize to approximate monthly cost for upgrade vs downgrade messaging
  const fromMonthly =
    currentInterval === 'year'
      ? (fromPlan?.priceAnnual ?? (fromPlan?.priceMonthly ?? 0) * 12 * 0.8) / 12
      : fromPlan?.priceMonthly ?? 0;
  const toMonthly =
    interval === 'year'
      ? (toPlan?.priceAnnual ?? (toPlan?.priceMonthly ?? 0) * 12 * 0.8) / 12
      : toPlan?.priceMonthly ?? 0;
  const isUpgrade = toMonthly > fromMonthly + 0.01;
  const isIntervalOnly = samePlan && !sameInterval;

  const updated = await stripe.subscriptions.update(sub.stripeSubscriptionId, {
    items: [{ id: itemId, price: priceId }],
    proration_behavior: 'create_prorations',
    // Billing cycle aligns to the new price’s interval going forward
    cancel_at_period_end: false,
    metadata: {
      ...stripeSub.metadata,
      propintelUserId: userId,
      plan,
      interval,
    },
  });

  let chargedNow = false;
  if (isUpgrade || (isIntervalOnly && interval === 'year')) {
    try {
      const invoices = await stripe.invoices.list({
        customer: typeof updated.customer === 'string' ? updated.customer : undefined,
        subscription: updated.id,
        limit: 5,
      });
      const open = invoices.data.find((inv) => inv.status === 'open' || inv.status === 'draft');
      if (open?.id) {
        if (open.status === 'draft') {
          await stripe.invoices.finalizeInvoice(open.id);
        }
        const paid = await stripe.invoices.pay(open.id);
        chargedNow = paid.status === 'paid';
        await recordPaymentEvent({
          userId,
          type: 'PRORATION',
          status: paid.status === 'paid' ? 'OK' : 'PENDING',
          amount: (paid.amount_paid || 0) / 100,
          plan,
          stripeObjectId: paid.id,
          description: isIntervalOnly
            ? `Prorated switch to ${interval === 'year' ? 'annual' : 'monthly'} billing`
            : `Prorated change to ${plan}`,
        });
      }
    } catch (err) {
      void logError('Proration invoice pay deferred', err, {
        category: 'SYSTEM',
        meta: { userId, plan, interval },
      });
    }
  }

  await updateSubscriptionStatus(userId, plan, mapStripeStatus(updated.status), {
    customerId: typeof updated.customer === 'string' ? updated.customer : undefined,
    subscriptionId: updated.id,
    currentPeriodEnd: periodEndFromSubscription(updated),
    cancelAtPeriodEnd: Boolean(updated.cancel_at_period_end),
    billingInterval: interval,
  });

  const labelFrom = `${sub.plan} ${currentInterval === 'year' ? 'annual' : 'monthly'}`;
  const labelTo = `${plan} ${interval === 'year' ? 'annual' : 'monthly'}`;

  await prisma.order.create({
    data: {
      userId,
      amount: Math.max(0, toMonthly - fromMonthly),
      plan,
      description: isIntervalOnly
        ? interval === 'year'
          ? 'Switched to annual billing'
          : 'Switched to monthly billing'
        : `Upgraded to ${plan} (${interval === 'year' ? 'annual' : 'monthly'})`,
      status: 'PAID',
    },
  });

  await recordPaymentEvent({
    userId,
    type: 'PLAN_CHANGE',
    plan,
    stripeObjectId: updated.id,
    description: `Subscription changed ${labelFrom} → ${labelTo}`,
    meta: {
      fromPlan: sub.plan,
      toPlan: plan,
      fromInterval: currentInterval,
      toInterval: interval,
      isUpgrade,
      isIntervalOnly,
      chargedNow,
    },
  });

  let message: string;
  if (isIntervalOnly) {
    message =
      interval === 'year'
        ? chargedNow
          ? `You’re now on annual billing. A prorated charge was applied for the rest of this period.`
          : `You’re now on annual billing. Any unused monthly time is credited toward the annual price.`
        : `You’re now on monthly billing. Unused annual time is credited toward future charges.`;
  } else if (isUpgrade) {
    message = chargedNow
      ? `You’re now on ${labelTo}. Only the prorated difference was charged.`
      : `You’re now on ${labelTo}. A prorated charge applies for the rest of this billing period.`;
  } else {
    message = `You’re now on ${labelTo}. Unused time on your previous plan is credited toward future charges.`;
  }

  return {
    mode: isIntervalOnly ? 'interval_changed' : isUpgrade ? 'upgraded' : 'downgraded',
    plan,
    interval,
    status: mapStripeStatus(updated.status),
    prorated: true,
    message,
  };
}

/**
 * Schedule cancel at period end (downgrade to Free without losing access immediately),
 * or cancel immediately if no Stripe subscription.
 */
export async function cancelToFreePlan(userId: string): Promise<{
  mode: 'canceled_now' | 'cancel_at_period_end';
  plan: string;
  status: string;
  currentPeriodEnd: Date | null;
  message: string;
}> {
  const stripe = getStripe();
  const sub = await prisma.subscription.findUnique({ where: { userId } });

  if (stripe && sub?.stripeSubscriptionId) {
    const updated = await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
    const periodEnd = periodEndFromSubscription(updated);
    await prisma.subscription.update({
      where: { userId },
      data: {
        cancelAtPeriodEnd: true,
        currentPeriodEnd: periodEnd,
        updatedAt: new Date(),
      },
    });
    await recordPaymentEvent({
      userId,
      type: 'CANCEL_SCHEDULED',
      plan: sub.plan,
      stripeObjectId: updated.id,
      description: 'Cancellation scheduled for end of billing period',
      meta: { currentPeriodEnd: periodEnd?.toISOString() },
    });
    return {
      mode: 'cancel_at_period_end',
      plan: sub.plan,
      status: sub.status,
      currentPeriodEnd: periodEnd,
      message: periodEnd
        ? `Your ${sub.plan} plan stays active until ${periodEnd.toLocaleDateString()}. Then you’ll move to Free.`
        : `Your plan will cancel at the end of the current billing period.`,
    };
  }

  await updateSubscriptionStatus(userId, 'FREE', 'CANCELED');
  return {
    mode: 'canceled_now',
    plan: 'FREE',
    status: 'CANCELED',
    currentPeriodEnd: null,
    message: 'Moved to Free plan.',
  };
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

/**
 * Fallback when webhooks are delayed/missing: read Checkout Session (or latest
 * active subscription) from Stripe and update the local subscription row.
 */
export async function syncSubscriptionFromStripe(
  userId: string,
  opts?: { sessionId?: string | null; planHint?: string | null }
): Promise<{
  synced: boolean;
  source: 'checkout_session' | 'customer_subscription' | 'already_active' | 'none';
  plan: string;
  status: string;
  webhookSeen: boolean;
}> {
  const stripe = getStripe();
  const sub = await prisma.subscription.findUnique({ where: { userId } });

  const recentWebhook = await prisma.paymentEvent.findFirst({
    where: {
      userId,
      OR: [{ type: 'WEBHOOK' }, { type: 'CHECKOUT_COMPLETED' }, { type: 'CHECKOUT_SYNC' }],
      createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
    },
    orderBy: { createdAt: 'desc' },
  });
  const webhookSeen = Boolean(
    recentWebhook &&
      (recentWebhook.type === 'WEBHOOK' || recentWebhook.type === 'CHECKOUT_COMPLETED')
  );

  if (!stripe) {
    return {
      synced: false,
      source: 'none',
      plan: sub?.plan || 'FREE',
      status: sub?.status || 'INACTIVE',
      webhookSeen,
    };
  }

  // Prefer the exact Checkout session from the success URL (handles upgrades PRO → ENTERPRISE)
  if (opts?.sessionId?.startsWith('cs_')) {
    try {
      const session = await stripe.checkout.sessions.retrieve(opts.sessionId, {
        expand: ['subscription'],
      });
      const metaUser = session.metadata?.propintelUserId;
      if (metaUser && metaUser !== userId) {
        throw new Error('Checkout session does not belong to this user');
      }

      const paid =
        session.status === 'complete' ||
        session.payment_status === 'paid' ||
        session.payment_status === 'no_payment_required';

      if (paid) {
        const plan = session.metadata?.plan || opts.planHint || 'PRO';
        const customerId =
          typeof session.customer === 'string' ? session.customer : undefined;
        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription && typeof session.subscription === 'object'
              ? session.subscription.id
              : undefined;

        // Cancel other active Stripe subscriptions so upgrades don't leave duplicates
        if (customerId && subscriptionId) {
          await cancelOtherActiveSubscriptions(stripe, customerId, subscriptionId);
        }

        const checkoutInterval =
          (session.metadata?.interval === 'year' || session.metadata?.interval === 'month'
            ? session.metadata.interval
            : null) ||
          (subscriptionId
            ? intervalFromStripeSub(
                await stripe.subscriptions.retrieve(subscriptionId)
              )
            : 'month');

        await updateSubscriptionStatus(userId, plan, 'ACTIVE', {
          customerId,
          subscriptionId,
          billingInterval: checkoutInterval,
        });

        const paymentIntentId =
          typeof session.payment_intent === 'string' ? session.payment_intent : null;

        const existingOrder = paymentIntentId
          ? await prisma.order.findFirst({
              where: { userId, stripePaymentId: paymentIntentId },
            })
          : await prisma.order.findFirst({
              where: {
                userId,
                plan,
                status: 'PAID',
                createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
              },
            });

        if (!existingOrder) {
          await prisma.order.create({
            data: {
              userId,
              amount: (session.amount_total || 0) / 100,
              plan,
              description: `${plan} plan subscription`,
              status: 'PAID',
              stripeInvoiceId: typeof session.invoice === 'string' ? session.invoice : null,
              stripePaymentId: paymentIntentId,
            },
          });
        }

        await recordPaymentEvent({
          userId,
          type: 'CHECKOUT_SYNC',
          amount: (session.amount_total || 0) / 100,
          plan,
          stripeObjectId: session.id,
          description: `${plan} subscription activated`,
          meta: { webhookSeen },
        });

        return {
          synced: true,
          source: 'checkout_session',
          plan,
          status: 'ACTIVE',
          webhookSeen,
        };
      }
    } catch (err) {
      void logError('Checkout session sync failed', err, {
        category: 'SYSTEM',
        meta: { userId, sessionId: opts.sessionId },
      });
    }
  }

  // Pick the newest active Stripe subscription (supports upgrades without session_id)
  const customerId = sub?.stripeCustomerId;
  if (customerId) {
    try {
      const list = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 10,
      });
      if (list.data.length > 0) {
        // Newest first
        const sorted = [...list.data].sort((a, b) => b.created - a.created);
        const active = sorted[0];
        const plan =
          active.metadata?.plan ||
          opts?.planHint ||
          (await inferPlanFromPriceId(active.items.data[0]?.price?.id)) ||
          sub?.plan ||
          'PRO';

        // Keep only the newest subscription
        await cancelOtherActiveSubscriptions(stripe, customerId, active.id);

        const billingInterval = intervalFromStripeSub(active);
        // Always write newest plan — do not bail early on existing PRO when ENTERPRISE exists
        if (
          sub?.plan !== plan ||
          sub?.status !== 'ACTIVE' ||
          sub?.stripeSubscriptionId !== active.id ||
          sub?.billingInterval !== billingInterval
        ) {
          await updateSubscriptionStatus(userId, plan, 'ACTIVE', {
            customerId,
            subscriptionId: active.id,
            currentPeriodEnd: periodEndFromSubscription(active),
            cancelAtPeriodEnd: Boolean(active.cancel_at_period_end),
            billingInterval,
          });
          await recordPaymentEvent({
            userId,
            type: 'CHECKOUT_SYNC',
            plan,
            stripeObjectId: active.id,
            description: `${plan} subscription activated`,
          });
        }

        return {
          synced: true,
          source: 'customer_subscription',
          plan,
          status: 'ACTIVE',
          webhookSeen,
        };
      }
    } catch (err) {
      void logError('Customer subscription sync failed', err, {
        category: 'SYSTEM',
        meta: { userId, customerId },
      });
    }
  }

  // Nothing newer on Stripe — keep local paid plan if already active
  if (sub?.status === 'ACTIVE' && sub.plan !== 'FREE') {
    return {
      synced: true,
      source: 'already_active',
      plan: sub.plan,
      status: sub.status,
      webhookSeen,
    };
  }

  const fresh = await prisma.subscription.findUnique({ where: { userId } });
  return {
    synced: false,
    source: 'none',
    plan: fresh?.plan || 'FREE',
    status: fresh?.status || 'INACTIVE',
    webhookSeen,
  };
}

async function inferPlanFromPriceId(priceId?: string | null): Promise<string | null> {
  if (!priceId) return null;
  const plan = await prisma.subscriptionPlan.findFirst({
    where: {
      OR: [{ stripePriceMonthly: priceId }, { stripePriceAnnual: priceId }],
    },
  });
  return plan?.code || null;
}

async function cancelOtherActiveSubscriptions(
  stripe: Stripe,
  customerId: string,
  keepSubscriptionId: string
) {
  try {
    const list = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 20,
    });
    for (const s of list.data) {
      if (s.id === keepSubscriptionId) continue;
      try {
        await stripe.subscriptions.cancel(s.id);
        void logInfo('Canceled duplicate Stripe subscription after upgrade', {
          canceled: s.id,
          kept: keepSubscriptionId,
          customerId,
        });
      } catch (err) {
        void logError('Failed to cancel duplicate subscription', err, {
          category: 'SYSTEM',
          meta: { subscriptionId: s.id },
        });
      }
    }
  } catch (err) {
    void logError('list/cancel duplicate subscriptions failed', err, {
      category: 'SYSTEM',
      meta: { customerId },
    });
  }
}

export async function updateSubscriptionStatus(
  userId: string,
  plan: string,
  status: string,
  stripeIds?: {
    customerId?: string;
    subscriptionId?: string;
    currentPeriodEnd?: Date | null;
    cancelAtPeriodEnd?: boolean;
    billingInterval?: 'month' | 'year' | string | null;
  }
): Promise<void> {
  const interval =
    stripeIds?.billingInterval === 'year' || stripeIds?.billingInterval === 'month'
      ? stripeIds.billingInterval
      : undefined;

  await prisma.subscription.upsert({
    where: { userId },
    update: {
      plan,
      status,
      ...(stripeIds?.customerId ? { stripeCustomerId: stripeIds.customerId } : {}),
      ...(stripeIds?.subscriptionId ? { stripeSubscriptionId: stripeIds.subscriptionId } : {}),
      ...(stripeIds?.currentPeriodEnd !== undefined
        ? { currentPeriodEnd: stripeIds.currentPeriodEnd }
        : {}),
      ...(stripeIds?.cancelAtPeriodEnd !== undefined
        ? { cancelAtPeriodEnd: stripeIds.cancelAtPeriodEnd }
        : {}),
      ...(interval ? { billingInterval: interval } : {}),
      updatedAt: new Date(),
    },
    create: {
      userId,
      plan,
      status,
      stripeCustomerId: stripeIds?.customerId,
      stripeSubscriptionId: stripeIds?.subscriptionId,
      currentPeriodEnd: stripeIds?.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: stripeIds?.cancelAtPeriodEnd ?? false,
      billingInterval: interval || 'month',
    },
  });

  await prisma.activityLog.create({
    data: {
      userId,
      action: 'UPDATE_SUBSCRIPTION',
      details: `Subscribed to ${plan} plan (Status: ${status}${interval ? `, ${interval}` : ''})`,
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
        const customerId = typeof session.customer === 'string' ? session.customer : undefined;
        const subscriptionId =
          typeof session.subscription === 'string' ? session.subscription : undefined;

        if (customerId && subscriptionId) {
          const stripe = getStripe();
          if (stripe) {
            await cancelOtherActiveSubscriptions(stripe, customerId, subscriptionId);
          }
        }

        let billingInterval: 'month' | 'year' =
          session.metadata?.interval === 'year' ? 'year' : 'month';
        if (subscriptionId) {
          const stripeClient = getStripe();
          if (stripeClient) {
            try {
              const remote = await stripeClient.subscriptions.retrieve(subscriptionId);
              billingInterval = intervalFromStripeSub(remote);
            } catch {
              // keep metadata interval
            }
          }
        }

        await updateSubscriptionStatus(userId, plan, 'ACTIVE', {
          customerId,
          subscriptionId,
          billingInterval,
        });

        const paymentIntentId =
          typeof session.payment_intent === 'string' ? session.payment_intent : null;
        const existingOrder = paymentIntentId
          ? await prisma.order.findFirst({ where: { userId, stripePaymentId: paymentIntentId } })
          : null;

        if (!existingOrder) {
          await prisma.order.create({
            data: {
              userId,
              amount: (session.amount_total || 0) / 100,
              plan,
              description: `${plan} plan subscription`,
              status: 'PAID',
              stripeInvoiceId: typeof session.invoice === 'string' ? session.invoice : null,
              stripePaymentId: paymentIntentId,
              receiptUrl: session.url,
            },
          });
        }

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
          await prisma.subscription.update({
            where: { userId: sub.userId },
            data: { status: 'ACTIVE' },
          });
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
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === 'string' ? subscription.customer : null;
      if (customerId) {
        const sub = await prisma.subscription.findFirst({
          where: { stripeCustomerId: customerId },
        });
        if (sub) {
          const plan =
            subscription.metadata?.plan ||
            (await inferPlanFromPriceId(subscription.items.data[0]?.price?.id)) ||
            sub.plan;
          const status = mapStripeStatus(subscription.status);
          await updateSubscriptionStatus(
            sub.userId,
            status === 'CANCELED' ? 'FREE' : plan,
            status === 'CANCELED' ? 'CANCELED' : status,
            {
              customerId,
              subscriptionId: subscription.id,
              currentPeriodEnd: periodEndFromSubscription(subscription),
              cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
              billingInterval: intervalFromStripeSub(subscription),
            }
          );
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
          await updateSubscriptionStatus(sub.userId, 'FREE', 'CANCELED', {
            customerId,
            subscriptionId: undefined,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
          });
          // Clear subscription id explicitly
          await prisma.subscription.update({
            where: { userId: sub.userId },
            data: { stripeSubscriptionId: null },
          });
        }
      }
      break;
    }
    default:
      void logInfo(`Unhandled Stripe event ${event.type}`, { id: event.id }, 'SYSTEM');
  }
}
