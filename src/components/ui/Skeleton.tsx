import React from 'react';

type SkeletonProps = {
  className?: string;
  /** Accessible label while content loads */
  label?: string;
};

/**
 * Inline shimmer placeholder for async values (amounts, counts, status chips).
 * Keep surrounding labels/cards mounted; swap only the dynamic bit for this.
 */
export function Skeleton({ className = '', label = 'Loading' }: SkeletonProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`skeleton-shimmer inline-block rounded-md ${className}`}
    />
  );
}

/** Large metric number placeholder (KPI cards, balance tiles). */
export function SkeletonValue({ className = '' }: { className?: string }) {
  return <Skeleton className={`h-8 w-24 ${className}`} label="Loading value" />;
}

/** Compact text / status line placeholder. */
export function SkeletonText({ className = '' }: { className?: string }) {
  return <Skeleton className={`h-3.5 w-28 ${className}`} label="Loading text" />;
}

/** Placeholder rows for tables / event lists while data loads. */
export function SkeletonRows({
  rows = 5,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading rows">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          {Array.from({ length: cols }).map((__, j) => (
            <Skeleton
              key={j}
              className={`h-4 flex-1 ${j === 0 ? 'max-w-[40%]' : j === cols - 1 ? 'max-w-[15%]' : ''}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Form field placeholders — keep section labels visible around these. */
export function SkeletonFields({ count = 6, cols = 2 }: { count?: number; cols?: number }) {
  return (
    <div
      className={`grid grid-cols-1 gap-4 ${cols === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}
      role="status"
      aria-label="Loading form"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

/** Card grid placeholders (deal pickers, plan cards, coaching tiles). */
export function SkeletonCards({ count = 6, className = '' }: { count?: number; className?: string }) {
  return (
    <div
      className={`grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 ${className}`}
      role="status"
      aria-label="Loading cards"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-xl border border-[var(--border)] p-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-3/4 max-w-[80%]" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

/** Matches Property Explorer / My Properties listing cards. */
export function SkeletonPropertyCards({
  count = 6,
  className = '',
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 ${className}`}
      role="status"
      aria-label="Loading properties"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-4/5 max-w-[85%]" />
              <Skeleton className="h-3 w-2/3 max-w-[60%]" />
            </div>
            <Skeleton className="h-5 w-12 shrink-0 rounded" />
          </div>
          <div className="mb-4 flex flex-wrap gap-3">
            <Skeleton className="h-3.5 w-14" />
            <Skeleton className="h-3.5 w-14" />
            <Skeleton className="h-3.5 w-20" />
          </div>
          <div className="mt-auto flex items-end justify-between gap-2 border-t border-[var(--border)] pt-3">
            <div className="space-y-1.5">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Matches explore detail: overview (2 cols) + financial sidebar. */
export function SkeletonPropertyDetail() {
  return (
    <div className="space-y-8" role="status" aria-label="Loading property details">
      <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-72 max-w-full" />
          <Skeleton className="h-3.5 w-48" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 lg:col-span-2">
          <Skeleton className="mb-4 h-6 w-28" />
          <div className="mb-6 flex flex-wrap gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-20" />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <Skeleton className="mb-5 h-6 w-24" />
          <Skeleton className="mb-1 h-2.5 w-20" />
          <Skeleton className="mb-5 h-9 w-36" />
          <div className="space-y-3 border-t border-[var(--border)] pt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3.5 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
