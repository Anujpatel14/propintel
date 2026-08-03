'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/services/auth';
import { prisma, withDbRetry } from '@/lib/db';

export type ReportType = 'FINANCIAL' | 'PROPERTY' | 'RENTAL' | 'FLIP' | 'PORTFOLIO';

export async function listReportsAction(filters?: {
  type?: ReportType | 'ALL';
  q?: string;
}) {
  const user = await requireAuth();
  const type = filters?.type && filters.type !== 'ALL' ? filters.type : undefined;
  const q = filters?.q?.trim();

  const reports = await withDbRetry(() =>
    prisma.report.findMany({
      where: {
        userId: user.id,
        ...(type ? { type } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { address: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
  );

  return { success: true as const, reports };
}

export async function createReportAction(input: {
  type: ReportType;
  title: string;
  address?: string;
  payload: Record<string, unknown>;
}) {
  const user = await requireAuth();
  const report = await withDbRetry(() =>
    prisma.report.create({
      data: {
        userId: user.id,
        type: input.type,
        title: input.title.trim(),
        address: input.address?.trim() || null,
        status: 'READY',
        payloadJson: JSON.stringify(input.payload),
      },
    })
  );

  await withDbRetry(() =>
    prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'GENERATE_REPORT',
        details: `Generated ${input.type} report: ${input.title}`,
      },
    })
  );

  revalidatePath('/dashboard/reports');
  return { success: true as const, report };
}

export async function deleteReportAction(id: string) {
  const user = await requireAuth();
  await withDbRetry(() =>
    prisma.report.deleteMany({ where: { id, userId: user.id } })
  );
  revalidatePath('/dashboard/reports');
  return { success: true as const };
}
