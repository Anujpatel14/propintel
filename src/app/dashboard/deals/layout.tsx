import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Saved Deals',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
