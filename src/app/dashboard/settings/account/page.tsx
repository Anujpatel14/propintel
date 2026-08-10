'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { UserProfile, useUser, useClerk, useAuth } from '@clerk/nextjs';
import {
  KeyRound,
  Mail,
  Shield,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import SettingsTabs from '@/components/dashboard/SettingsTabs';
import { Skeleton } from '@/components/ui/Skeleton';
import { clerkUserProfileAppearance } from '@/lib/clerkAppearance';

export default function AccountSettingsPage() {
  const { isLoaded, user } = useUser();
  const { signOut } = useClerk();
  const { sessionId } = useAuth();
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const email =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    '';

  const handleForgotPassword = async () => {
    if (!email) {
      setResetError('No email on this account.');
      return;
    }
    setResetting(true);
    setResetError(null);
    try {
      await signOut({
        redirectUrl: `/login?tab=login&reset=1&email=${encodeURIComponent(email)}`,
      });
    } catch (e) {
      setResetError(e instanceof Error ? e.message : 'Could not start password reset');
      setResetting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        title="Account & security"
        description="Change email, password, and sign-in settings. Investor profile details are on a separate tab."
        actions={<SettingsTabs />}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="surface-card space-y-3 p-5">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Mail className="h-4 w-4 text-blue-700" /> Change email
          </div>
          <p className="text-xs text-[var(--muted)]">
            Update your login email in the account manager below (Email addresses). Confirm the
            new address from your inbox.
          </p>
          <p className="rounded-lg bg-[var(--surface-soft)] px-3 py-2 text-xs font-semibold">
            {!isLoaded ? <Skeleton className="h-4 w-40" /> : <>Current: {email || '—'}</>}
          </p>
        </div>

        <div className="surface-card space-y-3 p-5">
          <div className="flex items-center gap-2 text-sm font-bold">
            <KeyRound className="h-4 w-4 text-blue-700" /> Password
          </div>
          <p className="text-xs text-[var(--muted)]">
            Change your password in Security below, or start a forgot-password email reset.
          </p>
          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={resetting || !isLoaded}
            className="inline-flex min-h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-bold hover:bg-[var(--surface-soft)] disabled:opacity-50"
          >
            {resetting ? 'Redirecting…' : 'Forgot password — email reset'}
          </button>
          {resetError && (
            <p className="flex items-start gap-1.5 text-[11px] text-red-700">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {resetError}
            </p>
          )}
        </div>

        <div className="surface-card space-y-3 p-5">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Shield className="h-4 w-4 text-blue-700" /> Investor profile
          </div>
          <p className="text-xs text-[var(--muted)]">
            Name, company, markets, and deal criteria are not managed here.
          </p>
          <Link
            href="/dashboard/settings/profile"
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-800 hover:underline"
          >
            Edit investor profile <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          {sessionId ? (
            <p className="text-[10px] text-[var(--muted-foreground)]">
              Active session secured by Clerk
            </p>
          ) : null}
        </div>
      </div>

      <div className="surface-card overflow-hidden p-3 sm:p-5">
        <div className="mb-4 border-b border-[var(--border)] px-1 pb-3">
          <h2 className="text-sm font-bold">Account manager</h2>
          <p className="text-xs text-[var(--muted)]">
            Email addresses, password, connected accounts, and active devices.
          </p>
        </div>
        {!isLoaded ? (
          <div className="space-y-3 p-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="clerk-user-profile">
            <UserProfile routing="hash" appearance={clerkUserProfileAppearance} />
          </div>
        )}
      </div>
    </div>
  );
}
