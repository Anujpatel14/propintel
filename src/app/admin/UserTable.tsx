'use client';

import React, { useState, useTransition } from 'react';
import { CheckCircle, XCircle, ArrowRightLeft, Loader2 } from 'lucide-react';
import { updateUserRole } from '@/app/actions/adminActions';
import type { Role } from '@prisma/client';

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: 'INVESTOR' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED';
  joined: string;
  plan?: string;
}

export default function AdminUserManagement({
  initialUsers,
}: {
  initialUsers: AdminUserRow[];
}) {
  const [users, setUsers] = useState<AdminUserRow[]>(initialUsers);
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const toggleRole = (id: string) => {
    const target = users.find((u) => u.id === id);
    if (!target) return;

    const nextRole: Role = target.role === 'INVESTOR' ? 'ADMIN' : 'INVESTOR';

    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role: nextRole } : u))
    );
    setPendingId(id);

    startTransition(async () => {
      try {
        await updateUserRole(id, nextRole);
      } catch (e) {
        console.error(e);
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, role: target.role } : u))
        );
      } finally {
        setPendingId(null);
      }
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-[var(--border)] font-semibold text-[var(--muted-foreground)] uppercase">
            <th className="py-3 pr-4">User</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Plan</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Joined Date</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 font-medium text-[var(--muted)]">
          {users.map((u) => (
            <tr key={u.id} className="transition-all hover:bg-white/2">
              <td className="py-3.5 pr-4">
                <div>
                  <span className="block font-bold text-foreground">{u.name}</span>
                  <span className="block text-[10px] text-[var(--muted-foreground)]">
                    {u.email}
                  </span>
                </div>
              </td>

              <td className="px-4 py-3.5">
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase ${u.role === 'ADMIN' ? 'bg-[#0e1a16]/20 text-teal-800' : 'bg-teal-700/20 text-teal-800'}`}
                >
                  {u.role}
                </span>
              </td>

              <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                {u.plan || 'FREE'}
              </td>

              <td className="px-4 py-3.5">
                <span
                  className={`inline-flex items-center gap-1 text-[9px] font-extrabold uppercase ${u.status === 'ACTIVE' ? 'text-teal-800' : 'text-red-400'}`}
                >
                  {u.status === 'ACTIVE' ? (
                    <CheckCircle className="h-3 w-3 text-teal-800" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-400" />
                  )}
                  {u.status}
                </span>
              </td>

              <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{u.joined}</td>

              <td className="space-x-2 px-4 py-3.5 text-right">
                <button
                  onClick={() => toggleRole(u.id)}
                  disabled={isPending && pendingId === u.id}
                  title="Toggle Permissions (Investor/Admin)"
                  className="inline-flex cursor-pointer items-center gap-1 rounded border border-[var(--border)] bg-[var(--surface-soft)] px-2.5 py-1 text-[10px] transition-all hover:border-indigo-500/20 hover:bg-white disabled:opacity-50"
                >
                  {isPending && pendingId === u.id ? (
                    <Loader2 className="h-3 w-3 animate-spin text-teal-800" />
                  ) : (
                    <ArrowRightLeft className="h-3 w-3 text-teal-800" />
                  )}{' '}
                  Role
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
