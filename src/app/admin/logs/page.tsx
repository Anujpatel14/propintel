'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getAdminAuditLogs } from '@/app/actions/adminExpandActions';

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<
    Array<{
      id: string;
      action: string;
      details: string | null;
      createdAt: Date | string;
      user: { email: string; name: string | null };
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const result = await getAdminAuditLogs();
        setLogs(result.logs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-tight">Audit logs & security</h1>
        <p className="text-sm text-[var(--muted)]">
          Registrations, role changes, plan upgrades, and underwriting events.
        </p>
      </div>

      <div className="surface-card p-5">
        {loading ? (
          <div className="flex justify-center py-12 text-[var(--muted)]">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
          </div>
        ) : logs.length === 0 ? (
          <p className="text-xs text-[var(--muted)]">No audit events yet.</p>
        ) : (
          <div className="max-h-[70vh] space-y-3 overflow-y-auto text-xs">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-3"
              >
                <div>
                  <div className="font-semibold text-foreground">
                    {log.user.name || log.user.email}
                  </div>
                  <div className="text-[var(--muted)]">
                    <strong>{log.action}</strong>
                    {log.details ? ` — ${log.details}` : ''}
                  </div>
                </div>
                <span className="shrink-0 text-[10px] text-[var(--muted-foreground)]">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
