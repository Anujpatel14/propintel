'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  LayoutDashboard,
  TrendingUp,
  Layers,
  FolderOpen,
  Calendar,
  CreditCard,
  LogOut,
  User,
  Menu,
  X,
  ShieldCheck,
  Settings,
  ArrowRightLeft,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Analyzer', href: '/dashboard/analyzer', icon: TrendingUp },
  { label: 'CRM Pipeline', href: '/dashboard/crm', icon: Layers },
  { label: 'Saved Deals', href: '/dashboard/deals', icon: FolderOpen },
  { label: 'Compare', href: '/dashboard/compare', icon: ArrowRightLeft },
  { label: 'Coaching', href: '/dashboard/coaching', icon: Calendar },
  { label: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { label: 'Settings', href: '/dashboard/settings/profile', icon: Settings },
];

interface DashboardShellProps {
  user: { name: string; email: string; role: string };
  planLabel: string;
  logoutAction: () => Promise<void>;
  children: React.ReactNode;
}

export default function DashboardShell({
  user,
  planLabel,
  logoutAction,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href.startsWith('/dashboard/settings')) return pathname.startsWith('/dashboard/settings');
    return pathname.startsWith(href);
  };

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
              active
                ? 'bg-teal-700 text-teal-50 shadow-sm'
                : 'text-[var(--muted)] hover:bg-teal-700/8 hover:text-foreground'
            }`}
          >
            <Icon className={`h-4 w-4 ${active ? 'text-teal-100' : 'text-teal-700'}`} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)] text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--sidebar)] md:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-[var(--border)] px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-white">
            <Building2 className="h-4 w-4" />
          </span>
          <span className="font-display text-xl tracking-tight">PropIntel</span>
        </div>

        <NavLinks />

        <div className="space-y-3 border-t border-[var(--border)] p-4">
          <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-white p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-700/10 text-teal-800">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-bold">{user.name}</div>
              <div className="truncate text-[10px] text-[var(--muted)]">{user.email}</div>
            </div>
            <span className="shrink-0 rounded-md bg-teal-700/10 px-1.5 py-0.5 text-[8px] font-bold uppercase text-teal-800">
              {user.role}
            </span>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--border)] py-2.5 text-xs font-bold text-[var(--muted)] transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-20 flex h-16 items-center justify-between border-b border-[var(--border)] bg-white/80 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] p-2 text-teal-800 md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 md:hidden">
              <Building2 className="h-4 w-4 text-teal-700" />
              <span className="font-display text-lg">PropIntel</span>
            </div>
            <div className="hidden items-center gap-2 rounded-lg border border-teal-700/15 bg-teal-700/5 px-3 py-1.5 text-xs font-semibold text-teal-800 md:flex">
              <ShieldCheck className="h-3.5 w-3.5" />
              MVP workspace active
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Plan
              </div>
              <div className="text-xs font-bold text-teal-800">{planLabel}</div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white">
              {user.name.charAt(0)}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[var(--border)] bg-white md:hidden"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            >
              <div className="flex h-16 items-center justify-between border-b border-[var(--border)] px-4">
                <span className="font-display text-xl">PropIntel</span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg border border-[var(--border)] p-2"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <NavLinks onNavigate={() => setMobileOpen(false)} />
              <div className="border-t border-[var(--border)] p-4">
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] py-2.5 text-xs font-bold text-[var(--muted)]"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </button>
                </form>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
