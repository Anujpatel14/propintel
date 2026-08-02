'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { SignIn, SignUp, useAuth, useClerk } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { usePageTitle } from '@/components/DocumentTitle';
import { clerkAuthAppearance } from '@/lib/clerkAppearance';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const tabParam = searchParams.get('tab');
  const redirectTo = searchParams.get('redirect');
  const sessionError = searchParams.get('error') === 'session';
  const resetRequested = searchParams.get('reset') === '1';
  const prefillEmail = searchParams.get('email') || '';
  const isRegister = tabParam === 'register';
  const [clearing, setClearing] = useState(sessionError);
  const clearedRef = useRef(false);

  usePageTitle(isRegister ? 'Sign up' : resetRequested ? 'Reset password' : 'Sign in');

  const afterAuthUrl =
    redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')
      ? redirectTo
      : '/dashboard';

  // Break redirect loop: Clerk cookie present but app user sync failed
  useEffect(() => {
    if (!isLoaded || !sessionError || clearedRef.current) return;
    clearedRef.current = true;
    setClearing(true);
    void (async () => {
      try {
        await signOut({ redirectUrl: '/login' });
      } catch {
        window.location.replace('/login');
      }
    })();
  }, [isLoaded, sessionError, signOut]);

  // Only auto-forward when signed in AND not recovering from a sync error
  useEffect(() => {
    if (!isLoaded || !isSignedIn || sessionError || clearing) return;
    router.replace(afterAuthUrl);
  }, [isLoaded, isSignedIn, sessionError, clearing, afterAuthUrl, router]);

  if (!isLoaded || clearing || (isSignedIn && !sessionError)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-sm text-[var(--muted)]">
        <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
        {clearing ? 'Refreshing your session…' : 'Loading…'}
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12">
      <div className="pointer-events-none absolute inset-0 blueprint-grid opacity-50" />
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-teal-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-72 w-72 rounded-full bg-[#c4a050]/15 blur-3xl" />

      <div className="relative z-10 w-full max-w-[420px] space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex justify-center">
            <BrandLogo markSize={40} />
          </Link>
          <p className="mt-3 text-sm text-[var(--muted)]">
            {isRegister
              ? 'Create your investor workspace'
              : resetRequested
                ? 'Use “Forgot password?” below to reset via email'
                : 'Sign in to your workspace'}
          </p>
        </div>

        {resetRequested && !isRegister ? (
          <div className="rounded-xl border border-teal-700/20 bg-teal-700/5 px-4 py-3 text-xs text-teal-900">
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
              <Link href="/login" className="font-semibold text-teal-800 hover:underline">
                Sign in
              </Link>
            </>
          ) : (
            <>
              Need an account?{' '}
              <Link
                href="/login?tab=register"
                className="font-semibold text-teal-800 hover:underline"
              >
                Sign up
              </Link>
            </>
          )}
        </p>

        <div className="text-center">
          <Link href="/" className="text-xs font-medium text-[var(--muted)] transition hover:text-teal-800">
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
          <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
        </div>
      }
    >
      <LoginPageContent />
    </React.Suspense>
  );
}
