export const PIPELINE_STATUSES = [
  'LEAD',
  'UNDER_REVIEW',
  'OFFER_MADE',
  'UNDER_CONTRACT',
  'CLOSED',
  'LOST',
] as const;

export type PipelineStatus = (typeof PIPELINE_STATUSES)[number];

export const PIPELINE_STATUS_LABELS: Record<PipelineStatus, string> = {
  LEAD: 'New lead',
  UNDER_REVIEW: 'Underwriting',
  OFFER_MADE: 'Offer sent',
  UNDER_CONTRACT: 'Under contract',
  CLOSED: 'Assigned',
  LOST: 'Passed',
};

export function isPipelineStatus(value: string): value is PipelineStatus {
  return (PIPELINE_STATUSES as readonly string[]).includes(value);
}
