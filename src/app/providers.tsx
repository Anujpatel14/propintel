'use client';

import { DocumentTitleProvider } from '@/components/DocumentTitle';
import { ToastProvider } from '@/components/ui/Toast';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <DocumentTitleProvider>{children}</DocumentTitleProvider>
    </ToastProvider>
  );
}
