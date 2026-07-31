'use server';

import { prisma, withDbRetry } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';
import { revalidatePath } from 'next/cache';

export async function bookCoachingSession(
  bookingDate: Date,
  meetingLink?: string,
  meta?: { coachName?: string; topic?: string }
) {
  const user = await requireAuth();

  const coaching = await withDbRetry(() =>
    prisma.coaching.create({
      data: {
        userId: user.id,
        bookingDate,
        status: 'CONFIRMED',
        meetingLink: meetingLink || 'https://meet.google.com/propintel-coaching',
        paymentStatus: 'PAID',
        coachName: meta?.coachName,
        topic: meta?.topic,
      },
    })
  );

  await withDbRetry(() =>
    prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'BOOK_COACHING',
        details: `Booked 1-on-1 coaching session for ${bookingDate.toLocaleDateString()}`,
      },
    })
  );

  revalidatePath('/dashboard/coaching');
  return { success: true, coaching };
}

export async function getUserCoachingSessions() {
  const user = await requireAuth();

  const sessions = await withDbRetry(() =>
    prisma.coaching.findMany({
      where: { userId: user.id },
      orderBy: { bookingDate: 'desc' },
    })
  );

  return { success: true, sessions };
}
