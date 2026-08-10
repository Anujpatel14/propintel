'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { SignIn, SignUp, useAuth, useClerk } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { usePageTitle } from '@/components/DocumentTitle';
import { clerkAuthAppearance } from '@/lib/clerkAppearance';

function LoginPageContent() {
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const tabParam = searchParams.get('tab');
  const redirectTo = searchParams.get('redirect');
  const sessionError = searchParams.get('error') === 'session';
  const suspendedError = searchParams.get('error') === 'suspended';
  const resetRequested = searchParams.get('reset') === '1';
  const prefillEmail = searchParams.get('email') || '';
  const isRegister = tabParam === 'register';
  const [clearing, setClearing] = useState(sessionError || suspendedError);
  const [clearFailed, setClearFailed] = useState(false);
  const clearedRef = useRef(false);

  usePageTitle(isRegister ? 'Sign up' : resetRequested ? 'Reset password' : 'Sign in');

  const afterAuthUrl =
    redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')
      ? redirectTo
      : '/dashboard';

  const isAdminEntry =
    afterAuthUrl === '/admin' ||
    afterAuthUrl.startsWith('/admin/') ||
    afterAuthUrl === '/ops' ||
    afterAuthUrl.includes('pintel-4dmin-p4n3l-9f2a');

  // Break redirect loop: Clerk cookie present but app user sync failed / suspended.
  useEffect(() => {
    if (!isLoaded || (!sessionError && !suspendedError) || clearedRef.current) return;
    clearedRef.current = true;
    setClearing(true);
    setClearFailed(false);

    let finished = false;
    const finish = (failed = false) => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timeoutId);
      if (failed) {
        setClearing(false);
        setClearFailed(true);
        return;
      }
      window.location.replace(suspendedError ? '/login?error=suspended' : '/login');
    };

    const timeoutId = window.setTimeout(() => finish(true), 6000);

    void (async () => {
      try {
        await signOut({
          redirectUrl: suspendedError ? '/login?error=suspended' : '/login',
        });
        finish(false);
      } catch {
        finish(false);
      }
    })();

    return () => window.clearTimeout(timeoutId);
  }, [isLoaded, sessionError, suspendedError, signOut]);

  // Only auto-forward when signed in AND not recovering from a sync/suspend error.
  useEffect(() => {
    if (!isLoaded || !isSignedIn || sessionError || suspendedError || clearing) return;
    window.location.replace(afterAuthUrl);
  }, [isLoaded, isSignedIn, sessionError, suspendedError, clearing, afterAuthUrl]);

  if (!isLoaded || clearing || (isSignedIn && !sessionError && !suspendedError && !clearFailed)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-5 text-sm text-[var(--muted)]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
        {clearing ? 'Refreshing your session…' : isSignedIn ? 'Taking you to your workspace…' : 'Loading…'}
        {clearing ? (
          <p className="max-w-xs text-center text-xs text-[var(--muted)]">
            This should only take a moment. If it hangs, your database may not be configured yet.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-start justify-center overflow-x-clip px-4 py-10 sm:items-center sm:px-5 sm:py-12">
      <div className="pointer-events-none absolute inset-0 blueprint-grid opacity-50" />
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-72 w-72 rounded-full bg-[#c4a050]/15 blur-3xl" />

      <div className="relative z-10 w-full max-w-[420px] min-w-0 space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex justify-center">
            <BrandLogo markSize={40} />
          </Link>
          <p className="mt-3 text-sm text-[var(--muted)]">
            {isRegister
              ? 'Create your investor workspace'
              : resetRequested
                ? 'Use “Forgot password?” below to reset via email'
                : isAdminEntry
                  ? 'Sign in to the PropIntel ops console'
                  : 'Sign in to your workspace'}
          </p>
        </div>

        {clearFailed ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-950">
            Session refresh timed out. Check that{' '}
            <code className="rounded bg-white/70 px-1">DATABASE_URL</code> is set in{' '}
            <code className="rounded bg-white/70 px-1">.env</code>, then sign in again.
            <div className="mt-2">
              <button
                type="button"
                className="font-semibold text-blue-800 underline"
                onClick={() => {
                  window.location.replace('/login');
                }}
              >
                Continue to sign in
              </button>
            </div>
          </div>
        ) : null}

        {suspendedError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
            Your account has been suspended by an administrator. Contact support if you believe this
            is a mistake.
          </div>
        ) : null}

        {resetRequested && !isRegister ? (
          <div className="rounded-xl border border-blue-700/20 bg-blue-700/5 px-4 py-3 text-xs text-blue-900">
            Password reset requested for{' '}
            <strong>{prefillEmail || 'your account'}</strong>. Open{' '}
            <strong>Forgot password?</strong> on the form to receive a reset email.
          </div>
        ) : null}

        {isRegister ? (
          <SignUp
            routing="hash"
            forceRedirectUrl={afterAuthUrl}
            fallbackRedirectUrl={afterAuthUrl}
            signInUrl="/login"
            appearance={clerkAuthAppearance}
          />
        ) : (
          <SignIn
            routing="hash"
            forceRedirectUrl={afterAuthUrl}
            fallbackRedirectUrl={afterAuthUrl}
            signUpUrl="/login?tab=register"
            appearance={clerkAuthAppearance}
            initialValues={prefillEmail ? { emailAddress: prefillEmail } : undefined}
          />
        )}

        <p className="text-center text-sm text-[var(--muted)]">
          {isRegister ? (
            <>
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-blue-800 hover:underline">
                Sign in
              </Link>
            </>
          ) : (
            <>
              Need an account?{' '}
              <Link
                href="/login?tab=register"
                className="font-semibold text-blue-800 hover:underline"
              >
                Sign up
              </Link>
            </>
          )}
        </p>

        <div className="text-center">
          <Link href="/" className="text-xs font-medium text-[var(--muted)] transition hover:text-blue-800">
            ← Back to PropIntel
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
        </div>
      }
    >
      <LoginPageContent />
    </React.Suspense>
  );
}
