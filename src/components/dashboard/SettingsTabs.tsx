'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/dashboard/settings/profile', label: 'Profile' },
  { href: '/dashboard/settings/underwriting', label: 'Underwriting' },
] as const;

/** Shared settings sub-nav used on profile + underwriting pages. */
export default function SettingsTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-2 text-xs">
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={
              active
                ? 'btn-primary px-3 py-2 text-xs'
                : 'rounded-xl border border-[var(--border)] px-3 py-2 font-semibold text-[var(--muted)] hover:bg-white'
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
