'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Clock,
  Check,
  Loader2,
  Pencil,
  Trash2,
  X,
  Search,
  Send,
  UserRound,
  Inbox,
} from 'lucide-react';
import { SkeletonRows } from '@/components/ui/Skeleton';
import {
  bookCoachingSession,
  getActiveCoachingExperts,
  getUserCoachingSessions,
  updateUserCoachingSession,
  deleteUserCoachingSession,
} from '@/app/actions/coachingActions';

interface Expert {
  id: string;
  name: string;
  specialty: string | null;
  bio: string | null;
  avatarInitial: string | null;
}

interface Booking {
  id: string;
  coach: string;
  expertId: string | null;
  topic: string;
  date: string;
  time: string;
  status: string;
  bookingDate: Date;
  notes: string | null;
}

type SessionFilter = 'upcoming' | 'past' | 'all';

const TIME_SLOTS = ['9:00 AM', '10:00 AM', '11:30 AM', '1:00 PM', '3:30 PM', '5:00 PM'];

function parseTimeToHours(timeLabel: string): { hours: number; minutes: number } {
  const match = timeLabel.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return { hours: 10, minutes: 0 };
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return { hours, minutes };
}

function formatDateInput(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function tomorrowInput() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return formatDateInput(d);
}

function mapSession(s: {
  id: string;
  bookingDate: Date | string;
  coachName: string | null;
  expertId?: string | null;
  topic: string | null;
  status: string;
  notes?: string | null;
}): Booking {
  const dt = new Date(s.bookingDate);
  return {
    id: s.id,
    coach: s.coachName || 'Assigned advisor',
    expertId: s.expertId || null,
    topic: s.topic || 'Strategy Session',
    date: formatDateInput(dt),
    time: dt.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),
    status: s.status,
    bookingDate: dt,
    notes: s.notes || null,
  };
}

function statusStyles(status: string) {
  switch (status.toUpperCase()) {
    case 'CONFIRMED':
      return 'bg-emerald-50 text-emerald-800 ring-emerald-200';
    case 'PENDING':
      return 'bg-amber-50 text-amber-900 ring-amber-200';
    case 'COMPLETED':
      return 'bg-slate-100 text-slate-700 ring-slate-200';
    case 'EXPIRED':
      return 'bg-orange-50 text-orange-800 ring-orange-200';
    case 'CANCELED':
      return 'bg-rose-50 text-rose-700 ring-rose-200';
    default:
      return 'bg-blue-50 text-blue-800 ring-blue-200';
  }
}

function isInactiveStatus(status: string) {
  const s = status.toUpperCase();
  return s === 'EXPIRED' || s === 'CANCELED' || s === 'COMPLETED';
}

function coachInitial(name: string, fallback?: string | null) {
  return (fallback || name.trim().charAt(0) || '?').toUpperCase();
}

export default function CoachingPortalPage() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExpertId, setSelectedExpertId] = useState<string>('');
  const [bookingTopic, setBookingTopic] = useState('Deal Underwriting Strategy Review');
  const [bookingDate, setBookingDate] = useState(tomorrowInput);
  const [bookingTime, setBookingTime] = useState('10:00 AM');
  const [isBooking, setIsBooking] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<SessionFilter>('upcoming');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Booking | null>(null);
  const [editExpertId, setEditExpertId] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const [expRes, sesRes] = await Promise.all([
        getActiveCoachingExperts(),
        getUserCoachingSessions(),
      ]);
      const list = expRes.experts as Expert[];
      setExperts(list);
      if (list.length && !selectedExpertId) {
        setSelectedExpertId(list[0].id);
      }
      setBookings(sesRes.sessions.map(mapSession));
    } catch (e) {
      console.error(e);
      setError('Could not load coaching data. If this persists, restart the app after prisma generate.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedExpert = experts.find((e) => e.id === selectedExpertId) || experts[0];

  const filteredBookings = useMemo(() => {
    const now = new Date();
    const q = search.trim().toLowerCase();
    return bookings
      .filter((b) => {
        if (filter === 'upcoming') {
          const upcoming =
            (b.status === 'PENDING' || b.status === 'CONFIRMED') && b.bookingDate >= now;
          if (!upcoming) return false;
        }
        if (filter === 'past') {
          const past = isInactiveStatus(b.status) || b.bookingDate < now;
          if (!past) return false;
        }
        if (!q) return true;
        return (
          b.coach.toLowerCase().includes(q) ||
          b.topic.toLowerCase().includes(q) ||
          b.status.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.bookingDate.getTime() - b.bookingDate.getTime());
  }, [bookings, filter, search]);

  const stats = useMemo(() => {
    const now = new Date();
    const upcoming = bookings.filter(
      (b) => (b.status === 'PENDING' || b.status === 'CONFIRMED') && b.bookingDate >= now
    ).length;
    const pending = bookings.filter((b) => b.status === 'PENDING').length;
    return { total: bookings.length, upcoming, pending };
  }, [bookings]);

  const buildDate = (dateStr: string, timeLabel: string) => {
    const { hours, minutes } = parseTimeToHours(timeLabel);
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d, hours, minutes, 0, 0);
  };

  const handleCreateBooking = async () => {
    if (!selectedExpert) {
      setError('No experts available yet. Ask an admin to add coaching experts.');
      return;
    }
    setIsBooking(true);
    setError(null);
    setNotice(null);
    try {
      const scheduled = buildDate(bookingDate, bookingTime);
      const result = await bookCoachingSession(scheduled, {
        expertId: selectedExpert.id,
        coachName: selectedExpert.name,
        topic: bookingTopic,
      });
      if (!result.success) {
        setError(result.error || 'Could not submit request');
        return;
      }
      setNotice(
        `Request sent for ${selectedExpert.name}. An admin will review and confirm the time.`
      );
      await load();
    } catch (e) {
      console.error(e);
      setError('Could not submit booking request.');
    } finally {
      setIsBooking(false);
    }
  };

  const openEdit = (b: Booking) => {
    setEditing(b);
    setEditExpertId(
      b.expertId || experts.find((e) => e.name === b.coach)?.id || experts[0]?.id || ''
    );
    setEditTopic(b.topic);
    setEditDate(b.date);
    setEditTime(
      TIME_SLOTS.find((t) => t.replace(/\s/g, '') === b.time.replace(/\s/g, '')) || TIME_SLOTS[1]
    );
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSavingEdit(true);
    try {
      const expert = experts.find((e) => e.id === editExpertId);
      await updateUserCoachingSession(editing.id, {
        bookingDate: buildDate(editDate, editTime),
        expertId: editExpertId || undefined,
        coachName: expert?.name,
        topic: editTopic,
      });
      setEditing(null);
      await load();
    } finally {
      setSavingEdit(false);
    }
  };

  const cancelRequest = async (id: string) => {
    await updateUserCoachingSession(id, { status: 'CANCELED' });
    await load();
  };

  const removeRequest = async (id: string) => {
    if (!window.confirm('Delete this coaching request?')) return;
    await deleteUserCoachingSession(id);
    await load();
  };

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-[#dbe7ff] px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-[#1639a8] uppercase">
          Advisors · Requests
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-[#0b1220] sm:text-4xl">
          Coaching
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-[var(--muted)]">
          Request a session with an expert listed by PropIntel admin. Your preferred time goes to
          the admin queue — they confirm and coordinate the call (no Google Meet required).
        </p>
      </div>

      {notice && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {notice}
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Request form */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-3xl border border-[var(--border)] bg-white lg:col-span-2"
        >
          <div className="border-b border-[var(--border)] bg-[linear-gradient(180deg,#f8fafc,white)] px-5 py-4">
            <h2 className="font-display text-lg font-bold">Request a session</h2>
            <p className="mt-0.5 text-xs text-[var(--muted)]">
              Pick expert · topic · preferred date/time
            </p>
          </div>
          <div className="space-y-4 p-5">
            <div>
              <p className="mb-2 text-[10px] font-bold tracking-[0.12em] text-[var(--muted)] uppercase">
                Choose expert
              </p>
              {isLoading ? (
                <SkeletonRows rows={3} cols={1} />
              ) : experts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
                  No experts published yet. An admin needs to add experts first.
                </div>
              ) : (
                <div className="space-y-2">
                  {experts.map((e) => {
                    const active = selectedExpertId === e.id;
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setSelectedExpertId(e.id)}
                        className={`flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                          active
                            ? 'border-blue-700/50 bg-[#eff4ff] ring-1 ring-blue-700/20'
                            : 'border-[var(--border)] hover:border-blue-700/25'
                        }`}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1d4ed8] text-sm font-bold text-white">
                          {coachInitial(e.name, e.avatarInitial)}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-[#0b1220]">
                            {e.name}
                          </span>
                          <span className="block text-xs text-[var(--muted)]">
                            {e.specialty || 'Real estate advisor'}
                          </span>
                          {e.bio ? (
                            <span className="mt-1 line-clamp-2 block text-[11px] text-[var(--muted)]">
                              {e.bio}
                            </span>
                          ) : null}
                        </span>
                        {active ? (
                          <Check className="mt-1 h-4 w-4 shrink-0 text-blue-800" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase">
                Topic
              </span>
              <input
                value={bookingTopic}
                onChange={(e) => setBookingTopic(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-blue-700/40 focus:ring-2 focus:ring-blue-700/10"
                placeholder="What do you want to cover?"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase">
                  Preferred date
                </span>
                <div className="relative">
                  <CalendarIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                  <input
                    type="date"
                    min={tomorrowInput()}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2.5 pr-3 pl-10 text-sm"
                  />
                </div>
              </label>
              <label className="block space-y-1.5">
                <span className="text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase">
                  Preferred time
                </span>
                <div className="relative">
                  <Clock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2.5 pr-3 pl-10 text-sm"
                  >
                    {TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>
                        {t} EST
                      </option>
                    ))}
                  </select>
                </div>
              </label>
            </div>

            <button
              type="button"
              disabled={isBooking || !experts.length}
              onClick={handleCreateBooking}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1d4ed8] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1e40af] disabled:opacity-50"
            >
              {isBooking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Submit request
            </button>
            <p className="text-center text-[11px] text-[var(--muted)]">
              Status starts as <span className="font-semibold text-amber-800">Pending</span> until
              admin confirms.
            </p>
          </div>
        </motion.section>

        {/* Sessions list */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="overflow-hidden rounded-3xl border border-[var(--border)] bg-white lg:col-span-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[linear-gradient(180deg,#f8fafc,white)] px-5 py-4">
            <div>
              <h2 className="font-display text-lg font-bold">Your requests</h2>
              <p className="text-xs text-[var(--muted)]">
                {stats.total} total · {stats.upcoming} upcoming · {stats.pending} pending
              </p>
            </div>
            <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search topic or coach…"
                className="w-full rounded-xl border border-[var(--border)] bg-white py-2 pr-3 pl-9 text-xs"
              />
            </div>
          </div>

          <div className="flex gap-1 border-b border-[var(--border)] px-4 py-2">
            {(['upcoming', 'past', 'all'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize ${
                  filter === f
                    ? 'bg-[#0b1220] text-white'
                    : 'text-[var(--muted)] hover:bg-[var(--surface-soft)]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="max-h-[560px] space-y-2 overflow-y-auto p-4">
            {isLoading ? (
              <SkeletonRows rows={4} cols={1} />
            ) : filteredBookings.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-14 text-center">
                <Inbox className="mb-3 h-8 w-8 text-blue-800/40" />
                <p className="text-sm font-semibold text-[#0b1220]">No sessions here</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Submit a request on the left to get started.
                </p>
              </div>
            ) : (
              filteredBookings.map((b) => (
                <div
                  key={b.id}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)]/40 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eff4ff] text-sm font-bold text-blue-800">
                        {coachInitial(b.coach)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#0b1220]">{b.topic}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--muted)]">
                          <UserRound className="h-3 w-3" /> {b.coach}
                        </p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {b.bookingDate.toLocaleString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                        {b.notes && b.status === 'CONFIRMED' ? (
                          <p className="mt-2 rounded-lg bg-white px-2 py-1.5 text-[11px] text-[var(--muted)]">
                            Admin note: {b.notes}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ring-inset ${statusStyles(b.status)}`}
                    >
                      {b.status}
                    </span>
                  </div>
                  {!isInactiveStatus(b.status) ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(b)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5 text-[11px] font-semibold"
                      >
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => cancelRequest(b.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-amber-900"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRequest(b.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-red-700"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </motion.section>
      </div>

      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1220]/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-5 shadow-xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-lg font-bold">Edit request</h3>
                <button type="button" onClick={() => setEditing(null)} className="rounded-lg p-1 hover:bg-[var(--surface-soft)]">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                <label className="block space-y-1 text-xs font-semibold">
                  Expert
                  <select
                    value={editExpertId}
                    onChange={(e) => setEditExpertId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
                  >
                    {experts.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1 text-xs font-semibold">
                  Topic
                  <input
                    value={editTopic}
                    onChange={(e) => setEditTopic(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block space-y-1 text-xs font-semibold">
                    Date
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block space-y-1 text-xs font-semibold">
                    Time
                    <select
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
                    >
                      {TIME_SLOTS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <p className="text-[11px] text-[var(--muted)]">
                  Changing time after confirmation sets status back to Pending for admin review.
                </p>
                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={saveEdit}
                  className="w-full rounded-xl bg-[#1d4ed8] py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {savingEdit ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Save changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
