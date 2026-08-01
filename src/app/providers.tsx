'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { DocumentTitleProvider } from '@/components/DocumentTitle';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      afterSignOutUrl="/login"
      signInUrl="/login"
      signUpUrl="/login?tab=register"
    >
      <DocumentTitleProvider>{children}</DocumentTitleProvider>
    </ClerkProvider>
  );
}
