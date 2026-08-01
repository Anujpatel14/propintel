'use server';

import { prisma, withDbRetry } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== 'ADMIN') {
    throw new Error('Access denied. Administrator privileges required.');
  }
  return user;
}

const DEFAULT_PLANS = [
  {
    code: 'FREE',
    name: 'Free Starter',
    priceMonthly: 0,
    priceAnnual: 0,
    blurb: 'Limits property analysis archives to 3 saved deals. No AI tools or CRM boards.',
    features: '3 saved deals\nBasic calculator\nEmail support',
    sortOrder: 0,
  },
  {
    code: 'PRO',
    name: 'Professional',
    priceMonthly: 49,
    priceAnnual: 470,
    blurb: 'Unlimited property lookups, AI deal reports, and CRM pipeline access.',
    features: 'Unlimited analyses\nAI insights\nCRM pipeline\nPDF exports',
    sortOrder: 1,
  },
  {
    code: 'ENTERPRISE',
    name: 'Enterprise',
    priceMonthly: 99,
    priceAnnual: 950,
    blurb: 'Multi-agent accounts, custom report branding, and API endpoints for funds.',
    features: 'Everything in Pro\nTeam seats\nCustom branding\nAPI access\nPriority coaching',
    sortOrder: 2,
  },
];

/** Ensure default plans exist (idempotent). */
export async function ensureDefaultPlans() {
  for (const plan of DEFAULT_PLANS) {
    await withDbRetry(() =>
      prisma.subscriptionPlan.upsert({
        where: { code: plan.code },
        create: plan,
        update: {},
      })
    );
  }
}

export async function getSubscriptionPlans(activeOnly = false) {
  await ensureDefaultPlans();
  const plans = await withDbRetry(() =>
    prisma.subscriptionPlan.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { sortOrder: 'asc' },
    })
  );
  return { success: true as const, plans };
}

export async function getAdminPlansAndSubscribers() {
  await requireAdmin();
  await ensureDefaultPlans();

  const [plans, subscriptions, orders] = await Promise.all([
    withDbRetry(() =>
      prisma.subscriptionPlan.findMany({ orderBy: { sortOrder: 'asc' } })
    ),
    withDbRetry(() =>
      prisma.subscription.findMany({
        include: { user: { select: { id: true, email: true, name: true } } },
        orderBy: { updatedAt: 'desc' },
      })
    ),
    withDbRetry(() =>
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
    ),
  ]);

  const activePaid = subscriptions.filter(
    (s) => s.status === 'ACTIVE' && s.plan !== 'FREE'
  );
  const planPrice = Object.fromEntries(plans.map((p) => [p.code, p.priceMonthly]));
  const mrr = activePaid.reduce((sum, s) => sum + (planPrice[s.plan] ?? 0), 0);

  return {
    success: true as const,
    plans,
    subscriptions,
    orders,
    metrics: {
      mrr,
      arr: mrr * 12,
      totalSubscribers: activePaid.length,
      totalUsers: subscriptions.length,
      failedPayments: orders.filter((o) => o.status === 'FAILED').length,
      churnRate:
        subscriptions.length === 0
          ? 0
          : Math.round(
              (subscriptions.filter((s) => s.status === 'CANCELED').length /
                subscriptions.length) *
                100
            ),
    },
  };
}

export async function upsertSubscriptionPlan(data: {
  id?: string;
  code: string;
  name: string;
  priceMonthly: number;
  priceAnnual?: number | null;
  blurb?: string;
  features?: string;
  isActive?: boolean;
  sortOrder?: number;
  stripePriceMonthly?: string;
  stripePriceAnnual?: string;
}) {
  await requireAdmin();

  const code = data.code.trim().toUpperCase().replace(/\s+/g, '_');
  if (!code) return { success: false as const, error: 'Plan code is required' };

  const payload = {
    code,
    name: data.name.trim(),
    priceMonthly: Number(data.priceMonthly) || 0,
    priceAnnual: data.priceAnnual == null ? null : Number(data.priceAnnual),
    blurb: data.blurb?.trim() || null,
    features: data.features?.trim() || null,
    isActive: data.isActive ?? true,
    sortOrder: data.sortOrder ?? 0,
    stripePriceMonthly: data.stripePriceMonthly?.trim() || null,
    stripePriceAnnual: data.stripePriceAnnual?.trim() || null,
  };

  const plan = await withDbRetry(() =>
    data.id
      ? prisma.subscriptionPlan.update({ where: { id: data.id }, data: payload })
      : prisma.subscriptionPlan.upsert({
          where: { code },
          create: payload,
          update: payload,
        })
  );

  revalidatePath('/admin/subscriptions');
  revalidatePath('/dashboard/billing');
  return { success: true as const, plan };
}

export async function deleteSubscriptionPlan(id: string) {
  await requireAdmin();

  const plan = await withDbRetry(() =>
    prisma.subscriptionPlan.findUnique({ where: { id } })
  );
  if (!plan) return { success: false as const, error: 'Plan not found' };

  if (['FREE', 'PRO', 'ENTERPRISE'].includes(plan.code)) {
    // Soft-disable core plans instead of deleting
    await withDbRetry(() =>
      prisma.subscriptionPlan.update({
        where: { id },
        data: { isActive: false },
      })
    );
  } else {
    const inUse = await withDbRetry(() =>
      prisma.subscription.count({ where: { plan: plan.code } })
    );
    if (inUse > 0) {
      await withDbRetry(() =>
        prisma.subscriptionPlan.update({
          where: { id },
          data: { isActive: false },
        })
      );
    } else {
      await withDbRetry(() => prisma.subscriptionPlan.delete({ where: { id } }));
    }
  }

  revalidatePath('/admin/subscriptions');
  revalidatePath('/dashboard/billing');
  return { success: true as const };
}

export async function adminAssignUserPlan(
  userId: string,
  planCode: string,
  status: string = 'ACTIVE'
) {
  await requireAdmin();

  const plan = await withDbRetry(() =>
    prisma.subscriptionPlan.findUnique({ where: { code: planCode } })
  );
  if (!plan || !plan.isActive) {
    return { success: false as const, error: 'Plan not found or inactive' };
  }

  const subscription = await withDbRetry(() =>
    prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan: plan.code,
        status,
      },
      update: {
        plan: plan.code,
        status,
      },
    })
  );

  await withDbRetry(() =>
    prisma.activityLog.create({
      data: {
        userId,
        action: 'ADMIN_ASSIGN_PLAN',
        details: `Admin assigned ${plan.code} (${status})`,
      },
    })
  );

  revalidatePath('/admin/subscriptions');
  revalidatePath('/admin/users');
  return { success: true as const, subscription };
}
