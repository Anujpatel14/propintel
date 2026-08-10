'use client';

import React, { useEffect, useState } from 'react';
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
  Sparkles,
  HelpCircle,
  Moon,
  Sun,
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { ADMIN_PANEL_PATH, adminHref, isAdminPanelPath } from '@/lib/adminPath';

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const INVESTOR_GROUPS: NavGroup[] = [
  {
    title: 'Menu',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Property Explorer', href: '/dashboard/explore', icon: Search },
      { label: 'My Properties', href: '/dashboard/properties', icon: Building2 },
      { label: 'Analyze', href: '/dashboard/analyze', icon: Calculator },
      { label: 'Deals', href: '/dashboard/deals', icon: FolderOpen },
      { label: 'CRM', href: '/dashboard/crm', icon: Layers },
    ],
  },
  {
    title: 'General',
    items: [
      { label: 'Reports', href: '/dashboard/reports', icon: FileText },
      { label: 'Portfolio', href: '/dashboard/portfolio', icon: TrendingUp },
      { label: 'Coaching', href: '/dashboard/coaching', icon: Calendar },
      { label: 'Billing', href: '/dashboard/billing', icon: CreditCard },
      { label: 'Settings', href: '/dashboard/settings/profile', icon: Settings },
    ],
  },
];

const ADMIN_GROUPS: NavGroup[] = [
  {
    title: 'Menu',
    items: [
      { label: 'Overview', href: adminHref(), icon: LayoutDashboard },
      { label: 'Users', href: adminHref('/admin/users'), icon: Users },
      { label: 'Subscriptions', href: adminHref('/admin/subscriptions'), icon: CreditCard },
      { label: 'Payments', href: adminHref('/admin/payments'), icon: DollarSign },
      { label: 'Deal intelligence', href: adminHref('/admin/deals'), icon: Building2 },
      { label: 'API usage', href: adminHref('/admin/system/api-usage'), icon: Cpu },
    ],
  },
  {
    title: 'General',
    items: [
      { label: 'Coaching', href: adminHref('/admin/coaching'), icon: Calendar },
      { label: 'CMS', href: adminHref('/admin/cms'), icon: FileEdit },
      { label: 'AI activity', href: adminHref('/admin/system/ai-activity'), icon: Sparkles },
      { label: 'Audit logs', href: adminHref('/admin/logs'), icon: ScrollText },
      { label: 'Settings', href: adminHref('/admin/settings'), icon: Settings },
    ],
  },
];

interface DashboardShellProps {
  user: { name: string; email: string; role: string };
  planLabel: string;
  children: React.ReactNode;
  /** True when signed in via ADMIN_USERNAME / ADMIN_PASSWORD cookie */
  adminPasswordSession?: boolean;
}

export default function DashboardShell({
  user,
  planLabel,
  children,
  adminPasswordSession = false,
}: DashboardShellProps) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const isAdmin = user.role === 'ADMIN';
  const inAdminArea = isAdminPanelPath(pathname) || pathname.startsWith('/admin');
  const navGroups = isAdmin && inAdminArea ? ADMIN_GROUPS : INVESTOR_GROUPS;
  const workspaceLabel =
    isAdmin && inAdminArea ? 'Admin workspace' : 'Investor workspace';
  const isFreePlan = /free/i.test(planLabel);

  const isActive = (href: string) => {
    if (href === '/dashboard' || href === ADMIN_PANEL_PATH || href === '/admin') {
      return pathname === href || pathname === ADMIN_PANEL_PATH || pathname === '/admin';
    }
    if (href.startsWith('/dashboard/settings')) {
      return pathname.startsWith('/dashboard/settings');
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      if (adminPasswordSession) {
        await fetch('/api/admin/login', { method: 'DELETE' });
        window.location.href = ADMIN_PANEL_PATH;
        return;
      }
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
    } catch {
      window.location.href = adminPasswordSession ? ADMIN_PANEL_PATH : '/login';
    }
  };

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

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
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
      {navGroups.map((group) => (
        <div key={group.title}>
          <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
            {group.title}
          </div>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    active
                      ? 'bg-[color-mix(in_srgb,var(--cobalt)_14%,transparent)] text-[var(--ink)]'
                      : 'text-[var(--muted)] hover:bg-[color-mix(in_srgb,var(--cobalt)_8%,transparent)] hover:text-foreground'
                  }`}
                >
                  {active ? (
                    <span className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[var(--cobalt)]" />
                  ) : null}
                  <Icon
                    className={`h-4 w-4 ${active ? 'text-[var(--cobalt)]' : 'text-[var(--muted-foreground)]'}`}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {isAdmin && inAdminArea && !adminPasswordSession && (
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2.5 text-sm font-semibold text-[var(--ink)] transition hover:border-[color-mix(in_srgb,var(--cobalt)_30%,transparent)]"
        >
          <ArrowLeftRight className="h-4 w-4 text-[var(--cobalt)]" />
          Switch to investor
        </Link>
      )}

      {isAdmin && !inAdminArea && (
        <Link
          href={ADMIN_PANEL_PATH}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl border border-[color-mix(in_srgb,var(--cobalt)_30%,transparent)] bg-[var(--sky)] px-3 py-2.5 text-sm font-semibold text-[var(--sky-fg)] transition hover:opacity-90"
        >
          <ShieldCheck className="h-4 w-4" />
          Switch to admin
        </Link>
      )}
    </nav>
  );

  const UpgradeCard = () =>
    isFreePlan ? (
      <div className="mx-3 mb-3 overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--hero-from)] via-[var(--hero-via)] to-[var(--hero-to)] p-4 text-white shadow-[var(--shadow-soft)]">
        <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="text-sm font-bold tracking-tight">Unlock Pro underwriting</div>
        <p className="mt-1 text-[11px] leading-relaxed text-white/75">
          Deeper comps, AI verdicts, and portfolio forecasting.
        </p>
        <Link
          href="/dashboard/billing"
          className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#1639a8] transition hover:bg-[#dbe7ff]"
        >
          Upgrade plan
        </Link>
      </div>
    ) : null;

  return (
    <div className="dashboard flex h-screen overflow-hidden bg-[var(--background)] text-foreground">
      <aside className="hidden w-[260px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--sidebar)] md:flex">
        <div className="flex h-16 items-center gap-2.5 px-5">
          <BrandMark size={32} />
          <div className="min-w-0">
            <span className="font-display block text-xl leading-none tracking-tight text-[var(--ink)]">
              PropIntel
            </span>
            {isAdmin && inAdminArea ? (
              <span className="text-[10px] font-bold tracking-[0.12em] text-[var(--cobalt)] uppercase">
                Ops console
              </span>
            ) : null}
          </div>
        </div>

        <NavLinks />

        {!inAdminArea ? <UpgradeCard /> : null}

        <div className="space-y-2 border-t border-[var(--border)] p-3">
          <div className="flex items-center gap-3 rounded-2xl bg-[var(--surface-soft)] p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--ink)] text-sm font-bold text-[var(--background)]">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-bold text-[var(--ink)]">{user.name}</div>
              <div className="truncate text-[10px] text-[var(--muted)]">{user.email}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href="/dashboard/help"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] py-2 text-[11px] font-semibold text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-foreground"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              Help
            </Link>
            <SignOutControl className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] py-2 text-[11px] font-semibold text-[var(--muted)] transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-60" />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-20 flex h-14 items-center justify-between gap-2 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] px-3 backdrop-blur-md sm:h-16 sm:px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="inline-flex min-h-10 min-w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[var(--border)] p-2 text-[var(--cobalt)] md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="flex min-w-0 items-center gap-2 md:hidden">
              <BrandMark size={26} />
              <span className="font-display truncate text-base text-[var(--ink)] sm:text-lg">
                PropIntel
              </span>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--cobalt)_20%,transparent)] bg-[var(--sky)] px-3 py-1.5 text-xs font-semibold text-[var(--sky-fg)] md:flex">
              <ShieldCheck className="h-3.5 w-3.5" />
              {workspaceLabel}
              {isAdmin && inAdminArea ? (
                <span className="rounded-full bg-[var(--cobalt)] px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white uppercase">
                  Admin
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--ink)]"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {!inAdminArea ? (
              <div className="hidden rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)] sm:block">
                Plan · <span className="text-[var(--ink)]">{planLabel}</span>
              </div>
            ) : null}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ink)] text-sm font-bold text-[var(--background)] sm:h-9 sm:w-9">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-4 md:p-8">
          {children}
        </main>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-[#0b1220]/40 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-[var(--border)] bg-[var(--sidebar)] md:hidden"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            >
              <div className="flex h-16 items-center justify-between px-4">
                <span className="inline-flex items-center gap-2">
                  <BrandMark size={28} />
                  <span className="font-display text-xl text-[var(--ink)]">PropIntel</span>
                </span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="cursor-pointer rounded-xl border border-[var(--border)] p-2"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <NavLinks onNavigate={() => setMobileOpen(false)} />
              {!inAdminArea ? <UpgradeCard /> : null}
              <div className="space-y-3 border-t border-[var(--border)] p-4">
                <div className="flex items-center gap-3 rounded-2xl bg-[var(--surface-soft)] p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--ink)] text-sm font-bold text-[var(--background)]">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold">{user.name}</div>
                    <div className="truncate text-[10px] text-[var(--muted)]">{user.email}</div>
                  </div>
                </div>
                {!inAdminArea ? (
                  <div className="rounded-xl bg-[var(--sky)] px-3 py-2 text-[11px] font-semibold text-[var(--sky-fg)]">
                    Plan · {planLabel}
                  </div>
                ) : (
                  <div className="rounded-xl bg-[var(--sky)] px-3 py-2 text-[11px] font-semibold text-[var(--sky-fg)]">
                    Admin console
                  </div>
                )}
                <SignOutControl className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--border)] py-2.5 text-xs font-bold text-[var(--muted)] disabled:opacity-60" />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
