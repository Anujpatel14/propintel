import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/services/auth';
import AdminShell from '@/components/admin/AdminShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // Non-admins still render /admin denial UI without the ops shell
  if (user.role !== 'ADMIN') {
    return <>{children}</>;
  }

  return <AdminShell userEmail={user.email}>{children}</AdminShell>;
}
