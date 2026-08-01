'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { getAdminDealIntelligence } from '@/app/actions/adminExpandActions';

export default function AdminDealsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    totalAnalyses: number;
    totalVolume: number;
    avgCapRate: number;
    topMarkets: Array<{
      market: string;
      deals: number;
      avgCapRate: number;
      avgRoi: number;
      volume: number;
    }>;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const result = await getAdminDealIntelligence();
        setData(result);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex justify-center py-20 text-[var(--muted)]">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading deal flow…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-tight">Deal flow & market intelligence</h1>
        <p className="text-sm text-[var(--muted)]">
          Platform-wide underwriting activity and top markets.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SpotlightCard className="p-5">
          <div className="text-[10px] font-bold uppercase text-[var(--muted-foreground)]">
            Total analyses
          </div>
          <div className="mt-1 text-2xl font-extrabold">{data.totalAnalyses}</div>
        </SpotlightCard>
        <SpotlightCard className="p-5">
          <div className="text-[10px] font-bold uppercase text-[var(--muted-foreground)]">
            Pipeline volume
          </div>
          <div className="mt-1 text-2xl font-extrabold">
            ${(data.totalVolume / 1000).toFixed(0)}k
          </div>
        </SpotlightCard>
        <SpotlightCard className="p-5">
          <div className="text-[10px] font-bold uppercase text-[var(--muted-foreground)]">
            Avg cap rate
          </div>
          <div className="mt-1 text-2xl font-extrabold">{data.avgCapRate.toFixed(2)}%</div>
        </SpotlightCard>
      </div>

      <div className="surface-card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold">
          <MapPin className="h-4 w-4 text-teal-700" /> Top analyzed markets
        </h2>
        {data.topMarkets.length === 0 ? (
          <p className="text-xs text-[var(--muted)]">No analyses yet.</p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)] uppercase">
                <th className="py-2">Market</th>
                <th className="px-3 py-2">Deals</th>
                <th className="px-3 py-2">Avg cap</th>
                <th className="px-3 py-2">Avg ROI</th>
                <th className="py-2">Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {data.topMarkets.map((m) => (
                <tr key={m.market}>
                  <td className="py-2.5 font-semibold">{m.market}</td>
                  <td className="px-3 py-2.5">{m.deals}</td>
                  <td className="px-3 py-2.5">{m.avgCapRate.toFixed(2)}%</td>
                  <td className="px-3 py-2.5">{m.avgRoi.toFixed(2)}%</td>
                  <td className="py-2.5 font-bold text-teal-800">
                    ${m.volume.toLocaleString()}
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
