'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, 
  Plus, 
  Trash2, 
  MapPin, 
  User, 
  DollarSign, 
  Calendar, 
  ArrowRight,
  ChevronRight,
  MoreVertical,
  CheckCircle,
  PlusCircle,
  Loader2,
  X
} from 'lucide-react';
import SpotlightCard from '@/components/ui/SpotlightCard';

interface LeadItem {
  id: string;
  address: string;
  sellerName: string;
  sellerPhone: string;
  profit: number;
  stage: string;
  followUp: string;
}

const DEFAULT_LEADS: LeadItem[] = [
  {
    id: 'lead-1',
    address: '1402 Oak Ridge Dr, Dallas, TX',
    sellerName: 'Robert Smith',
    sellerPhone: '+1 (214) 555-0192',
    profit: 45000,
    stage: 'LEAD',
    followUp: '2026-08-05',
  },
  {
    id: 'lead-2',
    address: '892 Elm Street, Plano, TX',
    sellerName: 'Jane Doe',
    sellerPhone: '+1 (972) 555-0143',
    profit: 32000,
    stage: 'UNDER_REVIEW',
    followUp: '2026-08-02',
  },
  {
    id: 'lead-3',
    address: '778 Highland Ave, Austin, TX',
    sellerName: 'Gary Johnson',
    sellerPhone: '+1 (512) 555-0129',
    profit: 60000,
    stage: 'OFFER_MADE',
    followUp: '2026-07-31',
  },
  {
    id: 'lead-4',
    address: '922 Cherry Ln, McKinney, TX',
    sellerName: 'Mary Davis',
    sellerPhone: '+1 (469) 555-0177',
    profit: 22000,
    stage: 'UNDER_CONTRACT',
    followUp: '2026-08-10',
  },
  {
    id: 'lead-5',
    address: '311 Maple St, Fort Worth, TX',
    sellerName: 'David Miller',
    sellerPhone: '+1 (817) 555-0111',
    profit: 55000,
    stage: 'CLOSED',
    followUp: '2026-07-28',
  },
];

const COLUMNS = [
  { key: 'LEAD', title: 'New Leads', color: 'border-t-sky-600 bg-sky-50' },
  { key: 'UNDER_REVIEW', title: 'Under Review', color: 'border-t-teal-700 bg-teal-50' },
  { key: 'OFFER_MADE', title: 'Offer Made', color: 'border-t-[#c4a050] bg-[#f8f1e4]' },
  { key: 'UNDER_CONTRACT', title: 'Under Contract', color: 'border-t-orange-500 bg-orange-50' },
  { key: 'CLOSED', title: 'Closed Won', color: 'border-t-teal-800 bg-teal-50/80' },
  { key: 'LOST', title: 'Lost/Pass', color: 'border-t-red-500 bg-red-50' },
];

export default function CRMPipelinePage() {
  const [leads, setLeads] = useState<LeadItem[]>(DEFAULT_LEADS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // New Lead Form States
  const [newAddress, setNewAddress] = useState('');
  const [newSellerName, setNewSellerName] = useState('');
  const [newSellerPhone, setNewSellerPhone] = useState('');
  const [newProfit, setNewProfit] = useState(30000);
  const [newStage, setNewStage] = useState('LEAD');
  const [newFollowUp, setNewFollowUp] = useState('2026-08-01');

  // Change stage
  const moveLead = (id: string, targetStage: string) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, stage: targetStage } : l));
    setActiveMenuId(null);
  };

  // Add Lead
  const handleAddLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress) return;
    
    const lead: LeadItem = {
      id: `lead_${Date.now()}`,
      address: newAddress,
      sellerName: newSellerName || 'Anonymous Seller',
      sellerPhone: newSellerPhone || '+1 (555) 010-0000',
      profit: newProfit,
      stage: newStage,
      followUp: newFollowUp || new Date().toISOString().split('T')[0],
    };

    setLeads(prev => [lead, ...prev]);
    setIsModalOpen(false);
    
    // Reset Form
    setNewAddress('');
    setNewSellerName('');
    setNewSellerPhone('');
    setNewProfit(30000);
    setNewStage('LEAD');
  };

  // Delete Lead
  const handleDeleteLead = (id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id));
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <h1 className="font-display text-3xl tracking-tight text-foreground md:text-4xl">Deal CRM pipeline</h1>
          <p className="text-sm text-[var(--muted)]">Track purchase prospects, manage follow-up timers, and log assignment revenue.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-teal-700 hover:bg-teal-600 text-white font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg  text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add CRM Lead
        </button>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-5 overflow-x-auto pb-4">
        
        {COLUMNS.map((col) => {
          const colLeads = leads.filter(l => l.stage === col.key);
          
          return (
            <div 
              key={col.key}
              className={`flex flex-col w-full min-w-[200px] border-t-2 ${col.color} rounded-xl border border-[var(--border)] p-4 space-y-4`}
            >
              {/* Column Header */}
              <div className="flex justify-between items-center border-b border-[var(--border)] pb-2">
                <span className="text-xs font-extrabold text-foreground tracking-wide uppercase">{col.title}</span>
                <span className="bg-[var(--surface-soft)] text-[var(--muted)] text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {colLeads.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 space-y-4 min-h-[300px] overflow-y-auto">
                <AnimatePresence mode="popLayout">
                  {colLeads.map((lead) => (
                    <motion.div
                      key={lead.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      className="group relative bg-white border border-[var(--border)] rounded-xl p-4 space-y-3 hover:border-teal-700/20 transition-all shadow-md"
                    >
                      {/* Address */}
                      <div className="space-y-1">
                        <div className="text-[10px] text-[var(--muted-foreground)] font-semibold uppercase flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-teal-800" /> Location
                        </div>
                        <div className="text-xs font-bold text-foreground leading-tight">{lead.address}</div>
                      </div>

                      {/* Contact & Profit Info */}
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span className="text-[var(--muted-foreground)] uppercase font-semibold">Seller</span>
                          <div className="font-medium text-[var(--muted)] truncate">{lead.sellerName}</div>
                        </div>
                        <div>
                          <span className="text-[var(--muted-foreground)] uppercase font-semibold">Est. Profit</span>
                          <div className="font-bold text-teal-800">${lead.profit.toLocaleString()}</div>
                        </div>
                      </div>

                      {/* Control Panel: Move and Delete */}
                      <div className="flex justify-between items-center border-t border-[var(--border)] pt-3">
                        <span className="text-[9px] text-[var(--muted-foreground)] font-medium">Follow: {lead.followUp}</span>
                        <div className="flex items-center gap-1 relative">
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === lead.id ? null : lead.id)}
                            className="p-1 hover:bg-[var(--surface-soft)] rounded text-[var(--muted-foreground)] hover:text-foreground transition-all cursor-pointer"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                          
                          {/* Floating stage-shifter menu */}
                          {activeMenuId === lead.id && (
                            <div className="absolute right-0 bottom-6 bg-white border border-[var(--border)] rounded-xl shadow-2xl p-2 z-20 w-36 space-y-1">
                              <span className="text-[9px] text-[var(--muted-foreground)] font-bold uppercase block px-2 pb-1 border-b border-[var(--border)]">
                                Shift Stage
                              </span>
                              {COLUMNS.map(c => (
                                c.key !== lead.stage && (
                                  <button
                                    key={c.key}
                                    onClick={() => moveLead(lead.id, c.key)}
                                    className="w-full text-left text-[10px] px-2 py-1 hover:bg-teal-700 hover:text-white rounded transition-all font-medium text-[var(--muted)]"
                                  >
                                    {c.title}
                                  </button>
                                )
                              ))}
                              <button
                                onClick={() => handleDeleteLead(lead.id)}
                                className="w-full text-left text-[10px] text-red-400 hover:bg-red-500/10 px-2 py-1 rounded transition-all font-bold mt-1 pt-1.5 border-t border-[var(--border)]"
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

      {/* Modal Overlay: Add Lead Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="glass-panel border border-[var(--border)] rounded-2xl p-8 max-w-md w-full relative space-y-6">
            
            <div className="flex justify-between items-center border-b border-[var(--border)] pb-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-800" /> New Pipeline Lead
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 bg-[var(--surface-soft)] hover:bg-white rounded-lg text-[var(--muted)] hover:text-foreground transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddLeadSubmit} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs text-[var(--muted)] font-semibold uppercase">Street Address</label>
                <input
                  type="text"
                  required
                  placeholder="123 Main St, Dallas, TX"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full glass-input px-3.5 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-[var(--muted)] font-semibold uppercase">Seller Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={newSellerName}
                    onChange={(e) => setNewSellerName(e.target.value)}
                    className="w-full glass-input px-3.5 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-[var(--muted)] font-semibold uppercase">Seller Phone</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 012-3456"
                    value={newSellerPhone}
                    onChange={(e) => setNewSellerPhone(e.target.value)}
                    className="w-full glass-input px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-[var(--muted)] font-semibold uppercase">Projected Profit</label>
                  <input
                    type="number"
                    value={newProfit}
                    onChange={(e) => setNewProfit(Number(e.target.value))}
                    className="w-full glass-input px-3.5 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-[var(--muted)] font-semibold uppercase">Follow Up Date</label>
                  <input
                    type="date"
                    value={newFollowUp}
                    onChange={(e) => setNewFollowUp(e.target.value)}
                    className="w-full glass-input px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[var(--muted)] font-semibold uppercase">Initial Stage</label>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value)}
                  className="w-full glass-input px-3 py-2 text-sm bg-white text-foreground border-[var(--border)]"
                >
                  {COLUMNS.map(c => (
                    <option key={c.key} value={c.key} className="bg-white text-foreground">{c.title}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-teal-700 hover:bg-teal-600 text-white font-bold py-3 rounded-xl transition-all text-xs cursor-pointer shadow-lg "
              >
                Add Lead to Board
              </button>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
