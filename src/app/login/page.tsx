'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { SignIn, SignUp, useAuth, useClerk } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { usePageTitle } from '@/components/DocumentTitle';
import { clerkAuthAppearance } from '@/lib/clerkAppearance';

const SUSPENDED_FLAG = 'pi_show_suspended';

function LoginPageContent() {
  const router = useRouter();
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

  const [showSuspended, setShowSuspended] = useState(false);
  const [clearingSuspended, setClearingSuspended] = useState(false);
  const suspendedHandled = useRef(false);
  const sessionHandled = useRef(false);
  const forwardHandled = useRef(false);

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

  // Restore suspended banner without keeping ?error=suspended in the URL (avoids remount loops).
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SUSPENDED_FLAG) === '1') {
        setShowSuspended(true);
        sessionStorage.removeItem(SUSPENDED_FLAG);
      }
    } catch {
      /* ignore */
    }
  }, []);

  /**
   * Legacy ?error=session loop breaker:
   * Old builds sent sync failures here and signed the user out forever.
   * Always leave this URL — send signed-in users to the dashboard, otherwise clean /login.
   */
  useEffect(() => {
    if (!isLoaded || !sessionError || sessionHandled.current) return;
    sessionHandled.current = true;
    if (isSignedIn) {
      window.location.replace(afterAuthUrl);
      return;
    }
    router.replace(isRegister ? '/login?tab=register' : '/login');
  }, [isLoaded, sessionError, isSignedIn, afterAuthUrl, router, isRegister]);

  /**
   * Suspended: sign out once, then land on clean /login with a one-shot banner.
   * Never redirect back to ?error=suspended (that remounts and loops).
   */
  useEffect(() => {
    if (!isLoaded || !suspendedError || suspendedHandled.current) return;
    suspendedHandled.current = true;
    setClearingSuspended(true);

    void (async () => {
      try {
        try {
          sessionStorage.setItem(SUSPENDED_FLAG, '1');
        } catch {
          /* ignore */
        }
        await signOut({ redirectUrl: '/login' });
      } catch {
        /* fall through */
      }
      window.location.replace('/login');
    })();
  }, [isLoaded, suspendedError, signOut]);

  // Signed-in users on a clean login page → investor panel (skip while clearing suspended).
  useEffect(() => {
    if (!isLoaded || !isSignedIn || suspendedError || clearingSuspended || sessionError) return;
    if (forwardHandled.current) return;
    forwardHandled.current = true;
    window.location.replace(afterAuthUrl);
  }, [isLoaded, isSignedIn, suspendedError, clearingSuspended, sessionError, afterAuthUrl]);

  if (!isLoaded || clearingSuspended || sessionError || (isSignedIn && !showSuspended)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#070b14] px-5 text-sm text-white/55">
        <Loader2 className="h-8 w-8 animate-spin text-[#93c5fd]" />
        {clearingSuspended
          ? 'Signing out…'
          : sessionError
            ? 'Recovering your session…'
            : isSignedIn
              ? 'Opening your investor workspace…'
              : 'Loading…'}
        {sessionError ? (
          <p className="max-w-xs text-center text-xs text-white/40">
            Breaking a stuck redirect — you should land in the dashboard next.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-start justify-center overflow-x-clip bg-[#070b14] px-4 py-10 text-white sm:items-center sm:px-5 sm:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(29,78,216,0.35),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(14,165,233,0.12),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.55)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.55)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_75%)]" />

      <div className="relative z-10 w-full max-w-[420px] min-w-0 space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex justify-center">
            <BrandLogo markSize={40} className="[&_span]:text-white" />
          </Link>
          <p className="mt-3 text-sm text-white/60">
            {isRegister
              ? 'Create your investor workspace'
              : resetRequested
                ? 'Use “Forgot password?” below to reset via email'
                : isAdminEntry
                  ? 'Sign in to the PropIntel ops console'
                  : 'Sign in to your workspace'}
          </p>
        </div>

        {showSuspended ? (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-xs text-red-100">
            Your account has been suspended by an administrator. Contact support if you believe this
            is a mistake.
          </div>
        ) : null}

        {resetRequested && !isRegister ? (
          <div className="rounded-xl border border-[#1d4ed8]/35 bg-[#1d4ed8]/15 px-4 py-3 text-xs text-[#dbe7ff]">
            Password reset requested for{' '}
            <strong>{prefillEmail || 'your account'}</strong>. Open{' '}
            <strong>Forgot password?</strong> on the form to receive a reset email.
          </div>
        ) : null}

        <div className="clerk-auth overflow-hidden rounded-2xl bg-white shadow-[0_30px_80px_-40px_rgba(0,0,0,0.65)]">
          {isRegister ? (
            <SignUp
              routing="hash"
              forceRedirectUrl={afterAuthUrl}
              fallbackRedirectUrl={afterAuthUrl}
              signInForceRedirectUrl={afterAuthUrl}
              signInFallbackRedirectUrl={afterAuthUrl}
              signInUrl="/login"
              appearance={clerkAuthAppearance}
            />
          ) : (
            <SignIn
              routing="hash"
              forceRedirectUrl={afterAuthUrl}
              fallbackRedirectUrl={afterAuthUrl}
              signUpForceRedirectUrl={afterAuthUrl}
              signUpFallbackRedirectUrl={afterAuthUrl}
              signUpUrl="/login?tab=register"
              appearance={clerkAuthAppearance}
              initialValues={prefillEmail ? { emailAddress: prefillEmail } : undefined}
            />
          )}
        </div>

        <p className="text-center text-sm text-white/55">
          {isRegister ? (
            <>
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-[#93c5fd] hover:underline">
                Sign in
              </Link>
            </>
          ) : (
            <>
              Need an account?{' '}
              <Link
                href="/login?tab=register"
                className="font-semibold text-[#93c5fd] hover:underline"
              >
                Sign up
              </Link>
            </>
          )}
        </p>

        <div className="text-center">
          <Link href="/" className="text-xs font-medium text-white/40 transition hover:text-white/75">
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
        <div className="flex min-h-screen items-center justify-center bg-[#070b14]">
          <Loader2 className="h-8 w-8 animate-spin text-[#93c5fd]" />
        </div>
      }
    >
      <LoginPageContent />
    </React.Suspense>
  );
}
