import Link from 'next/link';
import type { ReactNode } from 'react';
import { BrandMark } from '@/components/BrandLogo';

export function LegalDoc({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5 md:px-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <BrandMark size={28} />
            <span className="font-display text-lg font-bold tracking-tight">PropIntel</span>
          </Link>
          <Link href="/#pricing" className="text-sm text-white/60 transition hover:text-white">
            Back to site
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12 md:px-8 md:py-16">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#93c5fd]">Legal</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-white/45">Last updated {updated}</p>
        <div className="prose-legal mt-10 space-y-6 text-sm leading-relaxed text-white/70 md:text-base">
          {children}
        </div>
        <p className="mt-12 border-t border-white/10 pt-6 text-sm text-white/45">
          Questions?{' '}
          <a href="mailto:hello@propintel.com" className="font-semibold text-[#93c5fd] hover:underline">
            hello@propintel.com
          </a>
        </p>
      </main>
    </div>
  );
}
