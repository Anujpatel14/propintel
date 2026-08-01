'use server';

import { prisma, withDbRetry } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';
import { ensureDefaultPlans } from './planActions';

export async function recordPlanOrder(planCode: string) {
  const user = await requireAuth();
  await ensureDefaultPlans();

  const catalog = await withDbRetry(() =>
    prisma.subscriptionPlan.findUnique({ where: { code: planCode } })
  );
  const amount = catalog?.priceMonthly ?? 0;

  const order = await withDbRetry(() =>
    prisma.order.create({
      data: {
        userId: user.id,
        amount,
        plan: planCode,
        description: `${catalog?.name || planCode} Plan Monthly`,
        status: 'COMPLETED',
        receiptUrl: `/dashboard/billing?receipt=${Date.now()}`,
      },
    })
  );

  return { success: true as const, order };
}

export async function getUserOrders() {
  const user = await requireAuth();

  const orders = await withDbRetry(() =>
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })
  );

  return { success: true as const, orders };
}
