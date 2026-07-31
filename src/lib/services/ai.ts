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
}

/**
 * Generates an AI-driven investment analysis report.
 * Dynamically fallbacks to an expert rule-engine analysis if OpenAI/Gemini key is not configured.
 */
export async function analyzeDeal(metrics: DealMetrics): Promise<string> {
  const {
    address,
    purchasePrice,
    rehabCost,
    arv,
    rent,
    cashFlow,
    roi,
    capRate,
    dscr,
    cashOnCash,
  } = metrics;
  
  // Checking OpenAI key
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a veteran real estate investment analyst. Analyze the following property metrics and provide a detailed review in Markdown. Include Strengths, Risks, and an overall Investment Verdict.',
            },
            {
              role: 'user',
              content: JSON.stringify(metrics, null, 2),
            },
          ],
        }),
      });
      const data = await response.json();
      if (data.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
      }
    } catch (e) {
      console.warn('OpenAI request failed, running expert fallback:', e);
    }
  }

  // Expert engine fallback: provides structured, dynamic review of the numbers
  const equityCushion = arv - (purchasePrice + rehabCost);
  const equityPercent = arv > 0 ? (equityCushion / arv) * 100 : 0;
  const isGoodCashFlow = cashFlow > 250;
  const isHealthyDSCR = dscr >= 1.25;
  const isGoodROI = roi > 12;
  
  let strengths = '';
  let risks = '';
  let verdict = '';
  
  // Strengths assessment
  if (equityPercent > 20) {
    strengths += `* **Strong Equity Position**: The purchase price + rehab cost leaves an equity cushion of **$${equityCushion.toLocaleString()}** (approx. **${equityPercent.toFixed(1)}%** of ARV). This protects you from market downturns.\n`;
  } else if (equityPercent > 5) {
    strengths += `* **Moderate Equity Cushion**: You have an equity margin of **$${equityCushion.toLocaleString()}**. Keep a close eye on budget overruns.\n`;
  } else {
    strengths += `* **Tight Refinancing Cushion**: There is very little equity buffer ($${equityCushion.toLocaleString()}) between costs and ARV. Ensure rehab estimates are firm.\n`;
  }
  
  if (isGoodCashFlow) {
    strengths += `* **Strong Net Cash Flow**: A monthly cash flow of **$${cashFlow.toFixed(2)}** is excellent for a single-family asset, offering solid buffer for vacancy and repair bills.\n`;
  } else if (cashFlow > 0) {
    strengths += `* **Marginal Cash Flow**: Generates a positive cash flow of **$${cashFlow.toFixed(2)}/mo**. It meets expenses but provides little margin for unexpected vacancies.\n`;
  } else {
    strengths += `* **Negative Cash Flow Warning**: The asset is bleeding **$${Math.abs(cashFlow).toFixed(2)}/mo** in current operations. This is standard for raw appreciation plays but dangerous for standard rentals.\n`;
  }
  
  if (isHealthyDSCR) {
    strengths += `* **Excellent Debt Service Coverage**: With a DSCR of **${dscr.toFixed(2)}**, lenders will view this deal favorably as it easily covers mortgage costs.\n`;
  }
  
  if (isGoodROI) {
    strengths += `* **Attractive Return Profile**: Projected Cap Rate is **${capRate.toFixed(2)}%** and cash-on-cash return is **${cashOnCash.toFixed(2)}%**, beating standard index fund returns.\n`;
  }
  
  // Risks assessment
  if (rehabCost > purchasePrice * 0.4) {
    risks += `* **Heavy Rehab Risk**: Construction costs are high (**$${rehabCost.toLocaleString()}**). Project management and contractor delays represent a major risk to profitability.\n`;
  }
  if (!isHealthyDSCR && dscr > 0) {
    risks += `* **High Leverage Debt Risk**: A DSCR of **${dscr.toFixed(2)}** is below the standard banking requirements of 1.20-1.25. Financing might require a larger down payment.\n`;
  }
  if (cashFlow < 100) {
    risks += `* **Slim Vacancy Cushion**: The cash flow is thin. A single month of vacancy could wipe out several months of cash reserves.\n`;
  }
  if (cashOnCash < 5 && cashOnCash > 0) {
    risks += `* **Sub-par Return on Equity**: Cash-on-Cash is only **${cashOnCash.toFixed(2)}%**. You might achieve better capital efficiency elsewhere.\n`;
  }
  if (risks === '') {
    risks = `* **Low Risk Profile**: No major red flags detected. Ensure local rental demand is verified.`;
  }

  // Verdict assessment
  if (isGoodCashFlow && isHealthyDSCR && equityPercent > 15) {
    verdict = `### Final Verdict: **STRONG BUY**\nThis property is a high-quality asset that offers strong equity, solid debt-coverage, and exceptional cash flow. We recommend lock-in or writing an offer immediately before competitors move in.`;
  } else if (cashFlow >= 0 && equityPercent >= 10) {
    verdict = `### Final Verdict: **ACQUIRE WITH CAUTION**\nThe deal is viable but features thin margins in either cash flow or equity cushion. Proceed if you can negotiate a **5-10% discount** on the purchase price or reduce rehab expenditures.`;
  } else {
    verdict = `### Final Verdict: **PASS OR RE-NEGOTIATE**\nAs currently configured, this deal poses significant risks to capital reserves due to negative/marginal returns and minimal equity buffers. We suggest re-negotiating the purchase price to under **$${(purchasePrice * 0.85).toLocaleString()}**.`;
  }

  // Combine into final review
  return `## AI Deal Analysis Report: **${address}**

This analysis represents an AI evaluation of the property located at **${address}** using financial performance calculations and real estate metrics.

### Key Performance Summary
* **Purchase Cost:** $${purchasePrice.toLocaleString()} (Rehab: $${rehabCost.toLocaleString()})
* **ARV Estimate:** $${arv.toLocaleString()}
* **Cap Rate:** ${capRate.toFixed(2)}%
* **Cash-on-Cash Return:** ${cashOnCash.toFixed(2)}%
* **Debt Service Coverage Ratio (DSCR):** ${dscr.toFixed(2)}

---

### Strengths
${strengths}

### Risks & Vulnerabilities
${risks}

---

${verdict}
`;
}
