'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { recordLogoutAuditAction } from '@/app/login/actions';
import { BrandMark } from '@/components/BrandLogo';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  LayoutDashboard,
  TrendingUp,
  Layers,
  FolderOpen,
  Calendar,
  CreditCard,
  DollarSign,
  LogOut,
  User,
  Menu,
  X,
  ShieldCheck,
  Settings,
  Users,
  Cpu,
  FileEdit,
  ScrollText,
  ArrowLeftRight,
  Loader2,
  Search,
  Calculator,
  FileText,
} from 'lucide-react';

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const INVESTOR_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Property Explorer', href: '/dashboard/explore', icon: Search },
  { label: 'My Properties', href: '/dashboard/properties', icon: Building2 },
  { label: 'Analyze', href: '/dashboard/analyze', icon: Calculator },
  { label: 'Deals', href: '/dashboard/deals', icon: FolderOpen },
  { label: 'CRM', href: '/dashboard/crm', icon: Layers },
  { label: 'Reports', href: '/dashboard/reports', icon: FileText },
  { label: 'Portfolio', href: '/dashboard/portfolio', icon: TrendingUp },
  { label: 'Coaching', href: '/dashboard/coaching', icon: Calendar },
  { label: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { label: 'Settings', href: '/dashboard/settings/profile', icon: Settings },
];

const ADMIN_NAV: NavItem[] = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
  { label: 'Payments', href: '/admin/payments', icon: DollarSign },
  { label: 'Deal intelligence', href: '/admin/deals', icon: Building2 },
  { label: 'API usage', href: '/admin/system/api-usage', icon: Cpu },
  { label: 'Coaching', href: '/admin/coaching', icon: Calendar },
  { label: 'CMS', href: '/admin/cms', icon: FileEdit },
  { label: 'Audit logs', href: '/admin/logs', icon: ScrollText },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

interface DashboardShellProps {
  user: { name: string; email: string; role: string };
  planLabel: string;
  children: React.ReactNode;
}

export default function DashboardShell({
  user,
  planLabel,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const isAdmin = user.role === 'ADMIN';
  const inAdminArea = pathname.startsWith('/admin');
  const navItems = isAdmin && inAdminArea ? ADMIN_NAV : INVESTOR_NAV;
  const workspaceLabel =
    isAdmin && inAdminArea ? 'Admin workspace active' : 'Investor workspace active';

  const isActive = (href: string) => {
    if (href === '/dashboard' || href === '/admin') return pathname === href;
    if (href.startsWith('/dashboard/settings')) {
      return pathname.startsWith('/dashboard/settings');
    }
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await recordLogoutAuditAction();
    } catch {
      // Still sign out even if audit write fails
    }
    try {
      await signOut({ redirectUrl: '/login' });
    } catch {
      window.location.href = '/login';
    }
  };

  const SignOutControl = ({ className }: { className?: string }) => (
    <button type="button" disabled={signingOut} onClick={handleSignOut} className={className}>
      {signingOut ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <LogOut className="h-3.5 w-3.5" />
      )}
      {signingOut ? 'Signing out…' : 'Sign out'}
    </button>
  );

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
      {navItems.map((item) => {
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

      {isAdmin && inAdminArea && (
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="mt-3 flex items-center gap-3 rounded-xl border border-[var(--border)] px-3.5 py-2.5 text-sm font-semibold text-[var(--muted)] transition hover:bg-teal-700/8 hover:text-foreground"
        >
          <ArrowLeftRight className="h-4 w-4 text-teal-700" />
          Investor workspace
        </Link>
      )}

      {isAdmin && !inAdminArea && (
        <Link
          href="/admin"
          onClick={onNavigate}
          className="mt-3 flex items-center gap-3 rounded-xl border border-[var(--border)] px-3.5 py-2.5 text-sm font-semibold text-[var(--muted)] transition hover:bg-teal-700/8 hover:text-foreground"
        >
          <ShieldCheck className="h-4 w-4 text-teal-700" />
          Admin workspace
        </Link>
      )}
    </nav>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)] text-foreground">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--sidebar)] md:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-[var(--border)] px-5">
          <BrandMark size={32} />
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

          <SignOutControl className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--border)] py-2.5 text-xs font-bold text-[var(--muted)] transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-60" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-20 flex h-16 items-center justify-between border-b border-[var(--border)] bg-white/80 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="min-h-11 min-w-11 inline-flex cursor-pointer items-center justify-center rounded-lg border border-[var(--border)] p-2.5 text-teal-800 md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 md:hidden">
              <BrandMark size={28} />
              <span className="font-display text-lg">PropIntel</span>
            </div>
            <div className="hidden items-center gap-2 rounded-lg border border-teal-700/15 bg-teal-700/5 px-3 py-1.5 text-xs font-semibold text-teal-800 md:flex">
              <ShieldCheck className="h-3.5 w-3.5" />
              {workspaceLabel}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] font-semibold tracking-wider text-[var(--muted-foreground)] uppercase">
                Plan
              </div>
              <div className="text-xs font-bold text-teal-800">{planLabel}</div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white">
              {user.name.charAt(0)}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-8">
          {children}
        </main>
      </div>

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
                <span className="inline-flex items-center gap-2">
                  <BrandMark size={28} />
                  <span className="font-display text-xl">PropIntel</span>
                </span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="cursor-pointer rounded-lg border border-[var(--border)] p-2"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <NavLinks onNavigate={() => setMobileOpen(false)} />
              <div className="border-t border-[var(--border)] p-4">
                <SignOutControl className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--border)] py-2.5 text-xs font-bold text-[var(--muted)] disabled:opacity-60" />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
