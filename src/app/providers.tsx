'use client';

import { DocumentTitleProvider } from '@/components/DocumentTitle';
import NavigationProgress from '@/components/NavigationProgress';
import { ToastProvider } from '@/components/ui/Toast';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <NavigationProgress />
      <DocumentTitleProvider>{children}</DocumentTitleProvider>
    </ToastProvider>
  );
}
