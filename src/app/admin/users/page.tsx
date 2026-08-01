'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { CheckCircle, XCircle, ArrowRightLeft, Loader2, Search, UserX, UserCheck } from 'lucide-react';
import { updateUserRole } from '@/app/actions/adminActions';
import { getAdminUsers, updateUserStatus } from '@/app/actions/adminExpandActions';
import PageHeader from '@/components/dashboard/PageHeader';
import type { Role } from '@prisma/client';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: 'INVESTOR' | 'ADMIN';
  status: string;
  joined: string;
  plan: string;
  deals: number;
  analyses: number;
  company: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const result = await getAdminUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        plan: planFilter || undefined,
        status: statusFilter || undefined,
      });
      setUsers(
        result.users.map((u) => ({
          id: u.id,
          name: u.name || 'Unnamed',
          email: u.email,
          role: u.role,
          status: u.status || 'ACTIVE',
          joined: new Date(u.createdAt).toISOString().split('T')[0],
          plan: u.subscription?.plan || 'FREE',
          deals: u._count.deals,
          analyses: u._count.propertyAnalyses + u._count.flipAnalyses,
          company: u.profile?.company || '—',
        }))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleRole = (id: string, current: Role) => {
    const next: Role = current === 'INVESTOR' ? 'ADMIN' : 'INVESTOR';
    setPendingId(id);
    startTransition(async () => {
      try {
        await updateUserRole(id, next);
        await load();
      } finally {
        setPendingId(null);
      }
    });
  };

  const toggleStatus = (id: string, current: string) => {
    const next = current === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setPendingId(id);
    startTransition(async () => {
      try {
        await updateUserStatus(id, next);
        await load();
      } finally {
        setPendingId(null);
      }
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        title="User directory"
        description="Search, filter, and manage platform accounts."
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-[var(--muted)]" />
          <input
            className="glass-input w-full py-2 pr-3 pl-9 text-sm"
            placeholder="Search name, email, company…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="glass-input bg-white px-3 py-2 text-sm"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All roles</option>
          <option value="INVESTOR">Investor</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select
          className="glass-input bg-white px-3 py-2 text-sm"
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
        >
          <option value="">All plans</option>
          <option value="FREE">Free</option>
          <option value="PRO">Pro</option>
          <option value="ENTERPRISE">Enterprise</option>
        </select>
        <select
          className="glass-input bg-white px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
        <button
          type="button"
          onClick={load}
          className="btn-primary cursor-pointer px-4 py-2 text-xs"
        >
          Apply
        </button>
      </div>

      <div className="surface-card overflow-x-auto p-4">
        {loading ? (
          <div className="flex justify-center py-12 text-[var(--muted)]">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
          </div>
        ) : (
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)] uppercase">
                <th className="py-3 pr-3">User</th>
                <th className="px-3 py-3">Role</th>
                <th className="px-3 py-3">Plan</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Deals</th>
                <th className="px-3 py-3">Joined</th>
                <th className="py-3 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="py-3 pr-3">
                    <div className="font-bold text-foreground">{u.name}</div>
                    <div className="text-[10px] text-[var(--muted)]">{u.email}</div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">{u.company}</div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="badge-status bg-teal-700/15 text-teal-800">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-3 py-3">{u.plan}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex items-center gap-1 text-[9px] font-extrabold uppercase ${
                        u.status === 'ACTIVE' ? 'text-teal-800' : 'text-red-500'
                      }`}
                    >
                      {u.status === 'ACTIVE' ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {u.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {u.analyses} analyses · {u.deals} CRM
                  </td>
                  <td className="px-3 py-3 text-[var(--muted)]">{u.joined}</td>
                  <td className="py-3 pl-3 text-right">
                    <div className="flex flex-col items-stretch justify-end gap-1 sm:inline-flex sm:flex-row sm:items-center">
                      <button
                        type="button"
                        disabled={isPending && pendingId === u.id}
                        onClick={() => toggleRole(u.id, u.role)}
                        className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-1 rounded-lg border border-[var(--border)] px-3 py-2 text-[11px] font-semibold disabled:opacity-50"
                      >
                        <ArrowRightLeft className="h-3.5 w-3.5 text-teal-700" /> Role
                      </button>
                      <button
                        type="button"
                        disabled={isPending && pendingId === u.id}
                        onClick={() => toggleStatus(u.id, u.status)}
                        className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-1 rounded-lg border border-[var(--border)] px-3 py-2 text-[11px] font-semibold disabled:opacity-50"
                      >
                        {u.status === 'ACTIVE' ? (
                          <>
                            <UserX className="h-3.5 w-3.5 text-red-400" /> Suspend
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-3.5 w-3.5 text-teal-700" /> Activate
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
