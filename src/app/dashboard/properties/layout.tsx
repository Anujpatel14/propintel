import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Properties',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
