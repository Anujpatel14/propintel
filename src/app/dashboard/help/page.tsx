'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Building2,
  Calendar,
  CreditCard,
  FolderKanban,
  HelpCircle,
  LifeBuoy,
  Mail,
  MessageCircle,
  Search,
  Settings,
  Sparkles,
} from 'lucide-react';

const TOPICS = [
  {
    title: 'Property Explorer',
    desc: 'Search markets, import ATTOM records into My Properties, then underwrite.',
    href: '/dashboard/explore',
    icon: Search,
  },
  {
    title: 'My Properties & Deals',
    desc: 'Assets live in Properties. Send to Deals to save analyses and CRM stages.',
    href: '/dashboard/properties',
    icon: Building2,
  },
  {
    title: 'CRM pipeline',
    desc: 'Drag leads through wholesale stages — assignment fee, MAO, follow-ups.',
    href: '/dashboard/crm',
    icon: FolderKanban,
  },
  {
    title: 'Coaching requests',
    desc: 'Request time with an admin-listed expert. Admin confirms — no Meet link required.',
    href: '/dashboard/coaching',
    icon: Calendar,
  },
  {
    title: 'Billing & plans',
    desc: 'Upgrade, switch monthly/annual, or open the Stripe customer portal.',
    href: '/dashboard/billing',
    icon: CreditCard,
  },
  {
    title: 'Profile & underwriting',
    desc: 'Investor details, deal criteria, and default underwriting assumptions.',
    href: '/dashboard/settings/profile',
    icon: Settings,
  },
];

const FAQS = [
  {
    q: 'What is the difference between Properties and Deals?',
    a: 'Properties are your book of assets (imported or manual). Deals are saved hold/flip/rental analyses with metrics and CRM sync.',
  },
  {
    q: 'How does coaching booking work?',
    a: 'Pick an expert the admin published, choose a preferred date/time and topic, then submit. Your request stays Pending until an admin confirms it.',
  },
  {
    q: 'Where do I change my password or email?',
    a: 'Use Settings → Account. Investor profile is for public/deal criteria only — not login security.',
  },
  {
    q: 'Why is my plan still Free after checkout?',
    a: 'Open Billing and tap Refresh plan. Stripe webhooks usually sync within a few seconds; Refresh pulls the latest subscription from Stripe.',
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-[#dbe7ff] px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-[#1639a8] uppercase">
          Support · Guides
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-[#0b1220] sm:text-4xl">
          Help center
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-[var(--muted)]">
          Quick answers for PropIntel investors — explore, underwrite, book coaching, and manage
          billing.
        </p>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[#0b1220] p-6 text-white sm:p-8"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_80%_at_100%_0%,rgba(59,130,246,0.35),transparent_55%)]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <LifeBuoy className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold">Need a human?</h2>
              <p className="mt-1 text-sm text-white/65">
                For account or billing issues, email support or request a coaching session with an
                expert.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="mailto:support@propintel.app"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#0b1220] hover:bg-blue-50"
            >
              <Mail className="h-4 w-4" /> Email support
            </a>
            <Link
              href="/dashboard/coaching"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              <MessageCircle className="h-4 w-4" /> Request coaching
            </Link>
          </div>
        </div>
      </motion.section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-blue-800" />
          <h2 className="font-display text-lg font-bold">Browse topics</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOPICS.map((t, i) => {
            const Icon = t.icon;
            return (
              <motion.div
                key={t.href}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  href={t.href}
                  className="group flex h-full flex-col rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.04)] transition hover:border-blue-700/30 hover:shadow-md"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eff4ff] text-blue-800">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 font-semibold text-[#0b1220] group-hover:text-blue-900">
                    {t.title}
                  </h3>
                  <p className="mt-1 flex-1 text-xs leading-relaxed text-[var(--muted)]">{t.desc}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-800">
                    Open <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-blue-800" />
          <h2 className="font-display text-lg font-bold">FAQ</h2>
        </div>
        <ul className="divide-y divide-[var(--border)]">
          {FAQS.map((f) => (
            <li key={f.q} className="py-4 first:pt-0 last:pb-0">
              <p className="text-sm font-semibold text-[#0b1220]">{f.q}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{f.a}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex items-center gap-2 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)]/60 px-4 py-3 text-xs text-[var(--muted)]">
        <Sparkles className="h-3.5 w-3.5 text-blue-800" />
        Tip: use the sidebar Settings for profile & account — Help is for guides only.
      </div>
    </div>
  );
}
