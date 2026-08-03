import React from 'react';

/**
 * Standard page header used across investor and admin workspace pages.
 * Matches the CRM pipeline header layout.
 */
export default function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 border-b border-[var(--border)] pb-6 md:flex-row md:items-center">
      <div>
        <h1 className="font-display text-3xl tracking-tight text-foreground md:text-4xl">
          {title}
        </h1>
        {description ? <p className="mt-1 text-sm text-[var(--muted)]">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
