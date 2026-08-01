'use client';

import { DocumentTitleProvider } from '@/components/DocumentTitle';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <DocumentTitleProvider>{children}</DocumentTitleProvider>;
}
