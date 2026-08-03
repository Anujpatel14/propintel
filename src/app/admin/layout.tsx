import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { resolveAppUser } from '@/lib/services/auth';
import { getUserSubscription } from '@/lib/services/stripe';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { ShieldAlert } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Admin',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const resolved = await resolveAppUser();

  if (resolved.status === 'anonymous') {
    redirect('/login?redirect=/admin');
  }

  if (resolved.status === 'sync_error') {
    redirect('/login?error=session');
  }

  const user = resolved.user;

  if (user.role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-6 text-foreground">
        <div className="surface-card w-full max-w-md space-y-6 border-red-200 bg-red-50 p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-red-200 bg-red-100">
            <ShieldAlert className="h-8 w-8 text-red-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-extrabold">Access denied</h1>
            <p className="text-xs text-[var(--muted)]">
              Admin routes are restricted. Your account (<strong>{user.email}</strong>) is an
              investor profile.
            </p>
          </div>
          <Link href="/dashboard" className="btn-primary inline-flex px-5 py-2.5 text-xs">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  let planLabel = 'ENTERPRISE';
  try {
    const sub = await getUserSubscription(user.id);
    if (sub?.plan) planLabel = String(sub.plan);
  } catch {
    planLabel = 'ENTERPRISE';
  }

  return (
    <DashboardShell
      user={{ name: user.name, email: user.email, role: user.role }}
      planLabel={planLabel}
    >
      {children}
    </DashboardShell>
  );
}
