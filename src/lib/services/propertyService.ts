/**
 * Property Service — validation, caching, ATTOM orchestration, DB import.
 * Frontend and Analyzer talk only to this layer (via server actions).
 */

import { prisma, withDbRetry } from "@/lib/db";
import { logError, writeLog } from "@/lib/logger";
import {
  AttomError,
  attomExpandedByAddress,
  attomExpandedById,
  attomSnapshotSearch,
  isAttomConfigured,
  type AttomRawProperty,
} from "@/lib/services/attom";
import {
  mapAttomProperties,
  mapAttomProperty,
  type MappedProperty,
} from "@/lib/services/attomMapper";
const DETAIL_TTL_MS = 30 * 60 * 1000; // 30 min
const SEARCH_TTL_MS = 10 * 60 * 1000; // 10 min

type CacheEntry<T> = { expires: number; value: T };
const detailCache = new Map<string, CacheEntry<MappedProperty>>();
const searchCache = new Map<string, CacheEntry<MappedProperty[]>>();

function cacheGet<T>(map: Map<string, CacheEntry<T>>, key: string): T | null {
  const hit = map.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expires) {
    map.delete(key);
    return null;
  }
  return hit.value;
}

function cacheSet<T>(map: Map<string, CacheEntry<T>>, key: string, value: T, ttl: number) {
  map.set(key, { value, expires: Date.now() + ttl });
}

export type PropertySearchInput = {
  query?: string;
  postalcode?: string;
  city?: string;
  state?: string;
  pagesize?: number;
  page?: number;
  minBeds?: number;
  minBaths?: number;
};

export type PropertySearchResult = {
  properties: MappedProperty[];
  total: number;
  source: "ATTOM" | "EMPTY";
  message?: string;
};

/** Parse free-text: ZIP, "City, ST", or street address. */
export function parsePropertyQuery(raw: string): {
  kind: "zip" | "city_state" | "address" | "empty";
  postalcode?: string;
  city?: string;
  state?: string;
  address1?: string;
  address2?: string;
} {
  const q = raw.trim().replace(/\s+/g, " ");
  if (!q) return { kind: "empty" };

  if (/^\d{5}(-\d{4})?$/.test(q)) {
    return { kind: "zip", postalcode: q.slice(0, 5) };
  }

  // "Austin, TX" or "Denver CO"
  const cityState = q.match(/^([A-Za-z .'-]+),?\s+([A-Za-z]{2})$/);
  if (cityState && !/\d/.test(cityState[1])) {
    return {
      kind: "city_state",
      city: cityState[1].trim(),
      state: cityState[2].toUpperCase(),
    };
  }

  // "123 Main St, City, ST 12345" or "123 Main St, City ST 12345"
  const parts = q.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const address1 = parts[0];
    const rest = parts.slice(1).join(", ");
    const zipMatch = rest.match(/\b(\d{5})(-\d{4})?\b/);
    const stateMatch = rest.match(/\b([A-Za-z]{2})\b(?=\s*\d{5}|$)/);
    const cityGuess = rest
      .replace(/\b\d{5}(-\d{4})?\b/, "")
      .replace(/\b[A-Za-z]{2}\b\s*$/, "")
      .replace(/,/g, " ")
      .trim();
    return {
      kind: "address",
      address1,
      address2: rest,
      city: cityGuess || undefined,
      state: stateMatch?.[1]?.toUpperCase(),
      postalcode: zipMatch?.[1],
    };
  }

  // Single token city name — snapshot by city only (needs state ideally)
  if (!/\d/.test(q) && q.length >= 3) {
    return { kind: "city_state", city: q };
  }

  return { kind: "address", address1: q, address2: "" };
}

function splitStreetAndLocality(address: string, zip: string): { address1: string; address2: string } {
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return {
      address1: parts[0],
      address2: parts.slice(1).join(", ") + (zip && !address.includes(zip) ? ` ${zip}` : ""),
    };
  }
  return { address1: address.trim(), address2: zip.trim() };
}

/** Map raw ATTOM / provider errors into investor-facing copy. */
export function friendlyAttomSearchError(raw: string): string {
  const msg = raw.trim();
  const upper = msg.toUpperCase();

  if (!msg) return "Property search failed. Try again.";

  if (upper.includes("NOT_CONFIGURED") || upper.includes("ATTOM_API_KEY")) {
    return "Property search isn’t configured on the server yet. Ask an admin to add the ATTOM API key.";
  }

  if (
    upper.includes("INVALID PARAMETER") &&
    (upper.includes("CITY") || upper.includes("STATE"))
  ) {
    return "City searches need a state. Try “Denver, CO” or a ZIP like 80212.";
  }

  if (upper.includes("INVALID PARAMETER") && upper.includes("POSTAL")) {
    return "That ZIP doesn’t look valid. Use a 5-digit US ZIP (e.g. 80212).";
  }

  if (upper.includes("INVALID PARAMETER") && upper.includes("ADDRESS")) {
    return "We couldn’t read that address. Use “123 Main St, City, ST 12345”.";
  }

  if (upper.includes("INVALID PARAMETER")) {
    return "That search isn’t valid for property lookup. Use a ZIP, “City, ST”, or a full street address.";
  }

  if (
    upper.includes("SUCCESSWITHOUTRESULT") ||
    upper.includes("NO RESULTS") ||
    upper.includes("NOT FOUND")
  ) {
    return "No properties matched. Try another ZIP, city + state, or a fuller street address.";
  }

  if (upper.includes("UNAUTHORIZED") || upper.includes("FORBIDDEN") || upper.includes("APIKEY")) {
    return "Property data provider rejected the request. Check the ATTOM API key.";
  }

  if (upper.includes("RATE") || upper.includes("TOO MANY") || upper.includes("429")) {
    return "Too many searches right now. Wait a few seconds and try again.";
  }

  // Never surface raw provider jargon like "Invalid Parameter(s) in Request - CITY"
  if (/invalid parameter|request -|attom|gateway/i.test(msg)) {
    return "That search didn’t work. Use a ZIP (80212), city + state (Denver, CO), or a full street address.";
  }

  return msg.length > 120
    ? "Property search failed. Try a ZIP, city + state, or full address."
    : msg;
}

export async function searchProperties(
  input: PropertySearchInput
): Promise<PropertySearchResult> {
  if (!isAttomConfigured()) {
    return {
      properties: [],
      total: 0,
      source: "EMPTY",
      message: friendlyAttomSearchError("ATTOM_API_KEY is not configured."),
    };
  }

  const parsed = input.query ? parsePropertyQuery(input.query) : { kind: "empty" as const };
  const postalcode = input.postalcode || parsed.postalcode;
  const city = input.city || parsed.city;
  const state = input.state || parsed.state;
  const pagesize = Math.min(Math.max(input.pagesize ?? 20, 1), 50);
  const page = Math.max(input.page ?? 1, 1);

  // ATTOM snapshot requires state (or postal) with city — never call city-only.
  if ((parsed.kind === "city_state" || city) && city && !state && !postalcode) {
    return {
      properties: [],
      total: 0,
      source: "EMPTY",
      message: `Add a state with that city — try “${city}, CO” or search by ZIP instead.`,
    };
  }

  if (parsed.kind === "empty" && !postalcode && !city) {
    return {
      properties: [],
      total: 0,
      source: "EMPTY",
      message: "Enter a ZIP code, city + state (e.g. Denver, CO), or full street address.",
    };
  }

  const cacheKey = JSON.stringify({
    postalcode,
    city,
    state,
    pagesize,
    page,
    minBeds: input.minBeds,
    minBaths: input.minBaths,
    kind: parsed.kind,
    a1: parsed.kind === "address" ? parsed.address1 : null,
  });

  const cached = cacheGet(searchCache, cacheKey);
  if (cached) {
    return { properties: cached, total: cached.length, source: "ATTOM" };
  }

  try {
    let rawList: AttomRawProperty[] = [];
    let total = 0;

    if (parsed.kind === "address" && parsed.address1) {
      const expanded = await attomExpandedByAddress(
        parsed.address1,
        parsed.address2 || [city, state, postalcode].filter(Boolean).join(" ")
      );
      rawList = expanded.property || [];
      total = expanded.status?.total ?? rawList.length;

      if (!rawList.length && postalcode) {
        const snap = await attomSnapshotSearch({
          postalcode,
          pagesize,
          page,
          minBeds: input.minBeds,
          minBaths: input.minBaths,
        });
        rawList = snap.property || [];
        total = snap.status?.total ?? rawList.length;
      }
    } else if (postalcode) {
      const snap = await attomSnapshotSearch({
        postalcode,
        pagesize,
        page,
        minBeds: input.minBeds,
        minBaths: input.minBaths,
      });
      rawList = snap.property || [];
      total = snap.status?.total ?? rawList.length;
    } else if (city && state) {
      const snap = await attomSnapshotSearch({
        city,
        state,
        pagesize,
        page,
        minBeds: input.minBeds,
        minBaths: input.minBaths,
      });
      rawList = snap.property || [];
      total = snap.status?.total ?? rawList.length;
    } else {
      return {
        properties: [],
        total: 0,
        source: "EMPTY",
        message: "Enter a ZIP code, city + state, or full street address.",
      };
    }

    const properties = mapAttomProperties(rawList);
    cacheSet(searchCache, cacheKey, properties, SEARCH_TTL_MS);

    void writeLog({
      level: "INFO",
      category: "ACTION",
      message: "ATTOM property search",
      meta: { count: properties.length, postalcode, city, state },
    });

    if (!properties.length) {
      return {
        properties: [],
        total: 0,
        source: "EMPTY",
        message:
          "No properties matched. Try another ZIP, “City, ST”, or a fuller street address.",
      };
    }

    return { properties, total: total || properties.length, source: "ATTOM" };
  } catch (err) {
    void logError("ATTOM search failed", err, { category: "ACTION" });
    const raw =
      err instanceof AttomError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Property search failed. Try again.";
    return {
      properties: [],
      total: 0,
      source: "EMPTY",
      message: friendlyAttomSearchError(raw),
    };
  }
}

export async function getPropertyDetail(attomId: string): Promise<MappedProperty | null> {
  const id = String(attomId).trim();
  if (!id) return null;

  const cached = cacheGet(detailCache, id);
  if (cached) return cached;

  if (!isAttomConfigured()) return null;

  try {
    const res = await attomExpandedById(id);
    const mapped = mapAttomProperty(res.property?.[0] || {});
    if (!mapped) return null;
    cacheSet(detailCache, id, mapped, DETAIL_TTL_MS);
    return mapped;
  } catch (err) {
    void logError("ATTOM detail failed", err, {
      category: "ACTION",
      meta: { attomId: id },
    });
    return null;
  }
}

export async function lookupPropertyFromAttom(
  address: string,
  zip: string
): Promise<MappedProperty | null> {
  if (!isAttomConfigured()) return null;

  const { address1, address2 } = splitStreetAndLocality(address, zip);
  const cacheKey = `addr:${address1}|${address2}`.toLowerCase();
  const cached = cacheGet(detailCache, cacheKey);
  if (cached) return cached;

  try {
    const res = await attomExpandedByAddress(address1, address2 || zip);
    const mapped = mapAttomProperty(res.property?.[0] || {});
    if (!mapped) return null;
    cacheSet(detailCache, cacheKey, mapped, DETAIL_TTL_MS);
    cacheSet(detailCache, mapped.attomId, mapped, DETAIL_TTL_MS);
    return mapped;
  } catch (err) {
    void logError("ATTOM address lookup failed", err, {
      category: "ACTION",
      meta: { address1, address2 },
    });
    return null;
  }
}

export async function importPropertyForUser(
  userId: string,
  attomId: string
): Promise<{ propertyId: string; property: MappedProperty }> {
  const detail = await getPropertyDetail(attomId);
  if (!detail) {
    throw new Error("Could not load property from ATTOM.");
  }

  const row = await withDbRetry(() =>
    prisma.property.upsert({
      where: {
        userId_attomId: { userId, attomId: detail.attomId },
      },
      create: {
        userId,
        attomId: detail.attomId,
        address: detail.address,
        city: detail.city,
        state: detail.state,
        zip: detail.zip,
        latitude: detail.latitude,
        longitude: detail.longitude,
        propertyType: detail.propertyType,
        bedrooms: detail.bedrooms,
        bathrooms: detail.bathrooms,
        yearBuilt: detail.yearBuilt,
        squareFeet: detail.squareFeet,
        lotSize: detail.lotSize,
        estimatedValue: detail.estimatedValue,
        estimatedRent: detail.estimatedRent,
        taxAmount: detail.taxAmount,
        apn: detail.apn,
        ownerOccupied: detail.ownerOccupied,
        source: "ATTOM",
        rawJson: JSON.stringify(detail),
      },
      update: {
        address: detail.address,
        city: detail.city,
        state: detail.state,
        zip: detail.zip,
        latitude: detail.latitude,
        longitude: detail.longitude,
        propertyType: detail.propertyType,
        bedrooms: detail.bedrooms,
        bathrooms: detail.bathrooms,
        yearBuilt: detail.yearBuilt,
        squareFeet: detail.squareFeet,
        lotSize: detail.lotSize,
        estimatedValue: detail.estimatedValue,
        estimatedRent: detail.estimatedRent,
        taxAmount: detail.taxAmount,
        apn: detail.apn,
        ownerOccupied: detail.ownerOccupied,
        rawJson: JSON.stringify(detail),
      },
    })
  );

  return { propertyId: row.id, property: detail };
}

export async function listImportedProperties(userId: string) {
  return withDbRetry(() =>
    prisma.property.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })
  );
}

export async function getImportedProperty(userId: string, propertyId: string) {
  return withDbRetry(() =>
    prisma.property.findFirst({
      where: { id: propertyId, userId },
    })
  );
}

export async function deleteImportedProperty(userId: string, propertyId: string) {
  return withDbRetry(() =>
    prisma.property.deleteMany({
      where: { id: propertyId, userId },
    })
  );
}
