import React from 'react';
import Link from 'next/link';
import {
  Users,
  DollarSign,
  Cpu,
  FolderLock,
  Database,
} from 'lucide-react';
import SpotlightCard from '@/components/ui/SpotlightCard';
import PageHeader from '@/components/dashboard/PageHeader';
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
  const metricsResult = await getAdminDashboardMetrics();
  const metrics = metricsResult.metrics;
  const recentLogs = metricsResult.recentLogs;
  const estimatedMrr = metrics.activeSubscribers * 49;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        title="Platform operations"
        description="Live Neon metrics and recent activity."
      />

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
