'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Video,
  Clock,
  Check,
  Sparkles,
  Loader2,
  Pencil,
  Trash2,
  X,
  ExternalLink,
  Search,
  AlertTriangle,
} from 'lucide-react';
import SpotlightCard from '@/components/ui/SpotlightCard';
import PageHeader from '@/components/dashboard/PageHeader';
import {
  bookCoachingSession,
  getUserCoachingSessions,
  updateUserCoachingSession,
  deleteUserCoachingSession,
} from '@/app/actions/coachingActions';

interface Booking {
  id: string;
  coach: string;
  topic: string;
  date: string;
  time: string;
  meetingLink: string | null;
  status: string;
  bookingDate: Date;
}

type SessionFilter = 'upcoming' | 'past' | 'all';

const COACHES = [
  { name: 'Marcus Sterling', specialty: 'Fix & Flip / Construction', avatar: 'M' },
  { name: 'Diana Jenkins', specialty: 'Buy & Hold / DSCR', avatar: 'D' },
  { name: 'Elena Rostova', specialty: 'Wholesaling / Outreach', avatar: 'E' },
];

const TIME_SLOTS = [
  '9:00 AM',
  '10:00 AM',
  '11:30 AM',
  '1:00 PM',
  '3:30 PM',
  '5:00 PM',
];

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
  topic: string | null;
  meetingLink: string | null;
  status: string;
}): Booking {
  const dt = new Date(s.bookingDate);
  return {
    id: s.id,
    coach: s.coachName || 'Assigned Advisor',
    topic: s.topic || 'Strategy Session',
    date: formatDateInput(dt),
    time: dt.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),
    meetingLink: s.meetingLink,
    status: s.status,
    bookingDate: dt,
  };
}

function statusStyles(status: string) {
  switch (status.toUpperCase()) {
    case 'CONFIRMED':
      return 'bg-teal-700/12 text-teal-800';
    case 'PENDING':
      return 'bg-amber-500/12 text-amber-800';
    case 'COMPLETED':
      return 'bg-slate-500/12 text-slate-700';
    case 'EXPIRED':
      return 'bg-orange-500/12 text-orange-800';
    case 'CANCELED':
      return 'bg-red-500/10 text-red-700';
    default:
      return 'bg-teal-700/10 text-teal-800';
  }
}

function isInactiveStatus(status: string) {
  const s = status.toUpperCase();
  return s === 'EXPIRED' || s === 'CANCELED' || s === 'COMPLETED';
}

function canJoinSession(b: Booking) {
  return Boolean(b.meetingLink) && !isInactiveStatus(b.status);
}

function coachInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || '?';
}

export default function CoachingPortalPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCoach, setSelectedCoach] = useState(COACHES[0].name);
  const [bookingTopic, setBookingTopic] = useState('Deal Underwriting Strategy Review');
  const [bookingDate, setBookingDate] = useState(tomorrowInput);
  const [bookingTime, setBookingTime] = useState('10:00 AM');
  const [isBooking, setIsBooking] = useState(false);
  const [filter, setFilter] = useState<SessionFilter>('upcoming');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Booking | null>(null);
  const [editCoach, setEditCoach] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editStatus, setEditStatus] = useState('CONFIRMED');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [meetConfigured, setMeetConfigured] = useState(true);
  const [formNotice, setFormNotice] = useState<{ type: 'success' | 'warn' | 'error'; text: string } | null>(
    null
  );

  const loadSessions = async () => {
    try {
      const result = await getUserCoachingSessions();
      if (result.success) {
        setBookings(result.sessions.map(mapSession));
        setMeetConfigured(result.meetConfigured);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const startToday = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, [bookings.length, isLoading]);

  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings
      .filter((b) => {
        const inactive = isInactiveStatus(b.status);
        if (filter === 'upcoming') {
          return b.bookingDate >= startToday && !inactive;
        }
        if (filter === 'past') {
          return b.bookingDate < startToday || inactive;
        }
        return true;
      })
      .filter((b) => {
        if (!q) return true;
        return (
          b.topic.toLowerCase().includes(q) ||
          b.coach.toLowerCase().includes(q) ||
          b.status.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (filter === 'past') return b.bookingDate.getTime() - a.bookingDate.getTime();
        return a.bookingDate.getTime() - b.bookingDate.getTime();
      });
  }, [bookings, filter, search, startToday]);

  const counts = useMemo(() => {
    const upcoming = bookings.filter(
      (b) => b.bookingDate >= startToday && !isInactiveStatus(b.status)
    ).length;
    const past = bookings.filter(
      (b) => b.bookingDate < startToday || isInactiveStatus(b.status)
    ).length;
    return { upcoming, past, all: bookings.length };
  }, [bookings, startToday]);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBooking(true);
    setFormNotice(null);

    try {
      const { hours, minutes } = parseTimeToHours(bookingTime);
      const [year, month, day] = bookingDate.split('-').map(Number);
      const scheduled = new Date(year, month - 1, day, hours, minutes);

      const result = await bookCoachingSession(scheduled, {
        coachName: selectedCoach,
        topic: bookingTopic,
      });

      if (!result.success) {
        setFormNotice({ type: 'error', text: result.error || 'Could not book session.' });
        return;
      }

      setBookings((prev) => [mapSession(result.coaching), ...prev]);
      setFilter('upcoming');
      if (result.meetWarning) {
        setFormNotice({ type: 'warn', text: result.meetWarning });
      } else {
        setFormNotice({
          type: 'success',
          text: result.coaching.meetingLink
            ? 'Session booked with a live Google Meet link.'
            : 'Session booked successfully.',
        });
      }
      setTimeout(() => setFormNotice(null), 6000);
    } catch (err) {
      console.error(err);
      setFormNotice({ type: 'error', text: 'Booking failed. Please try again.' });
    } finally {
      setIsBooking(false);
    }
  };

  const openEdit = (b: Booking) => {
    setEditing(b);
    setEditCoach(b.coach);
    setEditTopic(b.topic);
    setEditDate(b.date);
    setEditTime(
      TIME_SLOTS.includes(b.time.replace(/\s*EST$/i, '').trim())
        ? b.time.replace(/\s*EST$/i, '').trim()
        : TIME_SLOTS[1]
    );
    setEditStatus(b.status);
    setConfirmDeleteId(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setIsSavingEdit(true);

    try {
      const { hours, minutes } = parseTimeToHours(editTime);
      const [year, month, day] = editDate.split('-').map(Number);
      const scheduled = new Date(year, month - 1, day, hours, minutes);

      const result = await updateUserCoachingSession(editing.id, {
        bookingDate: scheduled,
        coachName: editCoach,
        topic: editTopic,
        status: editStatus,
      });

      if (result.success && result.coaching) {
        const mapped = mapSession(result.coaching);
        setBookings((prev) => prev.map((b) => (b.id === mapped.id ? mapped : b)));
        setEditing(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const result = await deleteUserCoachingSession(id);
      if (result.success) {
        setBookings((prev) => prev.filter((b) => b.id !== id));
        if (editing?.id === id) setEditing(null);
        setConfirmDeleteId(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const filterTabs: { key: SessionFilter; label: string; count: number }[] = [
    { key: 'upcoming', label: 'Upcoming', count: counts.upcoming },
    { key: 'past', label: 'Past', count: counts.past },
    { key: 'all', label: 'All', count: counts.all },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        title="Investor coaching desk"
        description="Book 1-on-1 strategizing sessions with master real estate underwriters."
      />

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Booking form */}
        <div className="lg:col-span-5 lg:sticky lg:top-4">
          <div className="space-y-6 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
            <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
              <Sparkles className="h-5 w-5 text-teal-700" /> Schedule a strategy call
            </h2>

            {!meetConfigured && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-50 px-3.5 py-3 text-xs text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Google Meet credentials are not set. Sessions will still book; add{' '}
                  <code className="font-mono text-[10px]">GOOGLE_CLIENT_ID</code>,{' '}
                  <code className="font-mono text-[10px]">GOOGLE_CLIENT_SECRET</code>, and{' '}
                  <code className="font-mono text-[10px]">GOOGLE_REFRESH_TOKEN</code> in{' '}
                  <code className="font-mono text-[10px]">.env</code> for live Meet links.
                </span>
              </div>
            )}

            <AnimatePresence>
              {formNotice && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={`flex items-start gap-2 rounded-xl border p-3.5 text-xs ${
                    formNotice.type === 'success'
                      ? 'border-teal-700/20 bg-teal-700/10 text-teal-800'
                      : formNotice.type === 'warn'
                        ? 'border-amber-500/25 bg-amber-50 text-amber-900'
                        : 'border-red-200 bg-red-50 text-red-700'
                  }`}
                >
                  {formNotice.type === 'success' ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  <span>{formNotice.text}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase">
                  Choose advisor
                </label>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  {COACHES.map((coach) => {
                    const active = selectedCoach === coach.name;
                    return (
                      <button
                        key={coach.name}
                        type="button"
                        onClick={() => setSelectedCoach(coach.name)}
                        className={`flex h-[5.5rem] cursor-pointer flex-col justify-between rounded-xl border p-3 text-left transition ${
                          active
                            ? 'border-teal-700 bg-teal-700/5 text-foreground ring-1 ring-teal-700/20'
                            : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted)] hover:border-teal-700/30'
                        }`}
                      >
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                            active ? 'bg-teal-700 text-white' : 'bg-white text-teal-800'
                          }`}
                        >
                          {coach.avatar}
                        </div>
                        <div>
                          <div className="truncate text-[11px] font-bold text-foreground">
                            {coach.name}
                          </div>
                          <div className="mt-0.5 truncate text-[9px] text-[var(--muted-foreground)]">
                            {coach.specialty}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase">
                  Topic
                </label>
                <input
                  type="text"
                  required
                  value={bookingTopic}
                  onChange={(e) => setBookingTopic(e.target.value)}
                  className="glass-input w-full px-3.5 py-2.5 text-sm"
                  placeholder="What do you want to cover?"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    min={formatDateInput(new Date())}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="glass-input w-full px-3 py-2.5 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase">
                    Time
                  </label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="glass-input w-full bg-white px-3 py-2.5 text-sm text-foreground"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot} EST
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isBooking}
                className="btn-primary flex w-full cursor-pointer items-center justify-center gap-2 py-3.5 text-xs disabled:opacity-50"
              >
                {isBooking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CalendarIcon className="h-4 w-4" />
                )}
                {isBooking ? 'Booking…' : 'Schedule session'}
              </button>
            </form>
          </div>
        </div>

        {/* Sessions panel */}
        <div className="lg:col-span-7">
          <SpotlightCard className="overflow-hidden p-0">
            <div className="border-b border-[var(--border)] px-5 pt-5 pb-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Your sessions</h3>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">
                    {counts.all} total · {counts.upcoming} upcoming
                  </p>
                </div>
                <div className="relative w-full sm:max-w-[220px]">
                  <Search className="pointer-events-none absolute top-2.5 left-3 h-3.5 w-3.5 text-[var(--muted)]" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search topic or coach…"
                    className="glass-input w-full py-2 pr-3 pl-9 text-xs"
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-1">
                {filterTabs.map((tab) => {
                  const active = filter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setFilter(tab.key)}
                      className={`relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                        active
                          ? 'bg-white text-foreground shadow-sm'
                          : 'text-[var(--muted)] hover:text-foreground'
                      }`}
                    >
                      {tab.label}
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                          active ? 'bg-teal-700/10 text-teal-800' : 'bg-[var(--surface-soft)] text-[var(--muted)]'
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="max-h-[min(62vh,560px)] overflow-y-auto overscroll-contain px-3 py-3 sm:px-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-16 text-[var(--muted)]">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading sessions…
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--border)] px-6 py-14 text-center">
                  <CalendarIcon className="mx-auto h-8 w-8 text-teal-700/40" />
                  <p className="mt-3 text-sm font-semibold text-foreground">No sessions here</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {filter === 'upcoming'
                      ? 'Book a call on the left to fill your upcoming schedule.'
                      : 'Try another filter or clear your search.'}
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {filteredBookings.map((b) => (
                      <motion.li
                        key={b.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.18 }}
                        className="group rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3.5 transition hover:border-teal-700/25 hover:bg-white"
                      >
                        <div className="flex gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-700/10 text-sm font-bold text-teal-800">
                            {coachInitial(b.coach)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="truncate text-sm font-bold text-foreground">
                                    {b.topic}
                                  </h4>
                                  <span
                                    className={`rounded-md px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide uppercase ${statusStyles(b.status)}`}
                                  >
                                    {b.status}
                                  </span>
                                </div>
                                <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
                                  with {b.coach}
                                </p>
                              </div>

                              <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                                <button
                                  type="button"
                                  onClick={() => openEdit(b)}
                                  className="cursor-pointer rounded-lg border border-[var(--border)] bg-white p-2 text-teal-800 transition hover:border-teal-700/30"
                                  aria-label="Edit session"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                {confirmDeleteId === b.id ? (
                                  <button
                                    type="button"
                                    disabled={deletingId === b.id}
                                    onClick={() => handleDelete(b.id)}
                                    className="cursor-pointer rounded-lg bg-red-600 px-3 py-2 text-[10px] font-bold text-white disabled:opacity-50"
                                  >
                                    {deletingId === b.id ? '…' : 'Confirm'}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(b.id)}
                                    className="cursor-pointer rounded-lg border border-[var(--border)] bg-white p-2 text-red-600 transition hover:border-red-200 hover:bg-red-50"
                                    aria-label="Delete session"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-[var(--muted)]">
                              <span className="inline-flex items-center gap-1.5">
                                <CalendarIcon className="h-3.5 w-3.5 text-teal-700" />
                                {b.bookingDate.toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-teal-700" />
                                {b.time} EST
                              </span>
                              {canJoinSession(b) ? (
                                <a
                                  href={b.meetingLink!}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 font-semibold text-teal-800 transition hover:underline"
                                >
                                  <Video className="h-3.5 w-3.5" />
                                  Join Meet
                                  <ExternalLink className="h-3 w-3 opacity-60" />
                                </a>
                              ) : b.status.toUpperCase() === 'EXPIRED' ? (
                                <span className="inline-flex items-center gap-1.5 font-semibold text-orange-700">
                                  Session expired
                                </span>
                              ) : b.meetingLink ? (
                                <span className="inline-flex items-center gap-1.5 text-[var(--muted)]">
                                  Meet unavailable
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-amber-800">
                                  Meet link pending
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>
          </SpotlightCard>
        </div>
      </div>

      {/* Edit modal */}
      <AnimatePresence>
        {editing && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-md sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditing(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-session-title"
              className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-2xl"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 360, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
                <h3 id="edit-session-title" className="text-sm font-bold">
                  Edit session
                </h3>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="cursor-pointer rounded-lg border border-[var(--border)] p-1.5"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4 p-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase">
                    Advisor
                  </label>
                  <select
                    value={editCoach}
                    onChange={(e) => setEditCoach(e.target.value)}
                    className="glass-input w-full bg-white px-3 py-2.5 text-sm"
                  >
                    {COACHES.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    {!COACHES.some((c) => c.name === editCoach) && (
                      <option value={editCoach}>{editCoach}</option>
                    )}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase">
                    Topic
                  </label>
                  <input
                    required
                    value={editTopic}
                    onChange={(e) => setEditTopic(e.target.value)}
                    className="glass-input w-full px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="glass-input w-full px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase">
                      Time
                    </label>
                    <select
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="glass-input w-full bg-white px-3 py-2.5 text-sm"
                    >
                      {TIME_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot} EST
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="glass-input w-full bg-white px-3 py-2.5 text-sm"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="EXPIRED">Expired</option>
                    <option value="CANCELED">Canceled</option>
                  </select>
                </div>

                <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    onClick={() => handleDelete(editing.id)}
                    disabled={deletingId === editing.id}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingId === editing.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Delete session
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="cursor-pointer rounded-xl border border-[var(--border)] px-4 py-2.5 text-xs font-semibold text-[var(--muted)]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingEdit}
                      className="btn-primary inline-flex cursor-pointer items-center gap-2 px-4 py-2.5 text-xs disabled:opacity-50"
                    >
                      {isSavingEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      Save changes
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
