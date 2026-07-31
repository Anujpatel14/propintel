import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/services/auth';
import { getUserSubscription } from '@/lib/services/stripe';
import { logoutUserAction } from '../login/actions';
import DashboardShell from '@/components/dashboard/DashboardShell';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  let planLabel = 'Free';
  try {
    const sub = await getUserSubscription(user.id);
    if (sub?.plan) {
      planLabel =
        sub.status === 'TRIALING' || sub.status === 'trialing'
          ? `${sub.plan} Trial`
          : String(sub.plan);
    } else {
      planLabel = 'PRO Trial';
    }
  } catch {
    planLabel = 'PRO Trial';
  }

  return (
    <DashboardShell
      user={{ name: user.name, email: user.email, role: user.role }}
      planLabel={planLabel}
      logoutAction={logoutUserAction}
    >
      {children}
    </DashboardShell>
  );
}
