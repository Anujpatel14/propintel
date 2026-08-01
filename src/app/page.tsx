'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  ChevronDown,
  Check,
  ArrowUpRight,
} from 'lucide-react';
import AtmosphericHero from '@/components/ui/AtmosphericHero';
import FloatingDealCard from '@/components/ui/FloatingDealCard';
import { BrandMark } from '@/components/BrandLogo';

const FAQS = [
  {
    question: 'What calculations can I run with PropIntel?',
    answer:
      'Buy & Hold (cash flow, Cap Rate, cash-on-cash, DSCR), Fix & Flip (profit, ROI, holding costs, MAO), and long-term rental projections.',
  },
  {
    question: 'How does the AI Deal Analyzer work?',
    answer:
      'It reads your underwriting outputs and returns strengths, risks, and a clear acquisition verdict — via our rules engine, or OpenAI when configured.',
  },
  {
    question: 'Can I generate PDF reports?',
    answer:
      'Yes. Export a clean dossier with costs, loan assumptions, returns, and AI insights — print-ready in one click.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'Free includes 3 analyses. PRO unlocks AI, CRM, and unlimited reports with a 7-day trial.',
  },
];

const INVESTOR_TABS = [
  {
    id: 'wholesale',
    label: 'Wholesalers',
    sub: 'Assignments & MAO',
    copy: 'Track leads, assignment fees, and maximum allowable offers without spreadsheet chaos.',
    metric: 'MAO',
    metricLabel: 'Offer discipline',
    points: ['Assignment fee tracking', 'Stage-based CRM', '70% rule MAO'],
  },
  {
    id: 'flip',
    label: 'Fix & Flip',
    sub: 'Profit & hold costs',
    copy: 'Model rehab, carrying costs, and sell-side fees before you write the offer.',
    metric: '18%',
    metricLabel: 'Sample flip yield',
    points: ['Holding cost model', 'Net profit & ROI', 'Sell-side fees'],
  },
  {
    id: 'hold',
    label: 'Buy & Hold',
    sub: 'Cash flow & DSCR',
    copy: 'See monthly cash flow, cap rate, and lender-ready DSCR in one underwrite.',
    metric: '7.2%',
    metricLabel: 'Sample cap rate',
    points: ['Monthly cash flow', 'Cash-on-cash return', 'Bank-ready DSCR'],
  },
  {
    id: 'rental',
    label: 'Rentals',
    sub: 'Long-term growth',
    copy: 'Project equity, rent growth, and annualized returns over a 5–30 year horizon.',
    metric: '10yr',
    metricLabel: 'Growth horizon',
    points: ['Rent growth curves', 'Equity projection', 'Annualized return'],
  },
];

const PROPERTIES = [
  {
    title: 'Oak Ridge Residence',
    meta: 'Dallas, TX',
    tag: 'Buy & Hold',
    stat: 'Cap 7.2%',
    img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Highland Avenue',
    meta: 'Austin, TX',
    tag: 'Fix & Flip',
    stat: 'ROI 18%',
    img: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Maple Court',
    meta: 'Fort Worth, TX',
    tag: 'Rental',
    stat: '+$298 CF',
    img: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Cedar Hollow',
    meta: 'Plano, TX',
    tag: 'Wholesale',
    stat: 'Fee $12k',
    img: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cd00?auto=format&fit=crop&w=1200&q=80',
  },
];

const LEADS = [
  { name: 'Robert S.', detail: 'Oak Ridge · Follow-up', status: 'LEAD' },
  { name: 'Jane D.', detail: 'Elm Street · Review', status: 'REVIEW' },
  { name: 'Gary J.', detail: 'Highland · Offer', status: 'OFFER' },
];

export default function LandingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [tab, setTab] = useState(INVESTOR_TABS[2].id);
  const activeTab = INVESTOR_TABS.find((t) => t.id === tab) ?? INVESTOR_TABS[2];

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 0.85]);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#f4f6f3]">
        {/* ─── HERO ─── */}
        <motion.section style={{ opacity: heroOpacity }} className="relative min-h-screen w-full overflow-hidden">
          <AtmosphericHero />

          {/* Nav — full bleed */}
          <header className="absolute inset-x-0 top-0 z-20">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 md:px-10 md:py-6">
              <Link href="/" className="flex items-center gap-2.5">
                <BrandMark size={36} />
                <span className="font-display text-lg font-bold tracking-tight text-white md:text-xl">
                  PropIntel
                </span>
              </Link>

              <nav className="hidden items-center gap-8 text-[11px] font-medium tracking-[0.14em] text-white/80 lg:flex">
                <a href="#platform" className="transition hover:text-white">
                  PLATFORM
                </a>
                <a href="#investors" className="transition hover:text-white">
                  USE CASES
                </a>
                <a href="#pricing" className="transition hover:text-white">
                  PRICING
                </a>
                <a href="#faq" className="transition hover:text-white">
                  FAQ
                </a>
              </nav>

              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="hidden px-3 py-2 text-sm font-medium text-white/85 transition hover:text-white sm:inline"
                >
                  Sign in
                </Link>
                <Link href="/login?tab=register" className="btn-ink btn-pill px-5 py-2.5 text-xs md:text-sm">
                  Start free
                </Link>
              </div>
            </div>
          </header>

          {/* Hero content */}
          <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-10 px-6 pb-20 pt-28 md:px-10 lg:grid-cols-12 lg:pb-24 lg:pt-24">
            <div className="lg:col-span-7">
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="font-display text-5xl font-extrabold tracking-tight text-white/95 sm:text-6xl md:text-7xl lg:text-[5.5rem] lg:leading-[0.92]"
              >
                PropIntel
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.12 }}
                className="mt-6 max-w-2xl font-display text-3xl font-bold leading-[1.05] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[3.25rem]"
              >
                Underwrite every deal before you leave the showing.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.28 }}
                className="mt-5 max-w-md text-base font-light leading-relaxed text-white/80 md:text-lg"
              >
                Cash flow, flips, pipelines, and AI verdicts — clarity for investors who move fast.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-10 flex flex-wrap items-center gap-3"
              >
                <Link href="/login?tab=register" className="btn-ink btn-pill inline-flex items-center gap-2 px-7 py-3.5 text-sm">
                  Start free <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#platform"
                  className="btn-secondary inline-flex items-center gap-2 border-white/40 px-7 py-3.5 text-sm text-white"
                >
                  See the platform
                </a>
              </motion.div>
            </div>

            <div className="flex justify-center lg:col-span-5 lg:justify-end lg:pr-4">
              <FloatingDealCard />
            </div>
          </div>
        </motion.section>

        {/* ─── BENTO PLATFORM ─── */}
        <section id="platform" className="bg-[#f4f6f3] px-5 py-20 md:px-10 md:py-28">
          <div className="mx-auto max-w-5xl text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-3xl font-bold tracking-tight text-[#141a17] sm:text-4xl md:text-5xl"
            >
              The desk that never loses a deal
            </motion.h2>
            <p className="mx-auto mt-4 max-w-xl text-[#5f6d64]">
              One workspace for underwriting, pipelines, and reports — designed like a product, not a spreadsheet.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-6xl gap-5 md:grid-cols-3">
            {/* Sage list card */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="bento-sage flex min-h-[380px] flex-col rounded-[2rem] p-6 text-white shadow-[var(--shadow-lift)]"
            >
              <h3 className="font-display text-2xl font-bold leading-tight tracking-tight">
                Every lead tracked,
                <br />
                every slot filled.
              </h3>
              <div className="mt-8 flex flex-1 flex-col gap-3">
                {LEADS.map((lead, i) => (
                  <motion.div
                    key={lead.name}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 + i * 0.08 }}
                    className="flex items-center gap-3 rounded-2xl bg-white px-3.5 py-3 text-[#141a17] shadow-sm"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8efe9] text-xs font-bold text-[#3d5a4c]">
                      {lead.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{lead.name}</div>
                      <div className="truncate text-[11px] text-[#5f6d64]">{lead.detail}</div>
                    </div>
                    <span className="rounded-lg bg-[#eef2ee] px-2 py-1 text-[9px] font-bold tracking-wide text-[#5f6d64]">
                      {lead.status}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Soft trust card */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.12 }}
              className="bento-soft relative flex min-h-[380px] flex-col overflow-hidden rounded-[2rem] p-6 shadow-[var(--shadow-soft)]"
            >
              <h3 className="relative z-10 font-display text-3xl font-bold leading-tight tracking-tight text-[#141a17]">
                Investor-
                <br />
                grade clarity.
              </h3>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-40">
                {['Bank-ready DSCR', 'AI risk verdicts', 'PDF dossiers', 'Live comps'].map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-[#3d5a4c]/15 bg-white/70 px-4 py-2 text-xs font-semibold text-[#3d5a4c]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Photo + calendar widget */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.18 }}
              className="relative min-h-[380px] overflow-hidden rounded-[2rem] shadow-[var(--shadow-lift)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=900&q=80"
                alt="Modern property interior"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <motion.div
                className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="mb-2 text-[10px] font-bold tracking-wider text-[#5f6d64]">COACHING · AUG</div>
                <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
                  {Array.from({ length: 14 }, (_, i) => i + 1).map((d) => (
                    <span
                      key={d}
                      className={`flex h-7 items-center justify-center rounded-full ${
                        d === 13 ? 'bg-[#3d5a4c] font-bold text-white' : 'text-[#141a17]'
                      }`}
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ─── INVESTOR USE CASES — light, full-width ─── */}
        <section id="investors" className="relative overflow-hidden border-y border-[var(--border)] bg-white py-20 md:py-28">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(127,154,136,0.12),transparent_55%)]" />
          <div className="relative mx-auto max-w-7xl px-5 md:px-10">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#3d5a4c]">Use cases</p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-5xl">
                Built for how you invest
              </h2>
              <p className="mt-3 text-[#5f6d64]">
                Switch models instantly — the same workspace adapts to wholesale, flips, hold, and rentals.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-2">
              {INVESTOR_TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                    tab === t.id
                      ? 'bg-[#3d5a4c] text-white shadow-lg shadow-[#3d5a4c]/20'
                      : 'bg-[#eef2ee] text-[#5f6d64] hover:bg-[#e0e8e2] hover:text-[#141a17]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
                className="mt-10 grid items-stretch gap-6 lg:grid-cols-12"
              >
                <div className="flex flex-col justify-between rounded-[2rem] border border-[var(--border)] bg-[#f4f6f3] p-8 lg:col-span-5 md:p-10">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#3d5a4c]">{activeTab.sub}</div>
                    <p className="mt-4 text-xl font-light leading-relaxed text-[#141a17] md:text-2xl">
                      {activeTab.copy}
                    </p>
                    <ul className="mt-8 space-y-3">
                      {activeTab.points.map((p, i) => (
                        <motion.li
                          key={p}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + i * 0.06 }}
                          className="flex items-center gap-3 text-sm font-medium text-[#5f6d64]"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3d5a4c]/12 text-[#3d5a4c]">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                          {p}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                  <Link
                    href="/dashboard/analyzer"
                    className="mt-10 inline-flex w-fit items-center gap-2 rounded-full bg-[#171c19] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#2a332e]"
                  >
                    Try this model <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="relative overflow-hidden rounded-[2rem] bg-[#3d5a4c] p-8 text-white lg:col-span-7 md:p-12">
                  <motion.div
                    className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
                    transition={{ duration: 6, repeat: Infinity }}
                  />
                  <div className="relative grid h-full gap-8 sm:grid-cols-2 sm:items-end">
                    <div>
                      <motion.div
                        key={activeTab.metric}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="font-display text-7xl font-extrabold tracking-tight md:text-8xl"
                      >
                        {activeTab.metric}
                      </motion.div>
                      <div className="mt-2 text-sm text-white/65">{activeTab.metricLabel}</div>
                    </div>
                    <div className="space-y-3">
                      {[72, 54, 88].map((h, i) => (
                        <motion.div
                          key={`${activeTab.id}-bar-${i}`}
                          className="overflow-hidden rounded-xl bg-white/10"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.15 + i * 0.08 }}
                        >
                          <motion.div
                            className="h-10 rounded-xl bg-white/85"
                            initial={{ width: 0 }}
                            animate={{ width: `${h}%` }}
                            transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                          />
                        </motion.div>
                      ))}
                      <p className="pt-2 text-xs text-white/50">Live underwriting signal preview</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* ─── FEATURED DEALS — animated gallery ─── */}
        <section className="overflow-hidden bg-[#f4f6f3] py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-5 md:px-10">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-xl">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#3d5a4c]">Deal gallery</p>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-5xl">
                  Properties underwritten with PropIntel
                </h2>
                <p className="mt-3 text-[#5f6d64]">
                  Hover any card — metrics lift in. Every asset tells a cash-flow story.
                </p>
              </div>
              <Link
                href="/login?tab=register"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#3d5a4c] transition hover:gap-3"
              >
                Analyze your first deal <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {PROPERTIES.map((p, i) => (
                <motion.a
                  key={p.title}
                  href="/login?tab=register"
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: i * 0.07, duration: 0.5 }}
                  whileHover={{ y: -10 }}
                  className="group relative block overflow-hidden rounded-[1.75rem] bg-white shadow-[var(--shadow-soft)]"
                >
                  <div className="relative aspect-[4/5] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.img}
                      alt={p.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141a17]/85 via-[#141a17]/15 to-transparent" />
                    <motion.span
                      className="absolute top-4 left-4 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold tracking-wide text-[#3d5a4c]"
                      initial={{ opacity: 0, y: -8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                    >
                      {p.tag}
                    </motion.span>
                    <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                      <div className="flex items-end justify-between gap-2">
                        <div>
                          <div className="font-display text-lg font-bold tracking-tight">{p.title}</div>
                          <div className="text-xs text-white/65">{p.meta}</div>
                        </div>
                        <ArrowUpRight className="mb-1 h-4 w-4 opacity-0 transition group-hover:opacity-100" />
                      </div>
                      <motion.div
                        className="mt-3 overflow-hidden"
                        initial={false}
                      >
                        <div className="translate-y-2 rounded-xl bg-white/15 px-3 py-2 text-sm font-semibold backdrop-blur-md opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                          {p.stat}
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>
          </div>
        </section>

        {/* ─── PRICING ─── */}
        <section id="pricing" className="relative overflow-hidden bg-white py-20 md:py-28">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_center,rgba(127,154,136,0.1),transparent_70%)]" />
          <div className="relative mx-auto max-w-7xl px-5 md:px-10">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#3d5a4c]">Pricing</p>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-5xl">
                  Simple pricing
                </h2>
                <p className="mt-2 text-[#5f6d64]">Start free. Upgrade when the deals demand it.</p>
              </div>
              <div className="relative flex rounded-full border border-[var(--border)] bg-[#f4f6f3] p-1">
                <button
                  onClick={() => setIsAnnual(false)}
                  className={`relative z-10 rounded-full px-5 py-2.5 text-sm font-semibold ${!isAnnual ? 'text-white' : 'text-[#5f6d64]'}`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setIsAnnual(true)}
                  className={`relative z-10 rounded-full px-5 py-2.5 text-sm font-semibold ${isAnnual ? 'text-white' : 'text-[#5f6d64]'}`}
                >
                  Annual <span className="ml-1 text-[10px] opacity-70">−20%</span>
                </button>
                <motion.div
                  className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-[#3d5a4c]"
                  animate={{ left: isAnnual ? 'calc(50% + 2px)' : '4px' }}
                  transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                />
              </div>
            </div>

            <div className="mt-14 grid gap-5 lg:grid-cols-3">
              <PriceCard
                name="Free"
                price="$0"
                period="forever"
                features={['3 analyses', 'Basic calculators', 'Property lookup', 'Email support']}
                delay={0}
              />
              <PriceCard
                name="PRO"
                price={isAnnual ? '$39' : '$49'}
                period={isAnnual ? '/mo yearly' : '/month'}
                featured
                features={['Unlimited analyses', 'AI verdicts', 'CRM pipeline', 'PDF reports', '7-day trial']}
                delay={0.08}
              />
              <PriceCard
                name="Enterprise"
                price={isAnnual ? '$79' : '$99'}
                period={isAnnual ? '/mo yearly' : '/month'}
                features={['Everything in PRO', 'Team seats', 'Priority coaching', 'Admin controls', 'Custom limits']}
                delay={0.16}
              />
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section id="faq" className="border-t border-[var(--border)] bg-[#f4f6f3] py-20 md:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 md:px-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#3d5a4c]">FAQ</p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-5xl">
                Answers before you underwrite
              </h2>
              <p className="mt-4 text-[#5f6d64]">
                Still stuck? Reach us at{' '}
                <a href="mailto:hello@propintel.com" className="font-semibold text-[#3d5a4c] underline-offset-2 hover:underline">
                  hello@propintel.com
                </a>
              </p>
            </div>

            <div className="space-y-3 lg:col-span-8">
              {FAQS.map((faq, i) => {
                const open = activeFaq === i;
                return (
                  <motion.div
                    key={faq.question}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className={`overflow-hidden rounded-2xl border transition ${
                      open
                        ? 'border-[#3d5a4c]/25 bg-white shadow-[var(--shadow-soft)]'
                        : 'border-[var(--border)] bg-white/70 hover:border-[#3d5a4c]/20'
                    }`}
                  >
                    <button
                      onClick={() => setActiveFaq(open ? null : i)}
                      className="flex w-full items-start gap-4 px-5 py-5 text-left md:px-6"
                    >
                      <span className="mt-0.5 font-display text-sm font-bold text-[#3d5a4c]/50">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="flex-1 font-semibold text-[#141a17] md:text-lg">{faq.question}</span>
                      <motion.span
                        animate={{ rotate: open ? 180 : 0 }}
                        className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef2ee] text-[#3d5a4c]"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28 }}
                        >
                          <p className="px-5 pb-6 pl-[3.25rem] text-sm leading-relaxed text-[#5f6d64] md:px-6 md:pl-[4rem] md:text-base">
                            {faq.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── FINAL CTA — full bleed ─── */}
        <section className="relative overflow-hidden bg-[#3d5a4c] py-24 md:py-32">
          <motion.div
            className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-white/10 blur-3xl"
            animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="pointer-events-none absolute -right-10 bottom-0 h-80 w-80 rounded-full bg-[#9eb5a4]/30 blur-3xl"
            animate={{ x: [0, -30, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="relative mx-auto max-w-7xl px-5 text-center md:px-10">
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mx-auto max-w-3xl font-display text-4xl font-bold tracking-tight text-white md:text-6xl"
            >
              Your next deal deserves better numbers
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mx-auto mt-5 max-w-lg text-lg text-white/70"
            >
              Create a workspace in minutes. Underwrite with confidence — cash flow, flips, and AI verdicts in one place.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-10 flex flex-wrap items-center justify-center gap-3"
            >
              <Link
                href="/login?tab=register"
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#171c19] transition hover:bg-[#eef2ee]"
              >
                Create your workspace <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Sign in
              </Link>
            </motion.div>

            <div className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-6 border-t border-white/15 pt-10">
              {[
                { n: '3', l: 'Deal models' },
                { n: 'AI', l: 'Risk verdicts' },
                { n: '7d', l: 'PRO trial' },
              ].map((s, i) => (
                <motion.div
                  key={s.l}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                >
                  <div className="font-display text-2xl font-bold text-white md:text-3xl">{s.n}</div>
                  <div className="mt-1 text-xs text-white/55 md:text-sm">{s.l}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="border-t border-[var(--border)] bg-[#171c19] text-white">
          <div className="mx-auto max-w-7xl px-5 py-16 md:px-10">
            <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-6">
              <div className="lg:col-span-2">
                <Link href="/" className="inline-flex items-center gap-2.5">
                  <BrandMark size={36} />
                  <span className="font-display text-xl font-bold tracking-tight">PropIntel</span>
                </Link>
                <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/55">
                  Real estate investment intelligence for wholesalers, flippers, and rental investors.
                </p>
                <div className="mt-6 flex gap-3">
                  {['X', 'in', 'YT'].map((s) => (
                    <a
                      key={s}
                      href="#"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-xs font-bold text-white/70 transition hover:border-white/40 hover:text-white"
                    >
                      {s}
                    </a>
                  ))}
                </div>
              </div>

              <FooterCol
                title="Product"
                links={[
                  { label: 'Platform', href: '#platform' },
                  { label: 'Analyzer', href: '/login?redirect=/dashboard/analyzer' },
                  { label: 'CRM Pipeline', href: '/login?redirect=/dashboard/crm' },
                  { label: 'Pricing', href: '#pricing' },
                ]}
              />
              <FooterCol
                title="Use cases"
                links={[
                  { label: 'Wholesalers', href: '#investors' },
                  { label: 'Fix & Flip', href: '#investors' },
                  { label: 'Buy & Hold', href: '#investors' },
                  { label: 'Rentals', href: '#investors' },
                ]}
              />
              <FooterCol
                title="Company"
                links={[
                  { label: 'Sign in', href: '/login' },
                  { label: 'Coaching', href: '/login?redirect=/dashboard/coaching' },
                  { label: 'Contact', href: 'mailto:hello@propintel.com' },
                  { label: 'Create account', href: '/login?tab=register' },
                ]}
              />
              <FooterCol
                title="Legal"
                links={[
                  { label: 'Privacy', href: '#' },
                  { label: 'Terms', href: '#' },
                  { label: 'Security', href: '#' },
                  { label: 'Cookies', href: '#' },
                ]}
              />
            </div>

            <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 text-sm text-white/45 md:flex-row md:items-center">
              <p>© {new Date().getFullYear()} PropIntel. All rights reserved.</p>
              <div className="flex flex-wrap gap-5">
                <Link href="/login" className="transition hover:text-white">
                  Sign in
                </Link>
                <Link href="/login?tab=register" className="transition hover:text-white">
                  Start free
                </Link>
                <a href="mailto:hello@propintel.com" className="transition hover:text-white">
                  hello@propintel.com
                </a>
              </div>
            </div>
          </div>
        </footer>
    </div>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-[0.16em] text-white/40">{title}</div>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <a href={l.href} className="text-sm text-white/70 transition hover:text-white">
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PriceCard({
  name,
  price,
  period,
  features,
  featured,
  delay = 0,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  featured?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.45 }}
      whileHover={{ y: -6 }}
      className={`relative flex flex-col rounded-[2rem] p-7 transition ${
        featured
          ? 'bg-[#3d5a4c] text-white shadow-[0_30px_80px_-40px_rgba(61,90,76,0.65)] ring-1 ring-[#3d5a4c]'
          : 'border border-[var(--border)] bg-[#f4f6f3] shadow-[var(--shadow-soft)]'
      }`}
    >
      {featured && (
        <span className="absolute -top-3 left-6 rounded-full bg-[#d6a88c] px-3 py-1 text-[10px] font-bold tracking-wide text-[#171c19]">
          MOST POPULAR
        </span>
      )}
      <div className={`text-sm font-semibold ${featured ? 'text-white/60' : 'text-[#3d5a4c]'}`}>{name}</div>
      <div className="mt-3 flex items-end gap-1">
        <span className="font-display text-5xl font-extrabold tracking-tight">{price}</span>
        <span className={`mb-2 text-sm ${featured ? 'text-white/50' : 'text-[#5f6d64]'}`}>{period}</span>
      </div>
      <ul className="mt-6 flex-1 space-y-3">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check className={`mt-0.5 h-4 w-4 shrink-0 ${featured ? 'text-[#9eb5a4]' : 'text-[#3d5a4c]'}`} />
            <span className={featured ? 'text-white/80' : 'text-[#5f6d64]'}>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/login?tab=register"
        className={`mt-8 inline-flex items-center justify-center rounded-full px-4 py-3.5 text-sm font-semibold transition ${
          featured
            ? 'bg-white text-[#171c19] hover:bg-[#eef2ee]'
            : 'bg-[#171c19] text-white hover:bg-[#2a332e]'
        }`}
      >
        {name === 'Free' ? 'Start free' : name === 'PRO' ? 'Start PRO trial' : 'Talk to sales'}
      </Link>
    </motion.div>
  );
}
