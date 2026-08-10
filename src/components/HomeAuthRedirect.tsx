'use client';

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

/**
 * After first-time Clerk auth, users sometimes land on `/` (Clerk app home).
 * Send authenticated visitors from the marketing home into the workspace.
 */
export default function HomeAuthRedirect() {
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    window.location.replace('/dashboard');
  }, [isLoaded, isSignedIn]);

  return null;
}
