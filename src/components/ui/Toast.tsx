'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastTone = 'success' | 'error' | 'info';

export type ToastInput = {
  title: string;
  description?: string;
  tone?: ToastTone;
  durationMs?: number;
};

type ToastItem = ToastInput & { id: string; tone: ToastTone };

type ToastContextValue = {
  toast: (input: ToastInput | string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function toneIcon(tone: ToastTone) {
  if (tone === 'success') return CheckCircle2;
  if (tone === 'error') return AlertCircle;
  return Info;
}

function toneClasses(tone: ToastTone) {
  if (tone === 'success') return 'border-[color-mix(in_srgb,var(--cobalt)_35%,transparent)] text-[var(--sky-fg)]';
  if (tone === 'error') return 'border-[var(--danger-border)] text-[var(--danger-fg)]';
  return 'border-[var(--border)] text-foreground';
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((input: ToastInput | string) => {
    const normalized: ToastInput =
      typeof input === 'string' ? { title: input } : input;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const item: ToastItem = {
      id,
      title: normalized.title,
      description: normalized.description,
      tone: normalized.tone || 'info',
      durationMs: normalized.durationMs ?? 3800,
    };
    setItems((prev) => [...prev.slice(-4), item]);
  }, []);

  const api = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (title, description) => toast({ title, description, tone: 'success' }),
      error: (title, description) => toast({ title, description, tone: 'error' }),
      info: (title, description) => toast({ title, description, tone: 'info' }),
    }),
    [toast]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-[min(100vw-2rem,22rem)] flex-col gap-2"
        aria-live="polite"
      >
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <ToastCard key={item.id} item={item} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const Icon = toneIcon(item.tone);

  useEffect(() => {
    const t = window.setTimeout(() => onDismiss(item.id), item.durationMs ?? 3800);
    return () => window.clearTimeout(t);
  }, [item.id, item.durationMs, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      className={`pointer-events-auto flex gap-3 rounded-xl border bg-[var(--surface)] px-3.5 py-3 shadow-[var(--shadow-lift,0_8px_30px_rgba(0,0,0,0.12))] ${toneClasses(item.tone)}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug">{item.title}</p>
        {item.description ? (
          <p className="mt-0.5 text-xs leading-snug text-[var(--muted)]">{item.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        className="shrink-0 rounded p-0.5 text-[var(--muted)] hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
