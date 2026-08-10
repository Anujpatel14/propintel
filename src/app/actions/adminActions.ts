'use server';

import { sumMrr } from '@/lib/billingMetrics';
import { getCoachingExpertDelegate, prisma } from '@/lib/db';
import { requireAdminAccess } from '@/lib/requireAdminAccess';
import { Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  return requireAdminAccess();
}

export async function getAdminDashboardMetrics() {
  await requireAdmin();

  const totalUsers = await prisma.user.count();
  const activeSubs = await prisma.subscription.findMany({
    where: { status: 'ACTIVE', plan: { not: 'FREE' } },
    select: { plan: true, billingInterval: true },
  });
  const plans = await prisma.subscriptionPlan.findMany({
    select: { code: true, priceMonthly: true, priceAnnual: true },
  });
  const mrr = sumMrr(activeSubs, plans);
  const totalAnalyses = await prisma.propertyAnalysis.count();
  const totalDeals = await prisma.dealPipeline.count();
  const totalAiRequests = await prisma.activityLog.count({
    where: { action: { in: ['CREATE_ANALYSIS', 'CREATE_FLIP_ANALYSIS'] } },
  });

  const coachingExpert = getCoachingExpertDelegate();

  const [pendingCoaching, activeExperts, investorCount, suspendedUsers] = await Promise.all([
    prisma.coaching.count({ where: { status: 'PENDING' } }),
    coachingExpert ? coachingExpert.count({ where: { isActive: true } } as never) : Promise.resolve(0),
    prisma.user.count({ where: { role: 'INVESTOR' } }),
    prisma.user.count({ where: { status: 'SUSPENDED' } }),
  ]);

  const recentLogs = await prisma.activityLog.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { email: true, name: true },
      },
    },
  });

  return {
    success: true,
    metrics: {
      totalUsers,
      investorCount,
      suspendedUsers,
      activeSubscribers: activeSubs.length,
      mrr,
      totalAnalyses,
      totalDeals,
      totalAiRequests,
      pendingCoaching,
      activeExperts,
    },
    recentLogs,
  };
}

export async function getUsersList() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    include: {
      profile: true,
      subscription: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return { success: true, users };
}

export async function updateUserRole(userId: string, role: Role) {
  await requireAdmin();

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  revalidatePath('/admin');
  revalidatePath('/admin/users');
  return { success: true, user: updatedUser };
}
