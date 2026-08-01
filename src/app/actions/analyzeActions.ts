'use server';

import { requireAuth } from '@/lib/services/auth';
import {
  analyzeDeal,
  isAiConfigured,
  type DealMetrics,
  type VerdictLabel,
  type AiBullet,
  type AiSummaryRow,
} from '@/lib/services/ai';

/** In-memory / client preview of an AI verdict (not persisted until Save deal). */
export type AiVerdictPreview = {
  id: string;
  address: string;
  modelType: string;
  provider: 'openrouter' | 'rules';
  modelName: string | null;
  verdict: VerdictLabel;
  headline: string | null;
  summary: AiSummaryRow[];
  strengths: AiBullet[];
  risks: AiBullet[];
  reportText: string | null;
  metrics: DealMetrics | null;
  createdAt: string;
};

/** @deprecated use AiVerdictPreview — kept for existing imports */
export type SavedAiAnalysis = AiVerdictPreview;

export async function analyzeDealAction(metrics: DealMetrics) {
  await requireAuth();

  if (!metrics?.address?.trim()) {
    return { success: false as const, error: 'Property address is required.' };
  }

  try {
    const cleaned = { ...metrics, address: metrics.address.trim() };
    const result = await analyzeDeal(cleaned);

    const analysis: AiVerdictPreview = {
      id: `preview-${Date.now()}`,
      address: cleaned.address,
      modelType: cleaned.modelType || 'hold',
      provider: result.provider,
      modelName: result.modelName || null,
      verdict: result.verdict,
      headline: result.headline,
      summary: result.summary,
      strengths: result.strengths,
      risks: result.risks,
      reportText: result.reportText,
      metrics: cleaned,
      createdAt: new Date().toISOString(),
    };

    return {
      success: true as const,
      analysis,
      aiConfigured: isAiConfigured(),
      reused: false as const,
    };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : 'Analysis failed',
    };
  }
}

export async function getAiStatusAction() {
  await requireAuth();
  return {
    configured: isAiConfigured(),
    provider: process.env.OPENROUTER_API_KEY
      ? 'openrouter'
      : process.env.OPENAI_API_KEY
        ? 'openai'
        : 'rules',
    model: process.env.OPENROUTER_MODEL || 'openrouter/free',
  };
}
