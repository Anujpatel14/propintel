'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ChevronDown,
  Check,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Mail,
  MessageCircle,
  BarChart3,
  TrendingUp,
  Sparkles,
  Activity,
} from 'lucide-react';
import AtmosphericHero from '@/components/ui/AtmosphericHero';
import HeroFloatingWidgets from '@/components/ui/HeroFloatingWidgets';
import { BrandMark } from '@/components/BrandLogo';
import HomeAuthRedirect from '@/components/HomeAuthRedirect';

const FAQS = [
  {
    tag: 'Underwriting',
    question: 'What calculations can I run with PropIntel?',
    answer:
      'Buy & Hold (cash flow, Cap Rate, cash-on-cash, DSCR), Fix & Flip (profit, ROI, holding costs, MAO), and long-term rental projections — all from one workspace.',
  },
  {
    tag: 'AI',
    question: 'How does the AI Deal Analyzer work?',
    answer:
      'It reads your underwriting outputs and returns strengths, risks, and a clear acquisition verdict — via our rules engine, or OpenAI when configured.',
  },
  {
    tag: 'Reports',
    question: 'Can I generate PDF reports?',
    answer:
      'Yes. Export a clean dossier with costs, loan assumptions, returns, and AI insights — print-ready in one click for partners or lenders.',
  },
  {
    tag: 'Billing',
    question: 'Is there a free trial?',
    answer:
      'Free includes 3 analyses. PRO unlocks AI, CRM, and unlimited reports with a 7-day trial — no long contract required.',
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
    preview: {
      badge: 'Wholesale desk',
      verdict: 'ASSIGN',
      verdictTone: 'good' as const,
      address: '1842 Maple Ave · Dallas, TX',
      stats: [
        { label: 'ARV', value: '$285k' },
        { label: 'Fee', value: '$12.5k' },
        { label: 'Spread', value: '14%' },
      ],
      signals: [
        { label: '70% rule MAO', value: '$198k', width: 78 },
        { label: 'Assignment fee', value: '$12.5k', width: 52 },
        { label: 'Buyer demand', value: 'High', width: 88 },
      ],
    },
  },
  {
    id: 'flip',
    label: 'Fix & Flip',
    sub: 'Profit & hold costs',
    copy: 'Model rehab, carrying costs, and sell-side fees before you write the offer.',
    metric: '18%',
    metricLabel: 'Sample flip yield',
    points: ['Holding cost model', 'Net profit & ROI', 'Sell-side fees'],
    preview: {
      badge: 'Flip underwrite',
      verdict: 'PROCEED',
      verdictTone: 'good' as const,
      address: '920 Oak Ridge · Austin, TX',
      stats: [
        { label: 'Profit', value: '$41k' },
        { label: 'Rehab', value: '$62k' },
        { label: 'Hold', value: '5 mo' },
      ],
      signals: [
        { label: 'Net profit', value: '$41.2k', width: 72 },
        { label: 'Holding costs', value: '$8.4k', width: 44 },
        { label: 'Sell-side fees', value: '6.2%', width: 61 },
      ],
    },
  },
  {
    id: 'hold',
    label: 'Buy & Hold',
    sub: 'Cash flow & DSCR',
    copy: 'See monthly cash flow, cap rate, and lender-ready DSCR in one underwrite.',
    metric: '7.2%',
    metricLabel: 'Sample cap rate',
    points: ['Monthly cash flow', 'Cash-on-cash return', 'Bank-ready DSCR'],
    preview: {
      badge: 'Hold underwrite',
      verdict: 'BUY',
      verdictTone: 'good' as const,
      address: '411 Harbor Ln · Tampa, FL',
      stats: [
        { label: 'Cash flow', value: '+$412' },
        { label: 'CoC', value: '9.1%' },
        { label: 'DSCR', value: '1.34' },
      ],
      signals: [
        { label: 'Monthly cash flow', value: '+$412', width: 74 },
        { label: 'Cash-on-cash', value: '9.1%', width: 58 },
        { label: 'Bank-ready DSCR', value: '1.34×', width: 86 },
      ],
    },
  },
  {
    id: 'rental',
    label: 'Rentals',
    sub: 'Long-term growth',
    copy: 'Project equity, rent growth, and annualized returns over a 5–30 year horizon.',
    metric: '10yr',
    metricLabel: 'Growth horizon',
    points: ['Rent growth curves', 'Equity projection', 'Annualized return'],
    preview: {
      badge: 'Rental projection',
      verdict: 'HOLD',
      verdictTone: 'warm' as const,
      address: '77 Cedar Ct · Raleigh, NC',
      stats: [
        { label: 'Yr 10 eq.', value: '$214k' },
        { label: 'Rent Δ', value: '+28%' },
        { label: 'IRR', value: '11.4%' },
      ],
      signals: [
        { label: 'Equity growth', value: '$214k', width: 82 },
        { label: 'Rent trajectory', value: '+2.8%/yr', width: 66 },
        { label: 'Annualized return', value: '11.4%', width: 74 },
      ],
    },
  },
];

const PROPERTIES = [
  {
    title: 'Villa Redwood',
    meta: 'Malibu, CA',
    tag: 'Under Offer',
    tagTone: 'warm' as const,
    price: '$4,800/mo',
    desc: 'Ocean-view hold with strong DSCR and low vacancy risk.',
    img: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=900&q=70',
    signals: [
      { label: 'DSCR', value: '1.41×' },
      { label: 'Cap', value: '5.8%' },
      { label: 'Vacancy', value: '3%' },
    ],
  },
  {
    title: 'Oak Ridge Residence',
    meta: 'Dallas, TX',
    tag: 'Buy & Hold',
    tagTone: 'cool' as const,
    price: 'Cap 7.2%',
    desc: 'Cash-flowing single-family with clean comps.',
    img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=70',
    signals: [
      { label: 'Cash flow', value: '+$412' },
      { label: 'CoC', value: '9.1%' },
      { label: 'DSCR', value: '1.34×' },
    ],
  },
  {
    title: 'Highland Avenue',
    meta: 'Austin, TX',
    tag: 'Fix & Flip',
    tagTone: 'mint' as const,
    price: 'ROI 18%',
    desc: 'Value-add flip with modeled rehab and hold costs.',
    img: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=70',
    signals: [
      { label: 'Profit', value: '$41k' },
      { label: 'Rehab', value: '$62k' },
      { label: 'Hold', value: '5 mo' },
    ],
  },
  {
    title: 'Cedar Hollow',
    meta: 'Plano, TX',
    tag: 'Rented',
    tagTone: 'mint' as const,
    price: '+$298 CF',
    desc: 'Stabilized rental with predictable annualized return.',
    img: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=70',
    signals: [
      { label: 'CF', value: '+$298' },
      { label: 'IRR', value: '11.2%' },
      { label: 'Occ.', value: '97%' },
    ],
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.35 },
};

const INSIGHT_TABS = [
  {
    id: 'market',
    n: '01',
    t: 'Market Analytics',
    hint: 'Comps, absorption, PPSF',
    icon: 'chart' as const,
    metric: 'MEDIAN SALE',
    value: '$412,800',
    delta: '+3.1%',
    deltaLabel: 'MoM comps',
    blurb: 'Neighborhood sale trends, absorption, and price-per-sqft so you underwrite against live market context.',
    bars: [38, 44, 41, 52, 48, 61, 58, 67, 63, 72, 70, 78],
    months: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
    stats: [
      { label: 'PPSF', value: '$218' },
      { label: 'DOM', value: '28d' },
      { label: 'Absorb.', value: '1.4×' },
    ],
  },
  {
    id: 'predictive',
    n: '02',
    t: 'Predictive Insights',
    hint: 'Forward cash-flow & appreciation',
    icon: 'trend' as const,
    metric: 'REVENUE',
    value: '$96,437',
    delta: '+12.4%',
    deltaLabel: 'vs last quarter',
    blurb: 'Forward cash-flow and appreciation signals that help you stress-test hold periods before you write the offer.',
    bars: [42, 58, 48, 72, 64, 88, 76, 94, 70, 82, 96, 85],
    months: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
    stats: [
      { label: 'NOI Δ', value: '+8.2%' },
      { label: 'Apprec.', value: '4.1%' },
      { label: 'Risk', value: 'Low' },
    ],
  },
  {
    id: 'actions',
    n: '03',
    t: 'Actionable Recommendations',
    hint: 'Buy, pass, or renegotiate',
    icon: 'spark' as const,
    metric: 'DEAL SCORE',
    value: '82 / 100',
    delta: 'BUY',
    deltaLabel: 'AI verdict',
    blurb: 'Clear next steps — renegotiate, pass, or proceed — with the risks and upside that matter for this address.',
    bars: [55, 62, 58, 70, 66, 74, 71, 80, 76, 84, 88, 82],
    months: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
    stats: [
      { label: 'Upside', value: 'High' },
      { label: 'Risks', value: '2' },
      { label: 'Action', value: 'Offer' },
    ],
  },
] as const;

export default function LandingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [tab, setTab] = useState(INVESTOR_TABS[2].id);
  const [dealIndex, setDealIndex] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [insightTab, setInsightTab] = useState<(typeof INSIGHT_TABS)[number]['id']>('predictive');
  const activeTab = INVESTOR_TABS.find((t) => t.id === tab) ?? INVESTOR_TABS[2];
  const activeInsight = INSIGHT_TABS.find((t) => t.id === insightTab) ?? INSIGHT_TABS[1];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const usecase = params.get('usecase');
    if (usecase && INVESTOR_TABS.some((t) => t.id === usecase)) {
      setTab(usecase);
    }
  }, []);

  const visibleDeals = [
    PROPERTIES[dealIndex % PROPERTIES.length],
    PROPERTIES[(dealIndex + 1) % PROPERTIES.length],
    PROPERTIES[(dealIndex + 2) % PROPERTIES.length],
  ];
  const mobileDeal = PROPERTIES[dealIndex % PROPERTIES.length];

  return (
    <div className="landing min-h-screen w-full overflow-x-hidden">
      <HomeAuthRedirect />
      {/* ─── FULL-WIDTH NAV — transparent over hero ─── */}
      <header className="absolute inset-x-0 top-0 z-40 w-full">
        <div className="flex w-full items-center justify-between gap-3 bg-transparent px-4 py-3 sm:px-6 sm:py-4 md:px-10 lg:px-14">
          <Link href="/" className="relative z-10 flex min-w-0 shrink-0 items-center gap-2">
            <BrandMark size={28} />
            <span className="font-display text-base font-bold tracking-tight text-white sm:text-lg md:text-xl">
              PropIntel
            </span>
          </Link>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-9 text-[14px] font-medium text-white/85 lg:flex">
            <a href="#platform" className="transition hover:text-white">
              Platform
            </a>
            <a href="#investors" className="transition hover:text-white">
              Use cases
            </a>
            <a href="#pricing" className="transition hover:text-white">
              Pricing
            </a>
            <a href="#faq" className="transition hover:text-white">
              FAQ
            </a>
          </nav>

          <div className="relative z-10 flex shrink-0 items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-lg border border-white/35 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20 sm:inline-flex sm:px-4 sm:py-2.5"
            >
              Login
            </Link>
            <Link
              href="/login?tab=register"
              className="inline-flex rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[#0b1220] transition hover:bg-[#e8eef8] sm:px-4 sm:py-2.5"
            >
              Sign up
            </Link>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/35 bg-white/10 text-white lg:hidden"
              aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((o) => !o)}
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileNavOpen && (
          <div className="border-t border-white/15 bg-[#0b1220]/92 px-4 py-4 backdrop-blur-md lg:hidden">
            <nav className="flex flex-col gap-1">
              {[
                { href: '#platform', label: 'Platform' },
                { href: '#investors', label: 'Use cases' },
                { href: '#pricing', label: 'Pricing' },
                { href: '#faq', label: 'FAQ' },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10"
                >
                  {item.label}
                </a>
              ))}
              <Link
                href="/login"
                onClick={() => setMobileNavOpen(false)}
                className="mt-2 rounded-lg border border-white/25 px-3 py-3 text-center text-sm font-semibold text-white sm:hidden"
              >
                Login
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* ─── HERO ─── */}
      <section className="relative w-full overflow-hidden">
        <div className="absolute inset-0">
          <AtmosphericHero />
        </div>

        <div className="relative z-10 mx-auto grid min-h-[100svh] max-w-6xl items-center gap-8 px-4 pb-10 pt-24 sm:px-6 sm:pb-16 sm:pt-28 md:px-8 lg:grid-cols-12 lg:gap-6 lg:pb-40 lg:pt-32">
          <div className="min-w-0 lg:col-span-6">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/30 bg-black/25 px-3 py-1.5 text-[10px] font-semibold tracking-wide text-white sm:text-[11px]">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#8ec0ff]" />
              <span className="truncate">Real estate investment intelligence</span>
            </div>

            <p className="landing-hero-title mt-4 font-display text-[clamp(2.35rem,11vw,5.25rem)] font-bold leading-[0.95] tracking-[-0.045em] text-[#9ec5ff] sm:mt-5">
              PropIntel
            </p>

            <h1 className="landing-hero-title mt-4 max-w-lg font-display text-[clamp(1.2rem,4.2vw,2rem)] font-semibold leading-[1.3] tracking-[-0.02em] text-white sm:mt-5">
              Underwrite every deal with{' '}
              <em className="landing-hero-accent font-serif text-[1.15em] font-normal italic">
                clarity
              </em>
            </h1>

            <p className="mt-3 max-w-md text-sm leading-relaxed text-white sm:mt-4 sm:text-[15px] md:text-base">
              Cash flow, flips, pipelines, and AI verdicts — before you leave the showing.
            </p>

            <div className="mt-6 flex w-full flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/login?tab=register"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-[#0b1220] transition hover:bg-[#e8eef8] sm:w-auto sm:px-7"
              >
                Start investing now <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#platform"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/50 bg-black/20 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-black/35 sm:w-auto"
              >
                See the platform
              </a>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3 border-t border-white/25 pt-5 sm:mt-10 sm:flex sm:flex-wrap sm:gap-6 sm:pt-6">
              {[
                { n: '3', l: 'Deal models' },
                { n: 'AI', l: 'Risk verdicts' },
                { n: '7d', l: 'PRO trial' },
              ].map((s) => (
                <div key={s.l} className="min-w-0">
                  <div className="font-display text-lg font-bold text-white sm:text-xl">{s.n}</div>
                  <div className="text-[10px] leading-snug text-white/75 sm:text-[11px]">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden min-w-0 lg:col-span-6 lg:block">
            <HeroFloatingWidgets />
          </div>
        </div>

        {/* Property strip — in-flow on mobile, floating on large screens */}
        <div className="relative z-20 px-4 pb-8 sm:px-6 lg:absolute lg:inset-x-0 lg:bottom-6 lg:px-8 lg:pb-0">
          <div className="mx-auto flex max-w-6xl gap-3 overflow-x-auto pb-1 scrollbar-none">
            {PROPERTIES.slice(0, 3).map((p) => (
              <a
                key={p.title}
                href="/login?tab=register"
                className="landing-glass lift-card group flex w-[min(85vw,280px)] shrink-0 items-center gap-3 rounded-2xl p-2.5 pr-4 sm:w-auto sm:min-w-[240px] sm:flex-1"
              >
                <div className="relative h-14 w-16 shrink-0 overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.img} alt="" className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-[#0b1220]">{p.title}</div>
                  <div className="truncate text-[11px] text-[#5b6578]">{p.meta}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-xs font-bold text-[#1d4ed8]">{p.price}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DATA INSIGHTS ─── */}
      <section className="relative overflow-hidden px-5 py-16 md:px-10 md:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_0%,rgba(29,78,216,0.1),transparent_50%),radial-gradient(ellipse_at_90%_40%,rgba(14,165,233,0.06),transparent_45%)]" />
        <div className="relative mx-auto max-w-6xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-lg bg-[#d1fae5] px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-[#047857]">
                  INVESTMENTS
                </span>
                <span className="rounded-lg bg-[#dbe7ff] px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-[#1d4ed8]">
                  EXCLUSIVE
                </span>
              </div>
              <motion.h2 {...fadeUp} className="mt-4 font-display text-3xl font-bold tracking-tight md:text-5xl">
                Data-driven property{' '}
                <span className="font-serif font-normal italic text-[#1d4ed8]">insights</span>.
              </motion.h2>
            </div>
            <motion.p {...fadeUp} className="max-w-sm text-sm leading-relaxed text-[#5b6578] md:text-base">
              Market analytics, predictive signals, and actionable recommendations — so every offer is
              grounded in numbers, not gut feel.
            </motion.p>
          </div>

          <div className="mt-12 grid items-stretch gap-5 lg:grid-cols-12">
            <motion.div
              {...fadeUp}
              className="flex flex-col justify-center gap-2.5 rounded-[1.75rem] border border-[var(--lp-border)] bg-white/90 p-4 shadow-[var(--lp-shadow)] backdrop-blur-sm lg:col-span-5 md:p-5"
            >
              {INSIGHT_TABS.map((item) => {
                const active = insightTab === item.id;
                const Icon =
                  item.icon === 'chart' ? BarChart3 : item.icon === 'trend' ? TrendingUp : Sparkles;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setInsightTab(item.id)}
                    className={`rounded-2xl px-4 py-4 text-left transition ${
                      active
                        ? 'bg-[#0b1220] text-white shadow-lg shadow-[#0b1220]/20'
                        : 'text-[#5b6578] hover:bg-[#f3f6fb]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                          active ? 'bg-[#1d4ed8] text-white' : 'bg-[#eef3fb] text-[#1d4ed8]'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span
                            className={`font-display text-xs font-bold ${
                              active ? 'text-[#9db7ff]' : 'text-[#94a3b8]'
                            }`}
                          >
                            {item.n}
                          </span>
                          <span className={`text-sm font-semibold sm:text-base ${active ? 'text-white' : 'text-[#0b1220]'}`}>
                            {item.t}
                          </span>
                        </span>
                        <span className={`mt-0.5 block text-xs ${active ? 'text-white/55' : 'text-[#94a3b8]'}`}>
                          {item.hint}
                        </span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </motion.div>

            <motion.div
              key={activeInsight.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28 }}
              className="relative overflow-hidden rounded-[1.75rem] border border-[#c7d7f5] bg-gradient-to-br from-[#e8f0ff] via-[#f4f7ff] to-[#dbe7ff] p-5 lg:col-span-7 md:p-7"
            >
              <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#93c5fd]/35 blur-3xl" />
              <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(29,78,216,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(29,78,216,0.35)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_70%_30%,black,transparent_70%)]" />

              <div className="relative flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5b6578]">
                      {activeInsight.metric}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-[#1d4ed8]">
                      <Activity className="h-3 w-3" />
                      Live feed
                    </span>
                  </div>
                  <div className="mt-2 font-display text-4xl font-extrabold tracking-tight text-[#0b1220] md:text-5xl">
                    {activeInsight.value}
                  </div>
                  <p className="mt-2 max-w-md text-xs leading-relaxed text-[#5b6578] sm:text-sm">
                    {activeInsight.blurb}
                  </p>
                </div>
                <div className="shrink-0 rounded-xl border border-white/70 bg-white/85 px-3 py-2 text-right shadow-sm">
                  <div className="text-sm font-bold text-[#047857]">{activeInsight.delta}</div>
                  <div className="text-[10px] text-[#5b6578]">{activeInsight.deltaLabel}</div>
                </div>
              </div>

              <div className="relative mt-5 grid grid-cols-3 gap-2">
                {activeInsight.stats.map((stat) => (
                  <div
                    key={`${activeInsight.id}-${stat.label}`}
                    className="rounded-xl border border-white/60 bg-white/70 px-3 py-2.5 backdrop-blur-sm"
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-[#94a3b8]">
                      {stat.label}
                    </div>
                    <div className="mt-0.5 font-display text-sm font-bold text-[#0b1220]">{stat.value}</div>
                  </div>
                ))}
              </div>

              <div className="relative mt-6">
                <div className="flex h-36 items-end gap-1.5 sm:h-40 sm:gap-2 md:h-44">
                  {activeInsight.bars.map((h, i) => (
                    <motion.div
                      key={`${activeInsight.id}-bar-${i}`}
                      initial={{ height: 8 }}
                      animate={{ height: `${h}%` }}
                      transition={{ duration: 0.45, delay: i * 0.03, ease: 'easeOut' }}
                      className={`flex-1 rounded-t-md bg-gradient-to-t from-[#1238b0] to-[#3b82f6] ${
                        i >= 8 ? 'hidden sm:block' : ''
                      }`}
                    />
                  ))}
                </div>
                <div className="mt-2 flex justify-between px-0.5 text-[9px] font-medium text-[#94a3b8]">
                  {activeInsight.months.map((m, i) => (
                    <span key={`${activeInsight.id}-m-${i}`} className={i >= 8 ? 'hidden sm:inline' : ''}>
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── PLATFORM BENTO ─── */}
      <section id="platform" className="relative overflow-hidden px-4 py-14 sm:px-5 sm:py-16 md:px-10 md:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(29,78,216,0.07),transparent_55%)]" />
        <div className="relative mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-lg bg-[#1d4ed8] px-3 py-1 text-[10px] font-bold tracking-[0.16em] text-white">
            PORTFOLIO TOOLS
          </span>
          <motion.h2 {...fadeUp} className="mt-5 font-display text-3xl font-bold tracking-tight md:text-5xl">
            Omni-channel, any task,{' '}
            <span className="font-serif font-normal italic text-[#1d4ed8]">multi-model</span>
          </motion.h2>
          <p className="mx-auto mt-4 max-w-xl text-[#5b6578]">
            One workspace for underwriting, pipelines, and reports — designed like a product, not a
            spreadsheet.
          </p>
        </div>

        <div className="relative mx-auto mt-14 grid max-w-6xl gap-4 md:grid-cols-12 md:grid-rows-[auto_auto]">
          {/* Unified dashboard */}
          <motion.div
            {...fadeUp}
            className="overflow-hidden rounded-[1.75rem] border border-[var(--lp-border)] bg-white p-5 shadow-[var(--lp-shadow)] md:col-span-4 md:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-xl font-bold tracking-tight">Unified dashboard.</h3>
                <p className="mt-1.5 text-sm text-[#5b6578]">Live cash-flow and deal health at a glance.</p>
              </div>
              <span className="rounded-lg bg-[#d1fae5] px-2 py-1 text-[10px] font-bold text-[#047857]">+8.4%</span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                { l: 'Cash flow', v: '$18.2k' },
                { l: 'Avg CoC', v: '9.4%' },
                { l: 'Active', v: '24' },
              ].map((k) => (
                <div key={k.l} className="rounded-xl bg-[#f3f6fb] px-2.5 py-2">
                  <div className="text-[9px] font-semibold uppercase tracking-wide text-[#94a3b8]">{k.l}</div>
                  <div className="mt-0.5 font-display text-sm font-bold text-[#0b1220]">{k.v}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 h-32">
              <svg viewBox="0 0 280 120" className="h-full w-full">
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,90 C40,80 60,50 100,55 C140,60 160,30 200,35 C240,40 260,20 280,25 L280,120 L0,120 Z"
                  fill="url(#areaGrad)"
                />
                <path
                  d="M0,90 C40,80 60,50 100,55 C140,60 160,30 200,35 C240,40 260,20 280,25"
                  fill="none"
                  stroke="#1d4ed8"
                  strokeWidth="2.5"
                />
                <circle cx="200" cy="35" r="4" fill="#1d4ed8" />
                <circle cx="200" cy="35" r="7" fill="#1d4ed8" fillOpacity="0.2" />
              </svg>
            </div>
          </motion.div>

          {/* Collaborative / AI chat */}
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.08 }}
            className="relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-[1.75rem] bg-[#0b1220] p-5 text-white md:col-span-4 md:p-6"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(29,78,216,0.35),transparent_45%)]" />
            <div className="pointer-events-none absolute -right-10 top-8 h-40 w-40 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -right-4 top-16 h-28 w-28 rounded-full border border-[#1d4ed8]/40" />
            <div className="relative">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-[#93c5fd]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Analyzer online
              </div>
              <h3 className="font-display text-xl font-bold tracking-tight">Collaborative AI.</h3>
              <p className="mt-1.5 text-sm text-white/60">Deal verdicts that speak investor language.</p>
            </div>
            <div className="relative mt-8 space-y-2.5">
              {[
                { text: 'Analyzing Oak Ridge Dr…', tone: 'muted' },
                { text: 'Cash flow +$312/mo · Cap 7.2%', tone: 'muted' },
                { text: 'Verdict: Strong buy', tone: 'accent' },
              ].map((line, i) => (
                <motion.div
                  key={line.text}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.12 }}
                  className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-snug ${
                    line.tone === 'accent'
                      ? 'bg-[#1d4ed8] text-white shadow-lg shadow-[#1d4ed8]/30'
                      : 'border border-white/10 bg-white/10 text-white/90 backdrop-blur-sm'
                  }`}
                >
                  {line.text}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Tall aerial card */}
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.12 }}
            className="group relative min-h-[340px] overflow-hidden rounded-[1.75rem] md:col-span-4 md:row-span-2 md:min-h-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1000&q=70"
              alt="Luxury housing development aerial"
              className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/35 to-[#0b1220]/25" />
            <div className="absolute left-5 top-5 rounded-xl border border-white/15 bg-black/30 px-3 py-2 backdrop-blur-md">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-white/55">Sample underwrite</div>
              <div className="mt-0.5 text-sm font-bold text-white">DSCR 1.38×</div>
            </div>
            <div className="absolute inset-x-0 bottom-0 p-6 text-white">
              <h3 className="font-display text-2xl font-bold leading-tight tracking-tight">
                Smart homes.
                <br />
                Smarter investments.
              </h3>
              <p className="mt-2 max-w-xs text-xs text-white/65">
                Pull comps, model cash flow, and export a lender-ready dossier from one asset view.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { l: 'Ask', v: '$959k' },
                  { l: 'ARV', v: '$1.2M' },
                  { l: 'Cap', v: '6.8%' },
                ].map((chip) => (
                  <div
                    key={chip.l}
                    className="rounded-xl border border-white/15 bg-white/10 px-2.5 py-2 backdrop-blur-md"
                  >
                    <div className="text-[9px] font-semibold uppercase tracking-wide text-white/50">{chip.l}</div>
                    <div className="text-sm font-bold">{chip.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Wide performance card */}
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.16 }}
            className="relative overflow-hidden rounded-[1.75rem] border border-[#c7d7f5] bg-gradient-to-br from-[#dbe7ff] via-[#eef4ff] to-[#cfe0ff] p-6 md:col-span-8 md:p-8"
          >
            <div className="pointer-events-none absolute -right-10 top-0 h-48 w-48 rounded-full bg-white/50 blur-2xl" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="max-w-md font-display text-2xl font-bold tracking-tight text-[#0b1220] md:text-3xl">
                  From single assets to a rental empire.
                </h3>
                <p className="mt-2 max-w-sm text-sm text-[#0b1220]/65">
                  Track performance across every property with live progress signals.
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-right">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-[#5b6578]">Portfolio score</div>
                <div className="font-display text-xl font-bold text-[#1d4ed8]">A−</div>
              </div>
            </div>
            <div className="relative mt-8 grid gap-3 sm:grid-cols-2">
              {[
                { label: 'Portfolio occupancy', value: 74, color: 'bg-[#10b981]', note: 'Stabilized' },
                { label: 'Underwriting complete', value: 88, color: 'bg-[#1d4ed8]', note: 'This week' },
                { label: 'Pipeline velocity', value: 62, color: 'bg-[#0b1220]', note: 'Deals / 30d' },
                { label: 'Report exports', value: 91, color: 'bg-[#0ea5e9]', note: 'Shared' },
              ].map((bar) => (
                <div key={bar.label} className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-[#0b1220]">{bar.label}</div>
                      <div className="mt-0.5 text-[10px] text-[#5b6578]">{bar.note}</div>
                    </div>
                    <span className="font-display text-lg font-bold text-[#0b1220]">{bar.value}%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e8eef8]">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${bar.value}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                      className={`h-full rounded-full ${bar.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── USE CASES ─── */}
      <section id="investors" className="relative overflow-hidden border-y border-[var(--lp-border)] bg-white py-20 md:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(29,78,216,0.07),transparent_55%)]" />
        <div className="relative mx-auto max-w-7xl px-5 md:px-10">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1d4ed8]">Use cases</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-5xl">
              Built for how you{' '}
              <span className="font-serif font-normal italic text-[#1d4ed8]">invest</span>
            </h2>
            <p className="mt-3 text-[#5b6578]">
              Switch models instantly — the same workspace adapts to wholesale, flips, hold, and rentals.
            </p>
          </div>

          <div className="mt-10 flex flex-nowrap gap-2 overflow-x-auto pb-1 scrollbar-none">
            {INVESTOR_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:px-5 ${
                  tab === t.id
                    ? 'bg-[#1d4ed8] text-white shadow-lg shadow-[#1d4ed8]/25'
                    : 'bg-[#f3f6fb] text-[#5b6578] hover:bg-[#e8eef8] hover:text-[#0b1220]'
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
              <div className="flex min-w-0 flex-col justify-between rounded-[1.75rem] border border-[var(--lp-border)] bg-[#f3f6fb] p-5 sm:p-8 lg:col-span-5 md:p-10">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#1d4ed8]">
                    {activeTab.sub}
                  </div>
                  <p className="mt-4 text-lg font-light leading-relaxed text-[#0b1220] sm:text-xl md:text-2xl">
                    {activeTab.copy}
                  </p>
                  <ul className="mt-8 space-y-3">
                    {activeTab.points.map((p, i) => (
                      <motion.li
                        key={p}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.06 }}
                        className="flex items-center gap-3 text-sm font-medium text-[#5b6578]"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#dbe7ff] text-[#1d4ed8]">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        {p}
                      </motion.li>
                    ))}
                  </ul>
                </div>
                <Link
                  href="/dashboard/analyze"
                  className="btn-ink-lp mt-10 inline-flex w-full items-center justify-center gap-2 px-6 py-3.5 text-sm sm:w-fit"
                >
                  Try this model <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="relative min-w-0 overflow-hidden rounded-[1.75rem] bg-[#1238b0] p-5 text-white sm:p-7 lg:col-span-7 md:p-9">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,#1d4ed8_0%,#1238b0_48%,#0b2a7a_100%)]" />
                <div className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(255,255,255,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.45)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_78%)]" />
                <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#93c5fd]/25 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-[#0ea5e9]/20 blur-3xl" />

                <div className="relative flex h-full flex-col gap-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-white/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/85">
                        {activeTab.preview.badge}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-400/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-100">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                        Live signal
                      </span>
                    </div>
                    <span
                      className={`rounded-lg px-2.5 py-1 text-[10px] font-bold tracking-wide ${
                        activeTab.preview.verdictTone === 'good'
                          ? 'bg-white text-[#1238b0]'
                          : 'bg-amber-300/90 text-[#0b1220]'
                      }`}
                    >
                      {activeTab.preview.verdict}
                    </span>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
                    <div className="min-w-0">
                      <p className="truncate text-xs text-white/55">{activeTab.preview.address}</p>
                      <motion.div
                        key={activeTab.metric}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-2 font-display text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl"
                      >
                        {activeTab.metric}
                      </motion.div>
                      <div className="mt-1.5 text-sm text-white/70">{activeTab.metricLabel}</div>

                      <div className="mt-6 grid grid-cols-3 gap-2">
                        {activeTab.preview.stats.map((stat, i) => (
                          <motion.div
                            key={`${activeTab.id}-${stat.label}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.08 + i * 0.05 }}
                            className="rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 backdrop-blur-sm"
                          >
                            <div className="text-[10px] font-medium uppercase tracking-wide text-white/50">
                              {stat.label}
                            </div>
                            <div className="mt-1 font-display text-sm font-bold sm:text-base">{stat.value}</div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/12 bg-black/15 p-4 backdrop-blur-sm sm:p-5">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
                          Signal stack
                        </p>
                        <p className="text-[10px] text-white/45">Underwrite preview</p>
                      </div>
                      <div className="space-y-4">
                        {activeTab.preview.signals.map((signal, i) => (
                          <div key={`${activeTab.id}-${signal.label}`}>
                            <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                              <span className="truncate text-white/70">{signal.label}</span>
                              <span className="shrink-0 font-semibold text-white">{signal.value}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/15">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${signal.width}%` }}
                                transition={{ duration: 0.55, delay: 0.12 + i * 0.08, ease: 'easeOut' }}
                                className="h-full rounded-full bg-gradient-to-r from-white/75 to-white"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-5 flex items-end justify-between gap-3 border-t border-white/10 pt-4">
                        <div className="flex h-10 items-end gap-1">
                          {[36, 52, 44, 68, 58, 76, 64, 88, 72, 84].map((h, i) => (
                            <motion.div
                              key={`${activeTab.id}-spark-${i}`}
                              initial={{ height: 6 }}
                              animate={{ height: (h / 100) * 40 }}
                              transition={{ duration: 0.4, delay: 0.2 + i * 0.03 }}
                              className="w-1.5 rounded-sm bg-white/55 sm:w-2"
                            />
                          ))}
                        </div>
                        <p className="max-w-[9rem] text-right text-[10px] leading-snug text-white/50">
                          Live underwriting signal preview
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ─── FEATURED PROPERTIES ─── */}
      <section className="relative overflow-hidden px-5 py-20 md:px-10 md:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(29,78,216,0.09),transparent_50%),radial-gradient(ellipse_at_90%_80%,rgba(14,165,233,0.06),transparent_45%)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1d4ed8]">Deal desk</p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-5xl">
                Featured{' '}
                <span className="font-serif font-normal italic text-[#1d4ed8]">investment properties</span>
              </h2>
              <p className="mt-3 text-[#5b6578]">
                Sample deals underwritten with PropIntel — hover a card to read the signal stack behind each asset.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Previous properties"
                onClick={() => setDealIndex((d) => (d - 1 + PROPERTIES.length) % PROPERTIES.length)}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--lp-border)] bg-white text-[#0b1220] shadow-[var(--lp-shadow)] transition hover:border-[#1d4ed8] hover:text-[#1d4ed8]"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-1.5 px-1">
                {PROPERTIES.map((_, i) => (
                  <button
                    key={`dot-${i}`}
                    type="button"
                    aria-label={`Show property set ${i + 1}`}
                    onClick={() => setDealIndex(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      dealIndex % PROPERTIES.length === i
                        ? 'w-6 bg-[#1d4ed8]'
                        : 'w-1.5 bg-[#c7d2e5] hover:bg-[#94a3b8]'
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                aria-label="Next properties"
                onClick={() => setDealIndex((d) => (d + 1) % PROPERTIES.length)}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--lp-border)] bg-white text-[#0b1220] shadow-[var(--lp-shadow)] transition hover:border-[#1d4ed8] hover:text-[#1d4ed8]"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <FeaturedDealCard deal={mobileDeal} className="md:hidden" />
            {visibleDeals.map((p, i) => (
              <FeaturedDealCard
                key={`${p.title}-${dealIndex}-${i}`}
                deal={p}
                className="hidden md:flex"
                delay={i * 0.06}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="relative overflow-hidden bg-[#070b14] py-14 text-white md:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(29,78,216,0.35),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(14,165,233,0.12),transparent_40%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.55)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.55)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" />

        <div className="relative mx-auto max-w-6xl px-5 md:px-10">
          <div className="flex flex-col items-start justify-between gap-5 lg:flex-row lg:items-end">
            <div className="max-w-lg">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#93c5fd]">Pricing</p>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight md:text-4xl">
                Plans that scale with{' '}
                <span className="font-serif font-normal italic text-[#93c5fd]">your deal flow</span>
              </h2>
              <p className="mt-2 text-sm text-white/55">
                Start free. Unlock AI verdicts, CRM, and unlimited underwrites when the volume shows up.
              </p>
            </div>
            <div className="relative flex rounded-xl border border-white/10 bg-white/5 p-1 backdrop-blur-sm">
              <button
                onClick={() => setIsAnnual(false)}
                className={`relative z-10 rounded-lg px-4 py-2 text-sm font-semibold ${
                  !isAnnual ? 'text-white' : 'text-white/50'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`relative z-10 rounded-lg px-4 py-2 text-sm font-semibold ${
                  isAnnual ? 'text-white' : 'text-white/50'
                }`}
              >
                Annual <span className="ml-1 text-[10px] text-emerald-300">−20%</span>
              </button>
              <motion.div
                className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-[#1d4ed8]"
                animate={{ left: isAnnual ? 'calc(50% + 2px)' : '4px' }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              />
            </div>
          </div>

          <div className="mt-8 grid items-stretch gap-4 lg:grid-cols-3">
            <PriceCard
              name="Free"
              blurb="Test the underwrite loop on a handful of deals."
              price="$0"
              period="forever"
              features={['3 analyses / month', 'Basic calculators', 'Property lookup', 'Email support']}
              highlight="Great for first runs"
              delay={0}
            />
            <PriceCard
              name="PRO"
              blurb="Full workspace for active investors who need speed and signal."
              price={isAnnual ? '$39' : '$49'}
              period={isAnnual ? '/mo billed yearly' : '/month'}
              featured
              features={[
                'Unlimited analyses',
                'AI deal verdicts',
                'CRM pipeline',
                'PDF investor reports',
                '7-day free trial',
              ]}
              highlight="Most teams start here"
              delay={0.08}
            />
            <PriceCard
              name="Enterprise"
              blurb="Shared desks, coaching priority, and custom limits for operators."
              price={isAnnual ? '$79' : '$99'}
              period={isAnnual ? '/mo billed yearly' : '/month'}
              features={[
                'Everything in PRO',
                'Team seats',
                'Priority coaching',
                'Admin controls',
                'Custom analysis limits',
              ]}
              highlight="Built for operators"
              delay={0.16}
            />
          </div>

          <p className="mt-5 text-center text-[11px] text-white/40">
            No long contracts on PRO · Cancel anytime · Upgrade mid-cycle when deal volume jumps
          </p>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="relative overflow-hidden border-t border-[var(--lp-border)] py-20 md:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_0%_0%,rgba(29,78,216,0.08),transparent_45%),radial-gradient(ellipse_at_100%_60%,rgba(14,165,233,0.05),transparent_40%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 md:px-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1d4ed8]">FAQ</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-5xl">
              Answers before you{' '}
              <span className="font-serif font-normal italic text-[#1d4ed8]">underwrite</span>
            </h2>
            <p className="mt-4 text-[#5b6578]">
              Quick clarity on models, AI, reports, and billing — so you can get back to the deal.
            </p>

            <div className="mt-8 space-y-3">
              <a
                href="mailto:hello@propintel.com"
                className="group flex items-start gap-3 rounded-2xl border border-[var(--lp-border)] bg-white p-4 shadow-[var(--lp-shadow)] transition hover:border-[#1d4ed8]/30"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#dbe7ff] text-[#1d4ed8]">
                  <Mail className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[#0b1220]">Email support</span>
                  <span className="mt-0.5 block truncate text-xs text-[#5b6578] group-hover:text-[#1d4ed8]">
                    hello@propintel.com
                  </span>
                </span>
              </a>
              <Link
                href="/login?redirect=/dashboard/coaching"
                className="group flex items-start gap-3 rounded-2xl border border-[var(--lp-border)] bg-[#0b1220] p-4 text-white transition hover:bg-[#152036]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#93c5fd]">
                  <MessageCircle className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">Talk to a coach</span>
                  <span className="mt-0.5 block text-xs text-white/55">
                    Book a session inside the investor portal
                  </span>
                </span>
              </Link>
            </div>
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
                  className={`relative overflow-hidden rounded-[1.35rem] border transition ${
                    open
                      ? 'border-[#1d4ed8]/30 bg-white shadow-[0_24px_60px_-40px_rgba(29,78,216,0.45)]'
                      : 'border-[var(--lp-border)] bg-white/80 hover:border-[#1d4ed8]/20 hover:bg-white'
                  }`}
                >
                  {open && (
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-[#1d4ed8]" />
                  )}
                  <button
                    onClick={() => setActiveFaq(open ? null : i)}
                    className="flex w-full items-start gap-3 px-4 py-4 text-left sm:gap-4 sm:px-5 sm:py-5 md:px-6"
                  >
                    <span
                      className={`mt-0.5 hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl font-display text-xs font-bold sm:flex ${
                        open ? 'bg-[#1d4ed8] text-white' : 'bg-[#eef3fb] text-[#1d4ed8]'
                      }`}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`mb-1.5 inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          open ? 'bg-[#dbe7ff] text-[#1d4ed8]' : 'bg-[#f3f6fb] text-[#5b6578]'
                        }`}
                      >
                        {faq.tag}
                      </span>
                      <span className="block font-semibold text-[#0b1220] md:text-lg">{faq.question}</span>
                    </span>
                    <motion.span
                      animate={{ rotate: open ? 180 : 0 }}
                      className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
                        open ? 'bg-[#1d4ed8] text-white' : 'bg-[#dbe7ff] text-[#1d4ed8]'
                      }`}
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
                        <div className="px-4 pb-5 sm:px-5 sm:pb-6 md:pl-[4.75rem] md:pr-6">
                          <div className="rounded-xl border border-[#dbe7ff] bg-[#f5f8ff] px-4 py-3.5">
                            <p className="text-sm leading-relaxed text-[#3b4659] md:text-base">{faq.answer}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="relative overflow-hidden bg-[#0b1220] py-24 md:py-32">
        <div className="pointer-events-none absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=70"
            alt=""
            className="h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b1220] via-[#0b1220]/85 to-[#0b1220]/55" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(29,78,216,0.35),transparent_55%)]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 text-center md:px-10">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-6xl"
          >
            Your next deal deserves better{' '}
            <span className="font-serif font-normal italic text-[#9db7ff]">numbers</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mx-auto mt-5 max-w-lg text-lg text-white/70"
          >
            Create a workspace in minutes. Underwrite with confidence — cash flow, flips, and AI
            verdicts in one place.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-10 flex w-full flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center"
          >
            <Link
              href="/login?tab=register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-[#0b1220] transition hover:bg-[#dbe7ff]"
            >
              Create your workspace <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Sign in
            </Link>
          </motion.div>

          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-3 border-t border-white/15 pt-8 sm:mt-16 sm:gap-6 sm:pt-10">
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
                className="min-w-0"
              >
                <div className="font-display text-xl font-bold text-white sm:text-2xl md:text-3xl">{s.n}</div>
                <div className="mt-1 text-[10px] leading-snug text-white/55 sm:text-xs md:text-sm">{s.l}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/10 bg-[#070b14] text-white">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-10">
          <div className="grid grid-cols-2 gap-8 sm:gap-12 md:grid-cols-2 lg:grid-cols-6">
            <div className="col-span-2 lg:col-span-2">
              <Link href="/" className="inline-flex items-center gap-2.5">
                <BrandMark size={36} />
                <span className="font-display text-xl font-bold tracking-tight">PropIntel</span>
              </Link>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/55">
                From property search to portfolio growth — real estate investment intelligence.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="mailto:hello@propintel.com"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3.5 py-2 text-xs font-semibold text-white/70 transition hover:border-white/40 hover:text-white"
                >
                  <Mail className="h-3.5 w-3.5" />
                  hello@propintel.com
                </a>
                <Link
                  href="/login?tab=register"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3.5 py-2 text-xs font-semibold text-white/70 transition hover:border-white/40 hover:text-white"
                >
                  Start free
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            <FooterCol
              title="Product"
              links={[
                { label: 'Platform', href: '/#platform' },
                { label: 'Analyze', href: '/login?redirect=/dashboard/analyze' },
                { label: 'CRM Pipeline', href: '/login?redirect=/dashboard/crm' },
                { label: 'Pricing', href: '/#pricing' },
                { label: 'FAQ', href: '/#faq' },
              ]}
            />
            <FooterCol
              title="Use cases"
              links={[
                { label: 'Wholesalers', href: '/?usecase=wholesale#investors' },
                { label: 'Fix & Flip', href: '/?usecase=flip#investors' },
                { label: 'Buy & Hold', href: '/?usecase=hold#investors' },
                { label: 'Rentals', href: '/?usecase=rental#investors' },
              ]}
            />
            <FooterCol
              title="Company"
              links={[
                { label: 'Sign in', href: '/login' },
                { label: 'Coaching', href: '/login?redirect=/dashboard/coaching' },
                { label: 'Help center', href: '/login?redirect=/dashboard/help' },
                { label: 'Contact', href: 'mailto:hello@propintel.com' },
                { label: 'Create account', href: '/login?tab=register' },
              ]}
            />
            <FooterCol
              title="Legal"
              links={[
                { label: 'Privacy', href: '/privacy' },
                { label: 'Terms', href: '/terms' },
                { label: 'Security', href: '/security' },
                { label: 'Cookies', href: '/cookies' },
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
              <Link href="/privacy" className="transition hover:text-white">
                Privacy
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
        {links.map((l) => {
          const external = l.href.startsWith('mailto:') || l.href.startsWith('http');
          if (external) {
            return (
              <li key={l.label}>
                <a href={l.href} className="text-sm text-white/70 transition hover:text-white">
                  {l.label}
                </a>
              </li>
            );
          }
          return (
            <li key={l.label}>
              <Link href={l.href} className="text-sm text-white/70 transition hover:text-white">
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FeaturedDealCard({
  deal,
  className = '',
  delay = 0,
}: {
  deal: (typeof PROPERTIES)[number];
  className?: string;
  delay?: number;
}) {
  const tagClass =
    deal.tagTone === 'warm'
      ? 'bg-[#ffedd5] text-[#c2410c]'
      : deal.tagTone === 'mint'
        ? 'bg-[#d1fae5] text-[#047857]'
        : 'bg-[#dbe7ff] text-[#1d4ed8]';

  return (
    <motion.a
      href="/login?tab=register"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.35 }}
      className={`group relative flex min-h-[28rem] flex-col overflow-hidden rounded-[1.75rem] border border-[var(--lp-border)] bg-[#0b1220] shadow-[var(--lp-shadow)] ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={deal.img}
        alt={deal.title}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/55 to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(29,78,216,0.25),transparent_45%)] opacity-70" />

      <div className="relative z-10 flex h-full flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <span className={`rounded-lg px-3 py-1 text-[10px] font-bold tracking-wide ${tagClass}`}>
            {deal.tag}
          </span>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur-sm transition group-hover:bg-[#1d4ed8]">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>

        <div className="mt-auto">
          <div className="font-display text-2xl font-bold tracking-tight text-white">{deal.title}</div>
          <div className="mt-1 text-sm text-white/65">{deal.meta}</div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/70">{deal.desc}</p>

          <div className="mt-5 grid grid-cols-3 gap-2 opacity-0 translate-y-2 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 max-md:translate-y-0 max-md:opacity-100">
            {deal.signals.map((s) => (
              <div
                key={`${deal.title}-${s.label}`}
                className="rounded-xl border border-white/10 bg-white/10 px-2.5 py-2 backdrop-blur-sm"
              >
                <div className="text-[9px] font-semibold uppercase tracking-wide text-white/50">{s.label}</div>
                <div className="mt-0.5 text-sm font-bold text-white">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-white/15 pt-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Key signal</div>
              <div className="font-display text-xl font-bold text-white">{deal.price}</div>
            </div>
            <span className="text-xs font-semibold text-[#93c5fd]">Underwrite →</span>
          </div>
        </div>
      </div>
    </motion.a>
  );
}

function PriceCard({
  name,
  blurb,
  price,
  period,
  features,
  featured,
  highlight,
  delay = 0,
}: {
  name: string;
  blurb: string;
  price: string;
  period: string;
  features: string[];
  featured?: boolean;
  highlight: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.35 }}
      className={`relative flex flex-col overflow-hidden rounded-[1.35rem] p-5 ${
        featured
          ? 'bg-[#1d4ed8] text-white shadow-[0_30px_70px_-45px_rgba(29,78,216,0.9)]'
          : 'border border-white/10 bg-white/[0.04] text-white backdrop-blur-sm'
      }`}
    >
      {featured && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,#3b82f6_0%,#1d4ed8_45%,#1238b0_100%)]" />
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.1] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:20px_20px]" />
        </>
      )}

      <div className="relative flex h-full flex-col">
        <div className="flex items-center justify-between gap-2">
          <div className={`text-sm font-semibold ${featured ? 'text-white/80' : 'text-[#93c5fd]'}`}>{name}</div>
          <span
            className={`rounded-md px-2 py-0.5 text-[9px] font-bold tracking-wide ${
              featured ? 'bg-[#0b1220] text-white' : 'bg-white/10 text-white/70'
            }`}
          >
            {featured ? 'MOST POPULAR' : highlight}
          </span>
        </div>

        <div className="mt-3 flex items-end gap-1">
          <span className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">{price}</span>
          <span className={`mb-1 text-xs ${featured ? 'text-white/60' : 'text-white/45'}`}>{period}</span>
        </div>
        <p className={`mt-2 text-xs leading-relaxed ${featured ? 'text-white/75' : 'text-white/50'}`}>{blurb}</p>

        {featured && (
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {['Unlimited', 'AI', 'CRM'].map((chip) => (
              <div
                key={chip}
                className="rounded-lg border border-white/15 bg-white/10 px-1.5 py-1.5 text-center text-[9px] font-bold uppercase tracking-wide text-white/85"
              >
                {chip}
              </div>
            ))}
          </div>
        )}

        <ul className="mt-4 flex-1 space-y-2">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-xs sm:text-sm">
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded ${
                  featured ? 'bg-white/15 text-[#dbe7ff]' : 'bg-[#1d4ed8]/25 text-[#93c5fd]'
                }`}
              >
                <Check className="h-2.5 w-2.5" />
              </span>
              <span className={featured ? 'text-white/90' : 'text-white/70'}>{f}</span>
            </li>
          ))}
        </ul>

        <Link
          href="/login?tab=register"
          className={`mt-5 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            featured
              ? 'bg-white text-[#0b1220] hover:bg-[#dbe7ff]'
              : 'bg-white/10 text-white hover:bg-white/15'
          }`}
        >
          {name === 'Free' ? 'Start free' : name === 'PRO' ? 'Start PRO trial' : 'Talk to sales'}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </motion.div>
  );
}
