import type { AttomRawProperty } from "@/lib/services/attom";

/** Normalized property DTO used across PropIntel (never pass raw ATTOM payloads to UI). */
export type MappedProperty = {
  attomId: string;
  address: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  latitude: number | null;
  longitude: number | null;
  propertyType: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  yearBuilt: number | null;
  squareFeet: number | null;
  lotSize: number | null;
  estimatedValue: number | null;
  estimatedRent: number | null;
  taxAmount: number | null;
  taxYear: number | null;
  apn: string | null;
  ownerOccupied: boolean | null;
  lastSaleAmount: number | null;
  lastSaleDate: string | null;
  marketValue: number | null;
  assessedValue: number | null;
  stories: number | null;
  garage: string | null;
  cooling: string | null;
  heating: string | null;
  legalDescription: string | null;
  source: "ATTOM";
};

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function pickNum(...vals: unknown[]): number | null {
  for (const v of vals) {
    const n = num(v);
    if (n !== null) return n;
  }
  return null;
}

function str(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s || null;
}

/** Rough monthly rent when ATTOM does not return a rental AVM (~0.7% of value / 12). */
export function estimateMonthlyRent(value: number | null): number | null {
  if (!value || value <= 0) return null;
  return Math.round((value * 0.007) / 12 / 10) * 10;
}

/**
 * Map a single ATTOM property object (snapshot or expandedprofile) into our DTO.
 * Handles both camelCase and lowercase field variants ATTOM returns across endpoints.
 */
export function mapAttomProperty(raw: AttomRawProperty): MappedProperty | null {
  const attomId = pickNum(raw.identifier?.attomId, raw.identifier?.Id);
  if (attomId === null) return null;

  const addr = raw.address || {};
  const street = str(addr.line1) || "";
  const city = str(addr.locality) || "";
  const state = str(addr.countrySubd) || "";
  const zip = str(addr.postal1) || "";
  const oneLine =
    str(addr.oneLine) ||
    [street, city && state ? `${city}, ${state}` : city || state, zip]
      .filter(Boolean)
      .join(", ");

  const summary = raw.summary || {};
  const building = raw.building || {};
  const rooms = building.rooms || {};
  const size = building.size || {};
  const assessment = raw.assessment || {};
  const saleAmt = pickNum(
    (raw.sale as { amount?: { saleAmt?: number; saleamt?: number } } | undefined)?.amount
      ?.saleAmt,
    (raw.sale as { amount?: { saleamt?: number } } | undefined)?.amount?.saleamt
  );

  const marketValue = pickNum(
    assessment.market?.mktTtlValue,
    assessment.assessed?.marketTtlValue
  );
  const assessedValue = pickNum(assessment.assessed?.assdTtlValue);
  const avmValue = pickNum(
    (raw.avm as { amount?: { value?: number } } | undefined)?.amount?.value
  );

  const estimatedValue = pickNum(avmValue, marketValue, saleAmt, assessedValue);
  const taxAmount = pickNum(assessment.tax?.taxAmt);
  const taxYear = pickNum(assessment.tax?.taxYear);

  const squareFeet = pickNum(
    (size as { universalSize?: number }).universalSize,
    size.universalsize,
    (size as { livingSize?: number }).livingSize,
    size.livingsize,
    (size as { bldgSize?: number }).bldgSize,
    size.bldgsize
  );

  const lotSize = pickNum(raw.lot?.lotSize2, raw.lot?.lotsize2, raw.lot?.lotSize1);

  const bedrooms = pickNum(rooms.beds);
  const bathrooms = pickNum(
    (rooms as { bathsTotal?: number }).bathsTotal,
    rooms.bathstotal,
    (rooms as { bathsFull?: number }).bathsFull,
    rooms.bathsfull
  );

  const yearBuilt = pickNum(summary.yearBuilt, summary.yearbuilt);
  const propertyType =
    str(summary.propertyType) ||
    str(summary.propClass) ||
    str(summary.propclass) ||
    str(summary.propType) ||
    str(summary.proptype);

  const absentee = str(summary.absenteeInd)?.toUpperCase() || "";
  const ownerOccupied =
    absentee.includes("OWNER") && !absentee.includes("ABSENTEE")
      ? true
      : absentee.includes("ABSENTEE")
        ? false
        : null;

  const lat = pickNum(raw.location?.latitude);
  const lng = pickNum(raw.location?.longitude);

  return {
    attomId: String(Math.trunc(attomId)),
    address: oneLine,
    street: street || oneLine,
    city,
    state,
    zip,
    latitude: lat,
    longitude: lng,
    propertyType,
    bedrooms,
    bathrooms,
    yearBuilt: yearBuilt !== null ? Math.trunc(yearBuilt) : null,
    squareFeet,
    lotSize,
    estimatedValue,
    estimatedRent: estimateMonthlyRent(estimatedValue),
    taxAmount,
    taxYear: taxYear !== null ? Math.trunc(taxYear) : null,
    apn: str(raw.identifier?.apn),
    ownerOccupied,
    lastSaleAmount: saleAmt,
    lastSaleDate:
      str(raw.sale?.saleTransDate) ||
      str(raw.sale?.saleSearchDate) ||
      str((raw.sale as { amount?: { saleRecDate?: string } })?.amount?.saleRecDate),
    marketValue,
    assessedValue,
    stories: pickNum(building.summary?.levels),
    garage: str(building.parking?.garageType) || str(building.parking?.prkgType),
    cooling: str(raw.utilities?.coolingType),
    heating: str(raw.utilities?.heatingType),
    legalDescription: str(summary.legal1),
    source: "ATTOM",
  };
}

export function mapAttomProperties(rawList: AttomRawProperty[] | undefined): MappedProperty[] {
  if (!rawList?.length) return [];
  const out: MappedProperty[] = [];
  for (const raw of rawList) {
    const mapped = mapAttomProperty(raw);
    if (mapped) out.push(mapped);
  }
  return out;
}
