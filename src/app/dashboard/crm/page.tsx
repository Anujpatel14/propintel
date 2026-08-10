'use client';

import React, { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  MapPin,
  MoreVertical,
  Loader2,
  X,
  Search,
  Building2,
  Mail,
  Phone,
  Clock,
  Snowflake,
  Inbox,
  Calculator,
  FileSignature,
  Handshake,
  CircleCheck,
  CircleX,
  DollarSign,
  Target,
  UserRound,
  StickyNote,
  Trophy,
  Layers,
  CalendarClock,
  Save,
  Hammer,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import {
  createDealLead,
  updateDealStage,
  updateDealLead,
  deleteDeal,
  getUserDeals,
  touchDeal,
  type SerializedDeal,
} from '@/app/actions/crmActions';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

type StageKey =
  | 'LEAD'
  | 'UNDER_REVIEW'
  | 'OFFER_MADE'
  | 'UNDER_CONTRACT'
  | 'CLOSED'
  | 'LOST';

type FocusFilter = 'all' | 'stale' | 'overdue' | 'contract' | 'highfee' | 'today';

interface DealLead {
  id: string;
  address: string;
  sellerName: string;
  sellerPhone: string;
  sellerEmail: string;
  buyerName: string;
  offerAmount: number;
  assignmentFee: number;
  stage: StageKey;
  followUp: string;
  followUpDate: Date | null;
  updatedAt: Date;
  notes: string;
}

const STAGE_WEIGHT: Record<StageKey, number> = {
  LEAD: 0.1,
  UNDER_REVIEW: 0.25,
  OFFER_MADE: 0.5,
  UNDER_CONTRACT: 0.8,
  CLOSED: 1,
  LOST: 0,
};

const COLUMNS: {
  key: StageKey;
  title: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  chip: string;
}[] = [
  {
    key: 'LEAD',
    title: 'New lead',
    hint: 'Fresh wholesale / off-market',
    icon: Inbox,
    accent: '#38bdf8',
    chip: 'bg-sky-100 text-sky-800',
  },
  {
    key: 'UNDER_REVIEW',
    title: 'Underwriting',
    hint: 'Comps, MAO, fee check',
    icon: Calculator,
    accent: '#1d4ed8',
    chip: 'bg-[#dbe7ff] text-[#1639a8]',
  },
  {
    key: 'OFFER_MADE',
    title: 'Offer sent',
    hint: 'MAO delivered to seller',
    icon: FileSignature,
    accent: '#d97706',
    chip: 'bg-amber-100 text-amber-800',
  },
  {
    key: 'UNDER_CONTRACT',
    title: 'Under contract',
    hint: 'Assignment in motion',
    icon: Handshake,
    accent: '#ea580c',
    chip: 'bg-orange-100 text-orange-800',
  },
  {
    key: 'CLOSED',
    title: 'Assigned',
    hint: 'Fee collected / closed',
    icon: CircleCheck,
    accent: '#059669',
    chip: 'bg-emerald-100 text-emerald-800',
  },
  {
    key: 'LOST',
    title: 'Passed',
    hint: 'Dead / walked away',
    icon: CircleX,
    accent: '#e11d48',
    chip: 'bg-rose-100 text-rose-800',
  },
];

function daysBetween(from: Date, to = new Date()) {
  return Math.floor((to.getTime() - from.getTime()) / 86400000);
}

function startOfDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(days: number) {
  const d = startOfDay();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function isClosedStage(stage: string) {
  return stage === 'CLOSED' || stage === 'LOST';
}

function isStale(deal: DealLead) {
  if (isClosedStage(deal.stage)) return false;
  return daysBetween(deal.updatedAt) >= 14;
}

function isOverdue(deal: DealLead) {
  if (isClosedStage(deal.stage) || !deal.followUpDate) return false;
  return deal.followUpDate < startOfDay();
}

function isDueToday(deal: DealLead) {
  if (isClosedStage(deal.stage) || !deal.followUpDate) return false;
  return deal.followUpDate.getTime() === startOfDay().getTime();
}

function needsAttention(deal: DealLead) {
  return isOverdue(deal) || isDueToday(deal);
}

function isHighFee(deal: DealLead) {
  return deal.assignmentFee >= 15000;
}

function money(n: number) {
  if (!n) return '—';
  return `$${Math.round(n).toLocaleString()}`;
}

function shortAddress(address: string) {
  const parts = address.split(',').map((p) => p.trim());
  return {
    street: parts[0] || address,
    locality: parts.slice(1).join(', ') || '',
  };
}

function mapDeal(deal: SerializedDeal): DealLead {
  const followUpDate = deal.followUpDate ? new Date(deal.followUpDate) : null;
  return {
    id: deal.id,
    address: deal.propertyAddress,
    sellerName: deal.sellerName || 'Unknown seller',
    sellerPhone: deal.sellerPhone || '',
    sellerEmail: deal.sellerEmail || '',
    buyerName: deal.buyerName || '',
    offerAmount: deal.offerAmount || 0,
    assignmentFee: deal.assignmentFee || 0,
    stage: (deal.stage as StageKey) || 'LEAD',
    followUp: followUpDate ? followUpDate.toISOString().split('T')[0] : '',
    followUpDate: followUpDate
      ? new Date(followUpDate.getFullYear(), followUpDate.getMonth(), followUpDate.getDate())
      : null,
    updatedAt: new Date(deal.updatedAt),
    notes: deal.notes || '',
  };
}

function DealCardFace({
  deal,
  dragging,
  menuOpen,
  onToggleMenu,
  onOpen,
  onMove,
  onDelete,
}: {
  deal: DealLead;
  dragging?: boolean;
  menuOpen?: boolean;
  onToggleMenu?: () => void;
  onOpen?: () => void;
  onMove?: (stage: StageKey) => void;
  onDelete?: () => void;
}) {
  const { street, locality } = shortAddress(deal.address);
  const idleDays = daysBetween(deal.updatedAt);
  const stale = isStale(deal);
  const overdue = isOverdue(deal);
  const dueToday = isDueToday(deal);
  const col = COLUMNS.find((c) => c.key === deal.stage);

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-white transition ${
        dragging
          ? 'border-[#1d4ed8]/50 shadow-[0_24px_60px_-28px_rgba(29,78,216,0.55)] ring-2 ring-[#1d4ed8]/20'
          : overdue
            ? 'border-orange-300 shadow-[0_14px_40px_-30px_rgba(11,18,32,0.45)]'
            : 'border-[var(--border)] shadow-[0_14px_40px_-30px_rgba(11,18,32,0.45)] hover:border-[#1d4ed8]/30'
      }`}
    >
      <div
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: overdue ? '#ea580c' : col?.accent || '#1d4ed8' }}
      />

      <div className="space-y-3 p-4 pt-5">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onOpen?.();
            }}
            className="min-w-0 cursor-pointer text-left"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#1d4ed8]">
              <MapPin className="h-3 w-3" />
              Property
            </div>
            <div className="mt-1 font-display text-[15px] leading-snug font-bold tracking-tight text-[#0b1220]">
              {street}
            </div>
            {locality ? (
              <div className="mt-0.5 truncate text-[11px] text-[var(--muted)]">{locality}</div>
            ) : null}
          </button>

          <div className="flex shrink-0 items-center gap-1">
            {stale ? (
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                <Snowflake className="h-3.5 w-3.5" />
              </span>
            ) : null}
            {onToggleMenu ? (
              <div className="relative">
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleMenu();
                  }}
                  className="cursor-pointer rounded-lg p-1.5 text-[var(--muted-foreground)] transition hover:bg-[var(--surface-soft)] hover:text-foreground"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {menuOpen ? (
                  <div
                    className="absolute right-0 top-8 z-30 w-44 space-y-1 rounded-xl border border-[var(--border)] bg-white p-2 shadow-2xl"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={onOpen}
                      className="w-full rounded-lg px-2 py-1.5 text-left text-[11px] font-semibold text-[#0b1220] transition hover:bg-[#dbe7ff]"
                    >
                      Open & edit
                    </button>
                    <span className="block border-b border-[var(--border)] px-2 pb-1 pt-1 text-[9px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Move stage
                    </span>
                    {COLUMNS.filter((c) => c.key !== deal.stage).map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => onMove?.(c.key)}
                        className="w-full rounded-lg px-2 py-1.5 text-left text-[11px] font-medium text-[var(--muted)] transition hover:bg-[#1d4ed8] hover:text-white"
                      >
                        {c.title}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={onDelete}
                      className="mt-1 w-full rounded-lg border-t border-[var(--border)] px-2 pt-2 pb-1 text-left text-[11px] font-bold text-rose-600 transition hover:bg-rose-50"
                    >
                      Remove deal
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-[#f3f6fb] px-3 py-2.5">
            <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Assignment fee
            </div>
            <div className="mt-0.5 text-sm font-extrabold text-[#1d4ed8]">
              {money(deal.assignmentFee)}
            </div>
          </div>
          <div className="rounded-xl bg-[#f3f6fb] px-3 py-2.5">
            <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Offer / MAO
            </div>
            <div className="mt-0.5 text-sm font-extrabold text-[#0b1220]">
              {money(deal.offerAmount)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dbe7ff] text-[10px] font-bold text-[#1639a8]">
            {deal.sellerName
              .split(/\s+/)
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase() || '')
              .join('') || <UserRound className="h-3.5 w-3.5" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold text-[#0b1220]">{deal.sellerName}</div>
            <div className="truncate text-[10px] text-[var(--muted)]">
              {deal.buyerName ? `Buyer · ${deal.buyerName}` : 'Seller lead'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {overdue ? (
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-800">
              Follow-up overdue
            </span>
          ) : dueToday ? (
            <span className="rounded-full bg-[#dbe7ff] px-2 py-0.5 text-[10px] font-bold text-[#1639a8]">
              Follow-up today
            </span>
          ) : deal.followUp ? (
            <span className="rounded-full bg-[var(--surface-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--muted)]">
              Follow-up {deal.followUp}
            </span>
          ) : null}
          {idleDays >= 7 && !isClosedStage(deal.stage) ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-800 ring-1 ring-sky-100">
              <Clock className="h-3 w-3" />
              {idleDays}d idle
            </span>
          ) : null}
          {deal.notes ? (
            <span className="inline-flex max-w-full items-center gap-1 truncate rounded-full bg-[#f3f6fb] px-2 py-0.5 text-[10px] font-medium text-[var(--muted)]">
              <StickyNote className="h-3 w-3 shrink-0" />
              <span className="truncate">{deal.notes}</span>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DraggableDealCard(props: {
  deal: DealLead;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onOpen: () => void;
  onMove: (stage: StageKey) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: props.deal.id,
    data: { type: 'deal', deal: props.deal },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.3 : 1,
      }}
      {...listeners}
      {...attributes}
      className="touch-none"
    >
      <DealCardFace {...props} />
    </div>
  );
}

function StageColumn({
  column,
  deals,
  activeMenuId,
  setActiveMenuId,
  onOpen,
  onMove,
  onDelete,
}: {
  column: (typeof COLUMNS)[number];
  deals: DealLead[];
  activeMenuId: string | null;
  setActiveMenuId: (id: string | null) => void;
  onOpen: (id: string) => void;
  onMove: (id: string, stage: StageKey) => void;
  onDelete: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.key,
    data: { type: 'column', stage: column.key },
  });
  const Icon = column.icon;
  const feeTotal = deals.reduce((s, d) => s + d.assignmentFee, 0);
  const weighted = deals.reduce(
    (s, d) => s + d.assignmentFee * (STAGE_WEIGHT[d.stage] ?? 0),
    0
  );

  return (
    <div
      ref={setNodeRef}
      className={`flex w-[min(90vw,300px)] shrink-0 flex-col rounded-[1.5rem] border p-3 transition md:w-[280px] ${
        isOver
          ? 'border-[#1d4ed8]/45 bg-[rgba(29,78,216,0.06)] ring-2 ring-[#1d4ed8]/15'
          : 'border-transparent bg-[#e8eef8]/55'
      }`}
    >
      <div className="mb-3 rounded-2xl border border-white/70 bg-white/90 px-3 py-3 shadow-sm backdrop-blur">
        <div className="flex items-center gap-2.5">
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm"
            style={{ background: column.accent }}
          >
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-bold text-[#0b1220]">{column.title}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${column.chip}`}>
                {deals.length}
              </span>
            </div>
            <div className="truncate text-[10px] text-[var(--muted)]">{column.hint}</div>
          </div>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-[10px] font-semibold text-[var(--muted)]">
          <span>Fees {money(feeTotal)}</span>
          <span>
            {Math.round((STAGE_WEIGHT[column.key] || 0) * 100)}% · {money(weighted)} wtd
          </span>
        </div>
      </div>

      <div className="flex max-h-[min(64vh,620px)] min-h-[240px] flex-1 flex-col gap-3 overflow-y-auto overscroll-contain pr-0.5">
        {deals.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-[#1d4ed8]/20 bg-white/60 px-4 py-12 text-center">
            <Building2 className="mb-2 h-6 w-6 text-[#1d4ed8]/35" />
            <div className="text-xs font-semibold text-[#0b1220]">No deals here</div>
            <div className="mt-1 max-w-[12rem] text-[10px] leading-relaxed text-[var(--muted)]">
              Drag a property card into this stage, or add a new wholesale lead.
            </div>
          </div>
        ) : (
          deals.map((deal) => (
            <DraggableDealCard
              key={deal.id}
              deal={deal}
              menuOpen={activeMenuId === deal.id}
              onToggleMenu={() =>
                setActiveMenuId(activeMenuId === deal.id ? null : deal.id)
              }
              onOpen={() => onOpen(deal.id)}
              onMove={(stage) => onMove(deal.id, stage)}
              onDelete={() => onDelete(deal.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function CRMPipelinePage() {
  const toast = useToast();
  const [deals, setDeals] = useState<DealLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wonModalOpen, setWonModalOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDetail, setIsSavingDetail] = useState(false);

  const [search, setSearch] = useState('');
  const [hideClosed, setHideClosed] = useState(true);
  const [focus, setFocus] = useState<FocusFilter>('all');

  const [draft, setDraft] = useState({
    address: '',
    sellerName: '',
    sellerPhone: '',
    sellerEmail: '',
    buyerName: '',
    offerAmount: 0,
    assignmentFee: 15000,
    stage: 'LEAD' as StageKey,
    followUp: addDays(3),
    notes: '',
  });

  const [newForm, setNewForm] = useState({
    address: '',
    sellerName: '',
    sellerPhone: '',
    sellerEmail: '',
    buyerName: '',
    offerAmount: 0,
    assignmentFee: 15000,
    stage: 'LEAD' as StageKey,
    followUp: addDays(3),
    notes: '',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const loadDeals = useCallback(async () => {
    setLoadError(null);
    try {
      const result = await getUserDeals();
      if (result.success) setDeals(result.deals.map(mapDeal));
    } catch (e) {
      console.error(e);
      setLoadError(
        e instanceof Error ? e.message : 'Couldn’t load your deal pipeline. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  const detailDeal = detailId ? deals.find((d) => d.id === detailId) || null : null;

  useEffect(() => {
    if (!detailDeal) return;
    setDraft({
      address: detailDeal.address,
      sellerName: detailDeal.sellerName,
      sellerPhone: detailDeal.sellerPhone,
      sellerEmail: detailDeal.sellerEmail,
      buyerName: detailDeal.buyerName,
      offerAmount: detailDeal.offerAmount,
      assignmentFee: detailDeal.assignmentFee,
      stage: detailDeal.stage,
      followUp: detailDeal.followUp,
      notes: detailDeal.notes,
    });
  }, [detailDeal]);

  const applyLocalDeal = (id: string, patch: Partial<DealLead>) => {
    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  const moveDeal = (id: string, targetStage: StageKey) => {
    setActiveMenuId(null);
    const previous = deals.find((d) => d.id === id);
    if (!previous || previous.stage === targetStage) return;

    applyLocalDeal(id, { stage: targetStage, updatedAt: new Date() });
    startTransition(async () => {
      const result = await updateDealStage(id, targetStage);
      if (!result.success) {
        applyLocalDeal(id, { stage: previous.stage, updatedAt: previous.updatedAt });
        toast.error('Couldn’t move deal', result.error);
        return;
      }
      toast.success('Stage updated', COLUMNS.find((c) => c.key === targetStage)?.title);
    });
  };

  const handleDelete = (id: string) => {
    setActiveMenuId(null);
    const previous = deals.find((d) => d.id === id);
    if (!previous) return;
    if (!window.confirm(`Remove ${shortAddress(previous.address).street} from your pipeline?`)) {
      return;
    }

    if (detailId === id) setDetailId(null);
    setDeals((prev) => prev.filter((d) => d.id !== id));
    startTransition(async () => {
      const result = await deleteDeal(id);
      if (!result.success) {
        setDeals((prev) => [...prev, previous]);
        toast.error('Couldn’t remove deal', result.error);
        return;
      }
      toast.success('Deal removed');
    });
  };

  const handleAddLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.address.trim()) {
      toast.error('Address required');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await createDealLead({
        propertyAddress: newForm.address,
        sellerName: newForm.sellerName || 'Unknown seller',
        sellerPhone: newForm.sellerPhone || undefined,
        sellerEmail: newForm.sellerEmail || undefined,
        buyerName: newForm.buyerName || undefined,
        offerAmount: newForm.offerAmount || undefined,
        assignmentFee: newForm.assignmentFee,
        notes: newForm.notes || undefined,
        stage: newForm.stage,
        followUpDate: newForm.followUp || undefined,
      });
      if (!result.success) {
        toast.error('Couldn’t add lead', result.error);
        return;
      }
      setDeals((prev) => [mapDeal(result.deal), ...prev]);
      setIsModalOpen(false);
      setNewForm({
        address: '',
        sellerName: '',
        sellerPhone: '',
        sellerEmail: '',
        buyerName: '',
        offerAmount: 0,
        assignmentFee: 15000,
        stage: 'LEAD',
        followUp: addDays(3),
        notes: '',
      });
      toast.success('Lead added to pipeline');
    } catch (err) {
      console.error(err);
      toast.error('Couldn’t add lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveDetail = async () => {
    if (!detailId) return;
    if (!draft.address.trim()) {
      toast.error('Address required');
      return;
    }
    setIsSavingDetail(true);
    try {
      const result = await updateDealLead(detailId, {
        propertyAddress: draft.address,
        sellerName: draft.sellerName,
        sellerPhone: draft.sellerPhone,
        sellerEmail: draft.sellerEmail,
        buyerName: draft.buyerName,
        offerAmount: draft.offerAmount,
        assignmentFee: draft.assignmentFee,
        notes: draft.notes,
        stage: draft.stage,
        followUpDate: draft.followUp || null,
      });
      if (!result.success || !result.deal) {
        toast.error('Couldn’t save deal', !result.success ? result.error : undefined);
        return;
      }
      setDeals((prev) => prev.map((d) => (d.id === detailId ? mapDeal(result.deal!) : d)));
      toast.success('Deal saved');
    } catch (e) {
      console.error(e);
      toast.error('Couldn’t save deal');
    } finally {
      setIsSavingDetail(false);
    }
  };

  const quickFollowUp = async (id: string, date: string | null) => {
    const previous = deals.find((d) => d.id === id);
    if (!previous) return;
    const followUpDate = date
      ? new Date(`${date}T12:00:00`)
      : null;
    applyLocalDeal(id, {
      followUp: date || '',
      followUpDate: followUpDate
        ? new Date(followUpDate.getFullYear(), followUpDate.getMonth(), followUpDate.getDate())
        : null,
      updatedAt: new Date(),
    });
    if (detailId === id) {
      setDraft((d) => ({ ...d, followUp: date || '' }));
    }
    const result = await updateDealLead(id, { followUpDate: date });
    if (!result.success) {
      applyLocalDeal(id, previous);
      toast.error('Couldn’t update follow-up', result.error);
      return;
    }
    toast.success(date ? `Follow-up set for ${date}` : 'Follow-up cleared');
  };

  const markContacted = async (id: string) => {
    const previous = deals.find((d) => d.id === id);
    if (!previous) return;
    applyLocalDeal(id, { updatedAt: new Date() });
    const result = await touchDeal(id);
    if (!result.success) {
      applyLocalDeal(id, { updatedAt: previous.updatedAt });
      toast.error('Couldn’t mark contacted', result.error);
      return;
    }
    toast.success('Marked contacted', 'Deal is no longer stale');
  };

  const openDeals = deals.filter((d) => !isClosedStage(d.stage));
  const agendaDeals = openDeals
    .filter(needsAttention)
    .sort((a, b) => {
      const at = a.followUpDate?.getTime() ?? 0;
      const bt = b.followUpDate?.getTime() ?? 0;
      return at - bt;
    });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return deals.filter((deal) => {
      if (hideClosed && isClosedStage(deal.stage)) return false;
      if (q) {
        const hay =
          `${deal.address} ${deal.sellerName} ${deal.sellerEmail} ${deal.sellerPhone} ${deal.buyerName} ${deal.notes}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (focus === 'stale' && !isStale(deal)) return false;
      if (focus === 'overdue' && !isOverdue(deal)) return false;
      if (focus === 'today' && !isDueToday(deal) && !isOverdue(deal)) return false;
      if (focus === 'contract' && deal.stage !== 'UNDER_CONTRACT') return false;
      if (focus === 'highfee' && !isHighFee(deal)) return false;
      return true;
    });
  }, [deals, search, hideClosed, focus]);

  const assignedFees = deals
    .filter((d) => d.stage === 'CLOSED')
    .reduce((s, d) => s + d.assignmentFee, 0);
  const weightedPipeline = openDeals.reduce(
    (s, d) => s + d.assignmentFee * (STAGE_WEIGHT[d.stage] ?? 0),
    0
  );
  const staleCount = openDeals.filter(isStale).length;

  const focusPills: { key: FocusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All deals', count: filtered.length },
    { key: 'today', label: 'Due now', count: agendaDeals.length },
    { key: 'stale', label: 'Stale', count: openDeals.filter(isStale).length },
    { key: 'overdue', label: 'Overdue', count: openDeals.filter(isOverdue).length },
    {
      key: 'contract',
      label: 'Under contract',
      count: openDeals.filter((d) => d.stage === 'UNDER_CONTRACT').length,
    },
    { key: 'highfee', label: 'High fee', count: openDeals.filter(isHighFee).length },
  ];

  const activeDeal = activeDragId ? deals.find((d) => d.id === activeDragId) || null : null;
  const assignable = openDeals.filter(
    (d) =>
      d.stage === 'UNDER_CONTRACT' || d.stage === 'OFFER_MADE' || d.stage === 'UNDER_REVIEW'
  );

  const onDragStart = (event: DragStartEvent) => {
    setActiveMenuId(null);
    setActiveDragId(String(event.active.id));
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;
    const dealId = String(active.id);
    const overId = String(over.id);
    let target: StageKey | null = null;
    if (COLUMNS.some((c) => c.key === overId)) target = overId as StageKey;
    else {
      const overDeal = deals.find((d) => d.id === overId);
      if (overDeal) target = overDeal.stage;
    }
    if (!target) return;
    moveDeal(dealId, target);
  };

  const addressQuery = (address: string) =>
    `/dashboard/analyze/hold?address=${encodeURIComponent(address)}`;
  const flipQuery = (address: string) =>
    `/dashboard/analyze/flip?address=${encodeURIComponent(address)}`;

  return (
    <div className="relative mx-auto max-w-[1680px] space-y-6">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-gradient-to-br from-[var(--hero-from)] via-[var(--hero-via)] to-[var(--hero-to)] p-5 text-white shadow-[var(--shadow-lift)] sm:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_45%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/80 ring-1 ring-white/15">
              <Layers className="h-3.5 w-3.5" />
              PropIntel CRM
              {isPending ? (
                <span className="inline-flex items-center gap-1 text-white/70">
                  <Loader2 className="h-3 w-3 animate-spin" /> Saving
                </span>
              ) : null}
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Deal pipeline
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/75 sm:text-[15px]">
              Run your wholesale book from lead to assignment — track fees, MAO, follow-ups, and
              underwrite without leaving the board.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => loadDeals()}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/20 bg-[rgba(255,255,255,0.1)] px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-[rgba(255,255,255,0.18)]"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setWonModalOpen(true)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/20 bg-[rgba(255,255,255,0.1)] px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-[rgba(255,255,255,0.18)]"
            >
              <Trophy className="h-4 w-4" />
              Mark assigned
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#1639a8] transition hover:bg-[#dbe7ff]"
            >
              <Plus className="h-4 w-4" />
              Add property lead
            </button>
          </div>
        </div>
      </div>

      {!isLoading && agendaDeals.length > 0 ? (
        <div className="rounded-[1.35rem] border border-orange-200/80 bg-gradient-to-r from-orange-50 to-white p-4 shadow-[var(--shadow-soft)] sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                <CalendarClock className="h-4 w-4" />
              </span>
              <div>
                <div className="text-sm font-bold text-[#0b1220]">Today’s follow-ups</div>
                <div className="text-[11px] text-[var(--muted)]">
                  {agendaDeals.length} deal{agendaDeals.length === 1 ? '' : 's'} need attention
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFocus('today')}
              className="text-xs font-semibold text-orange-700 hover:underline"
            >
              Focus board
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {agendaDeals.slice(0, 8).map((deal) => (
              <button
                key={deal.id}
                type="button"
                onClick={() => setDetailId(deal.id)}
                className="min-w-[220px] cursor-pointer rounded-2xl border border-orange-100 bg-white px-3.5 py-3 text-left transition hover:border-orange-300"
              >
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-700">
                  <AlertTriangle className="h-3 w-3" />
                  {isOverdue(deal) ? 'Overdue' : 'Due today'}
                </div>
                <div className="mt-1 truncate text-sm font-semibold text-[#0b1220]">
                  {shortAddress(deal.address).street}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-[var(--muted)]">
                  {deal.sellerName} · {money(deal.assignmentFee)} fee
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Open deals',
            value: String(openDeals.length),
            sub: 'Active wholesale pipeline',
            icon: Building2,
            tone: 'from-[var(--hero-via)] to-[var(--hero-to)]',
          },
          {
            label: 'Fees assigned',
            value: money(assignedFees),
            sub: 'Closed assignment revenue',
            icon: DollarSign,
            tone: 'from-[#059669] to-[#34d399]',
          },
          {
            label: 'Weighted pipeline',
            value: money(weightedPipeline),
            sub: 'Probability-weighted fees',
            icon: Target,
            tone: 'from-[var(--hero-from)] to-[var(--hero-via)]',
          },
          {
            label: 'Stale deals',
            value: String(staleCount),
            sub: 'No activity in 14+ days',
            icon: Snowflake,
            tone: 'from-[#ea580c] to-[#f59e0b]',
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="relative overflow-hidden rounded-[1.35rem] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-soft)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold text-[var(--muted)]">{kpi.label}</div>
                  <div className="mt-1.5 font-display text-3xl tracking-tight text-[#0b1220]">
                    {isLoading ? <Skeleton className="h-8 w-20" /> : kpi.value}
                  </div>
                  <div className="mt-1 text-[11px] text-[var(--muted-foreground)]">{kpi.sub}</div>
                </div>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${kpi.tone} text-white shadow-sm`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-[1.35rem] border border-[var(--border)] bg-white p-3 shadow-[var(--shadow-soft)] sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search address, seller, buyer, notes…"
              className="w-full rounded-2xl border border-[var(--border)] bg-[#f3f6fb] py-2.5 pr-4 pl-10 text-sm outline-none ring-[#1d4ed8]/20 placeholder:text-[var(--muted-foreground)] focus:bg-white focus:ring-2"
            />
          </div>
          <button
            type="button"
            onClick={() => setHideClosed((v) => !v)}
            className={`inline-flex cursor-pointer items-center justify-center rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
              hideClosed
                ? 'border-[#1d4ed8]/25 bg-[#dbe7ff] text-[#1639a8]'
                : 'border-[var(--border)] bg-[#f3f6fb] text-[var(--muted)] hover:text-foreground'
            }`}
          >
            {hideClosed ? 'Hiding assigned / passed' : 'Showing all stages'}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {focusPills.map((pill) => {
            const active = focus === pill.key;
            return (
              <button
                key={pill.key}
                type="button"
                onClick={() => setFocus(pill.key)}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  active
                    ? 'bg-[#0b1220] text-white'
                    : 'border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted)] hover:bg-[var(--surface)] hover:text-foreground'
                }`}
              >
                {pill.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    active ? 'bg-white text-[#0b1220]' : 'bg-white text-[var(--muted)]'
                  }`}
                >
                  {pill.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {COLUMNS.map((col) => (
            <div
              key={col.key}
              className="flex w-[280px] shrink-0 flex-col gap-3 rounded-[1.5rem] bg-[#e8eef8]/55 p-3"
            >
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-36 w-full rounded-2xl" />
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div className="space-y-4 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <p className="text-sm text-rose-700">{loadError}</p>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              loadDeals();
            }}
            className="btn-primary inline-flex cursor-pointer px-4 py-2.5 text-xs"
          >
            Retry connection
          </button>
        </div>
      ) : deals.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-[#1d4ed8]/25 bg-white px-6 py-16 text-center shadow-[var(--shadow-soft)]">
          <Building2 className="mx-auto h-10 w-10 text-[#1d4ed8]/40" />
          <h2 className="mt-4 font-display text-2xl font-bold text-[#0b1220]">
            Start your deal pipeline
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
            Add a wholesale lead with address, assignment fee, and MAO. Drag it through underwriting
            → offer → contract → assigned as the deal progresses.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="btn-primary mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-sm"
          >
            <Plus className="h-4 w-4" /> Add your first property lead
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto overscroll-x-contain pb-3 [-ms-overflow-style:none] [scrollbar-width:thin]">
            {COLUMNS.filter((col) => !(hideClosed && isClosedStage(col.key))).map((col) => (
              <StageColumn
                key={col.key}
                column={col}
                deals={filtered.filter((d) => d.stage === col.key)}
                activeMenuId={activeMenuId}
                setActiveMenuId={setActiveMenuId}
                onOpen={setDetailId}
                onMove={moveDeal}
                onDelete={handleDelete}
              />
            ))}
          </div>
          <DragOverlay dropAnimation={null}>
            {activeDeal ? (
              <div className="w-[280px] cursor-grabbing">
                <DealCardFace deal={activeDeal} dragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {detailDeal ? (
        <div
          className="fixed inset-0 z-[60] flex justify-end bg-[#0b1220]/40 backdrop-blur-sm"
          onClick={() => setDetailId(null)}
        >
          <aside
            className="flex h-full w-full max-w-lg flex-col border-l border-[var(--border)] bg-white shadow-[var(--shadow-lift)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-[var(--border)] bg-gradient-to-r from-[#f3f6fb] to-white px-5 py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1d4ed8]">
                    Edit deal
                  </div>
                  <h3 className="mt-1 font-display text-xl font-bold tracking-tight text-[#0b1220]">
                    {shortAddress(detailDeal.address).street}
                  </h3>
                  <p className="mt-0.5 text-sm text-[var(--muted)]">
                    Update fees, contacts, notes, and follow-ups
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailId(null)}
                  className="cursor-pointer rounded-xl border border-[var(--border)] p-2 text-[var(--muted)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  Property address
                </label>
                <input
                  value={draft.address}
                  onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
                  className="glass-input w-full px-3 py-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    Assignment fee
                  </label>
                  <input
                    type="number"
                    value={draft.assignmentFee}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, assignmentFee: Number(e.target.value) }))
                    }
                    className="glass-input w-full px-3 py-2.5 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    Offer / MAO
                  </label>
                  <input
                    type="number"
                    value={draft.offerAmount}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, offerAmount: Number(e.target.value) }))
                    }
                    className="glass-input w-full px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    Seller
                  </label>
                  <input
                    value={draft.sellerName}
                    onChange={(e) => setDraft((d) => ({ ...d, sellerName: e.target.value }))}
                    className="glass-input w-full px-3 py-2.5 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    End buyer
                  </label>
                  <input
                    value={draft.buyerName}
                    onChange={(e) => setDraft((d) => ({ ...d, buyerName: e.target.value }))}
                    className="glass-input w-full px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
                    <input
                      value={draft.sellerPhone}
                      onChange={(e) => setDraft((d) => ({ ...d, sellerPhone: e.target.value }))}
                      className="glass-input w-full py-2.5 pr-3 pl-9 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
                    <input
                      value={draft.sellerEmail}
                      onChange={(e) => setDraft((d) => ({ ...d, sellerEmail: e.target.value }))}
                      className="glass-input w-full py-2.5 pr-3 pl-9 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  Stage
                </label>
                <select
                  value={draft.stage}
                  onChange={(e) => setDraft((d) => ({ ...d, stage: e.target.value as StageKey }))}
                  className="glass-input w-full px-3 py-2.5 text-sm"
                >
                  {COLUMNS.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[#f3f6fb]/80 p-3">
                <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  Follow-up
                </div>
                <input
                  type="date"
                  value={draft.followUp}
                  onChange={(e) => setDraft((d) => ({ ...d, followUp: e.target.value }))}
                  className="glass-input mb-2 w-full bg-white px-3 py-2 text-sm"
                />
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Tomorrow', value: addDays(1) },
                    { label: '+3 days', value: addDays(3) },
                    { label: '+7 days', value: addDays(7) },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => quickFollowUp(detailDeal.id, chip.value)}
                      className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-[#1639a8] ring-1 ring-[#1d4ed8]/15 transition hover:bg-[#dbe7ff]"
                    >
                      {chip.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => quickFollowUp(detailDeal.id, null)}
                    className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-[var(--muted)] ring-1 ring-[var(--border)]"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => markContacted(detailDeal.id)}
                    className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200"
                  >
                    Mark contacted
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  Notes
                </label>
                <textarea
                  rows={4}
                  value={draft.notes}
                  onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                  placeholder="Seller motivation, repair notes, buyer interest…"
                  className="glass-input w-full resize-none px-3 py-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={addressQuery(draft.address || detailDeal.address)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[#f3f6fb] px-3 py-2.5 text-xs font-semibold text-[#0b1220] transition hover:border-[#1d4ed8]/30"
                >
                  <Calculator className="h-3.5 w-3.5 text-[#1d4ed8]" /> Buy & Hold
                </Link>
                <Link
                  href={flipQuery(draft.address || detailDeal.address)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[#f3f6fb] px-3 py-2.5 text-xs font-semibold text-[#0b1220] transition hover:border-[#1d4ed8]/30"
                >
                  <Hammer className="h-3.5 w-3.5 text-[#1d4ed8]" /> Fix & Flip
                </Link>
              </div>
            </div>

            <div className="flex gap-2 border-t border-[var(--border)] p-4">
              <button
                type="button"
                onClick={saveDetail}
                disabled={isSavingDetail}
                className="btn-primary inline-flex flex-1 items-center justify-center gap-2 py-2.5 text-sm disabled:opacity-60"
              >
                {isSavingDetail ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save changes
              </button>
              <button
                type="button"
                onClick={() => handleDelete(detailDeal.id)}
                className="rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
              >
                Remove
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      {isModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0b1220]/45 p-4 backdrop-blur-md"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative max-h-[90dvh] w-full max-w-lg space-y-5 overflow-y-auto rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-lift)] sm:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div>
                <h3 className="font-display text-lg font-bold text-[#0b1220]">Add property lead</h3>
                <p className="text-xs text-[var(--muted)]">
                  Capture address, assignment fee, and MAO for your wholesale pipeline.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="cursor-pointer rounded-lg bg-[var(--surface-soft)] p-1.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddLeadSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-[var(--muted)]">
                  Property address
                </label>
                <input
                  required
                  placeholder="124 Conch Street, Austin TX"
                  value={newForm.address}
                  onChange={(e) => setNewForm((f) => ({ ...f, address: e.target.value }))}
                  className="glass-input w-full px-3.5 py-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-[var(--muted)]">
                    Seller name
                  </label>
                  <input
                    placeholder="Robert Smith"
                    value={newForm.sellerName}
                    onChange={(e) => setNewForm((f) => ({ ...f, sellerName: e.target.value }))}
                    className="glass-input w-full px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-[var(--muted)]">
                    End buyer
                  </label>
                  <input
                    placeholder="Lone Star Investments"
                    value={newForm.buyerName}
                    onChange={(e) => setNewForm((f) => ({ ...f, buyerName: e.target.value }))}
                    className="glass-input w-full px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-[var(--muted)]">Phone</label>
                  <input
                    placeholder="+1 (555) 234-5678"
                    value={newForm.sellerPhone}
                    onChange={(e) => setNewForm((f) => ({ ...f, sellerPhone: e.target.value }))}
                    className="glass-input w-full px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-[var(--muted)]">Email</label>
                  <input
                    type="email"
                    placeholder="seller@email.com"
                    value={newForm.sellerEmail}
                    onChange={(e) => setNewForm((f) => ({ ...f, sellerEmail: e.target.value }))}
                    className="glass-input w-full px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-[var(--muted)]">
                    Assignment fee
                  </label>
                  <input
                    type="number"
                    value={newForm.assignmentFee}
                    onChange={(e) =>
                      setNewForm((f) => ({ ...f, assignmentFee: Number(e.target.value) }))
                    }
                    className="glass-input w-full px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-[var(--muted)]">
                    Offer / MAO
                  </label>
                  <input
                    type="number"
                    value={newForm.offerAmount}
                    onChange={(e) =>
                      setNewForm((f) => ({ ...f, offerAmount: Number(e.target.value) }))
                    }
                    className="glass-input w-full px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-[var(--muted)]">
                    Follow-up date
                  </label>
                  <input
                    type="date"
                    value={newForm.followUp}
                    onChange={(e) => setNewForm((f) => ({ ...f, followUp: e.target.value }))}
                    className="glass-input w-full px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-[var(--muted)]">Stage</label>
                  <select
                    value={newForm.stage}
                    onChange={(e) =>
                      setNewForm((f) => ({ ...f, stage: e.target.value as StageKey }))
                    }
                    className="glass-input w-full px-3 py-2.5 text-sm"
                  >
                    {COLUMNS.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-[var(--muted)]">Notes</label>
                <textarea
                  rows={3}
                  placeholder="Seller motivated due to relocation. Roof needs minor repair."
                  value={newForm.notes}
                  onChange={(e) => setNewForm((f) => ({ ...f, notes: e.target.value }))}
                  className="glass-input w-full resize-none px-3.5 py-2.5 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex w-full items-center justify-center gap-2 py-3 text-sm disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? 'Saving…' : 'Add to pipeline'}
              </button>
            </form>
          </div>
        </div>
      )}

      {wonModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0b1220]/45 p-4 backdrop-blur-md"
          onClick={() => setWonModalOpen(false)}
        >
          <div
            className="w-full max-w-md space-y-4 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-lift)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-[#0b1220]">Mark assigned</h3>
                <p className="text-xs text-[var(--muted)]">
                  Move a deal to Assigned when the assignment fee is locked in.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setWonModalOpen(false)}
                className="rounded-lg bg-[var(--surface-soft)] p-1.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {assignable.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                No open deals ready to assign. Move one into Underwriting / Offer / Contract first.
              </p>
            ) : (
              <div className="max-h-72 space-y-2 overflow-y-auto">
                {assignable.map((deal) => (
                  <button
                    key={deal.id}
                    type="button"
                    onClick={() => {
                      moveDeal(deal.id, 'CLOSED');
                      setWonModalOpen(false);
                    }}
                    className="flex w-full cursor-pointer items-start justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-3 text-left transition hover:border-[color-mix(in_srgb,var(--cobalt)_40%,transparent)] hover:bg-[var(--surface)]"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[#0b1220]">
                        {shortAddress(deal.address).street}
                      </div>
                      <div className="truncate text-[11px] text-[var(--muted)]">
                        {deal.sellerName} · {COLUMNS.find((c) => c.key === deal.stage)?.title}
                      </div>
                    </div>
                    <div className="shrink-0 text-xs font-bold text-emerald-700">
                      {money(deal.assignmentFee)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
