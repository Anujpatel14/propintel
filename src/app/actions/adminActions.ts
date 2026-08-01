'use server';

import { sumMrr } from '@/lib/billingMetrics';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';
import { Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== 'ADMIN') {
    throw new Error('Access denied. Administrator privileges required.');
  }
  return user;
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
      activeSubscribers: activeSubs.length,
      mrr,
      totalAnalyses,
      totalDeals,
      totalAiRequests,
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
  return { success: true, user: updatedUser };
}
