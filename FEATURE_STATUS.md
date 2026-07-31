# PropIntel — Feature Verification & Build Status

**Generated:** 2026-08-01  
**Sources checked against codebase:**
1. `cursor_task_handover.md`
2. `expanded_platform_features_blueprint.md`
3. `CHATGPT_SUGGESTIONS.md`

---

## Executive verdict

| Source | Status |
|--------|--------|
| **Handover (wire UI → server actions)** | **Done** — analyzer, CRM, deals, coaching, billing, admin metrics, AI/PDF/lookup are wired to Neon |
| **Expansion blueprint (Phase 6 roadmap)** | **Mostly done** — models + investor settings/compare/billing orders + admin modules exist; a few polish gaps remain |
| **ChatGPT suggestions (full SaaS IA)** | **Partial** — core MVP modules exist; large “premium SaaS” layer (Properties hub, Reports library, notifications, Cmd+K, onboarding, etc.) is still open |

---

## 1. `cursor_task_handover.md` — verification

### Backend (Part 1) — complete
- Neon + Prisma models, Clerk + sandbox auth, seed accounts, server actions layer — present and used.

### Wiring tasks (Part 2)

| Task | Status | Notes |
|------|--------|-------|
| T1 Analyzer → `savePropertyAnalysis` / `saveFlipAnalysis` | ✅ Done | Save deal persists to Neon |
| T1 Saved Analyses tab on analyzer | ⚠️ Partial | Saved list lives on `/dashboard/deals`, not a tab inside analyzer |
| T2 CRM → create / stage / delete | ✅ Done | Live Kanban against `DealPipeline` |
| T2 CRM notes UI (`addDealNotes`) | ⚠️ Partial | Action exists; dedicated notes editor UX is thin |
| T3 Deals page → `getUserAnalyses` | ✅ Done | Search + delete wired |
| T3 Deals also pull CRM `getUserDeals` | ⚠️ Partial | Page uses analyses only (not pipeline leads as “deals”) |
| T4 Coaching book + list | ✅ Done | Coach/topic stored on `Coaching` |
| T4 Billing `switchUserPlan` | ✅ Done | Also writes `Order` rows |
| T5 Admin metrics + users/role | ✅ Done | Overview + `/admin/users` |
| T6 AI / PDF / property lookup | ✅ Done | Wired in analyzer |

**Handover checklist:** treat as complete for MVP wiring; remaining items are UX polish, not missing backends.

---

## 2. `expanded_platform_features_blueprint.md` — verification

### Schema (Section 3)
| Model | Status |
|-------|--------|
| `UserSettings` | ✅ In schema + Neon |
| `Order` | ✅ In schema + Neon |
| `CMSContent` | ✅ In schema + Neon |
| Profile strategy fields / `User.status` / Coaching coach+topic | ✅ Extended beyond original blueprint |

### Investor expansions

| Feature | Route | Status | Gaps |
|---------|-------|--------|------|
| Profile settings | `/dashboard/settings/profile` | ✅ Built | No avatar upload; security section is informational only (Clerk/sandbox note) |
| Underwriting + PDF branding | `/dashboard/settings/underwriting` | ✅ Built | Logo is URL field, not file upload; PDF branding not yet applied inside `exportToPDF` |
| Billing + orders | `/dashboard/billing` | ✅ Built | No real Stripe card/VAT; receipt = print; annual cycle not modeled |
| Coaching hub | `/dashboard/coaching` | ✅ Built | No `.ics` calendar export; past-session notes/video links limited |
| Deal compare | `/dashboard/compare` | ✅ Built | No AI Risk Score column |
| Reports library | `/dashboard/reports` | ❌ Missing | PDF export exists on analyzer only; no report archive / share links |

### Admin expansions

| Feature | Route | Status | Gaps |
|---------|-------|--------|------|
| User directory | `/admin/users` | ✅ Built | No detail modal; no reset-password / impersonate |
| Subscriptions / revenue | `/admin/subscriptions` | ✅ Built | Plan manager is display stub, not editable CMS-driven pricing |
| Deal intelligence | `/admin/deals` | ✅ Built | — |
| AI / API usage | `/admin/system/api-usage` | ✅ Built | Estimates + read-only model select; not live OpenAI billing |
| Coaching ops | `/admin/coaching` | ✅ Built | — |
| CMS | `/admin/cms` | ✅ Built | **Not consumed by public landing page yet** |
| Audit logs | `/admin/logs` | ✅ Built | No IP / failed-login streams |
| Platform settings | `/admin/settings` | ✅ Built | Env-key placeholders; maintenance toggle disabled |

### Roadmap Steps 1–4
1. Models + db push — ✅  
2. Settings + compare — ✅  
3. Billing orders — ✅  
4. Admin users / subscriptions / api-usage / cms — ✅  

**Still open from blueprint text (beyond Steps 1–4):** `/dashboard/reports`, landing↔CMS wiring, avatar upload, impersonation, live Stripe portal.

---

## 3. `CHATGPT_SUGGESTIONS.md` — already built vs remaining

ChatGPT proposed a **full commercial SaaS IA** (11 investor modules + 12 admin modules + 20 global UX systems). Below maps that to PropIntel today.

### Investor modules (ChatGPT’s 11)

| # | Module | Status | What we have | What’s left |
|---|--------|--------|--------------|-------------|
| 1 | Dashboard | 🟡 Partial | Overview KPIs, chart, quick actions, static activity | Live KPIs from DB, more charts, upcoming coaching widget, real activity feed |
| 2 | Properties hub | ❌ Missing | Analyses stored as underwrites, not a Property entity/list/map/detail | Full property list/cards/map, detail page, images, neighborhood, CRUD property record |
| 3 | Calculators | ✅ Mostly | Hold / Flip / Rental L/T in `/dashboard/analyzer` | Split nav “Calculators” subroutes; closing costs / utilities / break-even extras |
| 4 | Saved Deals | ✅ Mostly | `/dashboard/deals` search, compare checkbox, delete | Favorites, archive, duplicate, “run AI again”, share |
| 5 | CRM Pipeline | ✅ Mostly | Kanban + stages + Neon | Table/calendar views; tasks; attachments; priority; richer notes |
| 6 | Reports | 🟡 Partial | `exportToPDF` from analyzer | `/dashboard/reports` library, templates, history, filters |
| 7 | AI Insights | 🟡 Partial | AI verdict inside analyzer | Dedicated AI history page, usage counter UI, prompt history, score |
| 8 | Coaching | ✅ Mostly | Book + list + admin ops | Reschedule/cancel, payment history, past notes/recordings |
| 9 | Billing | ✅ Mostly | Plan switch + order table (simulated) | Real Stripe portal, payment methods, trials, annual |
| 10 | Settings | ✅ Mostly | Profile + underwriting | Notifications prefs, theme, timezone, password UI |
| 11 | Help / Support | ❌ Missing | — | FAQ/docs/tickets/feedback for logged-in users |

### Admin modules (ChatGPT’s 12)

| # | Module | Status | What we have | What’s left |
|---|--------|--------|--------------|-------------|
| 1 | Dashboard | ✅ Mostly | Live metrics + quick links | More growth charts, trial/expired breakdowns |
| 2 | Users | ✅ Mostly | Search/filters, role, suspend | Detail drawer, delete, reset password, login history |
| 3 | Subscriptions | ✅ Mostly | MRR/ARR, orders | Coupons, Stripe sync, refunds, cancellation queue |
| 4 | Properties (admin) | 🟡 Partial | Deal intelligence by market | Flagged properties, imported properties admin |
| 5 | CRM monitoring | ❌ Missing | Investor CRM only | Cross-tenant pipeline stats page |
| 6 | Coaching | ✅ Built | `/admin/coaching` | Coach availability calendar, refunds |
| 7 | Reports (admin) | ❌ Missing | — | Platform-wide generated reports storage |
| 8 | AI management | ✅ Mostly | `/admin/system/api-usage` | Real token logs, prompt/response storage |
| 9 | Content / CMS | ✅ Mostly | FAQ/testimonial/announcement/pricing JSON | Wire to landing; hero/footer/terms/privacy editors |
| 10 | Platform settings | 🟡 Partial | Read-only env display | Editable secrets vault, feature flags, SMTP |
| 11 | Analytics | 🟡 Partial | Spread across admin pages | Dedicated analytics module (retention, conversion) |
| 12 | Activity logs | ✅ Mostly | `/admin/logs` | Errors, webhooks, Stripe events, API call logs |

### Global “premium SaaS” features (ChatGPT Phase 1)

| Feature | Status |
|---------|--------|
| Sidebar + mobile drawer | ✅ Built |
| Role-based shells (investor vs admin) | ✅ Built |
| Responsive layout | ✅ Mostly |
| Empty states (some pages) | 🟡 Partial |
| Cursor pointer on buttons | ✅ Built |
| Global search / Cmd+K | ❌ |
| Notification center | ❌ |
| Command palette | ❌ |
| Onboarding checklist / guided tour | ❌ |
| Saved filters / smart tables / bulk actions | ❌ |
| Design-system completeness (toasts, skeletons everywhere) | 🟡 Partial |
| Theme switcher / i18n | ❌ |
| Permission matrix beyond ADMIN/INVESTOR | ❌ |

---

## 4. Recommended next build order

Prioritized so we close blueprint gaps first, then the highest-value ChatGPT items.

### Next sprint A — close blueprint gaps (short)
1. **`/dashboard/reports`** — report library (store metadata when exporting PDF; list/download/re-run)
2. **Apply underwriting brand settings** inside `exportToPDF`
3. **Wire CMS → landing page** (pricing, FAQ, testimonials, announcement banner)
4. **Analyzer “Saved analyses” tab** (optional polish from handover)

### Next sprint B — ChatGPT high value
5. **Live investor dashboard** (real Neon KPIs + activity timeline)
6. **Properties module** (or promote analyses into a first-class Property list + detail)
7. **Notifications + Cmd+K command palette**
8. **Onboarding checklist** for new investors
9. **Help / Support** page

### Later / production
10. Real Stripe Customer Portal + webhooks  
11. Real property APIs (RentCast/ATTOM) + Google Maps  
12. Admin impersonation, coupons, webhooks/error logs  

---

## 5. Route map (what exists today)

### Investor
```
/dashboard
/dashboard/analyzer
/dashboard/crm
/dashboard/deals
/dashboard/compare
/dashboard/coaching
/dashboard/billing
/dashboard/settings/profile
/dashboard/settings/underwriting
```

### Admin
```
/admin
/admin/users
/admin/subscriptions
/admin/deals
/admin/system/api-usage
/admin/coaching
/admin/cms
/admin/logs
/admin/settings
```

### Missing vs suggestions/blueprint
```
/dashboard/reports          ← blueprint + ChatGPT
/dashboard/properties/*     ← ChatGPT
/dashboard/ai               ← ChatGPT (dedicated)
/dashboard/help             ← ChatGPT
/admin/crm                  ← ChatGPT
/admin/analytics            ← ChatGPT (dedicated)
/admin/reports              ← ChatGPT
```

---

## Bottom line

- **Handover wiring:** complete enough to demo end-to-end against Neon.  
- **Expansion blueprint Steps 1–4:** implemented; leftover is Reports library + landing CMS consumption + polish.  
- **ChatGPT doc:** treats the product as a large multi-module SaaS — we have the **core investor underwriting/CRM/billing/admin ops spine**; we do **not** yet have Properties-as-a-hub, Reports library, Help, notifications, Cmd+K, or deep analytics.

Use **Sprint A** above before expanding into the larger ChatGPT IA so the current MVP feels finished rather than half of a bigger redesign.
