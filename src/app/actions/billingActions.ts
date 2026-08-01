'use server';

import { prisma, withDbRetry } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';
import { revalidatePath } from 'next/cache';
import { recordPlanOrder } from './orderActions';

export async function switchUserPlan(plan: 'FREE' | 'PRO' | 'ENTERPRISE') {
  const user = await requireAuth();

  const subscription = await withDbRetry(() =>
    prisma.subscription.upsert({
      where: { userId: user.id },
      update: {
        plan,
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        plan,
        status: 'ACTIVE',
        stripeCustomerId: `cus_sim_${Math.random().toString(36).substring(7)}`,
        stripeSubscriptionId: `sub_sim_${Math.random().toString(36).substring(7)}`,
      },
    })
  );

  await withDbRetry(() =>
    prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_SUBSCRIPTION',
        details: `Switched plan to ${plan} (Status: ACTIVE)`,
      },
    })
  );

  await recordPlanOrder(plan);

  revalidatePath('/dashboard/billing');
  revalidatePath('/dashboard');
  return { success: true, subscription };
}

export async function getUserSubscriptionDetails() {
  const user = await requireAuth();

  const sub = await prisma.subscription.findUnique({
    where: { userId: user.id },
  });

  return {
    plan: sub?.plan || 'FREE',
    status: sub?.status || 'INACTIVE',
    isPro: sub?.status === 'ACTIVE' && (sub?.plan === 'PRO' || sub?.plan === 'ENTERPRISE'),
  };
}
