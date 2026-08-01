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
