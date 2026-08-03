'use server';

import { prisma, withDbRetry } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';

function relativeTime(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function friendlyAction(action: string): string {
  const map: Record<string, string> = {
    CREATE_ANALYSIS: 'Analysis created',
    CREATE_FLIP_ANALYSIS: 'Flip analysis saved',
    AI_VERDICT: 'AI insights',
    AI_ANALYZE: 'AI analysis',
    ADD_LEAD: 'Lead added',
    UPDATE_DEAL_STAGE: 'Lead moved',
    EXPORT_REPORT: 'Report exported',
    BOOK_COACHING: 'Coaching booked',
    LOGIN: 'Signed in',
    UPDATE_PROFILE: 'Profile updated',
    UPDATE_UNDERWRITING: 'Underwriting updated',
  };
  return map[action] || action.replace(/_/g, ' ').toLowerCase();
}

export async function getInvestorDashboard() {
  const user = await requireAuth();

  const [properties, flips, deals, activities, weekAnalyses] = await withDbRetry(async () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const props = await prisma.propertyAnalysis.findMany({
      where: { userId: user.id },
      select: {
        cashFlow: true,
        capRate: true,
        purchasePrice: true,
        createdAt: true,
      },
    });
    const flipRows = await prisma.flipAnalysis.findMany({
      where: { userId: user.id },
      select: { id: true, createdAt: true },
    });
    const pipeline = await prisma.dealPipeline.findMany({
      where: { userId: user.id },
      select: { stage: true, assignmentFee: true, offerAmount: true },
    });
    const logs = await prisma.activityLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });
    const recentCount = await prisma.propertyAnalysis.count({
      where: { userId: user.id, createdAt: { gte: weekAgo } },
    });
    const recentFlips = await prisma.flipAnalysis.count({
      where: { userId: user.id, createdAt: { gte: weekAgo } },
    });

    return [props, flipRows, pipeline, logs, recentCount + recentFlips] as const;
  });

  const savedDeals = properties.length + flips.length;
  const avgCashFlow =
    properties.length > 0
      ? properties.reduce((s, p) => s + (p.cashFlow || 0), 0) / properties.length
      : 0;
  const avgCapRate =
    properties.length > 0
      ? properties.reduce((s, p) => s + (p.capRate || 0), 0) / properties.length
      : 0;
  const activeLeads = deals.filter((d) => !['CLOSED', 'LOST'].includes(d.stage)).length;
  const potentialFees = deals
    .filter((d) => !['CLOSED', 'LOST'].includes(d.stage))
    .reduce((s, d) => s + (d.assignmentFee || d.offerAmount || 0), 0);

  const monthly = Math.max(0, avgCashFlow);
  const projection = Array.from({ length: 10 }, (_, i) => {
    const year = i + 1;
    // Compound modest growth on cumulative cash flow for chart shape
    const cumulative = monthly * 12 * year * (1 + 0.04 * i);
    return { label: `Y${year}`, value: Math.round(cumulative) };
  });

  return {
    success: true as const,
    metrics: {
      savedDeals,
      savedDealsHint: weekAnalyses > 0 ? `+${weekAnalyses} this week` : 'No new saves this week',
      monthlyCashFlow: Math.round(avgCashFlow),
      cashFlowHint:
        properties.length > 0
          ? `Avg across ${properties.length} hold deal${properties.length === 1 ? '' : 's'}`
          : 'Save a buy & hold deal to track this',
      avgCapRate: Math.round(avgCapRate * 10) / 10,
      capHint: properties.length > 0 ? 'Portfolio average' : 'No cap data yet',
      activeLeads,
      leadsHint:
        potentialFees > 0
          ? `$${Math.round(potentialFees / 1000)}k pipeline value`
          : 'No open pipeline value',
    },
    projection,
    recentActivity: activities.map((a) => ({
      id: a.id,
      action: friendlyAction(a.action),
      details: a.details || '—',
      time: relativeTime(a.createdAt),
    })),
  };
}
