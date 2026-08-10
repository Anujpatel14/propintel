'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { BrandMark } from '@/components/BrandLogo';

/**
 * Clerk session exists but PropIntel user sync failed.
 * Do NOT sign the user out — let them retry into /dashboard.
 */
export default function AuthSyncError({ clerkId }: { clerkId?: string }) {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [autoTried, setAutoTried] = useState(false);

  useEffect(() => {
    if (autoTried) return;
    setAutoTried(true);
    const t = window.setTimeout(() => {
      setAttempt((n) => n + 1);
      router.refresh();
    }, 1200);
    return () => window.clearTimeout(t);
  }, [autoTried, router]);

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
          You&apos;re signed in, but we couldn&apos;t sync your investor account yet. This is usually a
          brief database hiccup right after sign-up.
        </p>

        <div className="mt-5 flex items-center gap-2 rounded-xl bg-[#f3f6fb] px-3 py-2.5 text-xs text-[#5b6578]">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#1d4ed8]" />
          {attempt === 0 ? 'Retrying automatically…' : `Retry #${attempt} — tap below if it stalls.`}
        </div>

        {clerkId ? (
          <p className="mt-3 truncate text-[10px] text-[#94a3b8]">Session: {clerkId}</p>
        ) : null}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              setAttempt((n) => n + 1);
              router.refresh();
            }}
            className="inline-flex items-center justify-center rounded-xl bg-[#1d4ed8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1639a8]"
          >
            Open investor panel
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
