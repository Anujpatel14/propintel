import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Coaching admin',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
