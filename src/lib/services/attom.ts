/**
 * Raw ATTOM Property API client.
 * Server-only — never import from client components.
 */

const ATTOM_BASE =
  process.env.ATTOM_API_BASE_URL?.replace(/\/$/, "") ||
  "https://api.gateway.attomdata.com/propertyapi/v1.0.0";

const ATTOM_GATEWAY =
  process.env.ATTOM_GATEWAY_BASE_URL?.replace(/\/$/, "") ||
  "https://api.gateway.attomdata.com";

export class AttomError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "AttomError";
    this.status = status;
    this.code = code;
  }
}

export function isAttomConfigured(): boolean {
  return Boolean(process.env.ATTOM_API_KEY?.trim());
}

type AttomParams = Record<string, string | number | undefined | null>;

function buildQuery(params: AttomParams): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    q.set(key, String(value));
  }
  return q.toString();
}

async function attomFetchUrl<T = unknown>(url: string): Promise<T> {
  const key = process.env.ATTOM_API_KEY?.trim();
  if (!key) {
    throw new AttomError("ATTOM_API_KEY is not configured", 503, "NOT_CONFIGURED");
  }

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      apikey: key,
    },
    next: { revalidate: 0 },
    cache: "no-store",
  });

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    const statusMsg =
      (body as { status?: { msg?: string } })?.status?.msg ||
      `ATTOM request failed (${res.status})`;
    // ATTOM often returns HTTP 400 with SuccessWithoutResult for empty geo searches
    if (
      res.status === 400 &&
      /SuccessWithoutResult|no results|without result/i.test(statusMsg)
    ) {
      return (body ?? { status: { msg: statusMsg }, property: [] }) as T;
    }
    throw new AttomError(statusMsg, res.status, "HTTP_ERROR");
  }

  return body as T;
}

async function attomFetch<T = unknown>(
  endpoint: string,
  params: AttomParams = {}
): Promise<T> {
  const path = endpoint.replace(/^\//, "");
  const qs = buildQuery(params);
  const url = `${ATTOM_BASE}/${path}${qs ? `?${qs}` : ""}`;
  return attomFetchUrl<T>(url);
}

/** ATTOM envelope returned by property endpoints */
export type AttomPropertyResponse = {
  status?: {
    version?: string;
    code?: number;
    msg?: string;
    total?: number;
  };
  property?: AttomRawProperty[];
};

export type AttomRawProperty = {
  identifier?: {
    Id?: number;
    attomId?: number;
    fips?: string;
    apn?: string;
  };
  address?: {
    country?: string;
    countrySubd?: string;
    line1?: string;
    line2?: string;
    locality?: string;
    oneLine?: string;
    postal1?: string;
    postal2?: string;
  };
  location?: {
    latitude?: string | number;
    longitude?: string | number;
    accuracy?: string;
  };
  summary?: {
    propClass?: string;
    propclass?: string;
    propType?: string;
    proptype?: string;
    propertyType?: string;
    yearBuilt?: number;
    yearbuilt?: number;
    absenteeInd?: string;
    legal1?: string;
  };
  lot?: {
    lotSize1?: number;
    lotSize2?: number;
    lotsize2?: number;
    zoningType?: string;
  };
  building?: {
    size?: {
      universalsize?: number;
      universalSize?: number;
      livingsize?: number;
      livingSize?: number;
      bldgsize?: number;
      bldgSize?: number;
    };
    rooms?: {
      beds?: number;
      bathstotal?: number;
      bathsTotal?: number;
      bathsfull?: number;
      bathsFull?: number;
    };
    summary?: {
      levels?: number;
      storyDesc?: string;
      archStyle?: string;
    };
    construction?: {
      condition?: string;
    };
    parking?: {
      prkgSize?: number;
      garageType?: string;
      prkgType?: string;
    };
  };
  assessment?: {
    assessed?: {
      assdTtlValue?: number;
      assdttlvalue?: number;
      marketTtlValue?: number;
    };
    market?: {
      mktTtlValue?: number;
      mktttlvalue?: number;
    };
    tax?: {
      taxAmt?: number;
      taxamt?: number;
      taxYear?: number;
      taxyear?: number;
    };
  };
  avm?: {
    amount?: {
      value?: number;
      high?: number;
      low?: number;
    };
    eventDate?: string;
  };
  sale?: {
    amount?: {
      saleamt?: number;
      saleAmt?: number;
      salerecdate?: string;
      saleRecDate?: string;
      saletrancode?: string;
    };
    saleTransDate?: string;
    saleSearchDate?: string;
  };
  utilities?: Record<string, string>;
  vintage?: {
    lastModified?: string;
    pubDate?: string;
  };
};

export type AttomLocationLookupResponse = {
  status?: { msg?: string; code?: number; total?: number };
  geographies?: Array<{
    geoIdV4?: string;
    geographyName?: string;
    geographyTypeName?: string;
    geographyTypeAbbreviation?: string;
    details?: {
      name?: string;
      latitude?: number;
      longitude?: number;
      totalResidentCount?: number;
      areaSquareMiles?: number;
    };
  }>;
};

/** Resolve city / place / neighborhood names to geoIdV4. */
export async function attomLocationLookup(
  name: string,
  geographyTypeAbbreviation: "CI" | "PL" | "N2" | "N4" | "ZI" = "CI"
) {
  const qs = buildQuery({
    geographyTypeAbbreviation,
    name,
  });
  return attomFetchUrl<AttomLocationLookupResponse>(
    `${ATTOM_GATEWAY}/v4/location/lookup?${qs}`
  );
}

/** Basic address match (attomId + address lines). */
export async function attomLookupByAddress(address1: string, address2: string) {
  return attomFetch<AttomPropertyResponse>("property/address", {
    address1,
    address2,
  });
}

/** Full property profile by street + city/state/zip. */
export async function attomExpandedByAddress(address1: string, address2: string) {
  return attomFetch<AttomPropertyResponse>("property/expandedprofile", {
    address1,
    address2,
  });
}

/** Full property profile by ATTOM id. */
export async function attomExpandedById(attomId: string | number) {
  return attomFetch<AttomPropertyResponse>("property/expandedprofile", {
    attomId: String(attomId),
  });
}

/**
 * Location snapshot search (listing cards).
 * Prefer postalcode, lat/long+radius, or geoIdV4 (ZI/PL work; CI city ids often return empty on snapshot).
 * Do NOT pass city/state — ATTOM rejects those params.
 */
export async function attomSnapshotSearch(params: {
  postalcode?: string;
  geoIdV4?: string;
  latitude?: number | string;
  longitude?: number | string;
  radius?: number | string;
  address1?: string;
  address2?: string;
  pagesize?: number;
  page?: number;
  minBeds?: number;
  maxBeds?: number;
  minBaths?: number;
  minUniversalSize?: number;
  maxUniversalSize?: number;
  minYearBuilt?: number;
  maxYearBuilt?: number;
}) {
  return attomFetch<AttomPropertyResponse>("property/snapshot", {
    postalcode: params.postalcode,
    geoIdV4: params.geoIdV4,
    latitude: params.latitude,
    longitude: params.longitude,
    radius: params.radius,
    address1: params.address1,
    address2: params.address2,
    pagesize: params.pagesize ?? 20,
    page: params.page ?? 1,
    minBeds: params.minBeds,
    maxBeds: params.maxBeds,
    minBathsTotal: params.minBaths,
    minUniversalSize: params.minUniversalSize,
    maxUniversalSize: params.maxUniversalSize,
    minYearBuilt: params.minYearBuilt,
    maxYearBuilt: params.maxYearBuilt,
  });
}

/** Assessment snapshot — includes market/assessed values missing from property snapshot. */
export async function attomAssessmentSnapshot(params: {
  postalcode?: string;
  geoIdV4?: string;
  latitude?: number | string;
  longitude?: number | string;
  radius?: number | string;
  pagesize?: number;
  page?: number;
}) {
  return attomFetch<AttomPropertyResponse>("assessment/snapshot", {
    postalcode: params.postalcode,
    geoIdV4: params.geoIdV4,
    latitude: params.latitude,
    longitude: params.longitude,
    radius: params.radius,
    pagesize: params.pagesize ?? 50,
    page: params.page ?? 1,
  });
}

/** AVM detail for a single property. */
export async function attomAvmDetail(attomId: string | number) {
  return attomFetch<AttomPropertyResponse>("attomavm/detail", {
    attomId: String(attomId),
  });
}
