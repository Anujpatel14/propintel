'use client';

import React, { useState } from 'react';
import { 
  FolderOpen, 
  Search, 
  Trash2, 
  TrendingUp, 
  DollarSign, 
  ArrowRightLeft, 
  Building,
  CheckCircle,
  X
} from 'lucide-react';
import SpotlightCard from '@/components/ui/SpotlightCard';

interface SavedDeal {
  id: string;
  address: string;
  type: string;
  purchasePrice: number;
  rehabCost: number;
  cashFlow: number;
  roi: number;
  capRate: number;
  dscr: number;
}

const DEFAULT_DEALS: SavedDeal[] = [
  {
    id: 'deal-1',
    address: '1402 Oak Ridge Dr, Dallas, TX',
    type: 'Buy & Hold',
    purchasePrice: 220000,
    rehabCost: 30000,
    cashFlow: 312.45,
    roi: 11.2,
    capRate: 7.2,
    dscr: 1.35,
  },
  {
    id: 'deal-2',
    address: '892 Elm Street, Plano, TX',
    type: 'Fix & Flip',
    purchasePrice: 195000,
    rehabCost: 45000,
    cashFlow: 0,
    roi: 18.5, // flip yield
    capRate: 0,
    dscr: 0,
  },
  {
    id: 'deal-3',
    address: '778 Highland Ave, Austin, TX',
    type: 'Buy & Hold',
    purchasePrice: 380000,
    rehabCost: 15000,
    cashFlow: 184.20,
    roi: 6.8,
    capRate: 5.8,
    dscr: 1.15,
  },
  {
    id: 'deal-4',
    address: '311 Maple St, Fort Worth, TX',
    type: 'Buy & Hold',
    purchasePrice: 165000,
    rehabCost: 25000,
    cashFlow: 298.50,
    roi: 12.4,
    capRate: 8.1,
    dscr: 1.48,
  },
];

export default function SavedDealsPage() {
  const [deals, setDeals] = useState<SavedDeal[]>(DEFAULT_DEALS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  React.useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('propintel_saved_deals') || '[]') as Array<{
        id: string;
        address: string;
        type: string;
        purchasePrice: number;
        cashFlow: number;
        roi: number;
        capRate: number;
      }>;
      if (stored.length) {
        const mapped: SavedDeal[] = stored.map((d) => ({
          id: d.id,
          address: d.address,
          type:
            d.type === 'flip'
              ? 'Fix & Flip'
              : d.type === 'rental'
                ? 'Rental L/T'
                : d.type === 'hold'
                  ? 'Buy & Hold'
                  : d.type,
          purchasePrice: d.purchasePrice,
          rehabCost: 0,
          cashFlow: d.cashFlow,
          roi: d.roi,
          capRate: d.capRate,
          dscr: 0,
        }));
        setDeals((prev) => {
          const ids = new Set(mapped.map((m) => m.id));
          return [...mapped, ...prev.filter((p) => !ids.has(p.id))];
        });
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Toggle selection for comparison
  const handleSelectDeal = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : prev.length < 3 
          ? [...prev, id] 
          : prev
    );
  };

  // Remove deal
  const handleDeleteDeal = (id: string) => {
    setDeals(prev => prev.filter(d => d.id !== id));
    setSelectedIds(prev => prev.filter(item => item !== id));
  };

  // Filter deals
  const filteredDeals = deals.filter(d => 
    d.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedDeals = deals.filter(d => selectedIds.includes(d.id));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">Saved Deals Database</h1>
          <p className="text-sm text-[var(--muted)]">Search historical calculations, compare yields, and manage archives.</p>
        </div>
        {selectedIds.length >= 2 && (
          <button
            onClick={() => setShowComparison(true)}
            className="bg-[#0e1a16] hover:bg-teal-900 text-foreground font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg  text-sm cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4" /> Compare Selected ({selectedIds.length})
          </button>
        )}
      </div>

      {/* Search Filter */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-[var(--muted-foreground)] absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Search by street address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full glass-input pl-10 pr-4 py-2.5 text-sm"
        />
      </div>

      {/* Grid of Deals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDeals.map((deal) => {
          const isChecked = selectedIds.includes(deal.id);
          
          return (
            <SpotlightCard 
              key={deal.id}
              className={`p-6 space-y-4 border ${isChecked ? 'border-teal-700/30 bg-teal-700/5' : 'border-[var(--border)] bg-white'}`}
            >
              
              {/* Card Header */}
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-[var(--surface-soft)] text-[9px] text-[var(--muted)] font-bold px-2 py-0.5 rounded uppercase">
                      {deal.type}
                    </span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleSelectDeal(deal.id)}
                      className="w-3.5 h-3.5 accent-emerald-500 rounded border-[var(--border)]"
                    />
                    <span className="text-[10px] text-[var(--muted-foreground)]">Compare</span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground leading-snug mt-1">{deal.address}</h3>
                </div>
                <button
                  onClick={() => handleDeleteDeal(deal.id)}
                  className="p-1.5 bg-[var(--surface-soft)] hover:bg-red-500/10 rounded-lg text-[var(--muted-foreground)] hover:text-red-400 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Data metrics */}
              <div className="grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-4 text-center">
                <div>
                  <span className="text-[9px] text-[var(--muted-foreground)] uppercase font-semibold">Purchase</span>
                  <div className="text-xs font-bold text-foreground mt-0.5">${(deal.purchasePrice / 1000).toFixed(0)}k</div>
                </div>
                <div>
                  <span className="text-[9px] text-[var(--muted-foreground)] uppercase font-semibold">Rehab</span>
                  <div className="text-xs font-bold text-foreground mt-0.5">${(deal.rehabCost / 1000).toFixed(0)}k</div>
                </div>
                <div>
                  <span className="text-[9px] text-[var(--muted-foreground)] uppercase font-semibold">ROI</span>
                  <div className="text-xs font-extrabold text-teal-800 mt-0.5">{deal.roi.toFixed(1)}%</div>
                </div>
              </div>

              {deal.type === 'Buy & Hold' && (
                <div className="grid grid-cols-2 gap-4 text-[10px] border-t border-[var(--border)] pt-3">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Cash Flow:</span>
                    <span className="font-bold text-[var(--muted)]">${deal.cashFlow.toFixed(0)}/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">DSCR:</span>
                    <span className="font-bold text-[var(--muted)]">{deal.dscr.toFixed(2)}</span>
                  </div>
                </div>
              )}

            </SpotlightCard>
          );
        })}
      </div>

      {/* Slide-out Comparison Overlay Drawer */}
      {showComparison && (
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="glass-panel border border-[var(--border)] rounded-2xl p-8 max-w-4xl w-full relative space-y-6">
            
            <div className="flex justify-between items-center border-b border-[var(--border)] pb-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-teal-800" /> Side-by-Side Comparison Matrix
              </h3>
              <button 
                onClick={() => setShowComparison(false)}
                className="p-1.5 bg-[var(--surface-soft)] hover:bg-white rounded-lg text-[var(--muted)] hover:text-foreground transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="py-3 text-xs text-[var(--muted-foreground)] uppercase font-semibold">Financial Parameter</th>
                    {selectedDeals.map((d, i) => (
                      <th key={i} className="py-3 px-4 font-bold text-foreground">{d.address.split(',')[0]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="py-3 text-[var(--muted)] text-xs uppercase font-medium">Calculation Model</td>
                    {selectedDeals.map((d, i) => (
                      <td key={i} className="py-3 px-4 font-semibold text-[var(--muted)]">{d.type}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 text-[var(--muted)] text-xs uppercase font-medium">Purchase Price</td>
                    {selectedDeals.map((d, i) => (
                      <td key={i} className="py-3 px-4 font-bold text-foreground">${d.purchasePrice.toLocaleString()}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 text-[var(--muted)] text-xs uppercase font-medium">Rehab Budget</td>
                    {selectedDeals.map((d, i) => (
                      <td key={i} className="py-3 px-4 font-bold text-foreground">${d.rehabCost.toLocaleString()}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 text-[var(--muted)] text-xs uppercase font-medium">Total Capital Outlay</td>
                    {selectedDeals.map((d, i) => (
                      <td key={i} className="py-3 px-4 font-bold text-teal-800">${(d.purchasePrice * 0.2 + d.rehabCost).toLocaleString()}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 text-[var(--muted)] text-xs uppercase font-medium">Net Return (ROI)</td>
                    {selectedDeals.map((d, i) => (
                      <td key={i} className="py-3 px-4 font-extrabold text-teal-800">{d.roi.toFixed(1)}%</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 text-[var(--muted)] text-xs uppercase font-medium">Monthly Cash Flow</td>
                    {selectedDeals.map((d, i) => (
                      <td key={i} className="py-3 px-4 font-semibold text-[var(--muted)]">${d.cashFlow > 0 ? `${d.cashFlow.toFixed(2)}/mo` : 'N/A'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 text-[var(--muted)] text-xs uppercase font-medium">Cap Rate</td>
                    {selectedDeals.map((d, i) => (
                      <td key={i} className="py-3 px-4 font-semibold text-[var(--muted)]">{d.capRate > 0 ? `${d.capRate.toFixed(2)}%` : 'N/A'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 text-[var(--muted)] text-xs uppercase font-medium">DSCR</td>
                    {selectedDeals.map((d, i) => (
                      <td key={i} className="py-3 px-4 font-semibold text-[var(--muted)]">{d.dscr > 0 ? d.dscr.toFixed(2) : 'N/A'}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-4 border-t border-[var(--border)]">
              <button
                onClick={() => setShowComparison(false)}
                className="bg-teal-700 hover:bg-teal-600 text-white font-bold px-6 py-2.5 rounded-xl transition-all text-xs cursor-pointer"
              >
                Close Comparison
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
