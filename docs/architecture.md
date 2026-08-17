# Personal Finance Tracker — Product & Technical Architecture

## 0. Framing

The product's single organizing question is: **"How much can I safely spend right now?"** Every screen, table, and calculation should trace back to that question. I'll treat this as the north star for all architectural decisions below.

---

## 1. Product Architecture

**Layered architecture, calculation-first:**

```
┌─────────────────────────────────────────────┐
│  Presentation Layer (Web + Mobile-responsive)│
│  Dashboard / Expenses / Budget / Goals /     │
│  Subscriptions / AI Consultant / Insights    │
├─────────────────────────────────────────────┤
│  Application/API Layer (REST or tRPC)        │
│  Auth, validation, orchestration             │
├─────────────────────────────────────────────┤
│  Domain Services                             │
│  ┌───────────────┐  ┌──────────────────────┐│
│  │ Financial Calc │  │ AI Consultant Service││
│  │ Engine (pure,  │  │ (reads calc engine   ││
│  │ deterministic) │  │  output, never       ││
│  │                │  │  computes numbers)   ││
│  └───────────────┘  └──────────────────────┘│
│  Pay-Cycle Service | FX Service | Notif Svc  │
├─────────────────────────────────────────────┤
│  Data Layer (PostgreSQL + Redis cache)       │
├─────────────────────────────────────────────┤
│  External Integrations                       │
│  FX rate API | (later) Open Banking          │
└─────────────────────────────────────────────┘
```

**Key architectural rule (from your spec, and correctly so):** the Financial Calculation Engine is a pure, deterministic, testable module. The AI never performs arithmetic — it receives the engine's output as structured JSON and *narrates/interprets* it. This is the single most important boundary in the whole system, so I'll enforce it strictly throughout (see §7, §11).

---

## 2. Recommended Technology Stack

| Layer | Choice | Why |
|---|---|---|
| Language | TypeScript everywhere | One type system shared between frontend/backend/calc engine — critical for a domain full of money math where type errors are costly |
| Frontend | Next.js (React) | SSR for fast dashboard loads, file-based routing, good mobile responsiveness, huge ecosystem |
| Styling | Tailwind CSS + a small design-token layer | Fast iteration, easy to keep "calm/premium" aesthetic consistent (see §34 in your brief) |
| Charts | Recharts or visx | Lightweight, composable, works well with the "don't overwhelm with charts" principle — easy to keep charts minimal |
| Backend | Node.js + Fastify (or NestJS if you want stronger structure/DI) | NestJS is worth the extra ceremony here because you have many domain services (calc engine, pay-cycle, FX, notifications, AI) that benefit from dependency injection and clean module boundaries |
| API style | tRPC if frontend+backend share the TS monorepo; otherwise REST + OpenAPI | tRPC removes an entire class of contract bugs for a fast-moving MVP |
| Database | PostgreSQL | Relational integrity matters a lot here (money, dates, recurring rules) — not a NoSQL fit |
| ORM | Prisma | Type-safe schema, good migrations, works well with Postgres |
| Cache/Queue | Redis | Cache FX rates, precomputed cycle summaries; queue for notification jobs |
| Auth | Auth.js (NextAuth) or a dedicated auth service (Clerk/Auth0) for MVP speed | Don't hand-roll auth for a financial product |
| Money handling | Integer minor units (cents) + a decimal library (dinero.js or decimal.js) — never floats | Standard, non-negotiable practice for financial software |
| Dates/recurrence | Luxon or date-fns + a small custom recurrence-rule resolver (RRULE-inspired) for pay cycles | Pay-cycle logic (approximate dates, "last working day", biweekly) needs first-class date handling |
| i18n | next-intl or i18next | Mature, supports pluralization/number formatting per locale, keeps translations out of components |
| AI integration | Anthropic API (Claude), called server-side only, with a strict context-builder function | Server-side keeps API keys safe and lets you control exactly what data reaches the model |
| Testing | Vitest/Jest for unit tests (esp. calc engine), Playwright for E2E | The calc engine deserves near-100% unit test coverage given it's the trust anchor of the product |
| Monorepo tooling | Turborepo or Nx | Lets you share the calc engine + types package between web and (future) mobile |

I'm intentionally steering away from exotic tech — this is a trust-critical product; boring, well-understood tools reduce risk.

---

## 3. Database Architecture

Building on your suggested schema, refined and normalized. All money columns are `integer` (minor units) + a `currency` column (ISO 4217). All tables have `createdAt`/`updatedAt`, and `userId` foreign keys with cascading isolation.

```
User
 - id, email, passwordHash, country, language, defaultCurrency,
   timezone, createdAt

IncomeSource
 - id, userId, name, type (salary|freelance|bonus|side|other),
   amount, currency, frequency (monthly|biweekly|weekly|custom),
   expectedDayRule (JSON: {type:"fixed", day:30} | {type:"lastWorkday"}
     | {type:"approximate", day:30, varianceDays:2} | {type:"custom", rrule}),
   isRecurring, isActive

IncomeHistory              -- actual received income, used for variable-income averaging
 - id, incomeSourceId, amount, currency, receivedDate

FinancialCycle              -- one row per resolved pay period (materialized, not just computed on the fly)
 - id, userId, startDate, endDate, startingBalance,
   expectedIncome, desiredEndBalance, status (open|closed)

FixedExpense
 - id, userId, name, amount, currency, frequency, dueDayRule (JSON, same shape as IncomeSource),
   category, active

Subscription
 - id, userId, name, category, amount, currency, billingFrequency,
   nextBillingDate, usageFrequency (daily|weekly|monthly|rarely),
   notes

Expense                     -- actual transactions
 - id, userId, amount, currency, categoryId, description, date,
   paymentMethod, notes, source (manual|imported), createdAt

Category
 - id, userId (nullable = system default), name, icon, isCustom

FinancialGoal
 - id, userId, name, targetAmount, currentAmount, targetDate,
   priority, monthlyContribution

GoalContribution            -- audit trail of contributions, needed for "forecasted completion date"
 - id, goalId, amount, date

InstallmentPlan             -- persistent installment obligations (distinct from one-off PurchaseSimulation)
 - id, userId, name, totalAmount, downPayment, installmentCount,
   monthlyPayment, interestRate, fees, firstPaymentDate, remainingCount

PurchaseSimulation          -- "Can I afford it?" scratchpad, not a committed obligation until confirmed
 - id, userId, product, price, currency, downPayment, installments,
   monthlyPayment, interestRate, fees, recommendation, createdAt

ExchangeRateCache
 - id, base, quote, rate, fetchedAt

NotificationPreference
 - id, userId, type, channel, enabled, threshold (JSON)

AIConversation / AIMessage  -- stores AI consultant chat history + the financial-context snapshot sent with each message (for auditability)
```

**Design notes:**
- `FinancialCycle` is *materialized* rather than purely computed, because you need a stable historical record ("what was my safe-to-spend on Aug 20?") even as later data changes. The current/open cycle is recalculated live; closed cycles are frozen.
- Recurrence (`dueDayRule`) is a single JSON shape reused across `IncomeSource` and `FixedExpense` so the pay-cycle resolver has one code path, not two.
- `Expense.currency` can differ from `User.defaultCurrency` — conversion happens at read-time via `ExchangeRateCache`, never mutating the original entry (never lose the source-of-truth amount).

---

## 4. Application Architecture (Backend Modules)

```
/apps/api
  /modules
    /auth
    /users
    /income          — IncomeSource CRUD + variable-income averaging
    /pay-cycle        — resolves recurrence rules → concrete next dates
    /financial-cycle  — opens/closes cycles, snapshots
    /expenses
    /fixed-expenses
    /subscriptions
    /goals
    /installments
    /calc-engine      — pure functions, no DB access, fully unit-testable
    /ai-consultant    — context builder + Claude API client + response schema
    /fx               — exchange rate fetch + cache
    /notifications
/packages
  /calc-engine        — shared, framework-agnostic (usable from web, mobile, tests)
  /types              — shared TS types/schemas (zod)
  /i18n
```

The `/calc-engine` package is deliberately extracted as a standalone package with zero DB/HTTP dependencies — it takes plain data in, returns plain data out. This is what makes it "AI should not replace this service" enforceable: it's physically a separate module the AI module merely calls and reads.

---

## 5. Financial Calculation Engine

Pure functions, fully deterministic, unit-tested against fixtures like your Example 9/16/21.

```typescript
// packages/calc-engine/src/types.ts
interface CalcInput {
  currentBalance: Money;
  confirmedIncomeBeforeDate: IncomeEvent[];   // only income the user has confirmed/expects with confidence
  committedExpensesBeforeDate: ExpenseEvent[]; // fixed expenses + subscriptions + installments due before target date
  desiredReserve: Money;                       // "desired end-of-cycle balance"
  targetDate: DateISO;                         // next relevant income date, or cycle end
  today: DateISO;
}

interface CalcResult {
  discretionaryBudget: Money;      // current - committed - reserve (does NOT add future income)
  safeToSpend: Money;              // discretionary + confirmed income arriving before targetDate
  daysUntilTarget: number;
  recommendedDailySpending: Money;
  breakdown: LineItem[];           // for full transparency in the UI ("why is this my number?")
}
```

**Core function — `computeSafeToSpend()`:**

```
discretionaryBudget = currentBalance - committedExpensesBeforeDate - desiredReserve
safeToSpend = discretionaryBudget + confirmedIncomeBeforeDate   // §6/§8: never treat future salary as current money — it's added only as a separate, clearly-labeled term, and only when "confirmed" (i.e., inside the horizon being calculated)
recommendedDailySpending = safeToSpend / daysUntilTarget
```

This directly encodes your §6 rule ("never treat future salary as if already available") by keeping `currentBalance` and `confirmedIncomeBeforeDate` as separate line items all the way through — the breakdown shown to the user always separates "money you have" from "money you're expecting."

**Recalculation triggers** (every one of these re-runs the pure function, cheap because it's not I/O bound):
- New expense added
- Expense edited/deleted
- Fixed expense/subscription changed
- Income confirmed/updated
- Goal contribution changed
- Day rollover (daily allowance re-derives from remaining days)

**Overspend-day recalculation (§43):** rather than a "you overspent" flag, the engine recomputes `recommendedDailySpending` using `safeToSpend - spentSoFar` over `daysRemaining`. This is just the same pure function called again with updated `currentBalance`. No special-case logic needed — it's the same formula reapplied, which is exactly why keeping it pure and reusable matters.

**Financial Health Score** (§30) is a separate pure function taking the same kind of structured input (savings rate, budget adherence, fixed-expense ratio, subscription burden, installment load, goal progress, spending consistency) and returning a transparent, weighted 0–100 score *with the contributing factors attached* — never a black-box number.

---

## 6. Salary / Pay-Cycle Architecture

A `PayCycleResolver` turns a recurrence rule into concrete dates:

```typescript
type DueDayRule =
  | { type: 'fixed'; day: number }                         // "the 30th"
  | { type: 'lastWorkday' }
  | { type: 'approximate'; day: number; varianceDays: number } // "around the 30th"
  | { type: 'custom'; rrule: string };                      // RFC 5545 RRULE for edge cases

function resolveNextOccurrence(rule: DueDayRule, from: DateISO, holidayCalendar?: Country): DateISO
```

- Handles month-length edge cases (rule day=30 in February → last day of Feb).
- `lastWorkday` needs a per-country business-day/holiday calendar (start simple: weekends only; layer in holiday calendars later per country).
- `approximate` dates flow into the calc engine as **lower-confidence income** — the UI can show a range ("expected Aug 28–Sep 1") and the safe-to-spend calculation can conservatively use the *later* bound so the user is never caught short.

**Financial cycle derivation:** the active cycle is `[last pay date, next pay date)`. This is computed once per pay-date rollover and materialized into `FinancialCycle` so historical reporting stays stable even if the user later edits their salary date going forward.

Variable-income averaging (§5) is a small separate function operating on `IncomeHistory`, feeding an "expected income" estimate into the same `IncomeSource.amount` slot the calc engine reads — no special-casing required downstream.

---

## 7. Cash-Flow / Timeline Architecture

A `CashflowProjector` service walks forward from `today` to a configurable horizon (default: next 2 pay cycles), merging:
- Confirmed/expected income events
- Fixed expenses (resolved via the same `PayCycleResolver`)
- Subscriptions
- Installment plan payments

into a single sorted timeline of `{date, label, amount, runningBalance}` events — this directly produces both the §31 visual timeline and the §28 spending forecast (by adding a projected-spending event stream on top, derived from historical daily averages).

---

## 8. AI Architecture

**Strict separation of concerns:**

```
User question
   → AI Consultant Service
       1. Pull current CalcResult from calc-engine (already computed, cached)
       2. Pull relevant structured context (goals, subscriptions, installments — only what's needed for this question type, not the whole profile)
       3. Build a context JSON (your §37 example — this is exactly right)
       4. Call Claude with: system prompt (role, response format, safety rules) + context JSON + user question
       5. Validate the response against an expected structure (recommendation tier, why, impact, alternative) before returning to the client
   → Structured response rendered as the §38 card (🟢/🟡/🟠/🔴 + why + impact + alternative)
```

**Non-negotiables (matching your §36/§37/§39):**
- The AI is never given write access to financial records directly — any action it "recommends" (e.g., "log this expense") requires an explicit user confirmation step that goes through the normal API, not an AI tool-call side effect.
- Only the minimum context needed for the question type is sent — a "can I afford X" question doesn't need full expense history, just the calc summary + relevant goal + relevant installment load.
- Every AI response is logged with the exact context snapshot it was given, for auditability and debugging ("why did it say that").
- System prompt encodes the priority ordering from §39 (essential expenses > emergency savings > obligations > goals > discretionary) and requires the disclaimer language.

---

## 9. Security Architecture

- Auth: hashed passwords (argon2) or delegated to Auth0/Clerk; session tokens short-lived + refresh tokens.
- All financial endpoints scoped by `userId` from the verified session — never trust a client-supplied userId.
- Row-level isolation enforced at the ORM/query layer (every query includes `WHERE userId = :sessionUserId`), plus Postgres row-level security as defense-in-depth.
- Input validation via zod schemas shared between frontend and backend.
- API keys (Claude, FX provider) live only in backend env vars, never shipped to the client.
- Rate limiting on AI consultant endpoint (cost + abuse control).
- Encryption at rest for the database (managed Postgres provider handles this) and TLS everywhere in transit.
- No financial data in logs; AI conversation logs redact anything beyond the structured context.

---

## 10. Internationalization Strategy

- All UI strings in `i18n/{locale}.json` catalogs, loaded via next-intl — zero hardcoded strings in components.
- Number/date formatting via `Intl.NumberFormat`/`Intl.DateTimeFormat` keyed off `user.language` + `user.country`, not inferred from currency (§25 independence requirement).
- AI system prompt includes `respond in {user.language}` as a parameter, not a hardcoded instruction per language.
- Launch languages: English, Spanish, German — structured so adding a 4th is just a new JSON catalog.

## 11. Multi-Currency Strategy

- Every money-bearing record stores its own currency; nothing assumes `defaultCurrency`.
- A single `FxService.convert(amount, from, to, date?)` function, backed by `ExchangeRateCache` (refreshed on a schedule, e.g. daily, from a provider like exchangerate.host or Open Exchange Rates) — never a hardcoded rate table.
- Calc engine always operates in the user's `defaultCurrency`; conversions happen at the boundary (when reading in an expense recorded in a different currency), and the original amount+currency is always preserved for accuracy/audit.

---

## 12. API Requirements (MVP surface)

```
POST /auth/register, /auth/login
GET/PATCH /users/me
GET/POST/PATCH /income-sources
GET/POST/PATCH /fixed-expenses
GET/POST/PATCH/DELETE /expenses
GET /financial-cycle/current        → calc-engine output for dashboard
GET /financial-cycle/:id            → historical cycle snapshot
POST /goals, PATCH /goals/:id
GET/POST/PATCH /subscriptions
POST /purchase-simulations          → "Can I afford it?"
POST /ai/consultant/message
GET /insights/forecast
```

---

## 13. Main Screens & Component Structure

```
Dashboard        — Balance, Next Salary countdown, Safe-to-Spend, Daily allowance,
                    Financial Status badge, mini cash-flow timeline
Expenses         — Quick-add (always accessible, mobile-first), history w/ filters, charts
Budget           — Current cycle breakdown (money have/coming/must spend/want to save/can spend)
Goals            — Goal cards w/ progress, required contribution, "protection" warnings
Subscriptions    — List + monthly/annual cost, AI optimization panel
AI Consultant    — Chat interface, structured recommendation cards
Insights         — Spending patterns, forecast, financial health score
Settings         — Country, language, currency, pay-cycle config, notifications
Onboarding       — 4-step wizard: Personal → Income → Current Situation → Expenses/Goals
```

Shared component primitives: `<MoneyDisplay>`, `<SafeToSpendCard>`, `<PayCycleCountdown>`, `<RecommendationBadge>` (🟢🟡🟠🔴), `<CashflowTimeline>` — built once, reused across dashboard/AI responses/purchase advisor so the visual language stays consistent.

---

## 14. MVP Scope (Phase 1, confirming your §42)

Auth → Onboarding → Income & pay-cycle setup → Fixed expenses → Calc engine (safe-to-spend, daily budget) → Dashboard → Add/edit/delete expense → Expense history. No AI, no subscriptions module, no goals yet — get the deterministic core airtight first, since everything else is interpretation layered on top of it.

## 15. Development Roadmap

Phase 1 (MVP) → Phase 2 (categories/charts/goals/subscriptions/notifications/timeline) → Phase 3 (AI consultant, affordability advisor, installment simulator, subscription optimization) → Phase 4 (external economic data, FX, advanced forecasting, health score, integrations) — as you outlined. I'd add one adjustment: pull the **Financial Health Score** earlier into Phase 2, since it only needs data Phase 1/2 already has and gives early users a sense of momentum before the AI features land.

---

## 16. Technical Risks

- **Recurrence-rule edge cases** (month-end dates, "last workday" across countries/holidays) — mitigate with heavy unit-test fixtures per rule type before trusting it in production.
- **Floating-point money bugs** — mitigated structurally by integer-cents + decimal library, enforced via lint rule banning raw `number` arithmetic on money fields.
- **AI hallucinating numbers** — mitigated by the strict "AI never computes" boundary; add a response validator that rejects any AI message containing a number not traceable to the supplied context.
- **FX rate staleness** — cache with clear "as of" timestamps shown in UI; never silently use a stale rate for a live calculation without disclosure.
- **Multi-currency + multi-country combinatorics** — keep country (locale/formatting) and currency (money) fully decoupled in code, not just in the DB schema, or this will leak bugs everywhere.

## 17. UX Risks

- Overwhelming onboarding — mitigate with progressive disclosure (your §3 instinct is right; keep it to ~4 short steps, all else editable later in Settings).
- Users distrust a number they don't understand — every "Safe-to-Spend" figure needs a one-tap breakdown (the `LineItem[]` from §5 exists specifically for this).
- Punitive tone on overspending — enforce the §43 "supportive recalculation" language as a copy-writing rule reviewed for every notification/insight string, not just an example.
- Chart overload — cap dashboard to the 6 cards in §11; deeper charts live in Insights, not the dashboard.

## 18. Concept Improvements I'd Recommend

1. **Confidence-weighted income**, not binary confirmed/unconfirmed — "approximate" salary dates and variable-income sources should carry a confidence band that safe-to-spend uses conservatively (assume the later date / lower amount) rather than a point estimate, so the number never overpromises.
2. **Two safe-to-spend numbers on the dashboard**: "safe until next salary" and "safe for today," since the daily figure hides the cycle-level picture users sometimes want (e.g., "why is today's number so low if I have 3 weeks of runway?").
3. **Cycle close-out ritual**: a brief end-of-cycle summary (planned vs actual, what changed) — this both trains the forecasting model on the user's real behavior and creates a natural moment for positive reinforcement (§27/§43 tone).
4. **Materialize `FinancialCycle` snapshots** (as above) so historical safe-to-spend figures don't silently change when the user edits data retroactively — important for trust and for any future "how did I do" reporting.
5. **Separate "committed" from "planned" installments** — an `InstallmentPlan` the user is actively paying vs. a `PurchaseSimulation` they're just exploring should never be conflated in the calc engine's committed-expenses input.

---

# Implementation Plan (once you approve the above)

**Step 1 — Foundations:** monorepo scaffold (Turborepo), Prisma schema + migrations for the core MVP tables, auth module.

**Step 2 — Calc engine package:** pure functions (`computeSafeToSpend`, `resolveNextOccurrence`), full unit test suite against your worked examples (§9, §10, §16, §43) before any UI exists.

**Step 3 — Onboarding + income/fixed-expense CRUD APIs**, wired to the calc engine.

**Step 4 — Dashboard UI**: the 6 core cards + payday countdown, reading live calc-engine output.

**Step 5 — Expense quick-add + history**, with immediate recalculation on mutation.

At that point we'd have a working, testable MVP loop before touching goals, subscriptions, or AI — matching your phased approach and keeping each step reviewable.

I'll pause here for your sign-off on the architecture before starting Step 1 — happy to adjust the stack (e.g., if you already have infra preferences, or want a simpler non-monorepo setup for a faster first pass) before we commit to it.
