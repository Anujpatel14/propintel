'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Plus } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { createManualPropertyAction } from '@/app/actions/propertyActions';
import { useToast } from '@/components/ui/Toast';

export default function NewPropertyPage() {
  const toast = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    address: '',
    city: '',
    state: '',
    zip: '',
    bedrooms: '',
    bathrooms: '',
    squareFeet: '',
    estimatedValue: '',
    estimatedRent: '',
    notes: '',
  });

  const submit = () => {
    startTransition(async () => {
      const res = await createManualPropertyAction({
        address: form.address,
        city: form.city,
        state: form.state,
        zip: form.zip,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
        squareFeet: form.squareFeet ? Number(form.squareFeet) : undefined,
        estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : undefined,
        estimatedRent: form.estimatedRent ? Number(form.estimatedRent) : undefined,
        notes: form.notes || undefined,
      });
      if (!res.success || !res.property) {
        toast.error(res.error || 'Could not save property');
        return;
      }
      toast.success('Property saved', 'Continue to Analyze when ready');
      router.push(`/dashboard/properties/${res.property.id}`);
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Add property"
        description="Manual entry into My Properties (your database). Prefer Explorer when you want ATTOM public records."
        actions={
          <Link
            href="/dashboard/properties"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          >
            <ArrowLeft className="h-4 w-4" /> My Properties
          </Link>
        }
      />

      <SpotlightCard className="space-y-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ['address', 'Street address', 'sm:col-span-2'],
              ['city', 'City', ''],
              ['state', 'State', ''],
              ['zip', 'ZIP', ''],
              ['bedrooms', 'Beds', ''],
              ['bathrooms', 'Baths', ''],
              ['squareFeet', 'Sqft', ''],
              ['estimatedValue', 'Est. value', ''],
              ['estimatedRent', 'Est. rent / mo', ''],
              ['notes', 'Notes', 'sm:col-span-2 lg:col-span-4'],
            ] as const
          ).map(([key, label, span]) => (
            <label key={key} className={`block space-y-1 ${span}`}>
              <span className="text-xs text-[var(--muted)]">{label}</span>
              {key === 'notes' ? (
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                />
              ) : (
                <input
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                />
              )}
            </label>
          ))}
        </div>
        <button
          type="button"
          disabled={isPending || !form.address.trim()}
          onClick={submit}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Save property
        </button>
      </SpotlightCard>
    </div>
  );
}
