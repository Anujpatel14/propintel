'use server';

import { prisma, withDbRetry } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';
import { revalidatePath } from 'next/cache';

export async function getProfileSettings() {
  const user = await requireAuth();

  return withDbRetry(async () => {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { profile: true },
    });

    return {
      success: true,
      profile: {
        name: dbUser?.name || '',
        email: dbUser?.email || '',
        phone: dbUser?.profile?.phone || '',
        company: dbUser?.profile?.company || '',
        investorType: dbUser?.profile?.investorType || 'Buy & Hold',
        officeAddress: dbUser?.profile?.officeAddress || '',
        targetMarkets: dbUser?.profile?.targetMarkets || '',
        minCashFlow: dbUser?.profile?.minCashFlow ?? 200,
        targetRoi: dbUser?.profile?.targetRoi ?? 12,
        targetCapRate: dbUser?.profile?.targetCapRate ?? 7,
        maxRehabBudget: dbUser?.profile?.maxRehabBudget ?? 50000,
      },
    };
  });
}

export async function updateProfileSettings(input: {
  name: string;
  phone?: string;
  company?: string;
  investorType?: string;
  officeAddress?: string;
  targetMarkets?: string;
  minCashFlow?: number;
  targetRoi?: number;
  targetCapRate?: number;
  maxRehabBudget?: number;
}) {
  const user = await requireAuth();

  await withDbRetry(async () => {
    await prisma.user.update({
      where: { id: user.id },
      data: { name: input.name },
    });

    await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        phone: input.phone,
        company: input.company,
        investorType: input.investorType,
        officeAddress: input.officeAddress,
        targetMarkets: input.targetMarkets,
        minCashFlow: input.minCashFlow,
        targetRoi: input.targetRoi,
        targetCapRate: input.targetCapRate,
        maxRehabBudget: input.maxRehabBudget,
      },
      create: {
        userId: user.id,
        phone: input.phone,
        company: input.company,
        investorType: input.investorType,
        officeAddress: input.officeAddress,
        targetMarkets: input.targetMarkets,
        minCashFlow: input.minCashFlow,
        targetRoi: input.targetRoi,
        targetCapRate: input.targetCapRate,
        maxRehabBudget: input.maxRehabBudget,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_PROFILE',
        details: 'Updated investor profile settings',
      },
    });
  });

  revalidatePath('/dashboard/settings/profile');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function getUnderwritingSettings() {
  const user = await requireAuth();

  return withDbRetry(async () => {
    let settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });

    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId: user.id },
      });
    }

    return { success: true, settings };
  });
}

export async function updateUnderwritingSettings(input: {
  defaultDownPayment: number;
  defaultMortgageRate: number;
  defaultMortgageTerm: number;
  defaultVacancyRate: number;
  defaultMaintenanceRate: number;
  defaultClosingCost: number;
  defaultSellingCommission: number;
  customLogoUrl?: string;
  customPdfHeader?: string;
  customPdfSubtitle?: string;
  customPdfDisclaimer?: string;
  brandColor?: string;
}) {
  const user = await requireAuth();

  const settings = await withDbRetry(() =>
    prisma.userSettings.upsert({
      where: { userId: user.id },
      update: {
        defaultDownPayment: input.defaultDownPayment,
        defaultMortgageRate: input.defaultMortgageRate,
        defaultMortgageTerm: input.defaultMortgageTerm,
        defaultVacancyRate: input.defaultVacancyRate,
        defaultMaintenanceRate: input.defaultMaintenanceRate,
        defaultClosingCost: input.defaultClosingCost,
        defaultSellingCommission: input.defaultSellingCommission,
        customLogoUrl: input.customLogoUrl,
        customPdfHeader: input.customPdfHeader,
        customPdfSubtitle: input.customPdfSubtitle,
        customPdfDisclaimer: input.customPdfDisclaimer,
        brandColor: input.brandColor,
      },
      create: {
        userId: user.id,
        ...input,
      },
    })
  );

  revalidatePath('/dashboard/settings/underwriting');
  return { success: true, settings };
}
