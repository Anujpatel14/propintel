'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Plus,
  MapPin,
  MoreVertical,
  Loader2,
  X,
} from 'lucide-react';
import {
  createDealLead,
  updateDealStage,
  deleteDeal,
  getUserDeals,
} from '@/app/actions/crmActions';

interface LeadItem {
  id: string;
  address: string;
  sellerName: string;
  sellerPhone: string;
  profit: number;
  stage: string;
  followUp: string;
}

const COLUMNS = [
  { key: 'LEAD', title: 'New Leads', color: 'border-t-sky-600 bg-sky-50' },
  { key: 'UNDER_REVIEW', title: 'Under Review', color: 'border-t-teal-700 bg-teal-50' },
  { key: 'OFFER_MADE', title: 'Offer Made', color: 'border-t-[#c4a050] bg-[#f8f1e4]' },
  { key: 'UNDER_CONTRACT', title: 'Under Contract', color: 'border-t-orange-500 bg-orange-50' },
  { key: 'CLOSED', title: 'Closed Won', color: 'border-t-teal-800 bg-teal-50/80' },
  { key: 'LOST', title: 'Lost/Pass', color: 'border-t-red-500 bg-red-50' },
];

function mapDealToLead(deal: {
  id: string;
  propertyAddress: string;
  sellerName: string | null;
  sellerPhone: string | null;
  assignmentFee: number | null;
  offerAmount: number | null;
  stage: string;
  followUpDate: Date | string | null;
}): LeadItem {
  const followUp =
    deal.followUpDate != null
      ? new Date(deal.followUpDate).toISOString().split('T')[0]
      : '—';

  return {
    id: deal.id,
    address: deal.propertyAddress,
    sellerName: deal.sellerName || 'Anonymous Seller',
    sellerPhone: deal.sellerPhone || '',
    profit: deal.assignmentFee || deal.offerAmount || 0,
    stage: deal.stage,
    followUp,
  };
}

export default function CRMPipelinePage() {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newAddress, setNewAddress] = useState('');
  const [newSellerName, setNewSellerName] = useState('');
  const [newSellerPhone, setNewSellerPhone] = useState('');
  const [newProfit, setNewProfit] = useState(30000);
  const [newStage, setNewStage] = useState('LEAD');
  const [newFollowUp, setNewFollowUp] = useState(
    new Date().toISOString().split('T')[0]
  );

  const loadDeals = async () => {
    setLoadError(null);
    try {
      const result = await getUserDeals();
      if (result.success) {
        setLeads(result.deals.map(mapDealToLead));
      }
    } catch (e) {
      console.error(e);
      const message =
        e instanceof Error ? e.message : 'Failed to load pipeline from the database.';
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDeals();
  }, []);

  const moveLead = (id: string, targetStage: string) => {
    setActiveMenuId(null);
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, stage: targetStage } : l))
    );
    startTransition(async () => {
      try {
        await updateDealStage(id, targetStage);
      } catch (e) {
        console.error(e);
        await loadDeals();
      }
    });
  };

  const handleAddLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress) return;

    setIsSubmitting(true);
    try {
      const result = await createDealLead({
        propertyAddress: newAddress,
        sellerName: newSellerName || 'Anonymous Seller',
        sellerPhone: newSellerPhone || undefined,
        assignmentFee: newProfit,
        stage: newStage,
        followUpDate: newFollowUp || undefined,
      });

      if (result.success) {
        await loadDeals();
      }

      setIsModalOpen(false);
      setNewAddress('');
      setNewSellerName('');
      setNewSellerPhone('');
      setNewProfit(30000);
      setNewStage('LEAD');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLead = (id: string) => {
    setActiveMenuId(null);
    setLeads((prev) => prev.filter((l) => l.id !== id));
    startTransition(async () => {
      try {
        await deleteDeal(id);
      } catch (e) {
        console.error(e);
        await loadDeals();
      }
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-[var(--border)] pb-6 md:flex-row md:items-center">
        <div>
          <h1 className="font-display text-3xl tracking-tight text-foreground md:text-4xl">
            Deal CRM pipeline
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Track purchase prospects, manage follow-up timers, and log assignment revenue.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-teal-600"
        >
          <Plus className="h-4 w-4" /> Add CRM Lead
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-[var(--muted)]">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading pipeline…
        </div>
      ) : loadError ? (
        <div className="space-y-4 rounded-xl border border-red-500/20 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">{loadError}</p>
          <button
            onClick={() => {
              setIsLoading(true);
              loadDeals();
            }}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-600"
          >
            Retry connection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 overflow-x-auto pb-4 md:grid-cols-3 lg:grid-cols-6">
          {COLUMNS.map((col) => {
            const colLeads = leads.filter((l) => l.stage === col.key);

            return (
              <div
                key={col.key}
                className={`flex w-full min-w-[200px] flex-col space-y-4 rounded-xl border border-[var(--border)] border-t-2 p-4 ${col.color}`}
              >
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                  <span className="text-xs font-extrabold tracking-wide text-foreground uppercase">
                    {col.title}
                  </span>
                  <span className="rounded-full bg-[var(--surface-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--muted)]">
                    {colLeads.length}
                  </span>
                </div>

                <div className="min-h-[300px] flex-1 space-y-4 overflow-y-auto">
                  <AnimatePresence mode="popLayout">
                    {colLeads.map((lead) => (
                      <motion.div
                        key={lead.id}
                        layout
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className={`group relative space-y-3 rounded-xl border border-[var(--border)] bg-white p-4 shadow-md transition-all hover:border-teal-700/20 ${isPending ? 'opacity-80' : ''}`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-[10px] font-semibold text-[var(--muted-foreground)] uppercase">
                            <MapPin className="h-3 w-3 text-teal-800" /> Location
                          </div>
                          <div className="text-xs leading-tight font-bold text-foreground">
                            {lead.address}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div>
                            <span className="font-semibold text-[var(--muted-foreground)] uppercase">
                              Seller
                            </span>
                            <div className="truncate font-medium text-[var(--muted)]">
                              {lead.sellerName}
                            </div>
                          </div>
                          <div>
                            <span className="font-semibold text-[var(--muted-foreground)] uppercase">
                              Est. Profit
                            </span>
                            <div className="font-bold text-teal-800">
                              ${lead.profit.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
                          <span className="text-[9px] font-medium text-[var(--muted-foreground)]">
                            Follow: {lead.followUp}
                          </span>
                          <div className="relative flex items-center gap-1">
                            <button
                              onClick={() =>
                                setActiveMenuId(activeMenuId === lead.id ? null : lead.id)
                              }
                              className="cursor-pointer rounded p-1 text-[var(--muted-foreground)] transition-all hover:bg-[var(--surface-soft)] hover:text-foreground"
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </button>

                            {activeMenuId === lead.id && (
                              <div className="absolute right-0 bottom-6 z-20 w-36 space-y-1 rounded-xl border border-[var(--border)] bg-white p-2 shadow-2xl">
                                <span className="block border-b border-[var(--border)] px-2 pb-1 text-[9px] font-bold text-[var(--muted-foreground)] uppercase">
                                  Shift Stage
                                </span>
                                {COLUMNS.map(
                                  (c) =>
                                    c.key !== lead.stage && (
                                      <button
                                        key={c.key}
                                        onClick={() => moveLead(lead.id, c.key)}
                                        className="w-full rounded px-2 py-1 text-left text-[10px] font-medium text-[var(--muted)] transition-all hover:bg-teal-700 hover:text-white"
                                      >
                                        {c.title}
                                      </button>
                                    )
                                )}
                                <button
                                  onClick={() => handleDeleteLead(lead.id)}
                                  className="mt-1 w-full rounded border-t border-[var(--border)] px-2 pt-1.5 pb-1 text-left text-[10px] font-bold text-red-400 transition-all hover:bg-red-500/10"
                                >
                                  Delete Lead
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-6 backdrop-blur-sm">
          <div className="glass-panel relative w-full max-w-md space-y-6 rounded-2xl border border-[var(--border)] p-8">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
                <Layers className="h-5 w-5 text-teal-800" /> New Pipeline Lead
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="cursor-pointer rounded-lg bg-[var(--surface-soft)] p-1.5 text-[var(--muted)] transition-all hover:bg-white hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddLeadSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--muted)] uppercase">
                  Street Address
                </label>
                <input
                  type="text"
                  required
                  placeholder="123 Main St, Dallas, TX"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="glass-input w-full px-3.5 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">
                    Seller Name
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={newSellerName}
                    onChange={(e) => setNewSellerName(e.target.value)}
                    className="glass-input w-full px-3.5 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">
                    Seller Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+1 (555) 012-3456"
                    value={newSellerPhone}
                    onChange={(e) => setNewSellerPhone(e.target.value)}
                    className="glass-input w-full px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">
                    Projected Profit
                  </label>
                  <input
                    type="number"
                    value={newProfit}
                    onChange={(e) => setNewProfit(Number(e.target.value))}
                    className="glass-input w-full px-3.5 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">
                    Follow Up Date
                  </label>
                  <input
                    type="date"
                    value={newFollowUp}
                    onChange={(e) => setNewFollowUp(e.target.value)}
                    className="glass-input w-full px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--muted)] uppercase">
                  Initial Stage
                </label>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value)}
                  className="glass-input w-full border-[var(--border)] bg-white px-3 py-2 text-sm text-foreground"
                >
                  {COLUMNS.map((c) => (
                    <option key={c.key} value={c.key} className="bg-white text-foreground">
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-teal-700 py-3 text-xs font-bold text-white shadow-lg transition-all hover:bg-teal-600 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? 'Saving…' : 'Add Lead to Board'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
