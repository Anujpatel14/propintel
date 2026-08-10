import Link from 'next/link';
import PageHeader from '@/components/dashboard/PageHeader';
import { ADMIN_PANEL_PATH, adminHref } from '@/lib/adminPath';
import { ShieldCheck, ScrollText, Users, Calendar } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="Platform settings"
        description="Admin console access and shortcuts. Investor-facing APIs stay in server env."
      />

      <div className="space-y-4 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--sky)] text-[var(--cobalt)]">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold text-[var(--ink)]">Admin entry</h2>
            <p className="mt-1 break-all text-sm text-[var(--muted)]">
              Sign-in URL:{' '}
              <span className="font-mono font-semibold text-[var(--ink)]">{ADMIN_PANEL_PATH}</span>
            </p>
            <p className="mt-2 text-xs text-[var(--muted)]">
              Username and password are configured on the server. Change them by updating your
              deployment secrets, then restart the app.
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {[
            { href: adminHref('/admin/users'), label: 'Users', icon: Users },
            { href: adminHref('/admin/coaching'), label: 'Coaching', icon: Calendar },
            { href: adminHref('/admin/logs'), label: 'Audit logs', icon: ScrollText },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-3 text-sm font-semibold text-[var(--ink)] transition hover:border-[color-mix(in_srgb,var(--cobalt)_30%,transparent)]"
              >
                <Icon className="h-4 w-4 text-[var(--cobalt)]" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
