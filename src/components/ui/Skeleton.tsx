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
