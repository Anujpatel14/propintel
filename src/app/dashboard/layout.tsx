import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { resolveAppUser } from '@/lib/services/auth';
import { getUserSubscription } from '@/lib/services/stripe';
import DashboardShell from '@/components/dashboard/DashboardShell';
import DatabaseUnavailable from '@/components/DatabaseUnavailable';
import AuthSyncError from '@/components/AuthSyncError';

export const metadata: Metadata = {
  title: 'Overview',
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const resolved = await resolveAppUser();

  if (resolved.status === 'anonymous') {
    redirect('/login?redirect=/dashboard');
  }

  if (resolved.status === 'db_unavailable') {
    return <DatabaseUnavailable />;
  }

  if (resolved.status === 'sync_error') {
    // Keep the Clerk session — signing out here dumped new signups back on /login.
    return <AuthSyncError clerkId={resolved.clerkId} />;
  }

  if (resolved.status === 'suspended') {
    redirect('/login?error=suspended');
  }

  const user = resolved.user;

  let planLabel = 'Free';
  try {
    const sub = await getUserSubscription(user.id);
    if (sub?.plan) {
      planLabel =
        sub.status === 'TRIALING' || sub.status === 'trialing'
          ? `${sub.plan} Trial`
          : String(sub.plan);
    } else {
      planLabel = 'FREE';
    }
  } catch {
    planLabel = 'FREE';
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
