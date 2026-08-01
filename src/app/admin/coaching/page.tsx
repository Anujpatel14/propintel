'use client';

import React, { useEffect, useMemo, useState, useTransition } from 'react';
import { Search, Filter } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import { SkeletonRows } from '@/components/ui/Skeleton';
import {
  getAdminCoachingSessions,
  updateAdminCoachingSession,
} from '@/app/actions/adminExpandActions';

type SessionRow = {
  id: string;
  bookingDate: Date | string;
  status: string;
  meetingLink: string | null;
  coachName: string | null;
  topic: string | null;
  notes: string | null;
  user: { email: string; name: string | null };
};

const STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'EXPIRED', 'CANCELED'];

function formatDateInput(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function AdminCoachingPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  const [search, setSearch] = useState('');
  const [person, setPerson] = useState('all');
  const [coach, setCoach] = useState('all');
  const [status, setStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [timeSlot, setTimeSlot] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const result = await getAdminCoachingSessions();
      setSessions(result.sessions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const people = useMemo(() => {
    const map = new Map<string, string>();
    sessions.forEach((s) => {
      map.set(s.user.email, s.user.name || s.user.email);
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [sessions]);

  const coaches = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => {
      if (s.coachName) set.add(s.coachName);
    });
    return Array.from(set).sort();
  }, [sessions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sessions
      .filter((s) => {
        const dt = new Date(s.bookingDate);
        const day = formatDateInput(dt);
        const hour = dt.getHours();

        if (person !== 'all' && s.user.email !== person) return false;
        if (coach !== 'all' && (s.coachName || '') !== coach) return false;
        if (status !== 'all' && s.status !== status) return false;
        if (dateFrom && day < dateFrom) return false;
        if (dateTo && day > dateTo) return false;

        if (timeSlot === 'morning' && (hour < 5 || hour >= 12)) return false;
        if (timeSlot === 'afternoon' && (hour < 12 || hour >= 17)) return false;
        if (timeSlot === 'evening' && (hour < 17 || hour >= 22)) return false;

        if (!q) return true;
        return (
          (s.user.name || '').toLowerCase().includes(q) ||
          s.user.email.toLowerCase().includes(q) ||
          (s.topic || '').toLowerCase().includes(q) ||
          (s.coachName || '').toLowerCase().includes(q) ||
          s.status.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());
  }, [sessions, search, person, coach, status, dateFrom, dateTo, timeSlot]);

  const updateField = (
    id: string,
    data: { status?: string; meetingLink?: string; notes?: string; coachName?: string }
  ) => {
    startTransition(async () => {
      await updateAdminCoachingSession(id, data);
      await load();
    });
  };

  const clearFilters = () => {
    setSearch('');
    setPerson('all');
    setCoach('all');
    setStatus('all');
    setDateFrom('');
    setDateTo('');
    setTimeSlot('all');
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        title="Coaching operations"
        description="Filter by investor, coach, date, and time — then update status and Meet links."
      />

      <div className="surface-card space-y-4 p-4 sm:p-5">
        <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-[var(--muted)] uppercase">
          <Filter className="h-3.5 w-3.5 text-teal-700" /> Filters
          <span className="ml-auto font-semibold normal-case tracking-normal text-[var(--muted)]">
            {loading ? 'Loading…' : `Showing ${filtered.length} of ${sessions.length}`}
          </span>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-[var(--muted)]" />
          <input
            className="glass-input w-full py-2.5 pr-3 pl-9 text-sm"
            placeholder="Search investor, topic, coach, status…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <label className="space-y-1 text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase">
            Investor
            <select
              className="glass-input w-full bg-white px-3 py-2 text-xs font-semibold normal-case tracking-normal"
              value={person}
              onChange={(e) => setPerson(e.target.value)}
            >
              <option value="all">All people</option>
              {people.map(([email, label]) => (
                <option key={email} value={email}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase">
            Coach
            <select
              className="glass-input w-full bg-white px-3 py-2 text-xs font-semibold normal-case tracking-normal"
              value={coach}
              onChange={(e) => setCoach(e.target.value)}
            >
              <option value="all">All coaches</option>
              {coaches.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase">
            Status
            <select
              className="glass-input w-full bg-white px-3 py-2 text-xs font-semibold normal-case tracking-normal"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All statuses</option>
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase">
            From date
            <input
              type="date"
              className="glass-input w-full px-3 py-2 text-xs font-semibold normal-case tracking-normal"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </label>

          <label className="space-y-1 text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase">
            To date
            <input
              type="date"
              className="glass-input w-full px-3 py-2 text-xs font-semibold normal-case tracking-normal"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </label>

          <label className="space-y-1 text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase">
            Time of day
            <select
              className="glass-input w-full bg-white px-3 py-2 text-xs font-semibold normal-case tracking-normal"
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
            >
              <option value="all">Any time</option>
              <option value="morning">Morning (5–12)</option>
              <option value="afternoon">Afternoon (12–17)</option>
              <option value="evening">Evening (17–22)</option>
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={clearFilters}
          className="cursor-pointer text-xs font-semibold text-teal-800 hover:underline"
        >
          Clear filters
        </button>
      </div>

      <div className="max-h-[min(68vh,720px)] space-y-3 overflow-y-auto overscroll-contain pr-1">
        {loading ? (
          <div className="surface-card space-y-4 p-5">
            <SkeletonRows rows={6} cols={3} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] py-14 text-center text-sm text-[var(--muted)]">
            No sessions match these filters.
          </div>
        ) : (
          filtered.map((s) => (
            <div key={s.id} className="surface-card space-y-3 p-4 text-sm sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="font-bold">{s.user.name || s.user.email}</div>
                  <div className="truncate text-xs text-[var(--muted)]">{s.user.email}</div>
                  <div className="mt-1 text-xs">
                    {new Date(s.bookingDate).toLocaleString()} · {s.topic || 'Strategy session'}
                    {s.coachName ? ` · ${s.coachName}` : ''}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    className="glass-input min-h-10 bg-white px-3 py-2 text-xs"
                    value={s.coachName || ''}
                    onChange={(e) => updateField(s.id, { coachName: e.target.value })}
                  >
                    <option value="">Unassigned coach</option>
                    {['Marcus Sterling', 'Diana Jenkins', 'Elena Rostova', ...(coaches.filter((c) => !['Marcus Sterling', 'Diana Jenkins', 'Elena Rostova'].includes(c)))].map(
                      (c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      )
                    )}
                  </select>
                  <select
                    className="glass-input min-h-10 bg-white px-3 py-2 text-xs"
                    value={s.status}
                    onChange={(e) => updateField(s.id, { status: e.target.value })}
                  >
                    {STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <input
                className="glass-input w-full px-3 py-2.5 text-xs"
                defaultValue={s.meetingLink || ''}
                placeholder="Meeting link"
                onBlur={(e) => {
                  if (e.target.value !== (s.meetingLink || '')) {
                    updateField(s.id, { meetingLink: e.target.value });
                  }
                }}
              />
              <textarea
                className="glass-input w-full px-3 py-2.5 text-xs"
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
