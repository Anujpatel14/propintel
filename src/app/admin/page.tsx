import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/services/auth';
import {
  ShieldAlert,
  Users,
  DollarSign,
  Cpu,
  FolderLock,
  Database,
} from 'lucide-react';
import { logoutUserAction } from '../login/actions';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { getAdminDashboardMetrics } from '@/app/actions/adminActions';

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'ADMIN') {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-[var(--background)] p-6 text-foreground">
        <div className="glass-panel relative z-10 w-full max-w-md space-y-6 rounded-2xl border-red-500/20 bg-red-950/5 p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
            <ShieldAlert className="h-8 w-8 text-red-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-extrabold">Access Denied</h1>
            <p className="text-xs text-[var(--muted)]">
              Your profile (<strong>{user.email}</strong>) is not an administrator.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-5 py-2.5 text-xs font-semibold"
            >
              Back to Dashboard
            </Link>
            <form action={logoutUserAction}>
              <button
                type="submit"
                className="w-full cursor-pointer rounded-lg bg-red-500 px-5 py-2.5 text-xs font-bold text-white"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const metricsResult = await getAdminDashboardMetrics();
  const metrics = metricsResult.metrics;
  const recentLogs = metricsResult.recentLogs;
  const estimatedMrr = metrics.activeSubscribers * 49;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="font-display text-3xl tracking-tight md:text-4xl">Platform operations</h1>
        <p className="text-sm text-[var(--muted)]">Live Neon metrics and recent activity.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SpotlightCard className="flex justify-between p-5">
          <div>
            <div className="text-[10px] font-bold uppercase text-[var(--muted-foreground)]">
              Est. MRR
            </div>
            <div className="text-2xl font-extrabold">${estimatedMrr.toLocaleString()}</div>
          </div>
          <DollarSign className="h-5 w-5 text-teal-700" />
        </SpotlightCard>
        <SpotlightCard className="flex justify-between p-5">
          <div>
            <div className="text-[10px] font-bold uppercase text-[var(--muted-foreground)]">
              Users
            </div>
            <div className="text-2xl font-extrabold">{metrics.totalUsers}</div>
            <p className="text-[10px] text-teal-800">{metrics.activeSubscribers} paid</p>
          </div>
          <Users className="h-5 w-5 text-teal-700" />
        </SpotlightCard>
        <SpotlightCard className="flex justify-between p-5">
          <div>
            <div className="text-[10px] font-bold uppercase text-[var(--muted-foreground)]">
              Analyses
            </div>
            <div className="text-2xl font-extrabold">{metrics.totalAnalyses}</div>
            <p className="text-[10px] text-teal-800">{metrics.totalDeals} CRM deals</p>
          </div>
          <Cpu className="h-5 w-5 text-teal-700" />
        </SpotlightCard>
        <SpotlightCard className="flex justify-between p-5">
          <div>
            <div className="text-[10px] font-bold uppercase text-[var(--muted-foreground)]">
              Activity
            </div>
            <div className="text-2xl font-extrabold">{metrics.totalAiRequests}</div>
          </div>
          <Database className="h-5 w-5 text-teal-700" />
        </SpotlightCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="surface-card space-y-3 p-5">
          <h2 className="text-sm font-bold">Quick links</h2>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              ['/admin/users', 'User directory'],
              ['/admin/subscriptions', 'Revenue'],
              ['/admin/deals', 'Deal intelligence'],
              ['/admin/cms', 'CMS editor'],
              ['/admin/system/api-usage', 'API usage'],
              ['/admin/logs', 'Audit logs'],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="rounded-xl border border-[var(--border)] px-3 py-2.5 font-semibold text-[var(--muted)] hover:border-teal-700/25 hover:text-foreground"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="surface-card space-y-4 p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <FolderLock className="h-4 w-4 text-teal-700" /> Recent logs
          </h2>
          <div className="max-h-[240px] space-y-3 overflow-y-auto text-xs">
            {recentLogs.length === 0 ? (
              <p className="text-[var(--muted)]">No activity yet.</p>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="flex justify-between gap-3">
                  <div>
                    <div className="font-semibold">{log.user.email}</div>
                    <div className="text-[var(--muted)]">
                      {log.action}
                      {log.details ? ` — ${log.details}` : ''}
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] text-[var(--muted-foreground)]">
                    {formatRelativeTime(log.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
