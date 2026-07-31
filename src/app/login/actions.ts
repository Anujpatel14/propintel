'use server';

import { signInMockUser, signOutMockUser } from '@/lib/services/auth';
import { redirect } from 'next/navigation';

export async function loginUserAction(email: string) {
  const normalized = email.trim().toLowerCase();
  const session = await signInMockUser(normalized);
  if (!session) {
    throw new Error(
      'Use a sandbox profile: investor@propintel.com or admin@propintel.com (custom emails need Clerk).'
    );
  }

  if (session.role === 'ADMIN') {
    redirect('/admin');
  } else {
    redirect('/dashboard');
  }
}

export async function logoutUserAction() {
  await signOutMockUser();
  redirect('/login');
}
