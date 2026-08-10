'use client';

import { DocumentTitleProvider } from '@/components/DocumentTitle';
import NavigationProgress from '@/components/NavigationProgress';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <NavigationProgress />
        <DocumentTitleProvider>{children}</DocumentTitleProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
