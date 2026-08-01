/** Monthly recurring revenue contribution for one subscription. */
export function monthlyRevenueForSub(opts: {
  plan: string;
  billingInterval?: string | null;
  priceMonthly: number;
  priceAnnual?: number | null;
}): number {
  const monthly = opts.priceMonthly || 0;
  if (opts.billingInterval === 'year') {
    const annual = opts.priceAnnual != null && opts.priceAnnual > 0 ? opts.priceAnnual : monthly * 12;
    return Math.round((annual / 12) * 100) / 100;
  }
  return monthly;
}

export function sumMrr(
  subs: Array<{ plan: string; billingInterval?: string | null }>,
  plans: Array<{ code: string; priceMonthly: number; priceAnnual?: number | null }>
): number {
  const byCode = Object.fromEntries(
    plans.map((p) => [p.code, { priceMonthly: p.priceMonthly, priceAnnual: p.priceAnnual ?? null }])
  );
  return Math.round(
    subs.reduce((sum, s) => {
      const prices = byCode[s.plan];
      if (!prices) return sum;
      return (
        sum +
        monthlyRevenueForSub({
          plan: s.plan,
          billingInterval: s.billingInterval,
          priceMonthly: prices.priceMonthly,
          priceAnnual: prices.priceAnnual,
        })
      );
    }, 0) * 100
  ) / 100;
}
