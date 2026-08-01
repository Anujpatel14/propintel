'use server';

import { prisma, withDbRetry } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';
import { revalidatePath } from 'next/cache';

export type AiDealPayload = {
  verdict: string;
  headline?: string | null;
  summary?: unknown;
  strengths?: unknown;
  risks?: unknown;
  provider?: string;
  modelName?: string | null;
  reportText?: string | null;
};

export interface PropertyAnalysisInput {
  id?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  purchasePrice: number;
  rehabCost: number;
  arv: number;
  rent: number;
  downPayment: number;
  taxes: number;
  insurance: number;
  hoa: number;
  vacancyRate: number;
  maintenanceRate: number;
  mortgageRate: number;
  mortgageTerm: number;
  strategyType?: 'hold' | 'rental';
  ai?: AiDealPayload | null;
}

function calcPropertyMetrics(input: PropertyAnalysisInput) {
  const loanAmount = input.purchasePrice * (1 - input.downPayment / 100);
  const monthlyInterestRate = input.mortgageRate / 100 / 12;
  const numberOfPayments = input.mortgageTerm * 12;

  const monthlyMortgage =
    monthlyInterestRate > 0
      ? (loanAmount *
          (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments))) /
        (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1)
      : loanAmount / numberOfPayments;

  const monthlyTaxes = input.taxes / 12;
  const monthlyInsurance = input.insurance / 12;
  const monthlyHoa = input.hoa;
  const monthlyVacancy = input.rent * (input.vacancyRate / 100);
  const monthlyMaintenance = input.rent * (input.maintenanceRate / 100);

  const totalMonthlyExpenses =
    monthlyMortgage +
    monthlyTaxes +
    monthlyInsurance +
    monthlyHoa +
    monthlyVacancy +
    monthlyMaintenance;

  const cashFlow = input.rent - totalMonthlyExpenses;
  const annualNoi =
    (input.rent -
      (monthlyTaxes + monthlyInsurance + monthlyHoa + monthlyVacancy + monthlyMaintenance)) *
    12;
  const capRate = input.purchasePrice > 0 ? (annualNoi / input.purchasePrice) * 100 : 0;
  const dscr = monthlyMortgage > 0 ? annualNoi / 12 / monthlyMortgage : 0;
  const initialInvestment = input.purchasePrice * (input.downPayment / 100) + input.rehabCost;
  const cashOnCash =
    initialInvestment > 0 ? ((cashFlow * 12) / initialInvestment) * 100 : 0;
  const roi =
    initialInvestment > 0
      ? ((cashFlow * 12 + (input.arv - (input.purchasePrice + input.rehabCost))) /
          initialInvestment) *
        100
      : 0;

  return { cashFlow, roi, capRate, dscr, cashOnCash };
}

function aiFields(ai?: AiDealPayload | null) {
  if (!ai) {
    return {
      aiVerdict: null as string | null,
      aiHeadline: null as string | null,
      aiPayloadJson: null as string | null,
    };
  }
  return {
    aiVerdict: ai.verdict,
    aiHeadline: ai.headline || null,
    aiPayloadJson: JSON.stringify({
      summary: ai.summary || [],
      strengths: ai.strengths || [],
      risks: ai.risks || [],
      provider: ai.provider || null,
      modelName: ai.modelName || null,
      reportText: ai.reportText || null,
    }),
  };
}

export async function savePropertyAnalysis(input: PropertyAnalysisInput) {
  const user = await requireAuth();
  const metrics = calcPropertyMetrics(input);
  const strategyType = input.strategyType === 'rental' ? 'rental' : 'hold';

  const data = {
    address: input.address.trim(),
    city: input.city,
    state: input.state,
    zip: input.zip,
    purchasePrice: input.purchasePrice,
    rehabCost: input.rehabCost,
    arv: input.arv,
    rent: input.rent,
    downPayment: input.downPayment,
    taxes: input.taxes,
    insurance: input.insurance,
    hoa: input.hoa,
    vacancyRate: input.vacancyRate,
    maintenanceRate: input.maintenanceRate,
    mortgageRate: input.mortgageRate,
    mortgageTerm: input.mortgageTerm,
    strategyType,
    ...metrics,
    ...aiFields(input.ai),
  };

  let analysis;
  let updated = false;

  if (input.id) {
    const existing = await prisma.propertyAnalysis.findFirst({
      where: { id: input.id, userId: user.id },
    });
    if (existing) {
      analysis = await prisma.propertyAnalysis.update({
        where: { id: existing.id },
        data,
      });
      updated = true;
    }
  }

  if (!analysis) {
    const duplicate = await prisma.propertyAnalysis.findFirst({
      where: {
        userId: user.id,
        address: data.address,
        purchasePrice: data.purchasePrice,
        rehabCost: data.rehabCost,
        arv: data.arv,
        rent: data.rent,
        downPayment: data.downPayment,
        strategyType,
      },
      orderBy: { createdAt: 'desc' },
    });
    if (duplicate) {
      analysis = await prisma.propertyAnalysis.update({
        where: { id: duplicate.id },
        data,
      });
      updated = true;
    } else {
      analysis = await prisma.propertyAnalysis.create({
        data: { userId: user.id, ...data },
      });
    }
  }

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: updated ? 'UPDATE_ANALYSIS' : 'CREATE_ANALYSIS',
      details: `${updated ? 'Updated' : 'Saved'} ${strategyType} deal for ${input.address}`,
    },
  });

  revalidatePath('/dashboard/analyzer');
  revalidatePath('/dashboard/deals');
  return { success: true as const, analysis, updated };
}

export async function saveFlipAnalysis(input: {
  id?: string;
  address: string;
  purchasePrice: number;
  rehabCost: number;
  arv: number;
  financingCost?: number;
  holdingCost?: number;
  sellingCost?: number;
  ai?: AiDealPayload | null;
}) {
  const user = await requireAuth();

  const financingCost = input.financingCost || input.purchasePrice * 0.04;
  const holdingCost = input.holdingCost || input.purchasePrice * 0.02;
  const sellingCost = input.sellingCost || input.arv * 0.06;

  const totalCost =
    input.purchasePrice + input.rehabCost + financingCost + holdingCost + sellingCost;
  const profit = input.arv - totalCost;
  const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;
  const mao = input.arv * 0.7 - input.rehabCost;

  const data = {
    address: input.address.trim(),
    purchasePrice: input.purchasePrice,
    rehabCost: input.rehabCost,
    arv: input.arv,
    financingCost,
    holdingCost,
    sellingCost,
    profit,
    roi,
    mao,
    ...aiFields(input.ai),
  };

  let flip;
  let updated = false;

  if (input.id) {
    const existing = await prisma.flipAnalysis.findFirst({
      where: { id: input.id, userId: user.id },
    });
    if (existing) {
      flip = await prisma.flipAnalysis.update({
        where: { id: existing.id },
        data,
      });
      updated = true;
    }
  }

  if (!flip) {
    const duplicate = await prisma.flipAnalysis.findFirst({
      where: {
        userId: user.id,
        address: data.address,
        purchasePrice: data.purchasePrice,
        rehabCost: data.rehabCost,
        arv: data.arv,
      },
      orderBy: { createdAt: 'desc' },
    });
    if (duplicate) {
      flip = await prisma.flipAnalysis.update({
        where: { id: duplicate.id },
        data,
      });
      updated = true;
    } else {
      flip = await prisma.flipAnalysis.create({
        data: { userId: user.id, ...data },
      });
    }
  }

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: updated ? 'UPDATE_FLIP_ANALYSIS' : 'CREATE_FLIP_ANALYSIS',
      details: `${updated ? 'Updated' : 'Saved'} flip deal for ${input.address}`,
    },
  });

  revalidatePath('/dashboard/analyzer');
  revalidatePath('/dashboard/deals');
  return { success: true as const, flip, updated };
}

export async function getUserAnalyses() {
  const user = await requireAuth();

  const propertyAnalyses = await withDbRetry(() =>
    prisma.propertyAnalysis.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })
  );

  const flipAnalyses = await withDbRetry(() =>
    prisma.flipAnalysis.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })
  );

  return { propertyAnalyses, flipAnalyses };
}

export async function deleteAnalysis(id: string, type: 'PROPERTY' | 'FLIP') {
  const user = await requireAuth();

  if (type === 'PROPERTY') {
    await prisma.propertyAnalysis.deleteMany({
      where: { id, userId: user.id },
    });
  } else {
    await prisma.flipAnalysis.deleteMany({
      where: { id, userId: user.id },
    });
  }

  revalidatePath('/dashboard/analyzer');
  revalidatePath('/dashboard/deals');
  return { success: true };
}
