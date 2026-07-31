'use server';

import { prisma, withDbRetry } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';
import { revalidatePath } from 'next/cache';

const PLAN_PRICES: Record<string, number> = {
  FREE: 0,
  PRO: 49,
  ENTERPRISE: 99,
};

export async function getUserOrders() {
  const user = await requireAuth();

  const orders = await withDbRetry(() =>
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })
  );

  return { success: true, orders };
}

export async function recordPlanOrder(plan: 'FREE' | 'PRO' | 'ENTERPRISE') {
  const user = await requireAuth();
  const amount = PLAN_PRICES[plan] ?? 0;

  const order = await withDbRetry(() =>
    prisma.order.create({
      data: {
        userId: user.id,
        amount,
        plan,
        description: `${plan} Plan Monthly`,
        status: amount === 0 ? 'COMPLETED' : 'PAID',
        stripeInvoiceId: `inv_sim_${Math.random().toString(36).slice(2, 10)}`,
        receiptUrl: '#',
      },
    })
  );

  revalidatePath('/dashboard/billing');
  return { success: true, order };
}
