/** Shared real-estate calculator math used by Calculators hub pages. */

export function monthlyMortgagePayment(
  loanAmount: number,
  annualRatePercent: number,
  termYears: number
): number {
  if (loanAmount <= 0) return 0;
  const months = Math.max(termYears, 0.1) * 12;
  const r = annualRatePercent / 100 / 12;
  if (r === 0) return loanAmount / months;
  return (loanAmount * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

export function holdMetrics(input: {
  purchasePrice: number;
  rehabCost: number;
  rent: number;
  downPaymentPercent: number;
  mortgageRate: number;
  mortgageTerm: number;
  taxes: number;
  insurance: number;
  hoa: number;
  vacancyRate: number;
  maintenanceRate: number;
  utilities?: number;
  closingCostPercent?: number;
}) {
  const downPayment = input.purchasePrice * (input.downPaymentPercent / 100);
  const closingCosts =
    input.purchasePrice * ((input.closingCostPercent ?? 3) / 100);
  const totalCashIn = downPayment + input.rehabCost + closingCosts;
  const loanAmount = Math.max(0, input.purchasePrice - downPayment);
  const mortgage = monthlyMortgagePayment(
    loanAmount,
    input.mortgageRate,
    input.mortgageTerm
  );
  const vacancy = input.rent * (input.vacancyRate / 100);
  const maintenance = input.rent * (input.maintenanceRate / 100);
  const utilities = input.utilities ?? 0;
  const opex = input.taxes + input.insurance + input.hoa + vacancy + maintenance + utilities;
  const cashFlow = input.rent - mortgage - opex;
  const noi = (input.rent - vacancy - maintenance - input.taxes - input.insurance - input.hoa - utilities) * 12;
  const capRate = input.purchasePrice > 0 ? (noi / input.purchasePrice) * 100 : 0;
  const cashOnCash = totalCashIn > 0 ? ((cashFlow * 12) / totalCashIn) * 100 : 0;
  const dscr = mortgage > 0 ? noi / 12 / mortgage : 0;
  const breakEvenRent = mortgage + opex - vacancy - maintenance + vacancy + maintenance; // mortgage + fixed+variable at current rates on rent basis
  const fixedBeforeRent = mortgage + input.taxes + input.insurance + input.hoa + utilities;
  const variableRate = (input.vacancyRate + input.maintenanceRate) / 100;
  const breakEven =
    variableRate >= 1 ? fixedBeforeRent : fixedBeforeRent / (1 - variableRate);
  const roi =
    totalCashIn > 0
      ? (((cashFlow * 12) + (input.purchasePrice * 0.03)) / totalCashIn) * 100
      : 0;

  return {
    downPayment,
    closingCosts,
    totalCashIn,
    loanAmount,
    mortgage,
    opex,
    cashFlow,
    noi,
    capRate,
    cashOnCash,
    dscr,
    breakEvenRent: breakEven,
    roi,
    annualCashFlow: cashFlow * 12,
  };
}

export function flipMetrics(input: {
  purchasePrice: number;
  rehabCost: number;
  arv: number;
  financingCost: number;
  holdingCost: number;
  sellingCostPercent: number;
}) {
  const sellingCost = input.arv * (input.sellingCostPercent / 100);
  const totalCost =
    input.purchasePrice +
    input.rehabCost +
    input.financingCost +
    input.holdingCost +
    sellingCost;
  const profit = input.arv - totalCost;
  const invested = input.purchasePrice + input.rehabCost + input.financingCost + input.holdingCost;
  const roi = invested > 0 ? (profit / invested) * 100 : 0;
  // Max allowable offer ~ 70% rule variant
  const mao = input.arv * 0.7 - input.rehabCost;
  return { sellingCost, totalCost, profit, roi, mao, invested };
}

export function rentalMetrics(input: {
  purchasePrice: number;
  rent: number;
  expenses: number;
  mortgage: number;
  downPayment: number;
  years: number;
  rentGrowth: number;
}) {
  const cashFlow = input.rent - input.expenses - input.mortgage;
  const noi = (input.rent - input.expenses) * 12;
  const capRate = input.purchasePrice > 0 ? (noi / input.purchasePrice) * 100 : 0;
  const dscr = input.mortgage > 0 ? (input.rent - input.expenses) / input.mortgage : 0;
  const cashOnCash =
    input.downPayment > 0 ? ((cashFlow * 12) / input.downPayment) * 100 : 0;

  const projection: { year: number; rent: number; cashFlow: number; cumulative: number }[] = [];
  let cum = 0;
  let r = input.rent;
  for (let y = 1; y <= input.years; y++) {
    if (y > 1) r *= 1 + input.rentGrowth / 100;
    const cf = r - input.expenses - input.mortgage;
    cum += cf * 12;
    projection.push({ year: y, rent: r, cashFlow: cf, cumulative: cum });
  }

  return { cashFlow, noi, capRate, dscr, cashOnCash, projection };
}

export function money(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
}

export function pct(n: number) {
  return `${n.toFixed(1)}%`;
}
