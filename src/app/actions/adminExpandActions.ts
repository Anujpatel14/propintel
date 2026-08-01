'use server';

import { prisma, withDbRetry } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';
import { Role, Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== 'ADMIN') {
    throw new Error('Access denied. Administrator privileges required.');
  }
  return user;
}

export async function getAdminUsers(filters?: {
  search?: string;
  role?: string;
  plan?: string;
  status?: string;
}) {
  await requireAdmin();

  const where: Prisma.UserWhereInput = {};

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
      { profile: { company: { contains: filters.search, mode: 'insensitive' } } },
    ];
  }
  if (filters?.role && (filters.role === 'INVESTOR' || filters.role === 'ADMIN')) {
    where.role = filters.role;
  }
  if (filters?.status) {
    where.status = filters.status;
  }
  if (filters?.plan) {
    where.subscription = { plan: filters.plan };
  }

  const users = await withDbRetry(() =>
    prisma.user.findMany({
      where,
      include: {
        profile: true,
        subscription: true,
        _count: {
          select: {
            propertyAnalyses: true,
            flipAnalyses: true,
            deals: true,
            activities: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  );

  return { success: true, users };
}

export async function updateUserStatus(userId: string, status: 'ACTIVE' | 'SUSPENDED') {
  await requireAdmin();

  const user = await withDbRetry(() =>
    prisma.user.update({
      where: { id: userId },
      data: { status },
    })
  );

  revalidatePath('/admin/users');
  revalidatePath('/admin');
  return { success: true, user };
}

export async function getAdminRevenueMetrics() {
  await requireAdmin();

  const [activeSubs, orders, failedOrders, totalUsers] = await withDbRetry(async () => {
    const active = await prisma.subscription.findMany({
      where: { status: 'ACTIVE', plan: { in: ['PRO', 'ENTERPRISE'] } },
    });
    const allOrders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
    const failed = await prisma.order.count({ where: { status: 'FAILED' } });
    const users = await prisma.user.count();
    return [active, allOrders, failed, users] as const;
  });

  const mrr = activeSubs.reduce((sum, s) => sum + (s.plan === 'ENTERPRISE' ? 99 : 49), 0);
  const arr = mrr * 12;
  const paidOrders = orders.filter((o) => o.status === 'PAID' || o.status === 'COMPLETED');
  const churnRate = totalUsers > 0 ? Math.round((failedOrders / totalUsers) * 1000) / 10 : 0;

  return {
    success: true,
    metrics: {
      mrr,
      arr,
      totalSubscribers: activeSubs.length,
      churnRate,
      failedPayments: failedOrders,
      totalRevenue: paidOrders.reduce((s, o) => s + o.amount, 0),
    },
    orders,
  };
}

export async function getAdminDealIntelligence() {
  await requireAdmin();

  const analyses = await withDbRetry(() =>
    prisma.propertyAnalysis.findMany({
      select: {
        city: true,
        state: true,
        zip: true,
        purchasePrice: true,
        capRate: true,
        roi: true,
        cashFlow: true,
      },
    })
  );

  const marketMap = new Map<string, { count: number; capSum: number; roiSum: number; volume: number }>();
  for (const a of analyses) {
    const key = `${a.city || 'Unknown'}, ${a.state || '—'}`;
    const prev = marketMap.get(key) || { count: 0, capSum: 0, roiSum: 0, volume: 0 };
    prev.count += 1;
    prev.capSum += a.capRate || 0;
    prev.roiSum += a.roi || 0;
    prev.volume += a.purchasePrice || 0;
    marketMap.set(key, prev);
  }

  const topMarkets = Array.from(marketMap.entries())
    .map(([market, data]) => ({
      market,
      deals: data.count,
      avgCapRate: data.count ? data.capSum / data.count : 0,
      avgRoi: data.count ? data.roiSum / data.count : 0,
      volume: data.volume,
    }))
    .sort((a, b) => b.deals - a.deals)
    .slice(0, 10);

  const totalVolume = analyses.reduce((s, a) => s + (a.purchasePrice || 0), 0);
  const avgCap =
    analyses.length > 0
      ? analyses.reduce((s, a) => s + (a.capRate || 0), 0) / analyses.length
      : 0;

  return {
    success: true,
    totalAnalyses: analyses.length,
    totalVolume,
    avgCapRate: avgCap,
    topMarkets,
  };
}

export async function getAdminApiUsage() {
  await requireAdmin();

  const [aiLogs, analysisCount, lookupHint] = await withDbRetry(async () => {
    const logs = await prisma.activityLog.findMany({
      where: {
        action: {
          in: ['CREATE_ANALYSIS', 'CREATE_FLIP_ANALYSIS', 'AI_VERDICT', 'PROPERTY_LOOKUP'],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { email: true, name: true } } },
    });
    const analyses = await prisma.propertyAnalysis.count();
    const lookups = await prisma.activityLog.count({
      where: { action: 'PROPERTY_LOOKUP' },
    });
    return [logs, analyses, lookups] as const;
  });

  const estimatedTokens = analysisCount * 850;
  const estimatedCost = Math.round((estimatedTokens / 1_000_000) * 0.15 * 100) / 100;

  return {
    success: true,
    metrics: {
      totalAiRequests: aiLogs.length,
      totalAnalyses: analysisCount,
      estimatedTokens,
      estimatedCost,
      avgLatencyMs: 420,
      propertyLookups: lookupHint,
      fallbackRate: 92,
      model: 'gpt-4o-mini',
    },
    recentLogs: aiLogs,
  };
}

export async function getCmsContent(type?: string) {
  await requireAdmin();

  const items = await withDbRetry(() =>
    prisma.cMSContent.findMany({
      where: type ? { type } : undefined,
      orderBy: { updatedAt: 'desc' },
    })
  );

  return { success: true, items };
}

export async function upsertCmsContent(input: {
  id?: string;
  type: string;
  key?: string;
  data: Prisma.InputJsonValue;
}) {
  await requireAdmin();

  const item = await withDbRetry(async () => {
    if (input.id) {
      return prisma.cMSContent.update({
        where: { id: input.id },
        data: { type: input.type, key: input.key, data: input.data },
      });
    }
    return prisma.cMSContent.create({
      data: { type: input.type, key: input.key, data: input.data },
    });
  });

  revalidatePath('/admin/cms');
  return { success: true, item };
}

export async function deleteCmsContent(id: string) {
  await requireAdmin();

  await withDbRetry(() => prisma.cMSContent.delete({ where: { id } }));
  revalidatePath('/admin/cms');
  return { success: true };
}

export async function getAdminCoachingSessions() {
  await requireAdmin();

  const sessions = await withDbRetry(() =>
    prisma.coaching.findMany({
      include: { user: { select: { email: true, name: true } } },
      orderBy: { bookingDate: 'desc' },
    })
  );

  return { success: true, sessions };
}

export async function updateAdminCoachingSession(
  id: string,
  data: { status?: string; meetingLink?: string; coachName?: string; notes?: string }
) {
  await requireAdmin();

  const session = await withDbRetry(() =>
    prisma.coaching.update({
      where: { id },
      data,
    })
  );

  revalidatePath('/admin/coaching');
  return { success: true, session };
}

export async function getAdminAuditLogs() {
  await requireAdmin();

  const logs = await withDbRetry(() =>
    prisma.activityLog.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true, name: true } } },
    })
  );

  return { success: true, logs };
}
