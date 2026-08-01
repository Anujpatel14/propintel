'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Building2,
  Cpu,
  Calendar,
  FileEdit,
  ScrollText,
  Settings,
  ArrowLeft,
} from 'lucide-react';

const ADMIN_NAV = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
  { label: 'Deal intelligence', href: '/admin/deals', icon: Building2 },
  { label: 'API usage', href: '/admin/system/api-usage', icon: Cpu },
  { label: 'Coaching', href: '/admin/coaching', icon: Calendar },
  { label: 'CMS', href: '/admin/cms', icon: FileEdit },
  { label: 'Audit logs', href: '/admin/logs', icon: ScrollText },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail: string;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  return (
    <div className="flex min-h-screen bg-[var(--background)] text-foreground">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--border)] bg-white md:flex">
        <div className="border-b border-[var(--border)] px-4 py-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
            Admin desk
          </div>
          <div className="font-display text-xl">PropIntel</div>
          <div className="mt-1 truncate text-[10px] text-[var(--muted)]">{userEmail}</div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  active
                    ? 'bg-teal-700 text-white'
                    : 'text-[var(--muted)] hover:bg-teal-700/8 hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-[var(--border)] p-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--muted)] hover:bg-[var(--surface-soft)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Investor view
          </Link>
        </div>
      </aside>
      <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
    </div>
  );
}
