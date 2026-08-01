'use server';

import { prisma, withDbRetry } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';
import { revalidatePath } from 'next/cache';

export interface PropertyAnalysisInput {
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
}

export async function savePropertyAnalysis(input: PropertyAnalysisInput) {
  const user = await requireAuth();

  // Perform underwriting calculations
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
    monthlyMortgage + monthlyTaxes + monthlyInsurance + monthlyHoa + monthlyVacancy + monthlyMaintenance;

  const cashFlow = input.rent - totalMonthlyExpenses;
  const annualNoi = (input.rent - (monthlyTaxes + monthlyInsurance + monthlyHoa + monthlyVacancy + monthlyMaintenance)) * 12;
  const capRate = input.purchasePrice > 0 ? (annualNoi / input.purchasePrice) * 100 : 0;
  const dscr = monthlyMortgage > 0 ? (annualNoi / 12) / monthlyMortgage : 0;
  const initialInvestment = input.purchasePrice * (input.downPayment / 100) + input.rehabCost;
  const cashOnCash = initialInvestment > 0 ? ((cashFlow * 12) / initialInvestment) * 100 : 0;
  const roi = initialInvestment > 0 ? (((cashFlow * 12) + (input.arv - (input.purchasePrice + input.rehabCost))) / initialInvestment) * 100 : 0;

  const analysis = await prisma.propertyAnalysis.create({
    data: {
      userId: user.id,
      address: input.address,
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
      cashFlow,
      roi,
      capRate,
      dscr,
      cashOnCash,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: 'CREATE_ANALYSIS',
      details: `Saved property analysis for ${input.address} ($${input.purchasePrice.toLocaleString()})`,
    },
  });

  revalidatePath('/dashboard/analyzer');
  revalidatePath('/dashboard/deals');
  return { success: true, analysis };
}

export async function saveFlipAnalysis(input: {
  address: string;
  purchasePrice: number;
  rehabCost: number;
  arv: number;
  financingCost?: number;
  holdingCost?: number;
  sellingCost?: number;
}) {
  const user = await requireAuth();

  const financingCost = input.financingCost || input.purchasePrice * 0.04;
  const holdingCost = input.holdingCost || input.purchasePrice * 0.02;
  const sellingCost = input.sellingCost || input.arv * 0.06;

  const totalCost = input.purchasePrice + input.rehabCost + financingCost + holdingCost + sellingCost;
  const profit = input.arv - totalCost;
  const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;
  const mao = input.arv * 0.7 - input.rehabCost;

  const flip = await prisma.flipAnalysis.create({
    data: {
      userId: user.id,
      address: input.address,
      purchasePrice: input.purchasePrice,
      rehabCost: input.rehabCost,
      arv: input.arv,
      financingCost,
      holdingCost,
      sellingCost,
      profit,
      roi,
      mao,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: 'CREATE_FLIP_ANALYSIS',
      details: `Saved flip analysis for ${input.address} (MAO: $${mao.toLocaleString()})`,
    },
  });

  revalidatePath('/dashboard/analyzer');
  return { success: true, flip };
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
