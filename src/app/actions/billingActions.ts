'use server';

import { prisma, withDbRetry } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';
import {
  cancelToFreePlan,
  changeSubscriptionPlan,
  createBillingPortalSession,
  createCheckoutSession,
  getStripe,
  isStripeConfigured,
  syncSubscriptionFromStripe,
  updateSubscriptionStatus,
} from '@/lib/services/stripe';
import { recordPlanOrder } from './orderActions';
import { ensureDefaultPlans } from './planActions';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

function appOriginFromHeaders(hdrs: Headers) {
  const host = hdrs.get('x-forwarded-host') || hdrs.get('host') || 'localhost:3000';
  const proto = hdrs.get('x-forwarded-proto') || 'http';
  return process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;
}

export async function switchUserPlan(planCode: string, interval: 'month' | 'year' = 'month') {
  const user = await requireAuth();
  await ensureDefaultPlans();

  const plan = await withDbRetry(() =>
    prisma.subscriptionPlan.findFirst({
      where: { code: planCode, isActive: true },
    })
  );
  if (!plan) {
    return { success: false as const, error: 'Plan not available' };
  }

  const existing = await prisma.subscription.findUnique({ where: { userId: user.id } });

  // Free — schedule cancel at period end when on Stripe; otherwise flip locally
  if (plan.priceMonthly === 0 || plan.code === 'FREE') {
    if (isStripeConfigured() && existing?.stripeSubscriptionId) {
      try {
        const result = await cancelToFreePlan(user.id);
        revalidatePath('/dashboard/billing');
        revalidatePath('/dashboard');
        const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
        return {
          success: true as const,
          subscription: subscription!,
          checkoutUrl: null as string | null,
          notice: result.message,
        };
      } catch (err) {
        return {
          success: false as const,
          error: err instanceof Error ? err.message : 'Could not schedule cancellation',
        };
      }
    }

    await updateSubscriptionStatus(user.id, plan.code, 'ACTIVE');
    await recordPlanOrder(plan.code);
    revalidatePath('/dashboard/billing');
    const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
    return { success: true as const, subscription: subscription!, checkoutUrl: null as string | null };
  }

  if (isStripeConfigured()) {
    const hdrs = await headers();
    const origin = appOriginFromHeaders(hdrs);

    // Existing paid Stripe sub → in-place prorated change (no second full charge)
    if (existing?.stripeSubscriptionId && existing.status !== 'CANCELED') {
      try {
        const result = await changeSubscriptionPlan(user.id, plan.code, interval);
        revalidatePath('/dashboard/billing');
        revalidatePath('/dashboard');
        const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
        return {
          success: true as const,
          subscription: subscription!,
          checkoutUrl: null as string | null,
          notice: result.message,
          prorated: result.prorated,
        };
      } catch (err) {
        // Fall through to Checkout if update fails (e.g. incomplete sub)
        const message = err instanceof Error ? err.message : 'Plan change failed';
        if (!message.includes('No active Stripe subscription')) {
          return { success: false as const, error: message };
        }
      }
    }

    // First paid subscription → Stripe Checkout
    try {
      const checkoutUrl = await createCheckoutSession(
        user.id,
        plan.code,
        origin,
        user.email,
        user.name,
        interval
      );
      return { success: true as const, subscription: null, checkoutUrl };
    } catch (err) {
      return {
        success: false as const,
        error: err instanceof Error ? err.message : 'Checkout failed',
      };
    }
  }

  // Dev fallback when Stripe keys missing
  await updateSubscriptionStatus(user.id, plan.code, 'ACTIVE');
  await recordPlanOrder(plan.code);
  revalidatePath('/dashboard/billing');
  const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
  return {
    success: true as const,
    subscription: subscription!,
    checkoutUrl: null as string | null,
    warning:
      'Stripe keys are not set — plan was activated locally for development. Add STRIPE_SECRET_KEY to enable live Checkout.',
  };
}

export async function openBillingPortal() {
  const user = await requireAuth();
  if (!isStripeConfigured()) {
    return { success: false as const, error: 'Stripe is not configured yet.' };
  }
  const hdrs = await headers();
  const origin = appOriginFromHeaders(hdrs);

  try {
    const url = await createBillingPortalSession(user.id, origin);
    return { success: true as const, url };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : 'Could not open billing portal',
    };
  }
}

export async function getUserSubscriptionDetails() {
  const user = await requireAuth();
  await ensureDefaultPlans();

  let sub = await prisma.subscription.findUnique({
    where: { userId: user.id },
  });

  // Soft-refresh period/status/interval from Stripe when we have a subscription id
  const stripe = getStripe();
  if (stripe && sub?.stripeSubscriptionId) {
    try {
      const remote = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
      const remoteObj = remote as unknown as { current_period_end?: number };
      const end =
        typeof remoteObj.current_period_end === 'number'
          ? new Date(remoteObj.current_period_end * 1000)
          : null;
      const status =
        remote.status === 'active'
          ? 'ACTIVE'
          : remote.status === 'past_due' || remote.status === 'unpaid'
            ? 'PAST_DUE'
            : remote.status === 'canceled'
              ? 'CANCELED'
              : remote.status === 'trialing'
                ? 'TRIALING'
                : sub.status;
      const plan =
        remote.status === 'canceled'
          ? 'FREE'
          : remote.metadata?.plan || sub.plan;
      const metaInterval = remote.metadata?.interval;
      const recurring = remote.items.data[0]?.price?.recurring?.interval;
      const billingInterval: 'month' | 'year' =
        metaInterval === 'year' || metaInterval === 'month'
          ? metaInterval
          : recurring === 'year'
            ? 'year'
            : 'month';

      sub = await prisma.subscription.update({
        where: { userId: user.id },
        data: {
          plan,
          status: remote.status === 'canceled' ? 'CANCELED' : status,
          currentPeriodEnd: end,
          cancelAtPeriodEnd: Boolean(remote.cancel_at_period_end),
          billingInterval,
          ...(remote.status === 'canceled' ? { stripeSubscriptionId: null } : {}),
        },
      });
    } catch {
      // Stripe retrieve failed — keep local row
    }
  }

  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  const billingInterval =
    sub?.billingInterval === 'year' ? ('year' as const) : ('month' as const);

  return {
    plan: sub?.plan || 'FREE',
    status: sub?.status || 'INACTIVE',
    isPro: sub?.status === 'ACTIVE' && sub?.plan !== 'FREE',
    plans,
    stripeConfigured: isStripeConfigured(),
    hasStripeCustomer: Boolean(sub?.stripeCustomerId),
    stripeCustomerId: sub?.stripeCustomerId || null,
    currentPeriodEnd: sub?.currentPeriodEnd?.toISOString() || null,
    cancelAtPeriodEnd: Boolean(sub?.cancelAtPeriodEnd),
    billingInterval,
  };
}

/**
 * Called after Checkout success URL — confirms plan via webhook race OR Stripe API fallback.
 */
export async function confirmCheckoutAction(input?: {
  sessionId?: string | null;
  planHint?: string | null;
}) {
  const user = await requireAuth();

  const result = await syncSubscriptionFromStripe(user.id, {
    sessionId: input?.sessionId,
    planHint: input?.planHint,
  });

  revalidatePath('/dashboard/billing');
  revalidatePath('/dashboard');

  return {
    success: true as const,
    ...result,
    stripeConfigured: isStripeConfigured(),
  };
}
