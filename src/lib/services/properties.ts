import { isAttomConfigured } from "@/lib/services/attom";
import { estimateMonthlyRent } from "@/lib/services/attomMapper";
import { lookupPropertyFromAttom } from "@/lib/services/propertyService";

export interface PropertyData {
  address: string;
  city: string;
  state: string;
  zip: string;
  beds: number;
  baths: number;
  sqft: number;
  yearBuilt: number;
  estimatedValue: number;
  estimatedRent: number;
  /** Present when lookup came from ATTOM */
  attomId?: string;
  source?: "ATTOM" | "SIMULATED";
}

function simulateLookup(address: string, zip: string): PropertyData {
  const hash = address.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const beds = (hash % 3) + 2;
  const baths = hash % 2 === 0 ? 2 : 1.5 + (hash % 2) * 0.5;
  const sqft = 1200 + (hash % 15) * 100;
  const yearBuilt = 1960 + (hash % 60);
  const zipNum = parseInt(zip, 10) || 50000;
  let baseValue = 180000;
  if (zipNum > 90000) baseValue = 450000;
  else if (zipNum > 70000) baseValue = 280000;
  else if (zipNum > 30000) baseValue = 210000;
  else baseValue = 350000;
  const estimatedValue = baseValue + (hash % 80) * 1500;
  const rentPercent = 0.0065 + (hash % 30) * 0.0001;
  const estimatedRent = Math.round((estimatedValue * rentPercent) / 10) * 10;

  return {
    address,
    city: address.split(",")[1]?.trim() || "Springfield",
    state: address.split(",")[2]?.trim()?.substring(0, 2) || "IL",
    zip,
    beds,
    baths,
    sqft,
    yearBuilt,
    estimatedValue,
    estimatedRent,
    source: "SIMULATED",
  };
}

/**
 * Server-side property lookup. Prefers ATTOM when configured; falls back to
 * deterministic simulation so Analyzer keeps working offline / without a key.
 * Do not call from the browser — use `lookupPropertyAction` instead.
 */
export async function lookupProperty(address: string, zip: string): Promise<PropertyData> {
  if (isAttomConfigured()) {
    const mapped = await lookupPropertyFromAttom(address, zip);
    if (mapped) {
      return {
        address: mapped.street || mapped.address || address,
        city: mapped.city || "Unknown",
        state: mapped.state || "US",
        zip: mapped.zip || zip,
        beds: mapped.bedrooms ?? 3,
        baths: mapped.bathrooms ?? 2,
        sqft: mapped.squareFeet ?? 1500,
        yearBuilt: mapped.yearBuilt ?? 1980,
        estimatedValue: mapped.estimatedValue ?? 250000,
        estimatedRent:
          mapped.estimatedRent ??
          estimateMonthlyRent(mapped.estimatedValue) ??
          1500,
        attomId: mapped.attomId,
        source: "ATTOM",
      };
    }
  }
  return simulateLookup(address, zip);
}
