import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getUserSubscription } from '@/lib/services/stripe';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { getAdminPanelSession } from '@/lib/adminAuth';
import { ADMIN_PANEL_PATH } from '@/lib/adminPath';
import { resolveAppUser } from '@/lib/services/auth';

export const metadata: Metadata = {
  title: 'Admin',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const panelSession = await getAdminPanelSession();

  if (panelSession) {
    return (
      <DashboardShell
        user={{
          name: panelSession.username,
          email: `${panelSession.username}@admin.local`,
          role: 'ADMIN',
        }}
        planLabel="ENTERPRISE"
        adminPasswordSession
      >
        {children}
      </DashboardShell>
    );
  }

  // Fallback: Clerk users who already have ADMIN role
  const resolved = await resolveAppUser();
  if (resolved.status === 'ready' && resolved.user.role === 'ADMIN') {
    let planLabel = 'ENTERPRISE';
    try {
      const sub = await getUserSubscription(resolved.user.id);
      if (sub?.plan) planLabel = String(sub.plan);
    } catch {
      planLabel = 'ENTERPRISE';
    }

    return (
      <DashboardShell
        user={{
          name: resolved.user.name,
          email: resolved.user.email,
          role: resolved.user.role,
        }}
        planLabel={planLabel}
      >
        {children}
      </DashboardShell>
    );
  }

  redirect(ADMIN_PANEL_PATH);
}
