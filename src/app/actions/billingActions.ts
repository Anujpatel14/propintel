'use server';

import { prisma, withDbRetry } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';
import {
  createBillingPortalSession,
  createCheckoutSession,
  isStripeConfigured,
  updateSubscriptionStatus,
} from '@/lib/services/stripe';
import { recordPlanOrder } from './orderActions';
import { ensureDefaultPlans } from './planActions';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

export async function switchUserPlan(planCode: string) {
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

  // Free plan — no Stripe checkout
  if (plan.priceMonthly === 0 || plan.code === 'FREE') {
    await updateSubscriptionStatus(user.id, plan.code, 'ACTIVE');
    await recordPlanOrder(plan.code);
    revalidatePath('/dashboard/billing');
    const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
    return { success: true as const, subscription: subscription!, checkoutUrl: null as string | null };
  }

  // Paid plan with Stripe configured → Checkout
  if (isStripeConfigured()) {
    const hdrs = await headers();
    const host = hdrs.get('x-forwarded-host') || hdrs.get('host') || 'localhost:3000';
    const proto = hdrs.get('x-forwarded-proto') || 'http';
    const origin = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;

    try {
      const checkoutUrl = await createCheckoutSession(
        user.id,
        plan.code,
        origin,
        user.email,
        user.name
      );
      return { success: true as const, subscription: null, checkoutUrl };
    } catch (err) {
      return {
        success: false as const,
        error: err instanceof Error ? err.message : 'Checkout failed',
      };
    }
  }

  // Dev fallback when Stripe keys missing — local assign + order (admin still sees it)
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
  const host = hdrs.get('x-forwarded-host') || hdrs.get('host') || 'localhost:3000';
  const proto = hdrs.get('x-forwarded-proto') || 'http';
  const origin = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;

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

  const sub = await prisma.subscription.findUnique({
    where: { userId: user.id },
  });

  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  return {
    plan: sub?.plan || 'FREE',
    status: sub?.status || 'INACTIVE',
    isPro: sub?.status === 'ACTIVE' && sub?.plan !== 'FREE',
    plans,
    stripeConfigured: isStripeConfigured(),
    hasStripeCustomer: Boolean(sub?.stripeCustomerId),
  };
}
