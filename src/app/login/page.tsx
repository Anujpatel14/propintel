'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { SignIn, SignUp, useAuth, useClerk } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { usePageTitle } from '@/components/DocumentTitle';

const clerkAppearance = {
  variables: {
    colorPrimary: '#0f766e',
    colorText: '#141a17',
    colorTextSecondary: '#5c6b63',
    colorBackground: '#ffffff',
    colorInputBackground: '#f4f6f3',
    colorInputText: '#141a17',
    borderRadius: '0.75rem',
    fontFamily: 'var(--font-body), system-ui, sans-serif',
  },
  elements: {
    rootBox: 'w-full',
    cardBox: 'w-full shadow-none',
    card: 'w-full border border-[var(--border)] bg-white shadow-none rounded-2xl',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    socialButtonsBlockButton:
      'border border-[var(--border)] bg-white hover:bg-[var(--surface-soft)] text-sm font-semibold',
    formButtonPrimary:
      'bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold shadow-none',
    formFieldInput: 'bg-[var(--surface-soft)] border-[var(--border)]',
    footerAction: 'hidden',
    footer: 'hidden',
    identityPreviewEditButton: 'text-teal-800',
  },
} as const;

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const tabParam = searchParams.get('tab');
  const redirectTo = searchParams.get('redirect');
  const sessionError = searchParams.get('error') === 'session';
  const isRegister = tabParam === 'register';
  const [clearing, setClearing] = useState(sessionError);
  const clearedRef = useRef(false);

  usePageTitle(isRegister ? 'Sign up' : 'Sign in');

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
            {isRegister ? 'Create your investor workspace' : 'Sign in to your workspace'}
          </p>
        </div>

        {isRegister ? (
          <SignUp
            routing="hash"
            forceRedirectUrl={afterAuthUrl}
            fallbackRedirectUrl={afterAuthUrl}
            signInUrl="/login"
            appearance={clerkAppearance}
          />
        ) : (
          <SignIn
            routing="hash"
            forceRedirectUrl={afterAuthUrl}
            fallbackRedirectUrl={afterAuthUrl}
            signUpUrl="/login?tab=register"
            appearance={clerkAppearance}
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
