'use server';

import { prisma, withDbRetry } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';
import { revalidatePath } from 'next/cache';

const CRM_STAGES = [
  'LEAD',
  'UNDER_REVIEW',
  'OFFER_MADE',
  'UNDER_CONTRACT',
  'CLOSED',
  'LOST',
] as const;

type CrmStage = (typeof CRM_STAGES)[number];

export type DealLeadInput = {
  propertyAddress: string;
  sellerName?: string;
  sellerPhone?: string;
  sellerEmail?: string;
  buyerName?: string;
  offerAmount?: number;
  assignmentFee?: number;
  notes?: string;
  stage?: string;
  followUpDate?: Date | string | null;
};

export type SerializedDeal = {
  id: string;
  userId: string;
  propertyAddress: string;
  sellerName: string | null;
  sellerPhone: string | null;
  sellerEmail: string | null;
  buyerName: string | null;
  offerAmount: number | null;
  assignmentFee: number | null;
  notes: string | null;
  followUpDate: string | null;
  stage: string;
  createdAt: string;
  updatedAt: string;
};

function isValidStage(stage: string): stage is CrmStage {
  return (CRM_STAGES as readonly string[]).includes(stage);
}

function parseFollowUp(value: Date | string | null | undefined) {
  if (value === null) return null;
  if (value === undefined || value === '') return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

function serializeDeal(deal: {
  id: string;
  userId: string;
  propertyAddress: string;
  sellerName: string | null;
  sellerPhone: string | null;
  sellerEmail: string | null;
  buyerName: string | null;
  offerAmount: number | null;
  assignmentFee: number | null;
  notes: string | null;
  followUpDate: Date | null;
  stage: string;
  createdAt: Date;
  updatedAt: Date;
}): SerializedDeal {
  return {
    id: deal.id,
    userId: deal.userId,
    propertyAddress: deal.propertyAddress,
    sellerName: deal.sellerName,
    sellerPhone: deal.sellerPhone,
    sellerEmail: deal.sellerEmail,
    buyerName: deal.buyerName,
    offerAmount: deal.offerAmount,
    assignmentFee: deal.assignmentFee,
    notes: deal.notes,
    followUpDate: deal.followUpDate ? deal.followUpDate.toISOString() : null,
    stage: deal.stage,
    createdAt: deal.createdAt.toISOString(),
    updatedAt: deal.updatedAt.toISOString(),
  };
}

function revalidateCrm() {
  revalidatePath('/dashboard/crm');
  revalidatePath('/dashboard');
}

export async function createDealLead(input: DealLeadInput) {
  const user = await requireAuth();
  const address = input.propertyAddress?.trim();
  if (!address) {
    return { success: false as const, error: 'Property address is required.' };
  }

  const stage = input.stage && isValidStage(input.stage) ? input.stage : 'LEAD';
  const followUpDate = parseFollowUp(input.followUpDate);

  const deal = await withDbRetry(() =>
    prisma.dealPipeline.create({
      data: {
        userId: user.id,
        propertyAddress: address,
        sellerName: input.sellerName?.trim() || null,
        sellerPhone: input.sellerPhone?.trim() || null,
        sellerEmail: input.sellerEmail?.trim() || null,
        buyerName: input.buyerName?.trim() || null,
        offerAmount: Number(input.offerAmount) || 0,
        assignmentFee: Number(input.assignmentFee) || 0,
        notes: input.notes?.trim() || null,
        stage,
        followUpDate: followUpDate === undefined ? null : followUpDate,
      },
    })
  );

  await withDbRetry(() =>
    prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'ADD_LEAD',
        details: `Added CRM lead for ${address}`,
      },
    })
  );

  revalidateCrm();
  return { success: true as const, deal: serializeDeal(deal) };
}

export async function updateDealStage(dealId: string, stage: string) {
  const user = await requireAuth();
  if (!dealId) return { success: false as const, error: 'Deal id required.' };
  if (!isValidStage(stage)) {
    return { success: false as const, error: 'Invalid pipeline stage.' };
  }

  const result = await withDbRetry(() =>
    prisma.dealPipeline.updateMany({
      where: { id: dealId, userId: user.id },
      data: { stage, updatedAt: new Date() },
    })
  );

  if (result.count === 0) {
    return { success: false as const, error: 'Deal not found.' };
  }

  await withDbRetry(() =>
    prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_DEAL_STAGE',
        details: `Moved deal to ${stage}`,
      },
    })
  );

  revalidateCrm();
  return { success: true as const };
}

export async function updateDealLead(dealId: string, input: Partial<DealLeadInput>) {
  const user = await requireAuth();
  if (!dealId) return { success: false as const, error: 'Deal id required.' };

  if (input.stage !== undefined && !isValidStage(input.stage)) {
    return { success: false as const, error: 'Invalid pipeline stage.' };
  }

  const data: Record<string, unknown> = { updatedAt: new Date() };

  if (input.propertyAddress !== undefined) {
    const address = input.propertyAddress.trim();
    if (!address) return { success: false as const, error: 'Property address is required.' };
    data.propertyAddress = address;
  }
  if (input.sellerName !== undefined) data.sellerName = input.sellerName.trim() || null;
  if (input.sellerPhone !== undefined) data.sellerPhone = input.sellerPhone.trim() || null;
  if (input.sellerEmail !== undefined) data.sellerEmail = input.sellerEmail.trim() || null;
  if (input.buyerName !== undefined) data.buyerName = input.buyerName.trim() || null;
  if (input.offerAmount !== undefined) data.offerAmount = Number(input.offerAmount) || 0;
  if (input.assignmentFee !== undefined) data.assignmentFee = Number(input.assignmentFee) || 0;
  if (input.notes !== undefined) data.notes = input.notes.trim() || null;
  if (input.stage !== undefined) data.stage = input.stage;
  if (input.followUpDate !== undefined) {
    const parsed = parseFollowUp(input.followUpDate);
    data.followUpDate = parsed === undefined ? null : parsed;
  }

  const result = await withDbRetry(() =>
    prisma.dealPipeline.updateMany({
      where: { id: dealId, userId: user.id },
      data,
    })
  );

  if (result.count === 0) {
    return { success: false as const, error: 'Deal not found.' };
  }

  await withDbRetry(() =>
    prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_DEAL',
        details: `Updated CRM deal ${dealId.slice(0, 8)}`,
      },
    })
  );

  const deal = await withDbRetry(() =>
    prisma.dealPipeline.findFirst({
      where: { id: dealId, userId: user.id },
    })
  );

  revalidateCrm();
  return {
    success: true as const,
    deal: deal ? serializeDeal(deal) : null,
  };
}

export async function scheduleFollowUp(dealId: string, followUpDate: string | null) {
  return updateDealLead(dealId, { followUpDate });
}

/** Bump activity so the deal is no longer treated as stale. */
export async function touchDeal(dealId: string) {
  const user = await requireAuth();
  if (!dealId) return { success: false as const, error: 'Deal id required.' };

  const result = await withDbRetry(() =>
    prisma.dealPipeline.updateMany({
      where: { id: dealId, userId: user.id },
      data: { updatedAt: new Date() },
    })
  );

  if (result.count === 0) {
    return { success: false as const, error: 'Deal not found.' };
  }

  revalidateCrm();
  return { success: true as const };
}

export async function addDealNotes(
  dealId: string,
  notes: string,
  followUpDate?: Date | string | null
) {
  return updateDealLead(dealId, { notes, followUpDate });
}

export async function deleteDeal(dealId: string) {
  const user = await requireAuth();
  if (!dealId) return { success: false as const, error: 'Deal id required.' };

  const existing = await withDbRetry(() =>
    prisma.dealPipeline.findFirst({
      where: { id: dealId, userId: user.id },
      select: { propertyAddress: true },
    })
  );

  if (!existing) {
    return { success: false as const, error: 'Deal not found.' };
  }

  await withDbRetry(() =>
    prisma.dealPipeline.deleteMany({
      where: { id: dealId, userId: user.id },
    })
  );

  await withDbRetry(() =>
    prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'DELETE_LEAD',
        details: `Removed CRM lead for ${existing.propertyAddress}`,
      },
    })
  );

  revalidateCrm();
  return { success: true as const };
}

export async function getUserDeals() {
  const user = await requireAuth();

  const deals = await withDbRetry(() =>
    prisma.dealPipeline.findMany({
      where: { userId: user.id },
      orderBy: [{ followUpDate: 'asc' }, { updatedAt: 'desc' }],
    })
  );

  return { success: true as const, deals: deals.map(serializeDeal) };
}
