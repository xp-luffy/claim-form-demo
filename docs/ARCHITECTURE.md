# Architecture

## Stack
- **Next.js 15 (App Router)** + TypeScript + Tailwind
- **Supabase** (Postgres + RLS)
- **Vercel** deploy

## Build Sequence
**Now:** Claim submission → classification → approval → payment release (full lifecycle against DB, no login).
**Next:** Dashboard summaries, department management, audit trail UI.
**Later:** Auto-classification AI, login + per-user RLS, receipt uploads.

## Key User Flow (one real action)
1. Staff opens **New Claim** form, fills title, type, department, adds line items, enters total.
2. On submit → `claims` row created with status `submitted`, voucher number auto-generated.
3. Finance officer opens claim, sets category → status `classified`.
4. Approver reviews, clicks Approve → status `approved`, approval row written.
5. Finance enters payment method + reference, clicks Release → status `paid`, payment row written.
6. Every transition appends an `audit_logs` row.

## Responsive Nav Shell
Multi-page app: persistent left sidebar (desktop) → hamburger menu (mobile). Sections: **Claims**, **New Claim**, **Payments**, **Departments**. Current section highlighted. Keyboard accessible.

## Layer Plan
1. **Data layer** (`lib/data/`) — all DB reads/writes, one place. Supabase queries only here.
2. **Server actions** (`lib/actions/`) — status transitions, voucher generation, validation.
3. **UI components** (`components/`) — forms, tables, timeline, state shells.
4. **AI module** (`lib/ai/`) — auto-classification (later sprint, isolated).

## Why Core Works Without AI
The submit→classify→approve→pay pipeline is pure database writes and status transitions. AI classification is an optional enhancement that pre-fills a category suggestion; if absent, finance sets it manually.

## Repo Structure
```
lib/data/claims.ts        # DB queries
lib/data/departments.ts
lib/data/payments.ts
lib/data/audit.ts
lib/actions/claim-actions.ts  # status transitions
lib/ai/classify.ts           # later
components/claims/           # forms, list, detail
components/payments/
components/shared/           # loading, empty, error shells
app/claims/page.tsx
app/claims/[id]/page.tsx
app/claims/new/page.tsx
app/payments/page.tsx
app/departments/page.tsx
__tests/
```

## Module Map
| Module | Responsibility | Owns | Build Order |
|--------|---------------|------|-------------|
| **claims-data** | All claim DB queries | claims, claim_items | 1st |
| **claim-workflow** | Status transitions, voucher gen | status logic, actions | 2nd |
| **departments** | Department CRUD | departments | 3rd |
| **payments** | Payment release + tracking | payments | 4th |
| **audit** | Log every transition | audit_logs | 5th |
| **dashboard** | Summary views, filters | reads across tables | 6th |
| **ai-classify** | Suggest category for claim | suggested_category fields | 7th (later) |
| **auth-lockdown** | Login + per-user RLS | auth, policies | 8th (later) |