'use client';

import React, { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRightLeft,
  Bath,
  BedDouble,
  Building2,
  Calculator,
  ChevronDown,
  ExternalLink,
  FolderPlus,
  Home,
  Loader2,
  MapPin,
  Ruler,
  Save,
  Send,
  Trash2,
} from 'lucide-react';
import { SkeletonPropertyDetail } from '@/components/ui/Skeleton';
import { PipelineStatusSelect } from '@/components/dashboard/PipelineStatusSelect';
import { useToast } from '@/components/ui/Toast';
import type { PipelineStatus } from '@/lib/pipelineStatus';
import {
  deleteMyPropertyAction,
  getMyPropertyAction,
  sendPropertyToDealAction,
  updateMyPropertyAction,
} from '@/app/actions/propertyActions';

function money(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return '—';
  return `$${Math.round(n).toLocaleString()}`;
}

type PropertyRow = {
  id: string;
  attomId: string | null;
  address: string;
  city: string;
  state: string;
  zip: string;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;
  yearBuilt: number | null;
  estimatedValue: number | null;
  estimatedRent: number | null;
  taxAmount: number | null;
  propertyType: string | null;
  notes: string | null;
  source: string;
  latitude: number | null;
  longitude: number | null;
  pipelineStatus?: string | null;
};

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const id = String(params.id || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [property, setProperty] = useState<PropertyRow | null>(null);
  const [isPending, startTransition] = useTransition();
  const [sending, setSending] = useState<string | null>(null);
  const [dealMenuOpen, setDealMenuOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await getMyPropertyAction(id);
      if (cancelled) return;
      if (!res.success || !res.property) {
        setError(res.error || 'Not found');
        setProperty(null);
      } else {
        setProperty(res.property as PropertyRow);
        setNotes(res.property.notes || '');
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setDealMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  if (loading) return <SkeletonPropertyDetail />;

  if (error || !property) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-10">
        <h1 className="font-display text-2xl font-bold">Property</h1>
        <p className="text-sm text-[var(--muted)]">{error || 'Not found'}</p>
        <Link href="/dashboard/properties" className="text-sm font-semibold text-blue-800 hover:underline">
          Back to My Properties
        </Link>
      </div>
    );
  }

  const p = property;
  const calcQs = new URLSearchParams({
    address: p.address,
    zip: p.zip || '',
    from: 'property',
    propertyId: p.id,
    value: String(p.estimatedValue ?? ''),
    rent: String(p.estimatedRent ?? ''),
  });
  const flipQs = new URLSearchParams({
    address: p.address,
    from: 'property',
    propertyId: p.id,
    value: String(p.estimatedValue ?? ''),
  });

  const saveNotes = () => {
    startTransition(async () => {
      setMsg(null);
      const res = await updateMyPropertyAction(p.id, { notes });
      setMsg(res.success ? 'Notes saved.' : res.error || 'Failed');
      if (res.success) toast.success('Notes saved');
    });
  };

  const remove = () => {
    if (!window.confirm('Delete this property from My Properties?')) return;
    startTransition(async () => {
      await deleteMyPropertyAction(p.id);
      window.location.href = '/dashboard/properties';
    });
  };

  const sendToDeal = (strategy: 'hold' | 'flip' | 'rental') => {
    setDealMenuOpen(false);
    setSending(strategy);
    startTransition(async () => {
      const res = await sendPropertyToDealAction(p.id, strategy);
      setSending(null);
      if (!res.success) {
        toast.error(res.error || 'Could not create deal');
        return;
      }
      toast.success(
        res.updated ? 'Deal updated' : 'Sent to Deals',
        'Open the deal to refine underwriting numbers'
      );
      setProperty((prev) =>
        prev ? { ...prev, pipelineStatus: 'UNDER_REVIEW' } : prev
      );
      router.push(`/dashboard/deals/${res.dealId}`);
    });
  };

  const stats = [
    { label: 'Beds', value: p.bedrooms ?? '—', icon: BedDouble },
    { label: 'Baths', value: p.bathrooms ?? '—', icon: Bath },
    {
      label: 'Sqft',
      value: p.squareFeet ? Math.round(p.squareFeet).toLocaleString() : '—',
      icon: Ruler,
    },
    { label: 'Year', value: p.yearBuilt ?? '—', icon: Home },
  ];

  const pricePerSqft =
    p.estimatedValue && p.squareFeet && p.squareFeet > 0
      ? p.estimatedValue / p.squareFeet
      : null;

  const grossYield =
    p.estimatedValue && p.estimatedRent && p.estimatedValue > 0
      ? ((p.estimatedRent * 12) / p.estimatedValue) * 100
      : null;

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Link
            href="/dashboard/properties"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)] hover:text-blue-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> My Properties
          </Link>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#dbe7ff] px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-[#1639a8] uppercase">
            Asset · {p.source}
          </div>
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-[#0b1220] sm:text-3xl">
            {p.address}
          </h1>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-[var(--muted)]">
            <MapPin className="h-4 w-4 shrink-0 text-blue-800" />
            {[p.city, p.state, p.zip].filter(Boolean).join(', ')}
          </p>
          <div className="mt-3">
            <PipelineStatusSelect
              value={p.pipelineStatus || 'LEAD'}
              onChange={async (next: PipelineStatus) => {
                const res = await updateMyPropertyAction(p.id, { pipelineStatus: next });
                if (!res.success) {
                  toast.error(res.error || 'Could not update status');
                  return;
                }
                setProperty((prev) => (prev ? { ...prev, pipelineStatus: next } : prev));
                toast.success('Status updated', 'CRM pipeline moved too');
              }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/dashboard/properties/compare?ids=${p.id}`}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3.5 py-2 text-sm font-semibold shadow-sm hover:bg-[var(--surface-soft)]"
          >
            <ArrowRightLeft className="h-4 w-4 text-blue-800" /> Compare
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              disabled={isPending || !!sending}
              onClick={() => setDealMenuOpen((o) => !o)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1d4ed8] px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1e40af] disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send to deal
              <ChevronDown className="h-3.5 w-3.5 opacity-80" />
            </button>
            {dealMenuOpen && (
              <div className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-xl">
                <p className="border-b border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase">
                  Create deal from this asset
                </p>
                {(
                  [
                    {
                      key: 'hold' as const,
                      title: 'Buy & Hold',
                      desc: 'Cash flow deal with rent defaults',
                    },
                    {
                      key: 'rental' as const,
                      title: 'Rental',
                      desc: 'Rental strategy analysis',
                    },
                    {
                      key: 'flip' as const,
                      title: 'Fix & Flip',
                      desc: 'ARV / rehab defaults from value',
                    },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => sendToDeal(opt.key)}
                    className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left hover:bg-[#eff4ff]"
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-[#0b1220]">
                      <FolderPlus className="h-3.5 w-3.5 text-blue-800" />
                      {opt.title}
                    </span>
                    <span className="pl-5 text-[11px] text-[var(--muted)]">{opt.desc}</span>
                  </button>
                ))}
                <div className="border-t border-[var(--border)] px-3 py-2">
                  <Link
                    href={`/dashboard/analyze/hold?${calcQs.toString()}`}
                    className="flex items-center gap-2 text-xs font-semibold text-blue-800 hover:underline"
                    onClick={() => setDealMenuOpen(false)}
                  >
                    <Calculator className="h-3.5 w-3.5" />
                    Open analyzer first (edit numbers)
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link
            href={`/dashboard/analyze/hold?${calcQs.toString()}`}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3.5 py-2 text-sm font-semibold shadow-sm hover:bg-[var(--surface-soft)]"
          >
            <Calculator className="h-4 w-4" /> Analyze
          </Link>

          {p.attomId ? (
            <Link
              href={`/dashboard/explore/${p.attomId}`}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3.5 py-2 text-sm font-semibold shadow-sm hover:bg-[var(--surface-soft)]"
            >
              ATTOM <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          ) : null}

          <button
            type="button"
            disabled={isPending}
            onClick={remove}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>

      {/* Hero financial strip */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[#0b1220] p-6 text-white sm:p-8"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_80%_at_100%_0%,rgba(59,130,246,0.35),transparent_55%),radial-gradient(60%_50%_at_0%_100%,rgba(29,78,216,0.22),transparent_50%)]" />
        <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-[10px] font-bold tracking-[0.14em] text-blue-200/80 uppercase">
              Estimated value
            </p>
            <p className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {money(p.estimatedValue)}
            </p>
            <p className="mt-1 text-xs text-white/55">
              {p.propertyType || 'Property'} · {p.source}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-[0.14em] text-blue-200/80 uppercase">
              Est. rent / mo
            </p>
            <p className="mt-1 font-display text-2xl font-bold">{money(p.estimatedRent)}</p>
            <p className="mt-1 text-xs text-white/55">
              {grossYield != null ? `${grossYield.toFixed(1)}% gross yield` : 'Add rent to see yield'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-[0.14em] text-blue-200/80 uppercase">
              Annual tax
            </p>
            <p className="mt-1 font-display text-2xl font-bold">{money(p.taxAmount)}</p>
            <p className="mt-1 text-xs text-white/55">
              {pricePerSqft != null ? `$${Math.round(pricePerSqft)}/sqft` : '—'}
            </p>
          </div>
          <div className="flex flex-col justify-end gap-2">
            <button
              type="button"
              disabled={isPending || !!sending}
              onClick={() => sendToDeal('hold')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#0b1220] hover:bg-blue-50 disabled:opacity-50"
            >
              {sending === 'hold' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Quick send · Hold deal
            </button>
            <Link
              href={`/dashboard/analyze/flip?${flipQs.toString()}`}
              className="text-center text-xs font-medium text-white/70 hover:text-white"
            >
              Or open Fix & Flip analyzer →
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Stats + details */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[0_1px_0_rgba(15,23,42,0.04)]"
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold tracking-[0.12em] text-[var(--muted)] uppercase">
                  {s.label}
                </p>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eff4ff] text-blue-800">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 font-display text-2xl font-bold text-[#0b1220]">{s.value}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-white p-5 lg:col-span-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-800" />
            <h2 className="font-display text-lg font-bold">Property information</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {(
              [
                ['Type', p.propertyType || '—'],
                ['Beds', p.bedrooms ?? '—'],
                ['Baths', p.bathrooms ?? '—'],
                ['Sqft', p.squareFeet ? Math.round(p.squareFeet).toLocaleString() : '—'],
                ['Year built', p.yearBuilt ?? '—'],
                ['Source', p.source],
                [
                  'Coordinates',
                  p.latitude != null && p.longitude != null
                    ? `${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)}`
                    : '—',
                ],
                ['ZIP', p.zip || '—'],
                ['Market', [p.city, p.state].filter(Boolean).join(', ') || '—'],
              ] as const
            ).map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/50 px-3 py-2.5"
              >
                <p className="text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase">
                  {label}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-[#0b1220]">{value}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-[var(--border)] pt-4">
            <h3 className="mb-2 text-sm font-bold">Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-blue-700/40 focus:ring-2 focus:ring-blue-700/10"
              placeholder="Seller notes, walkthrough, comps…"
            />
            <button
              type="button"
              disabled={isPending}
              onClick={saveNotes}
              className="mt-2 inline-flex items-center gap-2 rounded-xl border border-blue-800/30 bg-blue-800/10 px-3.5 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-800/15 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save notes
            </button>
            {msg ? <p className="mt-2 text-sm text-blue-800">{msg}</p> : null}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <p className="text-[10px] font-bold tracking-[0.14em] text-[var(--muted)] uppercase">
              Deal actions
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Push this asset into Deals with starter underwriting, or open the analyzer.
            </p>
            <div className="mt-4 space-y-2">
              <button
                type="button"
                disabled={isPending || !!sending}
                onClick={() => sendToDeal('hold')}
                className="flex w-full items-center justify-between rounded-xl bg-[#1d4ed8] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1e40af] disabled:opacity-50"
              >
                <span className="inline-flex items-center gap-2">
                  <Send className="h-4 w-4" /> Send as Hold deal
                </span>
                {sending === 'hold' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              </button>
              <button
                type="button"
                disabled={isPending || !!sending}
                onClick={() => sendToDeal('flip')}
                className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-semibold hover:bg-[var(--surface-soft)] disabled:opacity-50"
              >
                <span className="inline-flex items-center gap-2">
                  <FolderPlus className="h-4 w-4 text-blue-800" /> Send as Flip deal
                </span>
                {sending === 'flip' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              </button>
              <Link
                href={`/dashboard/analyze/hold?${calcQs.toString()}`}
                className="flex w-full items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-semibold hover:bg-[var(--surface-soft)]"
              >
                <Calculator className="h-4 w-4 text-blue-800" /> Customize in analyzer
              </Link>
              <Link
                href={`/dashboard/properties/compare?ids=${p.id}`}
                className="flex w-full items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-semibold hover:bg-[var(--surface-soft)]"
              >
                <ArrowRightLeft className="h-4 w-4 text-blue-800" /> Compare with others
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[#eff4ff] to-white p-5">
            <p className="text-[10px] font-bold tracking-[0.14em] text-[#1639a8] uppercase">
              Snapshot
            </p>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li className="flex justify-between gap-3">
                <span className="text-[var(--muted)]">Est. value</span>
                <span className="font-semibold">{money(p.estimatedValue)}</span>
              </li>
              <li className="flex justify-between gap-3">
                <span className="text-[var(--muted)]">Est. rent</span>
                <span className="font-semibold">{money(p.estimatedRent)}/mo</span>
              </li>
              <li className="flex justify-between gap-3">
                <span className="text-[var(--muted)]">Annual tax</span>
                <span className="font-semibold">{money(p.taxAmount)}</span>
              </li>
              <li className="flex justify-between gap-3">
                <span className="text-[var(--muted)]">Gross yield</span>
                <span className="font-semibold">
                  {grossYield != null ? `${grossYield.toFixed(2)}%` : '—'}
                </span>
              </li>
              <li className="flex justify-between gap-3">
                <span className="text-[var(--muted)]">$/sqft</span>
                <span className="font-semibold">
                  {pricePerSqft != null ? `$${Math.round(pricePerSqft)}` : '—'}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
