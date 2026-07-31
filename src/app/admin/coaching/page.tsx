'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import {
  getAdminCoachingSessions,
  updateAdminCoachingSession,
} from '@/app/actions/adminExpandActions';

export default function AdminCoachingPage() {
  const [sessions, setSessions] = useState<
    Array<{
      id: string;
      bookingDate: Date | string;
      status: string;
      meetingLink: string | null;
      coachName: string | null;
      topic: string | null;
      notes: string | null;
      user: { email: string; name: string | null };
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  const load = async () => {
    const result = await getAdminCoachingSessions();
    setSessions(result.sessions);
  };

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateField = (id: string, data: { status?: string; meetingLink?: string; notes?: string }) => {
    startTransition(async () => {
      await updateAdminCoachingSession(id, data);
      await load();
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-[var(--muted)]">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading coaching desk…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-tight">Coaching operations</h1>
        <p className="text-sm text-[var(--muted)]">
          Assign coaches, update meeting links, and mark sessions complete.
        </p>
      </div>

      <div className="space-y-4">
        {sessions.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No coaching sessions booked.</p>
        ) : (
          sessions.map((s) => (
            <div key={s.id} className="surface-card space-y-3 p-5 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-bold">{s.user.name || s.user.email}</div>
                  <div className="text-xs text-[var(--muted)]">{s.user.email}</div>
                  <div className="mt-1 text-xs">
                    {new Date(s.bookingDate).toLocaleString()} · {s.topic || 'Strategy session'}
                  </div>
                </div>
                <select
                  className="glass-input bg-white px-3 py-1.5 text-xs"
                  value={s.status}
                  onChange={(e) => updateField(s.id, { status: e.target.value })}
                >
                  {['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELED'].map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
              <input
                className="glass-input w-full px-3 py-2 text-xs"
                defaultValue={s.meetingLink || ''}
                placeholder="Meeting link"
                onBlur={(e) => {
                  if (e.target.value !== (s.meetingLink || '')) {
                    updateField(s.id, { meetingLink: e.target.value });
                  }
                }}
              />
              <textarea
                className="glass-input w-full px-3 py-2 text-xs"
                rows={2}
                defaultValue={s.notes || ''}
                placeholder="Private coach notes"
                onBlur={(e) => {
                  if (e.target.value !== (s.notes || '')) {
                    updateField(s.id, { notes: e.target.value });
                  }
                }}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
