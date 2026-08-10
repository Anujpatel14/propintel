'use server';

import { getCoachingExpertDelegate, prisma, requireCoachingExpertDelegate, withDbRetry } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';
import { isSessionDayPassed, startOfToday } from '@/lib/services/googleMeet';
import { revalidatePath } from 'next/cache';

const ACTIVE_STATUSES = ['PENDING', 'CONFIRMED'] as const;

/**
 * Mark CONFIRMED/PENDING sessions whose scheduled day has passed as EXPIRED.
 */
async function expirePastSessions(userId?: string) {
  await withDbRetry(() =>
    prisma.coaching.updateMany({
      where: {
        ...(userId ? { userId } : {}),
        status: { in: [...ACTIVE_STATUSES] },
        bookingDate: { lt: startOfToday() },
      },
      data: { status: 'EXPIRED' },
    })
  );
}

/** Active experts for the investor Coaching page (admin-managed). */
export async function getActiveCoachingExperts() {
  await requireAuth();
  const delegate = getCoachingExpertDelegate();
  if (!delegate) {
    return { success: true as const, experts: [] };
  }
  const experts = await withDbRetry(() =>
    delegate.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    } as never)
  );
  return { success: true as const, experts };
}

/**
 * Investor booking request — goes to admin as PENDING.
 * No Google Meet / calendar links; admin coordinates offline.
 */
export async function bookCoachingSession(
  bookingDate: Date,
  meta?: { coachName?: string; topic?: string; expertId?: string }
) {
  const user = await requireAuth();

  if (isSessionDayPassed(bookingDate)) {
    return { success: false as const, error: 'Cannot book a session on a past date.' };
  }

  let coachName = meta?.coachName?.trim() || null;
  let expertId = meta?.expertId || null;
  const expertDb = requireCoachingExpertDelegate();

  if (expertId) {
    const expert = (await withDbRetry(() =>
      expertDb.findFirst({
        where: { id: expertId, isActive: true },
      } as never)
    )) as { id: string; name: string } | null;
    if (!expert) {
      return { success: false as const, error: 'That expert is no longer available.' };
    }
    coachName = expert.name;
    expertId = expert.id;
  } else if (coachName) {
    const byName = (await withDbRetry(() =>
      expertDb.findFirst({
        where: { name: coachName!, isActive: true },
      } as never)
    )) as { id: string } | null;
    if (byName) expertId = byName.id;
  }

  if (!coachName) {
    return { success: false as const, error: 'Please choose an expert.' };
  }

  const coaching = await withDbRetry(() =>
    prisma.coaching.create({
      data: {
        userId: user.id,
        bookingDate,
        status: 'PENDING',
        meetingLink: null,
        calendarEventId: null,
        paymentStatus: 'UNPAID',
        coachName,
        expertId,
        topic: meta?.topic?.trim() || 'Strategy Session',
      },
    })
  );

  await withDbRetry(() =>
    prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'BOOK_COACHING',
        details: `Requested ${coachName} for ${bookingDate.toLocaleString()} — awaiting admin confirmation`,
      },
    })
  );

  revalidatePath('/dashboard/coaching');
  revalidatePath('/admin/coaching');
  return { success: true as const, coaching };
}

export async function getUserCoachingSessions() {
  const user = await requireAuth();
  await expirePastSessions(user.id);

  const sessions = await withDbRetry(() =>
    prisma.coaching.findMany({
      where: { userId: user.id },
      orderBy: { bookingDate: 'asc' },
      include: {
        expert: {
          select: { id: true, name: true, specialty: true, avatarInitial: true },
        },
      },
    })
  );

  return {
    success: true as const,
    sessions,
  };
}

export async function updateUserCoachingSession(
  id: string,
  data: {
    bookingDate?: Date;
    coachName?: string;
    topic?: string;
    status?: string;
    expertId?: string;
  }
) {
  const user = await requireAuth();

  const existing = await withDbRetry(() =>
    prisma.coaching.findFirst({ where: { id, userId: user.id } })
  );
  if (!existing) {
    return { success: false as const, error: 'Session not found' };
  }

  // Investors may only cancel or reschedule pending/confirmed requests
  if (data.status && !['CANCELED', 'PENDING'].includes(data.status)) {
    return { success: false as const, error: 'Invalid status change.' };
  }

  if (data.bookingDate && isSessionDayPassed(data.bookingDate)) {
    return { success: false as const, error: 'Cannot move a session to a past date.' };
  }

  let nextStatus = data.status;
  if (data.bookingDate && !isSessionDayPassed(data.bookingDate)) {
    if (existing.status === 'EXPIRED' || existing.status === 'CANCELED') {
      nextStatus = 'PENDING';
    } else if (existing.status === 'CONFIRMED') {
      // Reschedule after confirm → back to pending for admin
      nextStatus = 'PENDING';
    }
  }

  let coachName = data.coachName;
  let expertId = data.expertId;

  if (expertId) {
    const expert = (await withDbRetry(() =>
      requireCoachingExpertDelegate().findFirst({
        where: { id: expertId, isActive: true },
      } as never)
    )) as { name: string } | null;
    if (expert) {
      coachName = expert.name;
    }
  }

  const coaching = await withDbRetry(() =>
    prisma.coaching.update({
      where: { id },
      data: {
        ...(data.bookingDate !== undefined ? { bookingDate: data.bookingDate } : {}),
        ...(coachName !== undefined ? { coachName } : {}),
        ...(expertId !== undefined ? { expertId } : {}),
        ...(data.topic !== undefined ? { topic: data.topic } : {}),
        ...(nextStatus !== undefined ? { status: nextStatus } : {}),
      },
    })
  );

  await withDbRetry(() =>
    prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_COACHING',
        details: `Updated coaching request ${id}`,
      },
    })
  );

  revalidatePath('/dashboard/coaching');
  revalidatePath('/admin/coaching');
  return { success: true as const, coaching };
}

export async function deleteUserCoachingSession(id: string) {
  const user = await requireAuth();

  const existing = await withDbRetry(() =>
    prisma.coaching.findFirst({ where: { id, userId: user.id } })
  );
  if (!existing) {
    return { success: false as const, error: 'Session not found' };
  }

  await withDbRetry(() => prisma.coaching.delete({ where: { id } }));

  await withDbRetry(() =>
    prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'DELETE_COACHING',
        details: `Deleted coaching request for ${existing.bookingDate.toLocaleDateString()}`,
      },
    })
  );

  revalidatePath('/dashboard/coaching');
  revalidatePath('/admin/coaching');
  return { success: true as const };
}
