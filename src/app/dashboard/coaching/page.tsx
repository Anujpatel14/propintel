'use client';

import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Video, 
  Clock, 
  User, 
  Check, 
  ArrowRight,
  Sparkles,
  Loader2
} from 'lucide-react';
import SpotlightCard from '@/components/ui/SpotlightCard';

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

const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'book-1',
    coach: 'Marcus Sterling',
    topic: 'Rehab Budget Underwriting Audit',
    date: '2026-08-04',
    time: '14:00 - 14:45 EST',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    status: 'CONFIRMED',
  }
];

export default function CoachingPortalPage() {
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [selectedCoach, setSelectedCoach] = useState(COACHES[0].name);
  const [bookingTopic, setBookingTopic] = useState('Deal Underwriting Strategy Review');
  const [bookingDate, setBookingDate] = useState('2026-08-10');
  const [bookingTime, setBookingTime] = useState('10:00 AM');
  
  const [isBooking, setIsBooking] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setIsBooking(true);

    setTimeout(() => {
      const newBooking: Booking = {
        id: `book_${Date.now()}`,
        coach: selectedCoach,
        topic: bookingTopic,
        date: bookingDate,
        time: `${bookingTime} - ${bookingTime.split(':')[0]}:45 ${bookingTime.includes('PM') ? 'PM' : 'AM'} EST`,
        meetingLink: `https://meet.google.com/sim-${Math.random().toString(36).substring(3, 10)}`,
        status: 'CONFIRMED',
      };

      setBookings(prev => [newBooking, ...prev]);
      setIsBooking(false);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 4000);
    }, 1000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="border-b border-[var(--border)] pb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground flex items-center gap-2">
          Investor Coaching Desk
        </h1>
        <p className="text-sm text-[var(--muted)]">Book 1-on-1 strategizing sessions with master real estate underwriters.</p>
      </div>

      {/* Grid: Booking Scheduler & Upcoming list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Booking Form */}
        <div className="lg:col-span-7">
          <div className="glass-panel border border-[var(--border)] rounded-2xl p-6 space-y-6">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-800" /> Schedule a Strategy Call
            </h2>

            {successMsg && (
              <div className="bg-teal-700/10 border border-teal-700/20 text-teal-800 p-4 rounded-xl text-xs flex gap-2 items-center">
                <Check className="w-4 h-4 text-teal-800 shrink-0" />
                <span>Call booked successfully! Meeting link was injected into your dashboard schedule below.</span>
              </div>
            )}

            <form onSubmit={handleCreateBooking} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs text-[var(--muted)] font-semibold uppercase">Choose Advisor</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {COACHES.map((coach) => (
                    <button
                      key={coach.name}
                      type="button"
                      onClick={() => setSelectedCoach(coach.name)}
                      className={`text-left p-3.5 border rounded-xl transition-all cursor-pointer flex flex-col justify-between h-24 ${selectedCoach === coach.name ? 'border-emerald-500 bg-teal-700/5 text-foreground' : 'border-[var(--border)] bg-[var(--surface-soft)] hover:border-[var(--border)] text-[var(--muted)]'}`}
                    >
                      <div className="w-6 h-6 rounded-md bg-[var(--surface-soft)] flex items-center justify-center font-bold text-xs">
                        {coach.avatar}
                      </div>
                      <div>
                        <div className="text-[10px] font-bold truncate text-foreground">{coach.name}</div>
                        <div className="text-[8px] text-[var(--muted-foreground)] truncate leading-none mt-0.5">{coach.specialty}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[var(--muted)] font-semibold uppercase">Topic of Discussion</label>
                <input
                  type="text"
                  required
                  value={bookingTopic}
                  onChange={(e) => setBookingTopic(e.target.value)}
                  className="w-full glass-input px-3.5 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-[var(--muted)] font-semibold uppercase">Select Date</label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full glass-input px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-[var(--muted)] font-semibold uppercase">Select Time</label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full glass-input px-3 py-2 text-sm bg-white text-foreground"
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
                className="w-full bg-teal-700 hover:bg-teal-600 disabled:bg-teal-700/50 text-white font-bold py-3.5 rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg "
              >
                {isBooking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarIcon className="w-4 h-4" />}
                {isBooking ? 'Registering Schedule...' : 'Schedule Coaching Session'}
              </button>

            </form>
          </div>
        </div>

        {/* Right Side: Upcoming schedule list */}
        <div className="lg:col-span-5 space-y-6">
          <SpotlightCard className="p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Scheduled Calls</h3>
            
            <div className="space-y-4">
              {bookings.map((b) => (
                <div 
                  key={b.id}
                  className="bg-[var(--surface-soft)] border border-[var(--border)] rounded-xl p-4 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <span className="bg-teal-700/15 text-teal-800 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase">
                        {b.status}
                      </span>
                      <h4 className="text-xs font-bold text-foreground mt-1.5">{b.topic}</h4>
                    </div>
                    <span className="text-[10px] text-[var(--muted-foreground)] font-semibold">{b.date}</span>
                  </div>

                  <div className="flex flex-col gap-1.5 text-[10px] text-[var(--muted)] pt-2 border-t border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-teal-700" />
                      <span>Coach: <strong>{b.coach}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-teal-700" />
                      <span>TimeSlot: {b.time}</span>
                    </div>
                  </div>

                  <a
                    href={b.meetingLink}
                    target="_blank"
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#0e1a16]/10 hover:bg-[#0e1a16]/20 border border-indigo-500/20 text-indigo-300 font-semibold py-2 rounded-lg text-[10px] transition-all"
                  >
                    <Video className="w-3.5 h-3.5 text-teal-800" /> Open Meeting Link
                  </a>
                </div>
              ))}
            </div>
          </SpotlightCard>
        </div>

      </div>

    </div>
  );
}
