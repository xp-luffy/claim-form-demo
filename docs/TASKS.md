# Task Plan

## Sprint 1 — Core Engine: Claim Submission
**Goal:** Staff can create and view claims end-to-end against the DB.
- [ ] Create Supabase tables + seed data (migration SQL)
- [ ] `lib/data/claims.ts` — insert, list, getById queries
- [ ] `lib/data/departments.ts` — list departments
- [ ] New Claim form: title, type, department, items, amount
- [ ] Auto-generate voucher number on submit (VC-YYYY-NNN)
- [ ] Claims list page with status + department filter
- [ ] Claim detail page with items table
- [ ] Loading / empty / error shells for all pages
- [ ] Sidebar nav: Claims, New Claim, Payments, Departments
**DoD:** New claim persists to DB, appears in list with voucher number, detail page shows all items.

## Sprint 2 — Full Workflow: Classify → Approve → Pay (v1 functional milestone)
**Goal:** The success scenario works end-to-end.
- [ ] `lib/actions/claim-actions.ts` — status transition functions
- [ ] Classify action: set category + petty_cash flag → status `classified`
- [ ] Approve action: write approval row + set status `approved`
- [ ] Reject action: write approval row + set status `rejected`
- [ ] Release payment: write payment row + set status `paid` + `paid_at`
- [ ] Audit log on every transition
- [ ] Claim detail timeline: submit → classify → approve → pay with timestamps
- [ ] Payments page: list released + pending payments
**DoD:** A claim goes from `submitted` → `classified` → `approved` → `paid` entirely in the app, each step persists, audit log shows all transitions.

## Sprint 3 — Dashboard + Departments + Audit
**Goal:** Visible overview for finance and management.
- [ ] Dashboard: counts by status, total amount pending, total paid
- [ ] Department management page: add/edit department
- [ ] Audit log viewer: filter by claim
- [ ] Claim list: sort by amount, date, status
**DoD:** Dashboard shows live counts from DB; departments CRUD works; audit log visible.

## Sprint 4 — Auto-Classification (Intelligence)
**Goal:** AI suggests category on claim submit.
- [ ] `lib/ai/classify.ts` — call AI provider with claim text
- [ ] Strict output schema: `{category, confidence}` both nullable
- [ ] On submit, call classify → store in `suggested_category` fields
- [ ] If confidence < 0.7 → `review_status = unreviewed`
- [ ] Finance sees suggestion with confidence badge; can accept or override
- [ ] Retry on AI failure; null on persistent failure
**DoD:** New claim shows AI-suggested category with confidence; low-confidence stays unreviewed; finance can override.

## Sprint 5 — Lock It Down (Auth + Per-User RLS)
**Goal:** Real users can use it with isolated data.
- [ ] Supabase Auth: login/signup pages
- [ ] Set `user_id` on all inserts to `auth.uid()`
- [ ] RLS policies: write `auth.uid() = user_id`; read for all staff
- [ ] Role columns: `approver`, `finance` flags
- [ ] Gate classify/approve/release by role
- [ ] Remove permissive v1 policies
**DoD:** Logged-out user redirected to login; logged-in user sees only their claims; finance/approver actions gated by role.

## Gantt
```
S1 ████████  Core engine (submission + list + detail)
S2 ████████  Workflow pipeline (classify → approve → pay)  ← v1 functional
S3 ████████  Dashboard + departments + audit
S4 ████████  AI auto-classification
S5 ████████  Auth + per-user RLS lock-down
```

**First handoff pass builds through Sprint 2 (v1 functional milestone).**