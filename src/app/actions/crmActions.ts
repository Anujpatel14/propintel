'use server';

import { prisma, withDbRetry } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';
import { revalidatePath } from 'next/cache';

export interface DealLeadInput {
  propertyAddress: string;
  sellerName?: string;
  sellerPhone?: string;
  sellerEmail?: string;
  buyerName?: string;
  offerAmount?: number;
  assignmentFee?: number;
  notes?: string;
  stage?: string;
  followUpDate?: Date | string;
}

export async function createDealLead(input: DealLeadInput) {
  const user = await requireAuth();

  const deal = await withDbRetry(() =>
    prisma.dealPipeline.create({
      data: {
        userId: user.id,
        propertyAddress: input.propertyAddress,
        sellerName: input.sellerName,
        sellerPhone: input.sellerPhone,
        sellerEmail: input.sellerEmail,
        buyerName: input.buyerName,
        offerAmount: input.offerAmount || 0,
        assignmentFee: input.assignmentFee || 0,
        notes: input.notes,
        stage: input.stage || 'LEAD',
        followUpDate: input.followUpDate ? new Date(input.followUpDate) : null,
      },
    })
  );

  await withDbRetry(() =>
    prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'ADD_LEAD',
        details: `Added new deal lead for ${input.propertyAddress}`,
      },
    })
  );

  revalidatePath('/dashboard/crm');
  revalidatePath('/dashboard');
  return { success: true, deal };
}

export async function updateDealStage(dealId: string, stage: string) {
  const user = await requireAuth();

  const deal = await withDbRetry(() =>
    prisma.dealPipeline.updateMany({
      where: { id: dealId, userId: user.id },
      data: { stage, updatedAt: new Date() },
    })
  );

  await withDbRetry(() =>
    prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_DEAL_STAGE',
        details: `Updated deal stage to ${stage}`,
      },
    })
  );

  revalidatePath('/dashboard/crm');
  return { success: true, deal };
}

export async function addDealNotes(dealId: string, notes: string, followUpDate?: Date) {
  const user = await requireAuth();

  await withDbRetry(() =>
    prisma.dealPipeline.updateMany({
      where: { id: dealId, userId: user.id },
      data: {
        notes,
        followUpDate: followUpDate || null,
        updatedAt: new Date(),
      },
    })
  );

  revalidatePath('/dashboard/crm');
  return { success: true };
}

export async function deleteDeal(dealId: string) {
  const user = await requireAuth();

  await withDbRetry(() =>
    prisma.dealPipeline.deleteMany({
      where: { id: dealId, userId: user.id },
    })
  );

  revalidatePath('/dashboard/crm');
  return { success: true };
}

export async function getUserDeals() {
  const user = await requireAuth();

  const deals = await withDbRetry(() =>
    prisma.dealPipeline.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    })
  );

  return { success: true, deals };
}
