'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import { SkeletonRows } from '@/components/ui/Skeleton';
import {
  getCmsContent,
  upsertCmsContent,
  deleteCmsContent,
} from '@/app/actions/adminExpandActions';

type CmsItem = {
  id: string;
  type: string;
  key: string | null;
  data: unknown;
};

export default function AdminCmsPage() {
  const [items, setItems] = useState<CmsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('FAQ');
  const [saving, setSaving] = useState(false);

  // FAQ form
  const [faqQ, setFaqQ] = useState('');
  const [faqA, setFaqA] = useState('');
  // Testimonial form
  const [tName, setTName] = useState('');
  const [tQuote, setTQuote] = useState('');
  const [tCompany, setTCompany] = useState('');
  const [tRating, setTRating] = useState(5);
  // Announcement
  const [announcement, setAnnouncement] = useState('');
  const [annEnabled, setAnnEnabled] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const result = await getCmsContent();
      setItems(result.items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = items.filter((i) => i.type === tab);

  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqQ.trim()) return;
    setSaving(true);
    try {
      await upsertCmsContent({ type: 'FAQ', data: { question: faqQ, answer: faqA } });
      setFaqQ('');
      setFaqA('');
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleAddTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tQuote.trim()) return;
    setSaving(true);
    try {
      await upsertCmsContent({
        type: 'TESTIMONIAL',
        data: { name: tName, quote: tQuote, company: tCompany, rating: tRating },
      });
      setTName('');
      setTQuote('');
      setTCompany('');
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const existing = items.find((i) => i.type === 'ANNOUNCEMENT');
      await upsertCmsContent({
        id: existing?.id,
        type: 'ANNOUNCEMENT',
        key: 'banner',
        data: { message: announcement, enabled: annEnabled },
      });
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteCmsContent(id);
    await load();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        title="CMS & landing content"
        description="Manage FAQs, testimonials, and announcement banners."
      />

      <div className="flex flex-wrap gap-2">
        {['FAQ', 'TESTIMONIAL', 'ANNOUNCEMENT', 'PRICING'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`min-h-10 cursor-pointer rounded-lg px-3 py-2 text-xs font-bold ${
              tab === t ? 'bg-blue-700 text-white' : 'border border-[var(--border)] text-[var(--muted)]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="surface-card space-y-4 p-5">
          <SkeletonRows rows={6} cols={3} />
        </div>
      ) : (
        <div className="space-y-6">
          {tab === 'FAQ' && (
            <form onSubmit={handleAddFaq} className="surface-card space-y-3 p-5">
              <h2 className="text-sm font-bold">Add FAQ</h2>
              <input
                className="glass-input w-full px-3 py-2 text-sm"
                placeholder="Question"
                value={faqQ}
                onChange={(e) => setFaqQ(e.target.value)}
              />
              <textarea
                className="glass-input w-full px-3 py-2 text-sm"
                rows={3}
                placeholder="Answer"
                value={faqA}
                onChange={(e) => setFaqA(e.target.value)}
              />
              <button
                type="submit"
                disabled={saving}
                className="btn-primary inline-flex cursor-pointer items-center gap-2 px-4 py-2 text-xs disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" /> Add FAQ
              </button>
            </form>
          )}

          {tab === 'TESTIMONIAL' && (
            <form onSubmit={handleAddTestimonial} className="surface-card space-y-3 p-5">
              <h2 className="text-sm font-bold">Add testimonial</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  className="glass-input px-3 py-2 text-sm"
                  placeholder="Investor name"
                  value={tName}
                  onChange={(e) => setTName(e.target.value)}
                />
                <input
                  className="glass-input px-3 py-2 text-sm"
                  placeholder="Company"
                  value={tCompany}
                  onChange={(e) => setTCompany(e.target.value)}
                />
              </div>
              <textarea
                className="glass-input w-full px-3 py-2 text-sm"
                rows={3}
                placeholder="Quote"
                value={tQuote}
                onChange={(e) => setTQuote(e.target.value)}
              />
              <label className="flex items-center gap-2 text-xs">
                Rating
                <input
                  type="number"
                  min={1}
                  max={5}
                  className="glass-input w-20 px-2 py-1"
                  value={tRating}
                  onChange={(e) => setTRating(Number(e.target.value))}
                />
              </label>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary inline-flex cursor-pointer items-center gap-2 px-4 py-2 text-xs disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" /> Add testimonial
              </button>
            </form>
          )}

          {tab === 'ANNOUNCEMENT' && (
            <form onSubmit={handleAnnouncement} className="surface-card space-y-3 p-5">
              <h2 className="text-sm font-bold">Announcement banner</h2>
              <textarea
                className="glass-input w-full px-3 py-2 text-sm"
                rows={2}
                placeholder='e.g. New Feature: AI Underwriting V2 is live!'
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
              />
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={annEnabled}
                  onChange={(e) => setAnnEnabled(e.target.checked)}
                />
                Enabled on landing page
              </label>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary cursor-pointer px-4 py-2 text-xs disabled:opacity-50"
              >
                Save announcement
              </button>
            </form>
          )}

          {tab === 'PRICING' && (
            <div className="surface-card space-y-3 p-5 text-sm">
              <h2 className="font-bold">Pricing CMS</h2>
              <p className="text-xs text-[var(--muted)]">
                Default tiers: FREE $0 · PRO $49/mo · ENTERPRISE $99/mo. Wire landing page consumers
                to `CMSContent` type `PRICING` when public pricing cards go dynamic.
              </p>
              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  try {
                    await upsertCmsContent({
                      type: 'PRICING',
                      key: 'tiers',
                      data: {
                        tiers: [
                          { id: 'FREE', price: 0, cta: 'Start free' },
                          { id: 'PRO', price: 49, cta: 'Upgrade to Pro' },
                          { id: 'ENTERPRISE', price: 99, cta: 'Contact sales' },
                        ],
                      },
                    });
                    await load();
                  } finally {
                    setSaving(false);
                  }
                }}
                className="btn-primary cursor-pointer px-4 py-2 text-xs"
              >
                Seed default pricing JSON
              </button>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase text-[var(--muted)]">
              Stored {tab.toLowerCase()} items ({filtered.length})
            </h3>
            {filtered.length === 0 ? (
              <p className="text-xs text-[var(--muted)]">No items yet.</p>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 rounded-xl border border-[var(--border)] bg-white p-4 text-xs"
                >
                  <pre className="max-w-full overflow-x-auto whitespace-pre-wrap text-[11px] text-[var(--muted)]">
                    {JSON.stringify(item.data, null, 2)}
                  </pre>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="cursor-pointer rounded-lg p-2 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
