'use server';

import { prisma, requireCoachingExpertDelegate, withDbRetry } from '@/lib/db';
import { requireAdminAccess } from '@/lib/requireAdminAccess';
import { Role, Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { sumMrr } from '@/lib/billingMetrics';

async function requireAdmin() {
  return requireAdminAccess();
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

  const [activeSubs, orders, failedOrders, plans] = await withDbRetry(async () => {
    const active = await prisma.subscription.findMany({
      where: { status: 'ACTIVE', plan: { not: 'FREE' } },
    });
    const allOrders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
    const failed = await prisma.order.count({ where: { status: 'FAILED' } });
    const planRows = await prisma.subscriptionPlan.findMany();
    return [active, allOrders, failed, planRows] as const;
  });

  const mrr = sumMrr(activeSubs, plans);
  const arr = Math.round(mrr * 12 * 100) / 100;
  const paidOrders = orders.filter((o) => o.status === 'PAID' || o.status === 'COMPLETED');
  const canceled = await withDbRetry(() =>
    prisma.subscription.count({ where: { status: 'CANCELED' } })
  );
  const subTotal = activeSubs.length + canceled;
  const churnRate =
    subTotal > 0 ? Math.round((canceled / subTotal) * 1000) / 10 : 0;

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
      take: 5,
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
  const totalLogged = await withDbRetry(() =>
    prisma.activityLog.count({
      where: {
        action: {
          in: ['CREATE_ANALYSIS', 'CREATE_FLIP_ANALYSIS', 'AI_VERDICT', 'PROPERTY_LOOKUP'],
        },
      },
    })
  );
  const aiVerdicts = await withDbRetry(() =>
    prisma.activityLog.count({ where: { action: 'AI_VERDICT' } })
  );
  const aiShare =
    totalLogged > 0 ? Math.round((aiVerdicts / totalLogged) * 1000) / 10 : 0;

  return {
    success: true,
    metrics: {
      totalAiRequests: totalLogged,
      totalAnalyses: analysisCount,
      estimatedTokens,
      estimatedCost,
      avgLatencyMs: null as number | null,
      propertyLookups: lookupHint,
      fallbackRate: aiShare,
      model: process.env.OPENROUTER_MODEL || 'openrouter/free',
    },
    recentLogs: aiLogs,
  };
}

const AI_ACTIVITY_ACTIONS = [
  'CREATE_ANALYSIS',
  'CREATE_FLIP_ANALYSIS',
  'AI_VERDICT',
  'PROPERTY_LOOKUP',
] as const;

export async function getAdminAiActivity(filters?: {
  search?: string;
  action?: string;
  from?: string;
  to?: string;
  take?: number;
}) {
  await requireAdmin();

  const take = Math.min(Math.max(filters?.take ?? 100, 1), 500);
  const where: Prisma.ActivityLogWhereInput = {
    action: {
      in: [...AI_ACTIVITY_ACTIONS],
    },
  };

  if (filters?.action && AI_ACTIVITY_ACTIONS.includes(filters.action as (typeof AI_ACTIVITY_ACTIONS)[number])) {
    where.action = filters.action;
  }

  if (filters?.from || filters?.to) {
    where.createdAt = {};
    if (filters.from) {
      const from = new Date(filters.from);
      from.setHours(0, 0, 0, 0);
      where.createdAt.gte = from;
    }
    if (filters.to) {
      const to = new Date(filters.to);
      to.setHours(23, 59, 59, 999);
      where.createdAt.lte = to;
    }
  }

  const search = filters?.search?.trim();
  if (search) {
    where.OR = [
      { details: { contains: search, mode: 'insensitive' } },
      { action: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [logs, total] = await withDbRetry(async () => {
    const rows = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      include: { user: { select: { email: true, name: true } } },
    });
    const count = await prisma.activityLog.count({ where });
    return [rows, count] as const;
  });

  return {
    success: true as const,
    logs,
    total,
    actions: [...AI_ACTIVITY_ACTIONS],
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
  revalidatePath('/');
  revalidatePath('/dashboard/help');
  return { success: true, item };
}

export async function deleteCmsContent(id: string) {
  await requireAdmin();

  await withDbRetry(() => prisma.cMSContent.delete({ where: { id } }));
  revalidatePath('/admin/cms');
  revalidatePath('/');
  revalidatePath('/dashboard/help');
  return { success: true };
}

export async function getAdminCoachingSessions() {
  await requireAdmin();

  // Expire past-day sessions before listing
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  await withDbRetry(() =>
    prisma.coaching.updateMany({
      where: {
        status: { in: ['PENDING', 'CONFIRMED'] },
        bookingDate: { lt: start },
      },
      data: { status: 'EXPIRED' },
    })
  );

  const sessions = await withDbRetry(() =>
    prisma.coaching.findMany({
      include: {
        user: { select: { email: true, name: true } },
        expert: { select: { id: true, name: true, specialty: true } },
      },
      orderBy: { bookingDate: 'desc' },
    })
  );

  return { success: true, sessions };
}

export async function updateAdminCoachingSession(
  id: string,
  data: {
    status?: string;
    meetingLink?: string;
    coachName?: string;
    notes?: string;
    expertId?: string | null;
  }
) {
  await requireAdmin();

  let coachName = data.coachName;
  if (data.expertId) {
    const expert = await withDbRetry(() =>
      requireCoachingExpertDelegate().findUnique({ where: { id: data.expertId! } } as never)
    );
    if (expert) coachName = expert.name;
  }

  const session = await withDbRetry(() =>
    prisma.coaching.update({
      where: { id },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.meetingLink !== undefined ? { meetingLink: data.meetingLink } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(coachName !== undefined ? { coachName } : {}),
        ...(data.expertId !== undefined ? { expertId: data.expertId } : {}),
      },
    })
  );

  revalidatePath('/admin/coaching');
  revalidatePath('/dashboard/coaching');
  return { success: true, session };
}

export async function listAdminCoachingExperts() {
  await requireAdmin();
  const experts = await withDbRetry(() =>
    requireCoachingExpertDelegate().findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { bookings: true } } },
    } as never)
  );
  return { success: true as const, experts };
}

export async function createAdminCoachingExpert(input: {
  name: string;
  specialty?: string;
  bio?: string;
  avatarInitial?: string;
  isActive?: boolean;
  sortOrder?: number;
}) {
  await requireAdmin();
  const name = input.name.trim();
  if (!name) return { success: false as const, error: 'Name is required' };

  const expert = await withDbRetry(() =>
    requireCoachingExpertDelegate().create({
      data: {
        name,
        specialty: input.specialty?.trim() || null,
        bio: input.bio?.trim() || null,
        avatarInitial:
          input.avatarInitial?.trim().slice(0, 2).toUpperCase() ||
          name.charAt(0).toUpperCase(),
        isActive: input.isActive !== false,
        sortOrder: input.sortOrder ?? 0,
      },
    } as never)
  );

  revalidatePath('/admin/coaching');
  revalidatePath('/dashboard/coaching');
  return { success: true as const, expert };
}

export async function updateAdminCoachingExpert(
  id: string,
  input: {
    name?: string;
    specialty?: string;
    bio?: string;
    avatarInitial?: string;
    isActive?: boolean;
    sortOrder?: number;
  }
) {
  await requireAdmin();

  const existing = (await withDbRetry(() =>
    requireCoachingExpertDelegate().findUnique({ where: { id } } as never)
  )) as { name: string } | null;
  if (!existing) return { success: false as const, error: 'Expert not found' };

  const expert = await withDbRetry(() =>
    requireCoachingExpertDelegate().update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.specialty !== undefined
          ? { specialty: input.specialty.trim() || null }
          : {}),
        ...(input.bio !== undefined ? { bio: input.bio.trim() || null } : {}),
        ...(input.avatarInitial !== undefined
          ? {
              avatarInitial:
                input.avatarInitial.trim().slice(0, 2).toUpperCase() || null,
            }
          : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      },
    } as never)
  );

  // Keep denormalized coachName in sync on open requests
  if (input.name && input.name.trim() !== existing.name) {
    await withDbRetry(() =>
      prisma.coaching.updateMany({
        where: { expertId: id, status: { in: ['PENDING', 'CONFIRMED'] } },
        data: { coachName: input.name!.trim() },
      })
    );
  }

  revalidatePath('/admin/coaching');
  revalidatePath('/dashboard/coaching');
  return { success: true as const, expert };
}

export async function deleteAdminCoachingExpert(id: string) {
  await requireAdmin();
  await withDbRetry(() => requireCoachingExpertDelegate().delete({ where: { id } } as never));
  revalidatePath('/admin/coaching');
  revalidatePath('/dashboard/coaching');
  return { success: true as const };
}

export async function getAdminAuditLogs(filters?: {
  search?: string;
  action?: string;
  role?: string;
  from?: string;
  to?: string;
  take?: number;
}) {
  await requireAdmin();

  const take = Math.min(Math.max(filters?.take ?? 200, 1), 500);
  const and: Prisma.ActivityLogWhereInput[] = [];

  if (filters?.action && filters.action !== 'all') {
    and.push({ action: filters.action });
  }

  if (filters?.role && (filters.role === 'ADMIN' || filters.role === 'INVESTOR')) {
    and.push({ user: { role: filters.role } });
  }

  if (filters?.from || filters?.to) {
    const createdAt: Prisma.DateTimeFilter = {};
    if (filters.from) {
      const from = new Date(filters.from);
      from.setHours(0, 0, 0, 0);
      createdAt.gte = from;
    }
    if (filters.to) {
      const to = new Date(filters.to);
      to.setHours(23, 59, 59, 999);
      createdAt.lte = to;
    }
    and.push({ createdAt });
  }

  const search = filters?.search?.trim();
  if (search) {
    and.push({
      OR: [
        { action: { contains: search, mode: 'insensitive' } },
        { details: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ],
    });
  }

  const where: Prisma.ActivityLogWhereInput = and.length ? { AND: and } : {};

  const [logs, total, actionGroups] = await withDbRetry(async () => {
    const rows = await prisma.activityLog.findMany({
      where,
      take,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true, name: true, role: true } } },
    });
    const count = await prisma.activityLog.count({ where });
    const actions = await prisma.activityLog.groupBy({
      by: ['action'],
      _count: { action: true },
      orderBy: { _count: { action: 'desc' } },
    });
    return [rows, count, actions] as const;
  });

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const [weekCount, todayCount, uniqueUsers] = await withDbRetry(async () => {
    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);
    const week = await prisma.activityLog.count({
      where: { createdAt: { gte: weekAgo } },
    });
    const today = await prisma.activityLog.count({
      where: { createdAt: { gte: startToday } },
    });
    const users = await prisma.activityLog.findMany({
      where: { createdAt: { gte: weekAgo } },
      select: { userId: true },
      distinct: ['userId'],
    });
    return [week, today, users.length] as const;
  });

  return {
    success: true as const,
    logs,
    total,
    actions: actionGroups.map((a) => ({ action: a.action, count: a._count.action })),
    metrics: {
      today: todayCount,
      last7Days: weekCount,
      activeUsers7d: uniqueUsers,
    },
  };
}
