'use server';

import { signInMockUser, signOutMockUser } from '@/lib/services/auth';
import { redirect } from 'next/navigation';

export async function loginUserAction(email: string) {
  const session = await signInMockUser(email);
  if (!session) {
    throw new Error('Invalid email or credentials. Use a sandbox profile below.');
  }

  if (session.role === 'ADMIN') {
    redirect('/admin');
  } else {
    redirect('/dashboard');
  }
}

export async function logoutUserAction() {
  await signOutMockUser();
  redirect('/');
}
