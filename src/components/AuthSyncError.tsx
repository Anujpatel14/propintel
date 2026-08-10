'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { BrandMark } from '@/components/BrandLogo';

type SyncResponse = {
  ok?: boolean;
  status?: string;
  reason?: string;
  clerkId?: string;
};

/**
 * Clerk session exists but PropIntel user sync failed.
 * Actively calls /api/auth/sync until the DB user exists, then enters the dashboard.
 */
export default function AuthSyncError({
  clerkId,
  reason: initialReason,
}: {
  clerkId?: string;
  reason?: string;
}) {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [reason, setReason] = useState(initialReason || '');
  const [busy, setBusy] = useState(false);
  const cancelled = useRef(false);

  const trySync = useCallback(async () => {
    if (cancelled.current) return;
    setBusy(true);
    setAttempt((n) => n + 1);
    try {
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const data = (await res.json().catch(() => ({}))) as SyncResponse;

      if (data.ok && data.status === 'ready') {
        window.location.replace('/dashboard');
        return;
      }

      if (data.status === 'suspended') {
        window.location.replace('/login?error=suspended');
        return;
      }

      if (data.reason) setReason(data.reason);
      // Soft refresh server components after a few tries
      if (attempt > 0 && attempt % 3 === 0) router.refresh();
    } catch (err) {
      setReason(err instanceof Error ? err.message : 'Network error while syncing');
    } finally {
      setBusy(false);
    }
  }, [attempt, router]);

  useEffect(() => {
    cancelled.current = false;
    void trySync();
    const id = window.setInterval(() => {
      void trySync();
    }, 2500);
    return () => {
      cancelled.current = true;
      window.clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount; trySync self-updates
  }, []);

  const hint =
    reason.includes('DATABASE_URL') || reason.includes('Can\'t reach')
      ? 'Set DATABASE_URL (and DIRECT_URL) in Vercel env to your Neon Postgres database, then redeploy.'
      : reason.includes('does not exist')
        ? 'Your production database is missing tables. Run `npx prisma db push` against the production DATABASE_URL.'
        : reason.includes('CLERK_SECRET')
          ? 'Clerk secret/publishable keys may be mismatched between Vercel and the Clerk dashboard.'
          : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#070b14] px-5 py-12 text-white">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white p-6 text-[#0b1220] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.65)] sm:p-8">
        <div className="flex items-center gap-2.5">
          <BrandMark size={32} />
          <span className="font-display text-xl font-bold tracking-tight">PropIntel</span>
        </div>

        <h1 className="mt-6 font-display text-2xl font-bold tracking-tight">
          Finishing your workspace…
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#5b6578]">
          You&apos;re signed in with Clerk. We&apos;re creating your investor account in the database
          now.
        </p>

        <div className="mt-5 flex items-center gap-2 rounded-xl bg-[#f3f6fb] px-3 py-2.5 text-xs text-[#5b6578]">
          <Loader2 className={`h-3.5 w-3.5 text-[#1d4ed8] ${busy ? 'animate-spin' : ''}`} />
          {attempt === 0 ? 'Starting sync…' : `Sync attempt #${attempt}`}
        </div>

        {reason ? (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-950">
            <div className="font-semibold">Sync detail</div>
            <div className="mt-1 break-words opacity-90">{reason}</div>
            {hint ? <div className="mt-2 font-medium text-amber-900">{hint}</div> : null}
          </div>
        ) : null}

        {clerkId ? (
          <p className="mt-3 truncate text-[10px] text-[#94a3b8]">Session: {clerkId}</p>
        ) : null}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={busy}
            onClick={() => void trySync()}
            className="inline-flex items-center justify-center rounded-xl bg-[#1d4ed8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1639a8] disabled:opacity-60"
          >
            {busy ? 'Syncing…' : 'Retry sync'}
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl border border-[rgba(11,18,32,0.12)] px-4 py-2.5 text-sm font-semibold text-[#5b6578] transition hover:bg-[#f3f6fb]"
          >
            Reload dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
