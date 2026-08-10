'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { usePageTitle } from '@/components/DocumentTitle';
import { ADMIN_PANEL_PATH } from '@/lib/adminPath';

/**
 * Username / password gate for the secret admin URL.
 */
export default function AdminGateClient() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  usePageTitle('Admin panel');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setError(data.error || 'Login failed');
        setBusy(false);
        return;
      }
      window.location.href = ADMIN_PANEL_PATH;
    } catch {
      setError('Could not reach the server. Try again.');
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-x-clip bg-[var(--background)] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 blueprint-grid opacity-40" />
      <div className="relative z-10 w-full max-w-[400px] space-y-5">
        <div className="text-center">
          <Link href="/" className="inline-flex justify-center">
            <BrandLogo markSize={36} />
          </Link>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--sky)] px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-[var(--sky-fg)] uppercase">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin panel
          </div>
          <h1 className="mt-3 font-display text-2xl font-bold text-[var(--ink)]">Admin login</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Enter your panel username and password.</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] sm:p-6"
        >
          <label className="block space-y-1.5">
            <span className="text-[10px] font-bold tracking-[0.12em] text-[var(--muted)] uppercase">
              Username
            </span>
            <input
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--cobalt)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cobalt)_25%,transparent)]"
              placeholder="admin"
              required
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-[10px] font-bold tracking-[0.12em] text-[var(--muted)] uppercase">
              Password
            </span>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] py-2.5 pr-11 pl-3.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--cobalt)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cobalt)_25%,transparent)]"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          {error ? (
            <p className="rounded-xl border border-[var(--danger-border)] bg-[var(--danger-soft)] px-3 py-2 text-xs font-semibold text-[var(--danger-fg)]">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="btn-primary flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {busy ? 'Signing in…' : 'Sign in to admin'}
          </button>
        </form>

        <p className="text-center text-[11px] text-[var(--muted)]">
          Investor workspace uses{' '}
          <Link href="/login" className="font-semibold text-[var(--cobalt)] hover:underline">
            /login
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
