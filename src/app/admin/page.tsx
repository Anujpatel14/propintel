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
  AlertCircle,
  Database,
  ArrowLeft,
  Search,
  CheckCircle,
  XCircle,
  Settings,
  Lock
} from 'lucide-react';
import { logoutUserAction } from '../login/actions';
import SpotlightCard from '@/components/ui/SpotlightCard';
import AdminUserManagement from './UserTable'; // Import client sub-component

// System Audit Logs
const AUDIT_LOGS = [
  { id: 'log-1', user: 'investor@propintel.com', action: 'CREATE_ANALYSIS', target: '1402 Oak Ridge Dr', time: '10 mins ago' },
  { id: 'log-2', user: 'admin@propintel.com', action: 'SYSTEM_SETTINGS_UPDATE', target: 'Stripe API keys updated', time: '1 hour ago' },
  { id: 'log-3', user: 'wholesaler_pro@gmail.com', action: 'EXPORT_REPORT', target: '778 Highland Ave PDF', time: '3 hours ago' },
  { id: 'log-4', user: 'buyer_houston@yahoo.com', action: 'UPGRADE_SUBSCRIPTION', target: 'Upgraded to PRO Plan', time: '6 hours ago' },
  { id: 'log-5', user: 'investor@propintel.com', action: 'AI_VERDICT_TRIGGER', target: '892 Elm Street audit', time: '1 day ago' },
];

export default async function AdminPage() {
  const user = await getCurrentUser();

  // Route protection
  if (!user) {
    redirect('/login');
  }

  // Access check: only admins allowed
  if (user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[var(--background)] text-foreground flex flex-col items-center justify-center p-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-md w-full glass-panel border-red-500/20 bg-red-950/5 rounded-2xl p-8 text-center space-y-6 relative z-10">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-extrabold text-foreground">Security Violation: Access Denied</h1>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Your profile (<strong>{user.email}</strong>) does not possess Administrator authorization. This desk is restricted to Platform Administrators.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/dashboard"
              className="bg-[var(--surface-soft)] border border-[var(--border)] hover:border-teal-700/20 px-5 py-2.5 rounded-lg text-xs font-semibold hover:bg-white transition-all"
            >
              Back to Dashboard
            </Link>
            <form action={logoutUserAction}>
              <button
                type="submit"
                className="w-full bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Sign Out / Swap Profile
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-foreground p-6 md:p-12 space-y-8 relative overflow-hidden">
      
      {/* Decorative Blur */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Admin Title Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--border)] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-teal-800 text-xs font-bold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" /> Secure Admin Dashboard
          </div>
          <h1 className="font-display text-3xl tracking-tight text-foreground md:text-4xl">Platform operations</h1>
        </div>

        <div className="flex gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 border border-[var(--border)] hover:border-teal-700/20 bg-[var(--surface-soft)] hover:bg-white text-[var(--muted)] font-semibold text-xs px-4 py-2.5 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Go to Investor View
          </Link>
          <form action={logoutUserAction}>
            <button
              type="submit"
              className="bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>

      {/* Platform KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <SpotlightCard spotlightColor="rgba(99, 102, 241, 0.12)" className="p-5 flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-[10px] text-[var(--muted-foreground)] uppercase font-bold tracking-wider">Monthly Revenue (MRR)</span>
            <div className="text-2xl font-extrabold text-foreground">$4,116</div>
            <p className="text-[10px] text-teal-800 font-medium">+18.2% monthly scale</p>
          </div>
          <div className="p-2 bg-[#0e1a16]/10 rounded-lg text-teal-800">
            <DollarSign className="w-5 h-5" />
          </div>
        </SpotlightCard>

        <SpotlightCard spotlightColor="rgba(99, 102, 241, 0.12)" className="p-5 flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-[10px] text-[var(--muted-foreground)] uppercase font-bold tracking-wider">Total User Profiles</span>
            <div className="text-2xl font-extrabold text-foreground">142 Users</div>
            <p className="text-[10px] text-teal-800 font-medium">84 Active Subscribers</p>
          </div>
          <div className="p-2 bg-[#0e1a16]/10 rounded-lg text-teal-800">
            <Users className="w-5 h-5" />
          </div>
        </SpotlightCard>

        <SpotlightCard spotlightColor="rgba(99, 102, 241, 0.12)" className="p-5 flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-[10px] text-[var(--muted-foreground)] uppercase font-bold tracking-wider">AI Analysis Quota</span>
            <div className="text-2xl font-extrabold text-foreground">8,924 / 10k</div>
            <p className="text-[10px] text-yellow-400 font-medium">89.2% rate limit threshold</p>
          </div>
          <div className="p-2 bg-[#0e1a16]/10 rounded-lg text-teal-800">
            <Cpu className="w-5 h-5" />
          </div>
        </SpotlightCard>

        <SpotlightCard spotlightColor="rgba(99, 102, 241, 0.12)" className="p-5 flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-[10px] text-[var(--muted-foreground)] uppercase font-bold tracking-wider">Neon DB Storage</span>
            <div className="text-2xl font-extrabold text-foreground">12.4 MB</div>
            <p className="text-[10px] text-teal-800 font-medium">100% serverless health</p>
          </div>
          <div className="p-2 bg-[#0e1a16]/10 rounded-lg text-teal-800">
            <Database className="w-5 h-5" />
          </div>
        </SpotlightCard>

      </div>

      {/* Main Admin Content Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: User Manager */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-panel border border-[var(--border)] rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-base font-bold text-foreground">Active Platform Profiles</h2>
                <p className="text-xs text-[var(--muted-foreground)]">Suspend, activate, or update user permissions dynamically.</p>
              </div>
            </div>
            {/* Call the Client User table to manage state toggles */}
            <AdminUserManagement />
          </div>
        </div>

        {/* Right: Logging & Content settings */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Quick CMS Pricing configurator widget */}
          <div className="glass-panel border border-[var(--border)] rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2">
              <Settings className="w-4 h-4 text-teal-800" /> Landing Content Configuration
            </h3>
            
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <span className="text-[var(--muted-foreground)] block">PRO Tier Subscription Rate ($)</span>
                <input
                  type="text"
                  defaultValue="49"
                  disabled
                  className="w-full glass-input px-3 py-1.5 opacity-60 text-slate-400"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[var(--muted-foreground)] block">OpenAI Model Engine</span>
                <input
                  type="text"
                  defaultValue="gpt-4o-mini"
                  disabled
                  className="w-full glass-input px-3 py-1.5 opacity-60 text-slate-400"
                />
              </div>
              <p className="text-[10px] text-[var(--muted-foreground)] leading-tight">
                * Live parameter updates are read-only in this V1 build.
              </p>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="glass-panel border border-[var(--border)] rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2">
              <FolderLock className="w-4 h-4 text-teal-800" /> Platform Security Logs
            </h3>
            
            <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1 text-xs">
              {AUDIT_LOGS.map((log) => (
                <div key={log.id} className="flex justify-between items-start gap-4">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-foreground block">{log.user}</span>
                    <span className="text-[var(--muted-foreground)] block leading-tight">
                      Action: <strong>{log.action}</strong> ({log.target})
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--muted-foreground)] shrink-0">{log.time}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
