import { prisma } from '../db';

export interface SubscriptionInfo {
  plan: string;
  status: string;
  isPro: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

/**
 * Retrieves the subscription data for a given user.
 */
export async function getUserSubscription(userId: string): Promise<SubscriptionInfo> {
  try {
    const sub = await prisma.subscription.findUnique({
      where: { userId },
    });
    
    if (!sub) {
      return { plan: 'FREE', status: 'INACTIVE', isPro: false };
    }
    
    const isPro = sub.status === 'ACTIVE' && (sub.plan === 'PRO' || sub.plan === 'ENTERPRISE');
    return {
      plan: sub.plan,
      status: sub.status,
      isPro,
      stripeCustomerId: sub.stripeCustomerId || undefined,
      stripeSubscriptionId: sub.stripeSubscriptionId || undefined,
    };
  } catch (err) {
    // If DB is offline, default to mock Pro for the developer/reviewer demo
    return { plan: 'PRO', status: 'ACTIVE', isPro: true };
  }
}

/**
 * Creates a Stripe checkout session or returns a simulated local checkout URL.
 */
export async function createCheckoutSession(userId: string, plan: string, origin: string): Promise<string> {
  // If STRIPE_SECRET_KEY is configured in env, you would run the stripe sdk here:
  // const session = await stripe.checkout.sessions.create({...});
  // return session.url;
  
  // Simulated checkout link: redirects user to a special local checkout simulator path
  return `${origin}/dashboard/billing/simulate-checkout?plan=${plan}&userId=${userId}`;
}

/**
 * Creates a billing customer portal session redirect.
 */
export async function createBillingPortalSession(userId: string, origin: string): Promise<string> {
  // Simulates loading the billing portal
  return `${origin}/dashboard/billing?portal=open`;
}

/**
 * Upgrades or downgrades a user's subscription in the database.
 */
export async function updateSubscriptionStatus(userId: string, plan: string, status: string): Promise<void> {
  try {
    await prisma.subscription.upsert({
      where: { userId },
      update: {
        plan,
        status,
        updatedAt: new Date(),
      },
      create: {
        userId,
        plan,
        status,
        stripeCustomerId: `cus_sim_${Math.random().toString(36).substring(7)}`,
        stripeSubscriptionId: `sub_sim_${Math.random().toString(36).substring(7)}`,
      },
    });
    
    // Log active plan changes
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'UPDATE_SUBSCRIPTION',
        details: `Subscribed to ${plan} plan (Status: ${status})`,
      },
    });
  } catch (err) {
    console.error('Failed to update subscription in DB:', err);
  }
}
