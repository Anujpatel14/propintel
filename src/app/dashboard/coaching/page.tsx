'use client';

import React, { useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Video,
  Clock,
  User,
  Check,
  Sparkles,
  Loader2,
} from 'lucide-react';
import SpotlightCard from '@/components/ui/SpotlightCard';
import {
  bookCoachingSession,
  getUserCoachingSessions,
} from '@/app/actions/coachingActions';

interface Booking {
  id: string;
  coach: string;
  topic: string;
  date: string;
  time: string;
  meetingLink: string;
  status: string;
}

const COACHES = [
  { name: 'Marcus Sterling', specialty: 'Fix & Flip / Construction Mgmt', avatar: 'M' },
  { name: 'Diana Jenkins', specialty: 'Buy & Hold / DSCR Lending', avatar: 'D' },
  { name: 'Elena Rostova', specialty: 'Wholesaling & Cold Outreach', avatar: 'E' },
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

export default function CoachingPortalPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCoach, setSelectedCoach] = useState(COACHES[0].name);
  const [bookingTopic, setBookingTopic] = useState('Deal Underwriting Strategy Review');
  const [bookingDate, setBookingDate] = useState('2026-08-10');
  const [bookingTime, setBookingTime] = useState('10:00 AM');
  const [isBooking, setIsBooking] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const loadSessions = async () => {
    try {
      const result = await getUserCoachingSessions();
      if (result.success) {
        setBookings(
          result.sessions.map((s) => {
            const dt = new Date(s.bookingDate);
            return {
              id: s.id,
              coach: s.coachName || 'Assigned Advisor',
              topic: s.topic || 'Strategy Session',
              date: dt.toISOString().split('T')[0],
              time: dt.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              }),
              meetingLink: s.meetingLink || 'https://meet.google.com/propintel-coaching',
              status: s.status,
            };
          })
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBooking(true);

    try {
      const { hours, minutes } = parseTimeToHours(bookingTime);
      const [year, month, day] = bookingDate.split('-').map(Number);
      const scheduled = new Date(year, month - 1, day, hours, minutes);

      const meetingLink = `https://meet.google.com/sim-${Math.random().toString(36).substring(3, 10)}`;
      const result = await bookCoachingSession(scheduled, meetingLink, {
        coachName: selectedCoach,
        topic: bookingTopic,
      });

      if (result.success && result.coaching) {
        const c = result.coaching;
        const dt = new Date(c.bookingDate);
        setBookings((prev) => [
          {
            id: c.id,
            coach: selectedCoach,
            topic: bookingTopic,
            date: dt.toISOString().split('T')[0],
            time: `${bookingTime} EST`,
            meetingLink: c.meetingLink || meetingLink,
            status: c.status,
          },
          ...prev,
        ]);
        setSuccessMsg(true);
        setTimeout(() => setSuccessMsg(false), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="border-b border-[var(--border)] pb-6">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-foreground md:text-3xl">
          Investor Coaching Desk
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Book 1-on-1 strategizing sessions with master real estate underwriters.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="glass-panel space-y-6 rounded-2xl border border-[var(--border)] p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
              <Sparkles className="h-5 w-5 text-teal-800" /> Schedule a Strategy Call
            </h2>

            {successMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-teal-700/20 bg-teal-700/10 p-4 text-xs text-teal-800">
                <Check className="h-4 w-4 shrink-0 text-teal-800" />
                <span>
                  Call booked successfully! Meeting link was injected into your dashboard schedule
                  below.
                </span>
              </div>
            )}

            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--muted)] uppercase">
                  Choose Advisor
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {COACHES.map((coach) => (
                    <button
                      key={coach.name}
                      type="button"
                      onClick={() => setSelectedCoach(coach.name)}
                      className={`flex h-24 cursor-pointer flex-col justify-between rounded-xl border p-3.5 text-left transition-all ${selectedCoach === coach.name ? 'border-emerald-500 bg-teal-700/5 text-foreground' : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted)] hover:border-[var(--border)]'}`}
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--surface-soft)] text-xs font-bold">
                        {coach.avatar}
                      </div>
                      <div>
                        <div className="truncate text-[10px] font-bold text-foreground">
                          {coach.name}
                        </div>
                        <div className="mt-0.5 truncate text-[8px] leading-none text-[var(--muted-foreground)]">
                          {coach.specialty}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--muted)] uppercase">
                  Topic of Discussion
                </label>
                <input
                  type="text"
                  required
                  value={bookingTopic}
                  onChange={(e) => setBookingTopic(e.target.value)}
                  className="glass-input w-full px-3.5 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">
                    Select Date
                  </label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="glass-input w-full px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">
                    Select Time
                  </label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="glass-input w-full bg-white px-3 py-2 text-sm text-foreground"
                  >
                    <option value="9:00 AM">9:00 AM EST</option>
                    <option value="10:00 AM">10:00 AM EST</option>
                    <option value="11:30 AM">11:30 AM EST</option>
                    <option value="1:00 PM">1:00 PM EST</option>
                    <option value="3:30 PM">3:30 PM EST</option>
                    <option value="5:00 PM">5:00 PM EST</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isBooking}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-teal-700 py-3.5 text-xs font-bold text-white shadow-lg transition-all hover:bg-teal-600 disabled:bg-teal-700/50"
              >
                {isBooking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CalendarIcon className="h-4 w-4" />
                )}
                {isBooking ? 'Registering Schedule...' : 'Schedule Coaching Session'}
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-5">
          <SpotlightCard className="space-y-4 p-5">
            <h3 className="text-xs font-bold tracking-wider text-[var(--muted)] uppercase">
              Scheduled Calls
            </h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-[var(--muted)]">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : bookings.length === 0 ? (
              <p className="py-6 text-center text-xs text-[var(--muted)]">
                No sessions booked yet.
              </p>
            ) : (
              <div className="space-y-4">
                {bookings.map((b) => (
                  <div
                    key={b.id}
                    className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <span className="rounded-full bg-teal-700/15 px-1.5 py-0.5 text-[8px] font-extrabold text-teal-800 uppercase">
                          {b.status}
                        </span>
                        <h4 className="mt-1.5 text-xs font-bold text-foreground">{b.topic}</h4>
                      </div>
                      <span className="text-[10px] font-semibold text-[var(--muted-foreground)]">
                        {b.date}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5 border-t border-[var(--border)] pt-2 text-[10px] text-[var(--muted)]">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-teal-700" />
                        <span>
                          Coach: <strong>{b.coach}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-teal-700" />
                        <span>TimeSlot: {b.time}</span>
                      </div>
                    </div>

                    <a
                      href={b.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-500/20 bg-[#0e1a16]/10 py-2 text-[10px] font-semibold text-indigo-300 transition-all hover:bg-[#0e1a16]/20"
                    >
                      <Video className="h-3.5 w-3.5 text-teal-800" /> Open Meeting Link
                    </a>
                  </div>
                ))}
              </div>
            )}
          </SpotlightCard>
        </div>
      </div>
    </div>
  );
}
