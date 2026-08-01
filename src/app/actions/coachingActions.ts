'use server';

import { prisma, withDbRetry } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';
import {
  createGoogleMeetEvent,
  deleteGoogleMeetEvent,
  isGoogleMeetConfigured,
  isSessionDayPassed,
  startOfToday,
  updateGoogleMeetEvent,
} from '@/lib/services/googleMeet';
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

export async function bookCoachingSession(
  bookingDate: Date,
  meta?: { coachName?: string; topic?: string }
) {
  const user = await requireAuth();

  if (isSessionDayPassed(bookingDate)) {
    return { success: false as const, error: 'Cannot book a session on a past date.' };
  }

  let meetingLink: string | null = null;
  let calendarEventId: string | null = null;
  let meetWarning: string | undefined;

  if (isGoogleMeetConfigured()) {
    try {
      const meet = await createGoogleMeetEvent({
        summary: `PropIntel Coaching — ${meta?.topic || 'Strategy Session'}`,
        description: [
          `Coach: ${meta?.coachName || 'Assigned advisor'}`,
          `Investor: ${user.name || user.email}`,
          `Topic: ${meta?.topic || 'Strategy Session'}`,
        ].join('\n'),
        start: bookingDate,
        durationMinutes: 45,
        attendeeEmail: user.email,
      });
      meetingLink = meet.meetingLink;
      calendarEventId = meet.calendarEventId;
    } catch (err) {
      console.error('[coaching] Google Meet creation failed:', err);
      meetWarning =
        err instanceof Error
          ? err.message
          : 'Failed to create Google Meet link. Session saved without a join URL.';
    }
  } else {
    meetWarning =
      'Google Meet is not configured. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN to generate live Meet links.';
  }

  const coaching = await withDbRetry(() =>
    prisma.coaching.create({
      data: {
        userId: user.id,
        bookingDate,
        status: 'CONFIRMED',
        meetingLink,
        calendarEventId,
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
        details: `Booked coaching for ${bookingDate.toLocaleString()}${meetingLink ? ` · ${meetingLink}` : ''}`,
      },
    })
  );

  revalidatePath('/dashboard/coaching');
  return { success: true as const, coaching, meetWarning };
}

export async function getUserCoachingSessions() {
  const user = await requireAuth();
  await expirePastSessions(user.id);

  const sessions = await withDbRetry(() =>
    prisma.coaching.findMany({
      where: { userId: user.id },
      orderBy: { bookingDate: 'asc' },
    })
  );

  return {
    success: true as const,
    sessions,
    meetConfigured: isGoogleMeetConfigured(),
  };
}

export async function updateUserCoachingSession(
  id: string,
  data: {
    bookingDate?: Date;
    coachName?: string;
    topic?: string;
    status?: string;
  }
) {
  const user = await requireAuth();

  const existing = await withDbRetry(() =>
    prisma.coaching.findFirst({ where: { id, userId: user.id } })
  );
  if (!existing) {
    return { success: false as const, error: 'Session not found' };
  }

  if (data.bookingDate && isSessionDayPassed(data.bookingDate)) {
    return { success: false as const, error: 'Cannot move a session to a past date.' };
  }

  let meetingLink = existing.meetingLink;
  let calendarEventId = existing.calendarEventId;
  let nextStatus = data.status;

  // Rescheduling an expired/canceled session into the future restores it
  if (data.bookingDate && !isSessionDayPassed(data.bookingDate)) {
    if (existing.status === 'EXPIRED' || existing.status === 'CANCELED') {
      nextStatus = 'CONFIRMED';
    }
  }

  const nextStart = data.bookingDate ?? existing.bookingDate;
  const nextTopic = data.topic ?? existing.topic ?? 'Strategy Session';
  const nextCoach = data.coachName ?? existing.coachName ?? 'Assigned advisor';

  if (isGoogleMeetConfigured()) {
    try {
      if (calendarEventId && data.bookingDate) {
        const updated = await updateGoogleMeetEvent(calendarEventId, {
          summary: `PropIntel Coaching — ${nextTopic}`,
          description: `Coach: ${nextCoach}\nInvestor: ${user.name || user.email}\nTopic: ${nextTopic}`,
          start: nextStart,
        });
        if (updated) {
          meetingLink = updated.meetingLink;
          calendarEventId = updated.calendarEventId;
        }
      } else if (!calendarEventId && data.bookingDate) {
        const created = await createGoogleMeetEvent({
          summary: `PropIntel Coaching — ${nextTopic}`,
          description: `Coach: ${nextCoach}\nInvestor: ${user.name || user.email}\nTopic: ${nextTopic}`,
          start: nextStart,
          attendeeEmail: user.email,
        });
        meetingLink = created.meetingLink;
        calendarEventId = created.calendarEventId;
      }
    } catch (err) {
      console.error('[coaching] Google Meet update failed:', err);
    }
  }

  const coaching = await withDbRetry(() =>
    prisma.coaching.update({
      where: { id },
      data: {
        ...(data.bookingDate !== undefined ? { bookingDate: data.bookingDate } : {}),
        ...(data.coachName !== undefined ? { coachName: data.coachName } : {}),
        ...(data.topic !== undefined ? { topic: data.topic } : {}),
        ...(nextStatus !== undefined ? { status: nextStatus } : {}),
        meetingLink,
        calendarEventId,
      },
    })
  );

  await withDbRetry(() =>
    prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_COACHING',
        details: `Updated coaching session ${id}`,
      },
    })
  );

  revalidatePath('/dashboard/coaching');
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

  if (existing.calendarEventId) {
    await deleteGoogleMeetEvent(existing.calendarEventId);
  }

  await withDbRetry(() => prisma.coaching.delete({ where: { id } }));

  await withDbRetry(() =>
    prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'DELETE_COACHING',
        details: `Deleted coaching session scheduled for ${existing.bookingDate.toLocaleDateString()}`,
      },
    })
  );

  revalidatePath('/dashboard/coaching');
  return { success: true as const };
}
