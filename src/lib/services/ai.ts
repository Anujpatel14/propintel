import 'server-only';

import { logError, logInfo } from '@/lib/logger';

export interface DealMetrics {
  address: string;
  purchasePrice: number;
  rehabCost: number;
  arv: number;
  rent: number;
  cashFlow: number;
  roi: number;
  capRate: number;
  dscr: number;
  cashOnCash: number;
  modelType?: string;
}

export type VerdictLabel = 'STRONG BUY' | 'ACQUIRE WITH CAUTION' | 'PASS OR RE-NEGOTIATE';

export type AiBullet = { title: string; detail: string };
export type AiSummaryRow = { label: string; value: string };

export type StructuredAiAnalysis = {
  address: string;
  provider: 'openrouter' | 'rules';
  modelName?: string | null;
  verdict: VerdictLabel;
  headline: string;
  summary: AiSummaryRow[];
  strengths: AiBullet[];
  risks: AiBullet[];
  /** Plain readable text for PDF export (not shown raw in UI) */
  reportText: string;
};

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || 'openrouter/free';

function isOpenRouterConfigured(): boolean {
  const key = process.env.OPENROUTER_API_KEY;
  return Boolean(key && key.startsWith('sk-or-') && !key.includes('replace'));
}

function money(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
}

function buildSummary(metrics: DealMetrics): AiSummaryRow[] {
  return [
    {
      label: 'Purchase / Rehab',
      value: `${money(metrics.purchasePrice)} · ${money(metrics.rehabCost)}`,
    },
    { label: 'ARV', value: money(metrics.arv) },
    {
      label: 'Cap / Cash-on-Cash',
      value: `${metrics.capRate.toFixed(2)}% · ${metrics.cashOnCash.toFixed(2)}%`,
    },
    {
      label: 'DSCR / ROI signal',
      value: `${metrics.dscr.toFixed(2)} · ${metrics.roi.toFixed(2)}%`,
    },
    {
      label: 'Monthly cash flow',
      value: `${metrics.cashFlow >= 0 ? '+' : ''}$${metrics.cashFlow.toFixed(2)}`,
    },
  ];
}

function toReportText(analysis: Omit<StructuredAiAnalysis, 'reportText'>): string {
  const lines = [
    `AI Deal Analysis — ${analysis.address}`,
    `Verdict: ${analysis.verdict}`,
    analysis.headline,
    '',
    'Key metrics',
    ...analysis.summary.map((s) => `• ${s.label}: ${s.value}`),
    '',
    'Strengths',
    ...analysis.strengths.map((s) => `• ${s.title}: ${s.detail}`),
    '',
    'Risks',
    ...analysis.risks.map((s) => `• ${s.title}: ${s.detail}`),
  ];
  return lines.join('\n');
}

function normalizeVerdict(raw: string | undefined | null): VerdictLabel {
  const t = (raw || '').toUpperCase();
  if (t.includes('STRONG')) return 'STRONG BUY';
  if (t.includes('PASS') || t.includes('RE-NEGOTIATE') || t.includes('RENEGOTIATE')) {
    return 'PASS OR RE-NEGOTIATE';
  }
  return 'ACQUIRE WITH CAUTION';
}

function parseBullets(value: unknown): AiBullet[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') {
        const [title, ...rest] = item.split(':');
        return {
          title: (title || 'Note').trim(),
          detail: rest.join(':').trim() || item,
        };
      }
      if (item && typeof item === 'object') {
        const o = item as Record<string, unknown>;
        return {
          title: String(o.title || o.label || 'Note').trim(),
          detail: String(o.detail || o.text || o.description || '').trim(),
        };
      }
      return null;
    })
    .filter((b): b is AiBullet => Boolean(b && (b.title || b.detail)));
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
      } catch {
        return null;
      }
    }
    return null;
  }
}

function structuredFromLlm(
  metrics: DealMetrics,
  raw: string,
  modelName?: string
): StructuredAiAnalysis | null {
  const parsed = extractJsonObject(raw);
  if (!parsed) return null;

  const strengths = parseBullets(parsed.strengths);
  const risks = parseBullets(parsed.risks);
  if (strengths.length === 0 && risks.length === 0) return null;

  const verdict = normalizeVerdict(String(parsed.verdict || ''));
  const headline =
    String(parsed.headline || parsed.summary || parsed.notes || '').trim() ||
    'AI reviewed the underwriting metrics for this deal.';

  const base = {
    address: metrics.address,
    provider: 'openrouter' as const,
    modelName: modelName || null,
    verdict,
    headline,
    summary: buildSummary(metrics),
    strengths:
      strengths.length > 0
        ? strengths
        : [{ title: 'See model notes', detail: headline }],
    risks:
      risks.length > 0
        ? risks
        : [{ title: 'Verify locally', detail: 'Confirm comps, rents, and rehab scope before closing.' }],
  };

  return { ...base, reportText: toReportText(base) };
}

function buildLlmPrompt(metrics: DealMetrics): string {
  return `Analyze this real estate investment deal. Respond with ONLY valid JSON (no markdown fences) matching:
{
  "verdict": "STRONG BUY" | "ACQUIRE WITH CAUTION" | "PASS OR RE-NEGOTIATE",
  "headline": "1-2 sentence recommendation",
  "strengths": [{ "title": "short label", "detail": "one sentence with numbers" }],
  "risks": [{ "title": "short label", "detail": "one sentence with numbers" }]
}
Include 2-4 strengths and 1-3 risks. Be specific with the numbers.

Deal data:
${JSON.stringify(metrics, null, 2)}`;
}

async function callOpenRouter(metrics: DealMetrics): Promise<StructuredAiAnalysis | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const models = [
    process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
    'openrouter/free',
  ].filter((m, i, arr) => arr.indexOf(m) === i);

  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': appUrl,
          'X-Title': 'PropIntel Deal Analyzer',
        },
        body: JSON.stringify({
          model,
          temperature: 0.3,
          max_tokens: 1200,
          messages: [
            {
              role: 'system',
              content:
                'You are a veteran real estate investment analyst. Always reply with a single JSON object only.',
            },
            { role: 'user', content: buildLlmPrompt(metrics) },
          ],
        }),
      });

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        error?: { message?: string };
        model?: string;
      };

      if (!response.ok) {
        lastError = new Error(data.error?.message || `OpenRouter HTTP ${response.status}`);
        continue;
      }

      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) {
        lastError = new Error('OpenRouter returned an empty response');
        continue;
      }

      const structured = structuredFromLlm(metrics, content, data.model || model);
      if (!structured) {
        lastError = new Error('OpenRouter response was not valid structured JSON');
        continue;
      }

      void logInfo('OpenRouter deal analysis completed', {
        model: data.model || model,
        address: metrics.address,
        verdict: structured.verdict,
      });

      return structured;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  if (lastError) throw lastError;
  return null;
}

/** Deterministic structured fallback when OpenRouter is unavailable. */
export function ruleBasedAnalysis(metrics: DealMetrics): StructuredAiAnalysis {
  const {
    address,
    purchasePrice,
    rehabCost,
    arv,
    cashFlow,
    roi,
    capRate,
    dscr,
    cashOnCash,
  } = metrics;

  const equityCushion = arv - (purchasePrice + rehabCost);
  const equityPercent = arv > 0 ? (equityCushion / arv) * 100 : 0;
  const isGoodCashFlow = cashFlow > 250;
  const isHealthyDSCR = dscr >= 1.25;
  const isGoodROI = roi > 12;

  const strengths: AiBullet[] = [];
  const risks: AiBullet[] = [];

  if (equityPercent > 20) {
    strengths.push({
      title: 'Strong equity position',
      detail: `Equity cushion of ${money(equityCushion)} (~${equityPercent.toFixed(1)}% of ARV).`,
    });
  } else if (equityPercent > 5) {
    strengths.push({
      title: 'Moderate equity cushion',
      detail: `${money(equityCushion)} of cushion — watch rehab overruns.`,
    });
  } else {
    strengths.push({
      title: 'Tight refinancing cushion',
      detail: `Only ${money(equityCushion)} between all-in cost and ARV.`,
    });
  }

  if (isGoodCashFlow) {
    strengths.push({
      title: 'Strong net cash flow',
      detail: `$${cashFlow.toFixed(2)}/mo leaves room for vacancy and repairs.`,
    });
  } else if (cashFlow > 0) {
    strengths.push({
      title: 'Marginal cash flow',
      detail: `$${cashFlow.toFixed(2)}/mo — thin vacancy buffer.`,
    });
  } else {
    strengths.push({
      title: 'Negative cash flow',
      detail: `Bleeding $${Math.abs(cashFlow).toFixed(2)}/mo at current assumptions.`,
    });
  }

  if (isHealthyDSCR) {
    strengths.push({
      title: 'Healthy DSCR',
      detail: `${dscr.toFixed(2)} should clear most lender screens.`,
    });
  }
  if (isGoodROI) {
    strengths.push({
      title: 'Attractive returns',
      detail: `Cap ${capRate.toFixed(2)}%, cash-on-cash ${cashOnCash.toFixed(2)}%.`,
    });
  }

  if (rehabCost > purchasePrice * 0.4) {
    risks.push({
      title: 'Heavy rehab risk',
      detail: `Rehab ${money(rehabCost)} is high vs purchase price.`,
    });
  }
  if (!isHealthyDSCR && dscr > 0) {
    risks.push({
      title: 'Debt coverage risk',
      detail: `DSCR ${dscr.toFixed(2)} is below the typical 1.20–1.25 screen.`,
    });
  }
  if (cashFlow < 100) {
    risks.push({
      title: 'Slim vacancy cushion',
      detail: 'One vacant month can erase months of profit.',
    });
  }
  if (cashOnCash < 5 && cashOnCash > 0) {
    risks.push({
      title: 'Sub-par cash-on-cash',
      detail: `Only ${cashOnCash.toFixed(2)}% cash-on-cash at these inputs.`,
    });
  }
  if (risks.length === 0) {
    risks.push({
      title: 'Low risk profile',
      detail: 'No major red flags from the numbers alone — still verify local demand.',
    });
  }

  let verdict: VerdictLabel;
  let headline: string;
  if (isGoodCashFlow && isHealthyDSCR && equityPercent > 15) {
    verdict = 'STRONG BUY';
    headline = 'Strong equity, coverage, and cash flow. Move quickly if comps hold.';
  } else if (cashFlow >= 0 && equityPercent >= 10) {
    verdict = 'ACQUIRE WITH CAUTION';
    headline = 'Viable but thin margins — negotiate price or cut rehab scope.';
  } else {
    verdict = 'PASS OR RE-NEGOTIATE';
    headline = `Ask for closer to ${money(purchasePrice * 0.85)} or improve rents/expenses.`;
  }

  const base = {
    address,
    provider: 'rules' as const,
    modelName: 'rule-engine',
    verdict,
    headline,
    summary: buildSummary(metrics),
    strengths,
    risks,
  };

  return { ...base, reportText: toReportText(base) };
}

/**
 * Generates a structured investment analysis via OpenRouter,
 * with a deterministic rule-engine fallback.
 */
export async function analyzeDeal(metrics: DealMetrics): Promise<StructuredAiAnalysis> {
  if (isOpenRouterConfigured()) {
    try {
      const report = await callOpenRouter(metrics);
      if (report) return report;
    } catch (err) {
      void logError('OpenRouter deal analysis failed', err, {
        category: 'ACTION',
        meta: { address: metrics.address },
      });
    }
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are a veteran real estate investment analyst. Always reply with a single JSON object only.',
            },
            { role: 'user', content: buildLlmPrompt(metrics) },
          ],
        }),
      });
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const structured = structuredFromLlm(metrics, content, 'gpt-4o-mini');
        if (structured) return structured;
      }
    } catch (err) {
      void logError('OpenAI deal analysis failed', err, { category: 'ACTION' });
    }
  }

  return ruleBasedAnalysis(metrics);
}

export function isAiConfigured(): boolean {
  return isOpenRouterConfigured() || Boolean(process.env.OPENAI_API_KEY);
}
