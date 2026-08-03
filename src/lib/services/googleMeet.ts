import { google } from 'googleapis';
import { randomUUID } from 'crypto';

export type MeetSessionInput = {
  summary: string;
  description?: string;
  start: Date;
  durationMinutes?: number;
  attendeeEmail?: string;
  timeZone?: string;
};

export type MeetSessionResult = {
  meetingLink: string;
  calendarEventId: string;
  hangoutLink?: string | null;
};

function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }

  const oauth2 = new google.auth.OAuth2(
    clientId,
    clientSecret,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000'
  );
  oauth2.setCredentials({ refresh_token: refreshToken });
  return oauth2;
}

/** True when Google Calendar OAuth env vars are present. */
export function isGoogleMeetConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN
  );
}

function getCalendarId() {
  return process.env.GOOGLE_CALENDAR_ID || 'primary';
}

/**
 * Creates a Google Calendar event with an attached Google Meet conference.
 * Requires GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN.
 */
export async function createGoogleMeetEvent(
  input: MeetSessionInput
): Promise<MeetSessionResult> {
  const auth = getOAuthClient();
  if (!auth) {
    throw new Error(
      'Google Meet is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN in .env'
    );
  }

  const calendar = google.calendar({ version: 'v3', auth });
  const duration = input.durationMinutes ?? 45;
  const timeZone = input.timeZone || process.env.GOOGLE_CALENDAR_TIMEZONE || 'America/New_York';
  const end = new Date(input.start.getTime() + duration * 60_000);

  const response = await calendar.events.insert({
    calendarId: getCalendarId(),
    conferenceDataVersion: 1,
    sendUpdates: input.attendeeEmail ? 'all' : 'none',
    requestBody: {
      summary: input.summary,
      description:
        input.description ||
        'PropIntel investor coaching session. Join with the Google Meet link attached to this event.',
      start: {
        dateTime: input.start.toISOString(),
        timeZone,
      },
      end: {
        dateTime: end.toISOString(),
        timeZone,
      },
      attendees: input.attendeeEmail
        ? [{ email: input.attendeeEmail }]
        : undefined,
      conferenceData: {
        createRequest: {
          requestId: `propintel-${randomUUID()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    },
  });

  const event = response.data;
  const entryPoint = event.conferenceData?.entryPoints?.find(
    (ep) => ep.entryPointType === 'video'
  );
  const meetingLink = entryPoint?.uri || event.hangoutLink;

  if (!meetingLink || !event.id) {
    throw new Error('Google Calendar created the event but did not return a Meet link');
  }

  return {
    meetingLink,
    calendarEventId: event.id,
    hangoutLink: event.hangoutLink,
  };
}

/**
 * Updates an existing Calendar event (reschedule / retitle) and keeps the Meet link.
 */
export async function updateGoogleMeetEvent(
  calendarEventId: string,
  input: Partial<MeetSessionInput>
): Promise<MeetSessionResult | null> {
  const auth = getOAuthClient();
  if (!auth || !calendarEventId) return null;

  const calendar = google.calendar({ version: 'v3', auth });
  const timeZone = input.timeZone || process.env.GOOGLE_CALENDAR_TIMEZONE || 'America/New_York';
  const duration = input.durationMinutes ?? 45;

  const patch: Record<string, unknown> = {};
  if (input.summary) patch.summary = input.summary;
  if (input.description) patch.description = input.description;
  if (input.start) {
    const end = new Date(input.start.getTime() + duration * 60_000);
    patch.start = { dateTime: input.start.toISOString(), timeZone };
    patch.end = { dateTime: end.toISOString(), timeZone };
  }

  const response = await calendar.events.patch({
    calendarId: getCalendarId(),
    eventId: calendarEventId,
    conferenceDataVersion: 1,
    requestBody: patch,
  });

  const event = response.data;
  const entryPoint = event.conferenceData?.entryPoints?.find(
    (ep) => ep.entryPointType === 'video'
  );
  const meetingLink = entryPoint?.uri || event.hangoutLink;
  if (!meetingLink || !event.id) return null;

  return {
    meetingLink,
    calendarEventId: event.id,
    hangoutLink: event.hangoutLink,
  };
}

export async function deleteGoogleMeetEvent(calendarEventId: string): Promise<void> {
  const auth = getOAuthClient();
  if (!auth || !calendarEventId) return;

  const calendar = google.calendar({ version: 'v3', auth });
  try {
    await calendar.events.delete({
      calendarId: getCalendarId(),
      eventId: calendarEventId,
      sendUpdates: 'all',
    });
  } catch (err) {
    // Event may already be gone — don't block session deletion
    console.warn('[googleMeet] Failed to delete calendar event:', err);
  }
}

/**
 * Start of today in local server time — sessions before this day are expired.
 */
export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isSessionDayPassed(bookingDate: Date | string): boolean {
  return new Date(bookingDate).getTime() < startOfToday().getTime();
}
