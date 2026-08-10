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
    UPDATE_ANALYSIS: 'Analysis updated',
    UPDATE_FLIP_ANALYSIS: 'Flip updated',
    AI_VERDICT: 'AI insights',
    AI_ANALYZE: 'AI analysis',
    ADD_LEAD: 'Lead added',
    UPDATE_DEAL_STAGE: 'Lead moved',
    UPDATE_DEAL: 'Deal updated',
    EXPORT_REPORT: 'Report exported',
    BOOK_COACHING: 'Coaching booked',
    LOGIN: 'Signed in',
    UPDATE_PROFILE: 'Profile updated',
    UPDATE_UNDERWRITING: 'Underwriting updated',
    IMPORT_PROPERTY: 'Property imported',
  };
  return map[action] || action.replace(/_/g, ' ').toLowerCase();
}

function sparkFromSeries(values: number[], len = 8) {
  if (!values.length) return Array.from({ length: len }, (_, i) => 4 + i);
  const sliced = values.slice(-len);
  while (sliced.length < len) sliced.unshift(sliced[0] || 0);
  return sliced;
}

export async function getInvestorDashboard() {
  const user = await requireAuth();

  const [properties, flips, deals, activities, imported, weekAnalyses, prevWeekAnalyses] =
    await withDbRetry(async () => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const props = await prisma.propertyAnalysis.findMany({
        where: { userId: user.id, deletedAt: null },
        select: {
          cashFlow: true,
          capRate: true,
          purchasePrice: true,
          strategyType: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      });
      const flipRows = await prisma.flipAnalysis.findMany({
        where: { userId: user.id, deletedAt: null },
        select: {
          id: true,
          profit: true,
          purchasePrice: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
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
      const inventory = await prisma.property.findMany({
        where: { userId: user.id },
        select: { estimatedValue: true },
      });
      const recentCount = await prisma.propertyAnalysis.count({
        where: { userId: user.id, createdAt: { gte: weekAgo }, deletedAt: null },
      });
      const recentFlips = await prisma.flipAnalysis.count({
        where: { userId: user.id, createdAt: { gte: weekAgo }, deletedAt: null },
      });
      const prevHolds = await prisma.propertyAnalysis.count({
        where: {
          userId: user.id,
          createdAt: { gte: twoWeeksAgo, lt: weekAgo },
          deletedAt: null,
        },
      });
      const prevFlips = await prisma.flipAnalysis.count({
        where: {
          userId: user.id,
          createdAt: { gte: twoWeeksAgo, lt: weekAgo },
          deletedAt: null,
        },
      });

      return [
        props,
        flipRows,
        pipeline,
        logs,
        inventory,
        recentCount + recentFlips,
        prevHolds + prevFlips,
      ] as const;
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
  const closedFees = deals
    .filter((d) => d.stage === 'CLOSED')
    .reduce((s, d) => s + (d.assignmentFee || 0), 0);

  const inventoryValue = imported.reduce((s, p) => s + (p.estimatedValue || 0), 0);
  const underwrittenValue =
    properties.reduce((s, p) => s + (p.purchasePrice || 0), 0) +
    flips.reduce((s, f) => s + (f.purchasePrice || 0), 0);

  const monthly = Math.max(0, avgCashFlow);
  const projection = Array.from({ length: 10 }, (_, i) => {
    const year = i + 1;
    const cumulative = monthly * 12 * year * (1 + 0.04 * i);
    return { label: `Y${year}`, value: Math.round(cumulative) };
  });

  const dealDelta =
    prevWeekAnalyses === 0
      ? weekAnalyses > 0
        ? 100
        : 0
      : Math.round(((weekAnalyses - prevWeekAnalyses) / prevWeekAnalyses) * 100);

  const cashSpark = sparkFromSeries(
    properties.map((p) => Math.max(0, p.cashFlow || 0)),
    8
  );
  const dealSpark = sparkFromSeries(
    [...properties, ...flips]
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((_, i) => i + 1),
    8
  );

  const stageOrder = [
    'LEAD',
    'UNDER_REVIEW',
    'OFFER_MADE',
    'UNDER_CONTRACT',
    'CLOSED',
    'LOST',
  ] as const;
  const stageColors: Record<string, string> = {
    LEAD: '#38bdf8',
    UNDER_REVIEW: '#1d4ed8',
    OFFER_MADE: '#f59e0b',
    UNDER_CONTRACT: '#ea580c',
    CLOSED: '#059669',
    LOST: '#e11d48',
  };
  const pipelineMix = stageOrder
    .map((stage) => ({
      label: stage,
      value: deals.filter((d) => d.stage === stage).length,
      color: stageColors[stage],
    }))
    .filter((s) => s.value > 0);

  const strategyMix = [
    {
      label: 'Buy & Hold',
      value: properties.filter((p) => p.strategyType !== 'rental').length,
      color: '#1d4ed8',
    },
    {
      label: 'Rental',
      value: properties.filter((p) => p.strategyType === 'rental').length,
      color: '#60a5fa',
    },
    {
      label: 'Fix & Flip',
      value: flips.length,
      color: '#34d399',
    },
  ].filter((s) => s.value > 0);

  const performanceBars = [
    {
      label: 'Holds',
      value: Math.round(properties.reduce((s, p) => s + (p.cashFlow || 0), 0)),
      tone: 'up' as const,
    },
    {
      label: 'Flips',
      value: Math.round(flips.reduce((s, f) => s + (f.profit || 0), 0)),
      tone: 'flat' as const,
    },
    {
      label: 'Fees',
      value: Math.round(closedFees),
      tone: 'up' as const,
    },
    {
      label: 'Pipeline',
      value: Math.round(potentialFees),
      tone: 'flat' as const,
    },
  ];

  const year10 = projection[projection.length - 1]?.value || 0;

  return {
    success: true as const,
    metrics: {
      savedDeals,
      savedDealsHint: weekAnalyses > 0 ? `+${weekAnalyses} this week` : 'No new saves this week',
      savedDealsDelta: dealDelta,
      monthlyCashFlow: Math.round(avgCashFlow),
      cashFlowHint:
        properties.length > 0
          ? `Avg across ${properties.length} hold deal${properties.length === 1 ? '' : 's'}`
          : 'Save a buy & hold deal to track this',
      cashFlowPositive: avgCashFlow >= 0,
      avgCapRate: Math.round(avgCapRate * 10) / 10,
      capHint: properties.length > 0 ? 'Portfolio average' : 'No cap data yet',
      activeLeads,
      leadsHint:
        potentialFees > 0
          ? `$${Math.round(potentialFees / 1000)}k pipeline value`
          : 'No open pipeline value',
      inventoryValue: Math.round(inventoryValue),
      underwrittenValue: Math.round(underwrittenValue),
      year10Projection: year10,
      closedFees: Math.round(closedFees),
    },
    sparks: {
      deals: dealSpark,
      cashFlow: cashSpark,
      cap: sparkFromSeries(
        properties.map((p) => p.capRate || 0),
        8
      ),
      leads: sparkFromSeries(
        stageOrder.map((s) => deals.filter((d) => d.stage === s).length),
        8
      ),
    },
    projection,
    pipelineMix,
    strategyMix,
    performanceBars,
    recentActivity: activities.map((a) => ({
      id: a.id,
      action: friendlyAction(a.action),
      details: a.details || '—',
      time: relativeTime(a.createdAt),
    })),
  };
}
