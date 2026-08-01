'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Building2, ShieldAlert, User, Shield, ArrowRight, Loader2 } from 'lucide-react';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { loginUserAction } from './actions';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const redirectTo = searchParams.get('redirect');

  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(tabParam === 'register' ? 'register' : 'signin');
  }, [tabParam]);

  const finishLogin = (role: 'ADMIN' | 'INVESTOR' | string) => {
    const fallback = role === 'ADMIN' ? '/admin' : '/dashboard';
    const target =
      redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')
        ? redirectTo
        : fallback;
    router.push(target);
    router.refresh();
  };

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(email);
    setError(null);
    try {
      await loginUserAction(email);
    } catch (err: unknown) {
      if (isRedirectError(err)) {
        finishLogin(email.toLowerCase().includes('admin') ? 'ADMIN' : 'INVESTOR');
        return;
      }
      const message = err instanceof Error ? err.message : 'Login failed. Try a sandbox profile.';
      setError(message);
      setIsLoading(null);
    }
  };

  const handleQuickLogin = async (targetEmail: string) => {
    setIsLoading(targetEmail);
    setError(null);
    try {
      await loginUserAction(targetEmail);
    } catch (err: unknown) {
      if (isRedirectError(err)) {
        finishLogin(targetEmail.includes('admin') ? 'ADMIN' : 'INVESTOR');
        return;
      }
      const message = err instanceof Error ? err.message : 'Login failed.';
      setError(message);
      setIsLoading(null);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12">
      <div className="pointer-events-none absolute inset-0 blueprint-grid opacity-50" />
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-teal-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-72 w-72 rounded-full bg-[#c4a050]/15 blur-3xl" />

      <div className="relative z-10 w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white">
              <Building2 className="h-5 w-5" />
            </span>
            <span className="font-display text-3xl tracking-tight">PropIntel</span>
          </Link>
          <p className="mt-3 text-sm text-[var(--muted)]">
            {activeTab === 'signin' ? 'Welcome back to your workspace' : 'Create your investor workspace'}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface-card p-7 sm:p-8"
        >
          <div className="relative mb-6 grid grid-cols-2 rounded-xl bg-[var(--surface-soft)] p-1">
            <button
              type="button"
              onClick={() => setActiveTab('signin')}
              className={`relative z-10 cursor-pointer rounded-lg py-2.5 text-sm font-semibold transition ${
                activeTab === 'signin' ? 'text-teal-50' : 'text-[var(--muted)]'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={`relative z-10 cursor-pointer rounded-lg py-2.5 text-sm font-semibold transition ${
                activeTab === 'register' ? 'text-teal-50' : 'text-[var(--muted)]'
              }`}
            >
              Sign up
            </button>
            <motion.div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-teal-700"
              animate={{ left: activeTab === 'register' ? 'calc(50% + 2px)' : '4px' }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            />
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCustomLogin} className="space-y-4">
            {activeTab === 'register' && (
              <>
                <Field label="Full name">
                  <input
                    type="text"
                    placeholder="Alex Investor"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="glass-input w-full px-3.5 py-2.5 text-sm"
                  />
                </Field>
                <Field label="Company">
                  <input
                    type="text"
                    placeholder="Apex Equity Partners"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="glass-input w-full px-3.5 py-2.5 text-sm"
                  />
                </Field>
              </>
            )}

            <Field label="Email">
              <input
                type="email"
                required
                placeholder="investor@propintel.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input w-full px-3.5 py-2.5 text-sm"
              />
            </Field>

            <Field label="Password (demo — any value)">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="glass-input w-full px-3.5 py-2.5 text-sm"
              />
            </Field>

            <p className="text-[11px] leading-relaxed text-[var(--muted-foreground)]">
              Demo mode: click a sandbox profile below (recommended), or enter{' '}
              <strong>investor@propintel.com</strong> / <strong>admin@propintel.com</strong>.
            </p>

            <button
              type="submit"
              disabled={isLoading !== null}
              className="btn-primary flex w-full cursor-pointer items-center justify-center gap-2 py-3 text-sm disabled:opacity-50"
            >
              {isLoading === email ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {activeTab === 'signin' ? 'Access workspace' : 'Create account'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 space-y-3 border-t border-[var(--border)] pt-6">
            <p className="text-center text-[11px] font-bold tracking-[0.16em] text-[var(--muted-foreground)] uppercase">
              Sandbox access
            </p>

            <QuickLogin
              email="investor@propintel.com"
              title="Investor sandbox"
              badge="PRO"
              loading={isLoading === 'investor@propintel.com'}
              disabled={isLoading !== null}
              onClick={() => handleQuickLogin('investor@propintel.com')}
              icon={<User className="h-4 w-4" />}
            />
            <QuickLogin
              email="admin@propintel.com"
              title="Admin control desk"
              badge="ADMIN"
              loading={isLoading === 'admin@propintel.com'}
              disabled={isLoading !== null}
              onClick={() => handleQuickLogin('admin@propintel.com')}
              icon={<Shield className="h-4 w-4" />}
              accent="brass"
            />
          </div>
        </motion.div>

        <div className="text-center">
          <Link href="/" className="text-xs font-medium text-[var(--muted)] transition hover:text-teal-800">
            ← Back to PropIntel
          </Link>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-bold tracking-wider text-[var(--muted)] uppercase">{label}</span>
      {children}
    </label>
  );
}

function QuickLogin({
  email,
  title,
  badge,
  loading,
  disabled,
  onClick,
  icon,
  accent = 'teal',
}: {
  email: string;
  title: string;
  badge: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  accent?: 'teal' | 'brass';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex w-full cursor-pointer items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3.5 text-left transition hover:border-teal-700/25 disabled:opacity-50"
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            accent === 'brass' ? 'bg-[#c4a050]/15 text-[#8a6a28]' : 'bg-teal-700/10 text-teal-800'
          }`}
        >
          {icon}
        </div>
        <div>
          <div className="text-sm font-bold text-foreground group-hover:text-teal-800">{title}</div>
          <div className="text-[11px] text-[var(--muted)]">{email}</div>
        </div>
      </div>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-teal-700" />
      ) : (
        <span
          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
            accent === 'brass' ? 'bg-[#c4a050]/20 text-[#8a6a28]' : 'bg-teal-700/10 text-teal-800'
          }`}
        >
          {badge}
        </span>
      )}
    </button>
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
