'use client';

import React, { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Check,
  Filter,
  Loader2,
  Plus,
  Search,
  Trash2,
  UserRound,
  Users,
  ArrowUpRight,
} from 'lucide-react';
import { SkeletonRows } from '@/components/ui/Skeleton';
import {
  createAdminCoachingExpert,
  deleteAdminCoachingExpert,
  getAdminCoachingSessions,
  listAdminCoachingExperts,
  updateAdminCoachingExpert,
  updateAdminCoachingSession,
} from '@/app/actions/adminExpandActions';

type SessionRow = {
  id: string;
  bookingDate: Date | string;
  status: string;
  meetingLink: string | null;
  coachName: string | null;
  expertId?: string | null;
  topic: string | null;
  notes: string | null;
  user: { email: string; name: string | null };
};

type ExpertRow = {
  id: string;
  name: string;
  specialty: string | null;
  bio: string | null;
  avatarInitial: string | null;
  isActive: boolean;
  sortOrder: number;
  _count?: { bookings: number };
};

const STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'EXPIRED', 'CANCELED'];

function formatDateInput(d: Date) {
  return d.toISOString().slice(0, 10);
}

function statusTone(status: string) {
  if (status === 'PENDING') return 'bg-[var(--amber-soft)] text-[var(--amber-fg)]';
  if (status === 'CONFIRMED') return 'bg-[var(--sky)] text-[var(--sky-fg)]';
  if (status === 'COMPLETED') return 'bg-[var(--success-soft)] text-[var(--success-fg)]';
  if (status === 'CANCELED' || status === 'EXPIRED')
    return 'bg-[var(--danger-soft)] text-[var(--danger-fg)]';
  return 'bg-[var(--surface-soft)] text-[var(--muted)]';
}

export default function AdminCoachingPage() {
  const [tab, setTab] = useState<'requests' | 'experts'>('requests');
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [experts, setExperts] = useState<ExpertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [person, setPerson] = useState('all');
  const [coach, setCoach] = useState('all');
  const [status, setStatus] = useState('PENDING');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [timeSlot, setTimeSlot] = useState('all');

  const [expertForm, setExpertForm] = useState({
    name: '',
    specialty: '',
    bio: '',
    avatarInitial: '',
  });
  const [editingExpertId, setEditingExpertId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ses, exp] = await Promise.all([
        getAdminCoachingSessions(),
        listAdminCoachingExperts(),
      ]);
      setSessions(ses.sessions as SessionRow[]);
      setExperts(exp.experts as ExpertRow[]);
    } catch (e) {
      console.error(e);
      setError('Could not load coaching data. Check your connection and try again.');
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

  const coachNames = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => {
      if (s.coachName) set.add(s.coachName);
    });
    experts.forEach((e) => set.add(e.name));
    return Array.from(set).sort();
  }, [sessions, experts]);

  const pendingCount = sessions.filter((s) => s.status === 'PENDING').length;
  const activeExperts = experts.filter((e) => e.isActive).length;

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
    data: { status?: string; notes?: string; coachName?: string; expertId?: string | null }
  ) => {
    startTransition(async () => {
      await updateAdminCoachingSession(id, data);
      await load();
    });
  };

  const saveExpert = () => {
    startTransition(async () => {
      if (editingExpertId) {
        await updateAdminCoachingExpert(editingExpertId, {
          name: expertForm.name,
          specialty: expertForm.specialty,
          bio: expertForm.bio,
          avatarInitial: expertForm.avatarInitial,
        });
      } else {
        await createAdminCoachingExpert({
          name: expertForm.name,
          specialty: expertForm.specialty,
          bio: expertForm.bio,
          avatarInitial: expertForm.avatarInitial,
        });
      }
      setExpertForm({ name: '', specialty: '', bio: '', avatarInitial: '' });
      setEditingExpertId(null);
      await load();
    });
  };

  const startEditExpert = (e: ExpertRow) => {
    setEditingExpertId(e.id);
    setExpertForm({
      name: e.name,
      specialty: e.specialty || '',
      bio: e.bio || '',
      avatarInitial: e.avatarInitial || '',
    });
    setTab('experts');
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--sky)] px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-[var(--sky-fg)] uppercase">
            Admin · Coaching
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-[var(--ink)]">
            Coaching desk
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-[var(--muted)]">
            Experts published here appear on the investor Coaching page. Confirm requests — no Meet
            links required.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/coaching"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs font-semibold text-[var(--muted)] hover:text-foreground"
          >
            Investor view <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <div className="flex rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 text-xs font-semibold shadow-sm">
            <button
              type="button"
              onClick={() => setTab('requests')}
              className={`rounded-lg px-3.5 py-2 transition ${
                tab === 'requests'
                  ? 'bg-[var(--ink)] text-[var(--background)]'
                  : 'text-[var(--muted)] hover:text-foreground'
              }`}
            >
              Requests
              {pendingCount > 0 ? (
                <span className="ml-2 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] text-[#0b1220]">
                  {pendingCount}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => setTab('experts')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 transition ${
                tab === 'experts'
                  ? 'bg-[var(--ink)] text-[var(--background)]'
                  : 'text-[var(--muted)] hover:text-foreground'
              }`}
            >
              <Users className="h-3.5 w-3.5" /> Experts
              <span className="ml-1 text-[10px] opacity-70">{activeExperts}</span>
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger-fg)]">
          {error}{' '}
          <button type="button" className="font-bold underline" onClick={() => load()}>
            Retry
          </button>
        </div>
      ) : null}

      {tab === 'experts' ? (
        <div className="grid gap-4 lg:grid-cols-5">
          <section className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] lg:col-span-2">
            <h2 className="font-display text-lg font-bold text-[var(--ink)]">
              {editingExpertId ? 'Edit expert' : 'Add expert'}
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              These profiles appear on the investor Coaching page.
            </p>
            <div className="mt-4 space-y-3">
              <label className="block space-y-1 text-xs font-semibold text-[var(--muted)]">
                Name *
                <input
                  value={expertForm.name}
                  onChange={(e) => setExpertForm({ ...expertForm, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--ink)]"
                  placeholder="Marcus Sterling"
                />
              </label>
              <label className="block space-y-1 text-xs font-semibold text-[var(--muted)]">
                Specialty
                <input
                  value={expertForm.specialty}
                  onChange={(e) => setExpertForm({ ...expertForm, specialty: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--ink)]"
                  placeholder="Fix & Flip / Construction"
                />
              </label>
              <label className="block space-y-1 text-xs font-semibold text-[var(--muted)]">
                Initials
                <input
                  value={expertForm.avatarInitial}
                  maxLength={2}
                  onChange={(e) =>
                    setExpertForm({ ...expertForm, avatarInitial: e.target.value.toUpperCase() })
                  }
                  className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--ink)]"
                  placeholder="MS"
                />
              </label>
              <label className="block space-y-1 text-xs font-semibold text-[var(--muted)]">
                Bio
                <textarea
                  value={expertForm.bio}
                  onChange={(e) => setExpertForm({ ...expertForm, bio: e.target.value })}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--ink)]"
                  placeholder="Short background for investors…"
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isPending || !expertForm.name.trim()}
                  onClick={saveExpert}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--cobalt)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingExpertId ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {editingExpertId ? 'Update' : 'Add expert'}
                </button>
                {editingExpertId ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingExpertId(null);
                      setExpertForm({ name: '', specialty: '', bio: '', avatarInitial: '' });
                    }}
                    className="rounded-xl border border-[var(--border)] px-3 text-sm font-semibold"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] lg:col-span-3">
            <h2 className="font-display text-lg font-bold text-[var(--ink)]">Published experts</h2>
            {loading ? (
              <div className="mt-4">
                <SkeletonRows rows={4} cols={1} />
              </div>
            ) : experts.length === 0 ? (
              <p className="mt-6 text-center text-sm text-[var(--muted)]">
                No experts yet — add the first one on the left.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {experts.map((e) => (
                  <li
                    key={e.id}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--cobalt)] text-sm font-bold text-white">
                        {(e.avatarInitial || e.name.charAt(0)).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-[var(--ink)]">
                          {e.name}
                          {!e.isActive ? (
                            <span className="ml-2 text-[10px] font-bold text-[var(--amber-fg)]">
                              Hidden
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          {e.specialty || 'Advisor'} · {e._count?.bookings ?? 0} bookings
                        </p>
                        {e.bio ? (
                          <p className="mt-1 line-clamp-2 text-[11px] text-[var(--muted)]">{e.bio}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => startEditExpert(e)}
                        className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-[11px] font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          startTransition(async () => {
                            await updateAdminCoachingExpert(e.id, { isActive: !e.isActive });
                            await load();
                          })
                        }
                        className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-[11px] font-semibold"
                      >
                        {e.isActive ? 'Hide' : 'Show'}
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => {
                          if (!window.confirm(`Delete ${e.name}?`)) return;
                          startTransition(async () => {
                            await deleteAdminCoachingExpert(e.id);
                            await load();
                          });
                        }}
                        className="rounded-lg border border-[var(--danger-border)] bg-[var(--danger-soft)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--danger-fg)]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : (
        <>
          <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)]">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold text-[var(--muted)]">
              <Filter className="h-3.5 w-3.5" /> Filters
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              <div className="relative xl:col-span-2">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] py-2 pr-3 pl-9 text-sm"
                />
              </div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm"
              >
                <option value="all">All statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm"
              >
                <option value="all">All investors</option>
                {people.map(([email, label]) => (
                  <option key={email} value={email}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                value={coach}
                onChange={(e) => setCoach(e.target.value)}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm"
              >
                <option value="all">All experts</option>
                {coachNames.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm"
              />
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm"
              >
                <option value="all">Any time</option>
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
            {loading ? (
              <div className="p-5">
                <SkeletonRows rows={6} cols={1} />
              </div>
            ) : filtered.length === 0 ? (
              <p className="px-5 py-14 text-center text-sm text-[var(--muted)]">
                No booking requests match these filters.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {filtered.map((s) => {
                  const dt = new Date(s.bookingDate);
                  return (
                    <li
                      key={s.id}
                      className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-start lg:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-[var(--ink)]">
                            {s.user.name || s.user.email}
                          </p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusTone(s.status)}`}
                          >
                            {s.status}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-[var(--muted)]">{s.user.email}</p>
                        <p className="mt-2 flex items-center gap-1 text-sm text-[var(--ink)]">
                          <UserRound className="h-3.5 w-3.5 text-[var(--cobalt)]" />
                          Wants <span className="font-semibold">{s.coachName || '—'}</span>
                        </p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {dt.toLocaleString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                          {s.topic ? ` · ${s.topic}` : ''}
                        </p>
                      </div>
                      <div className="flex w-full flex-col gap-2 sm:max-w-sm">
                        <div className="flex flex-wrap gap-2">
                          <select
                            value={s.expertId || ''}
                            onChange={(e) =>
                              updateField(s.id, {
                                expertId: e.target.value || null,
                              })
                            }
                            className="min-w-[140px] flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-semibold"
                          >
                            <option value="">Assign expert…</option>
                            {experts
                              .filter((ex) => ex.isActive)
                              .map((ex) => (
                                <option key={ex.id} value={ex.id}>
                                  {ex.name}
                                </option>
                              ))}
                          </select>
                          <select
                            value={s.status}
                            onChange={(e) => updateField(s.id, { status: e.target.value })}
                            className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-semibold"
                          >
                            {STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                          {s.status === 'PENDING' ? (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => updateField(s.id, { status: 'CONFIRMED' })}
                              className="rounded-xl bg-[var(--cobalt)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                            >
                              Confirm
                            </button>
                          ) : null}
                        </div>
                        <textarea
                          defaultValue={s.notes || ''}
                          placeholder="Admin notes for investor (optional)…"
                          rows={2}
                          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs"
                          onBlur={(e) => {
                            if (e.target.value !== (s.notes || '')) {
                              updateField(s.id, { notes: e.target.value });
                            }
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
