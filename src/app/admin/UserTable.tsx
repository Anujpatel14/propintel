'use client';

import React, { useState } from 'react';
import { CheckCircle, XCircle, UserX, UserCheck, ShieldAlert, ArrowRightLeft } from 'lucide-react';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'INVESTOR' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED';
  joined: string;
}

const INITIAL_USERS: AdminUser[] = [
  { id: 'usr-1', name: 'Alex Investor', email: 'investor@propintel.com', role: 'INVESTOR', status: 'ACTIVE', joined: '2026-07-28' },
  { id: 'usr-2', name: 'Sarah Admin', email: 'admin@propintel.com', role: 'ADMIN', status: 'ACTIVE', joined: '2026-07-20' },
  { id: 'usr-3', name: 'Gary Wholesaler', email: 'wholesaler_pro@gmail.com', role: 'INVESTOR', status: 'ACTIVE', joined: '2026-07-25' },
  { id: 'usr-4', name: 'Mike Flipper', email: 'mike_flip@aol.com', role: 'INVESTOR', status: 'SUSPENDED', joined: '2026-06-15' },
];

export default function AdminUserManagement() {
  const [users, setUsers] = useState<AdminUser[]>(INITIAL_USERS);

  // Toggle user suspension
  const toggleStatus = (id: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        return {
          ...u,
          status: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
        };
      }
      return u;
    }));
  };

  // Toggle user permissions/role
  const toggleRole = (id: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        return {
          ...u,
          role: u.role === 'INVESTOR' ? 'ADMIN' : 'INVESTOR'
        };
      }
      return u;
    }));
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs text-left border-collapse">
        <thead>
          <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)] font-semibold uppercase">
            <th className="py-3 pr-4">User</th>
            <th className="py-3 px-4">Role</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4">Joined Date</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 font-medium text-[var(--muted)]">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-white/2 transition-all">
              
              {/* Profile info */}
              <td className="py-3.5 pr-4">
                <div>
                  <span className="font-bold text-foreground block">{u.name}</span>
                  <span className="text-[10px] text-[var(--muted-foreground)] block">{u.email}</span>
                </div>
              </td>

              {/* Role badge */}
              <td className="py-3.5 px-4">
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${u.role === 'ADMIN' ? 'bg-[#0e1a16]/20 text-teal-800' : 'bg-teal-700/20 text-teal-800'}`}>
                  {u.role}
                </span>
              </td>

              {/* Status badge */}
              <td className="py-3.5 px-4">
                <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold uppercase ${u.status === 'ACTIVE' ? 'text-teal-800' : 'text-red-400'}`}>
                  {u.status === 'ACTIVE' ? (
                    <CheckCircle className="w-3 h-3 text-teal-800" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-400" />
                  )}
                  {u.status}
                </span>
              </td>

              {/* Date */}
              <td className="py-3.5 px-4 text-[var(--muted-foreground)]">
                {u.joined}
              </td>

              {/* Action buttons */}
              <td className="py-3.5 px-4 text-right space-x-2">
                
                {/* Change Role Button */}
                <button
                  onClick={() => toggleRole(u.id)}
                  title="Toggle Permissions (Investor/Admin)"
                  className="inline-flex items-center gap-1 border border-[var(--border)] hover:border-indigo-500/20 bg-[var(--surface-soft)] hover:bg-white text-[10px] px-2.5 py-1 rounded transition-all cursor-pointer"
                >
                  <ArrowRightLeft className="w-3 h-3 text-teal-800" /> Role
                </button>

                {/* Suspend Toggle Button */}
                <button
                  onClick={() => toggleStatus(u.id)}
                  title={u.status === 'ACTIVE' ? 'Suspend User' : 'Activate User'}
                  className={`inline-flex items-center gap-1 border border-[var(--border)] text-[10px] px-2.5 py-1 rounded transition-all cursor-pointer ${u.status === 'ACTIVE' ? 'hover:border-red-500/20 bg-[var(--surface-soft)] hover:bg-red-500/10 hover:text-red-400' : 'hover:border-teal-700/20 bg-[var(--surface-soft)] hover:bg-teal-700/10 hover:text-teal-800'}`}
                >
                  {u.status === 'ACTIVE' ? (
                    <>
                      <UserX className="w-3 h-3 text-red-400" /> Suspend
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3 h-3 text-teal-800" /> Activate
                    </>
                  )}
                </button>

              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
