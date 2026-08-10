/**
 * Sync underwriting / inventory status into the CRM DealPipeline board.
 * Server-only helper used by analysis + property actions.
 */

import { prisma, withDbRetry } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import {
  isPipelineStatus,
  type PipelineStatus,
} from '@/lib/pipelineStatus';

export {
  PIPELINE_STATUSES,
  PIPELINE_STATUS_LABELS,
  isPipelineStatus,
  type PipelineStatus,
} from '@/lib/pipelineStatus';

function normalizeAddress(address: string) {
  return address.trim().replace(/\s+/g, ' ');
}

export async function upsertCrmDealForAddress(opts: {
  userId: string;
  address: string;
  stage: PipelineStatus;
  offerAmount?: number | null;
  assignmentFee?: number | null;
  notes?: string | null;
  analysisId?: string | null;
  analysisType?: 'PROPERTY' | 'FLIP' | null;
  propertyId?: string | null;
}) {
  const propertyAddress = normalizeAddress(opts.address);
  if (!propertyAddress) return null;

  const existing = await withDbRetry(() =>
    prisma.dealPipeline.findFirst({
      where: {
        userId: opts.userId,
        propertyAddress: { equals: propertyAddress, mode: 'insensitive' },
      },
      orderBy: { updatedAt: 'desc' },
    })
  );

  const notesParts = [
    opts.notes?.trim() || '',
    opts.analysisType ? `Linked ${opts.analysisType.toLowerCase()} analysis` : '',
  ].filter(Boolean);

  if (existing) {
    return withDbRetry(() =>
      prisma.dealPipeline.update({
        where: { id: existing.id },
        data: {
          stage: opts.stage,
          ...(opts.offerAmount != null ? { offerAmount: opts.offerAmount } : {}),
          ...(opts.assignmentFee != null ? { assignmentFee: opts.assignmentFee } : {}),
          ...(notesParts.length
            ? { notes: existing.notes || notesParts.join(' · ') }
            : {}),
          updatedAt: new Date(),
        },
      })
    );
  }

  return withDbRetry(() =>
    prisma.dealPipeline.create({
      data: {
        userId: opts.userId,
        propertyAddress,
        stage: opts.stage,
        offerAmount: opts.offerAmount ?? 0,
        assignmentFee: opts.assignmentFee ?? 0,
        notes: notesParts.join(' · ') || null,
      },
    })
  );
}

export async function syncCrmStageByAddress(
  userId: string,
  address: string,
  stage: PipelineStatus
) {
  if (!isPipelineStatus(stage)) return { updated: 0 };
  const propertyAddress = normalizeAddress(address);
  if (!propertyAddress) return { updated: 0 };

  const result = await withDbRetry(() =>
    prisma.dealPipeline.updateMany({
      where: {
        userId,
        propertyAddress: { equals: propertyAddress, mode: 'insensitive' },
      },
      data: { stage, updatedAt: new Date() },
    })
  );

  if (result.count === 0) {
    await upsertCrmDealForAddress({ userId, address: propertyAddress, stage });
    return { updated: 1 };
  }

  return { updated: result.count };
}

export function revalidateDealPaths() {
  revalidatePath('/dashboard/crm');
  revalidatePath('/dashboard/deals');
  revalidatePath('/dashboard/properties');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/portfolio');
}
