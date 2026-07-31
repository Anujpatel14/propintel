'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  CreditCard, 
  Check, 
  ExternalLink, 
  TrendingUp, 
  DollarSign, 
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react';
import SpotlightCard from '@/components/ui/SpotlightCard';

const INVOICES = [
  { id: 'inv_1029', date: '2026-07-28', plan: 'PRO Plan', amount: '$49.00', status: 'PAID' },
  { id: 'inv_1028', date: '2026-06-28', plan: 'PRO Plan', amount: '$49.00', status: 'PAID' },
  { id: 'inv_1027', date: '2026-05-28', plan: 'PRO Plan', amount: '$49.00', status: 'PAID' },
];

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState('PRO');
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleCheckoutSimulation = (planName: string) => {
    setIsLoading(planName);
    // Redirects to standard checkout simulation path:
    window.location.href = `/dashboard/billing/simulate-checkout?plan=${planName}`;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="border-b border-[var(--border)] pb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground flex items-center gap-2">
          Billing & Subscriptions
        </h1>
        <p className="text-sm text-[var(--muted)]">Manage plan tiers, update payment profiles, and review historical invoices.</p>
      </div>

      {/* Grid: Plan State & Receipts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Sub status & pricing tables */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active plan card */}
          <div className="glass-panel border-teal-700/20 bg-teal-700/5 rounded-2xl p-6 border flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="bg-teal-700/20 text-teal-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                  ACTIVE
                </span>
                <span className="text-xs text-[var(--muted-foreground)] font-semibold">Renews Aug 28, 2026</span>
              </div>
              <h3 className="text-lg font-bold text-foreground">Current plan: Professional (PRO)</h3>
              <p className="text-xs text-[var(--muted)]">Unlimited property lookups, AI deal reports, and CRM pipeline access.</p>
            </div>
            
            <div className="text-right shrink-0">
              <div className="text-3xl font-extrabold text-foreground">$49<span className="text-xs text-[var(--muted-foreground)] font-normal">/mo</span></div>
              <span className="text-[10px] text-[var(--muted-foreground)] uppercase font-semibold">Monthly Billing</span>
            </div>
          </div>

          {/* Plan upgrades selector */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">Upgrade or Change Plan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Enterprise */}
              <SpotlightCard className="p-5 flex flex-col justify-between h-64 border-[var(--border)] bg-white">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-teal-800">Enterprise</span>
                    <span className="text-xs font-bold text-foreground">$99<span className="text-[10px] text-[var(--muted-foreground)]">/mo</span></span>
                  </div>
                  <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                    Designed for syndicators and real estate investment funds requiring multi-agent accounts, custom report branding, and API endpoints.
                  </p>
                </div>
                <button
                  onClick={() => handleCheckoutSimulation('ENTERPRISE')}
                  disabled={isLoading !== null}
                  className="w-full bg-[#0e1a16] hover:bg-teal-900 disabled:opacity-50 text-foreground font-bold py-2.5 rounded-lg text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading === 'ENTERPRISE' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Subscribe to Enterprise'}
                </button>
              </SpotlightCard>

              {/* Free (downgrade) */}
              <div className="glass-card p-5 flex flex-col justify-between h-64 border border-[var(--border)] bg-white rounded-2xl">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-[var(--muted)]">Free Starter</span>
                    <span className="text-xs font-bold text-foreground">$0<span className="text-[10px] text-[var(--muted-foreground)]">/mo</span></span>
                  </div>
                  <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
                    Limits property analysis archives to 3 saved deals. No AI tools, PDF report compilations, or CRM pipeline boards.
                  </p>
                </div>
                <button
                  onClick={() => handleCheckoutSimulation('FREE')}
                  disabled={isLoading !== null}
                  className="w-full bg-[var(--surface-soft)] border border-[var(--border)] hover:border-red-500/20 text-[var(--muted)] hover:text-red-400 py-2.5 rounded-lg text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading === 'FREE' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cancel Plan / Downgrade'}
                </button>
              </div>

            </div>
          </div>

        </div>

        {/* Right Side: Invoice receipts list */}
        <div className="lg:col-span-4 space-y-6">
          
          <SpotlightCard className="p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Receipts & Invoices</h3>
            <div className="divide-y divide-white/5">
              {INVOICES.map((inv) => (
                <div key={inv.id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-foreground block">{inv.plan}</span>
                    <span className="text-[10px] text-[var(--muted-foreground)] block mt-0.5">{inv.date}</span>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <span className="font-bold text-teal-800 block">{inv.amount}</span>
                      <span className="bg-teal-700/10 text-teal-800 text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase">
                        {inv.status}
                      </span>
                    </div>
                    <button className="p-1 hover:bg-[var(--surface-soft)] rounded text-[var(--muted)] hover:text-foreground transition-all cursor-pointer">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </SpotlightCard>

        </div>

      </div>

    </div>
  );
}
