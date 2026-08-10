"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/services/auth";
import { lookupProperty, type PropertyData } from "@/lib/services/properties";
import {
  deleteImportedProperty,
  getImportedProperty,
  getPropertyDetail,
  importPropertyForUser,
  listImportedProperties,
  searchProperties,
  type PropertySearchInput,
  type PropertySearchResult,
} from "@/lib/services/propertyService";
import type { MappedProperty } from "@/lib/services/attomMapper";
import { prisma, withDbRetry } from "@/lib/db";
import { isAttomConfigured } from "@/lib/services/attom";

export async function lookupPropertyAction(
  address: string,
  zip: string
): Promise<{ success: boolean; data?: PropertyData; error?: string }> {
  await requireAuth();
  try {
    const data = await lookupProperty(address.trim(), zip.trim());
    return { success: true, data };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Lookup failed",
    };
  }
}

export async function searchPropertiesAction(
  input: PropertySearchInput
): Promise<PropertySearchResult & { configured: boolean }> {
  await requireAuth();
  const result = await searchProperties(input);
  return { ...result, configured: isAttomConfigured() };
}

export async function getPropertyDetailAction(
  attomId: string
): Promise<{ success: boolean; property?: MappedProperty; error?: string }> {
  await requireAuth();
  try {
    const property = await getPropertyDetail(attomId);
    if (!property) {
      return { success: false, error: "Property not found." };
    }
    return { success: true, property };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to load property",
    };
  }
}

export async function importPropertyAction(attomId: string): Promise<{
  success: boolean;
  propertyId?: string;
  property?: MappedProperty;
  error?: string;
}> {
  const user = await requireAuth();
  try {
    const { propertyId, property } = await importPropertyForUser(user.id, attomId);

    await withDbRetry(() =>
      prisma.activityLog.create({
        data: {
          userId: user.id,
          action: "IMPORT_PROPERTY",
          details: `Imported ${property.address} (ATTOM ${property.attomId})`,
        },
      })
    );

  revalidatePath("/dashboard/properties");
  revalidatePath("/dashboard/explore");
  revalidatePath("/dashboard/portfolio");
    return { success: true, propertyId, property };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Import failed",
    };
  }
}

export async function listMyPropertiesAction() {
  const user = await requireAuth();
  const rows = await listImportedProperties(user.id);
  return { success: true as const, properties: rows };
}

export async function getMyPropertyAction(propertyId: string) {
  const user = await requireAuth();
  const property = await getImportedProperty(user.id, propertyId);
  if (!property) return { success: false as const, error: "Not found" };
  return { success: true as const, property };
}

export async function deleteMyPropertyAction(propertyId: string) {
  const user = await requireAuth();
  await deleteImportedProperty(user.id, propertyId);
  await withDbRetry(() =>
    prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "DELETE_PROPERTY",
        details: `Removed imported property ${propertyId}`,
      },
    })
  );
  revalidatePath("/dashboard/properties");
  revalidatePath("/dashboard/portfolio");
  return { success: true as const };
}

export async function createManualPropertyAction(input: {
  address: string;
  city: string;
  state: string;
  zip: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  yearBuilt?: number;
  estimatedValue?: number;
  estimatedRent?: number;
  propertyType?: string;
  notes?: string;
}) {
  const user = await requireAuth();
  const address = input.address.trim();
  if (!address) return { success: false as const, error: "Address is required" };

  const property = await withDbRetry(() =>
    prisma.property.create({
      data: {
        userId: user.id,
        address,
        city: input.city.trim() || "Unknown",
        state: input.state.trim().toUpperCase().slice(0, 2) || "US",
        zip: input.zip.trim() || "",
        bedrooms: input.bedrooms ?? null,
        bathrooms: input.bathrooms ?? null,
        squareFeet: input.squareFeet ?? null,
        yearBuilt: input.yearBuilt ?? null,
        estimatedValue: input.estimatedValue ?? null,
        estimatedRent: input.estimatedRent ?? null,
        propertyType: input.propertyType ?? null,
        notes: input.notes?.trim() || null,
        source: "MANUAL",
      },
    })
  );

  await withDbRetry(() =>
    prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "CREATE_PROPERTY",
        details: `Manually added ${address}`,
      },
    })
  );

  revalidatePath("/dashboard/properties");
  revalidatePath("/dashboard/portfolio");
  return { success: true as const, property };
}

export async function updateMyPropertyAction(
  propertyId: string,
  input: {
    notes?: string;
    estimatedValue?: number;
    estimatedRent?: number;
    bedrooms?: number;
    bathrooms?: number;
    squareFeet?: number;
    yearBuilt?: number;
    propertyType?: string;
    pipelineStatus?: string;
  }
) {
  const user = await requireAuth();

  if (input.pipelineStatus) {
    const { isPipelineStatus } = await import('@/lib/services/dealPipelineSync');
    if (!isPipelineStatus(input.pipelineStatus)) {
      return { success: false as const, error: 'Invalid status' };
    }
  }

  const existing = await withDbRetry(() =>
    prisma.property.findFirst({
      where: { id: propertyId, userId: user.id },
    })
  );
  if (!existing) return { success: false as const, error: 'Not found' };

  const result = await withDbRetry(() =>
    prisma.property.updateMany({
      where: { id: propertyId, userId: user.id },
      data: {
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.estimatedValue !== undefined
          ? { estimatedValue: input.estimatedValue }
          : {}),
        ...(input.estimatedRent !== undefined
          ? { estimatedRent: input.estimatedRent }
          : {}),
        ...(input.bedrooms !== undefined ? { bedrooms: input.bedrooms } : {}),
        ...(input.bathrooms !== undefined ? { bathrooms: input.bathrooms } : {}),
        ...(input.squareFeet !== undefined ? { squareFeet: input.squareFeet } : {}),
        ...(input.yearBuilt !== undefined ? { yearBuilt: input.yearBuilt } : {}),
        ...(input.propertyType !== undefined
          ? { propertyType: input.propertyType }
          : {}),
        ...(input.pipelineStatus !== undefined
          ? { pipelineStatus: input.pipelineStatus }
          : {}),
      },
    })
  );
  if (!result.count) return { success: false as const, error: 'Not found' };

  if (input.pipelineStatus) {
    const {
      syncCrmStageByAddress,
      revalidateDealPaths,
      isPipelineStatus,
    } = await import('@/lib/services/dealPipelineSync');
    if (isPipelineStatus(input.pipelineStatus)) {
      const address = [existing.address, existing.city, existing.state, existing.zip]
        .filter(Boolean)
        .join(', ');
      await syncCrmStageByAddress(user.id, address || existing.address, input.pipelineStatus);
      revalidateDealPaths();
    }
  }

  revalidatePath("/dashboard/properties");
  revalidatePath("/dashboard/portfolio");
  revalidatePath(`/dashboard/properties/${propertyId}`);
  revalidatePath("/dashboard/crm");
  return { success: true as const };
}

/**
 * Create a Deal (saved analysis) from a My Properties asset with sensible defaults.
 * Investors can refine numbers later on the deal / analyzer pages.
 */
export async function sendPropertyToDealAction(
  propertyId: string,
  strategy: 'hold' | 'flip' | 'rental' = 'hold'
) {
  const user = await requireAuth();
  const property = await getImportedProperty(user.id, propertyId);
  if (!property) return { success: false as const, error: 'Property not found' };

  const purchasePrice = Math.max(0, property.estimatedValue || 0);
  if (!purchasePrice) {
    return {
      success: false as const,
      error: 'Set an estimated value on this property before sending to a deal.',
    };
  }

  const { savePropertyAnalysis, saveFlipAnalysis } = await import(
    '@/app/actions/analysisActions'
  );

  if (strategy === 'flip') {
    const rehabCost = Math.round(purchasePrice * 0.1);
    const arv = Math.round(purchasePrice * 1.2);
    const result = await saveFlipAnalysis({
      address: property.address,
      purchasePrice,
      rehabCost,
      arv,
    });
    if (!result.success) {
      return { success: false as const, error: 'Could not create flip deal' };
    }
    return {
      success: true as const,
      dealId: result.flip.id,
      strategy: 'flip' as const,
      updated: result.updated,
    };
  }

  const rent = Math.max(0, property.estimatedRent || 0);
  const taxes = Math.max(0, property.taxAmount || purchasePrice * 0.012);
  const result = await savePropertyAnalysis({
    address: property.address,
    city: property.city || '',
    state: property.state || '',
    zip: property.zip || '',
    purchasePrice,
    rehabCost: 0,
    arv: purchasePrice,
    rent,
    downPayment: 20,
    taxes,
    insurance: Math.round(purchasePrice * 0.0035),
    hoa: 0,
    vacancyRate: 5,
    maintenanceRate: 5,
    mortgageRate: 6.5,
    mortgageTerm: 30,
    strategyType: strategy === 'rental' ? 'rental' : 'hold',
  });

  if (!result.success) {
    return { success: false as const, error: 'Could not create deal' };
  }

  // Align property pipeline with deal when sending
  try {
    await prisma.property.updateMany({
      where: { id: propertyId, userId: user.id },
      data: { pipelineStatus: 'UNDER_REVIEW' },
    });
  } catch {
    /* non-fatal */
  }

  revalidatePath('/dashboard/properties');
  revalidatePath(`/dashboard/properties/${propertyId}`);

  return {
    success: true as const,
    dealId: result.analysis.id,
    strategy: (strategy === 'rental' ? 'rental' : 'hold') as 'hold' | 'rental',
    updated: result.updated,
  };
}
