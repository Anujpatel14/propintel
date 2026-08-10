'use client';

import React, { useState, useTransition } from 'react';
import {
  PIPELINE_STATUSES,
  PIPELINE_STATUS_LABELS,
  type PipelineStatus,
} from '@/lib/pipelineStatus';

const STATUS_STYLES: Record<PipelineStatus, string> = {
  LEAD: 'border-sky-200 bg-sky-50 text-sky-800',
  UNDER_REVIEW: 'border-[#1d4ed8]/20 bg-[#dbe7ff] text-[#1639a8]',
  OFFER_MADE: 'border-amber-200 bg-amber-50 text-amber-800',
  UNDER_CONTRACT: 'border-orange-200 bg-orange-50 text-orange-800',
  CLOSED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  LOST: 'border-rose-200 bg-rose-50 text-rose-700',
};

export function PipelineStatusSelect({
  value,
  onChange,
  disabled,
  compact,
}: {
  value: string;
  onChange: (next: PipelineStatus) => Promise<void> | void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [local, setLocal] = useState(value);
  const current = (PIPELINE_STATUSES.includes(local as PipelineStatus)
    ? local
    : 'LEAD') as PipelineStatus;

  React.useEffect(() => {
    setLocal(value);
  }, [value]);

  return (
    <select
      value={current}
      disabled={disabled || pending}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        const next = e.target.value as PipelineStatus;
        setLocal(next);
        startTransition(async () => {
          await onChange(next);
        });
      }}
      className={`cursor-pointer rounded-lg border font-semibold outline-none transition focus:ring-2 focus:ring-[#1d4ed8]/20 disabled:opacity-60 ${
        compact ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1.5 text-xs'
      } ${STATUS_STYLES[current]}`}
    >
      {PIPELINE_STATUSES.map((status) => (
        <option key={status} value={status}>
          {PIPELINE_STATUS_LABELS[status]}
        </option>
      ))}
    </select>
  );
}
