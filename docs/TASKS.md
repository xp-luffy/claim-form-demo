# Task Plan

**Sprint implementation status:** Sprints 1–5 are implemented. Runtime activation still needs an Anthropic API key for AI suggestions and account setup/role assignment for Finance and Approvers; see [AI setup](AI_CLASSIFICATION.md) and [role setup](ROLE_ADMIN.md).

## Sprint 1 — Core Engine: Claim Submission
**Goal:** Staff can create and view claims end-to-end against the DB.
- [x] Create Supabase tables + seed data (migration SQL)
- [x] `lib/data/claims.ts` — insert, list, getById queries
- [x] `lib/data/departments.ts` — list departments
- [x] New Claim form: title, type, department, items, amount
- [x] Auto-generate voucher number on submit (VC-YYYY-NNN)
- [x] Claims list page with status + department filter
- [x] Claim detail page with items table
- [x] Loading / empty / error shells for all pages
- [x] Sidebar nav: Claims, New Claim, Payments, Departments
**DoD:** New claim persists to DB, appears in list with voucher number, detail page shows all items.

## Sprint 2 — Full Workflow: Classify → Approve → Pay (v1 functional milestone)
**Goal:** The success scenario works end-to-end.
- [x] `lib/actions/claim-actions.ts` — status transition functions
- [x] Classify action: set category + petty_cash flag → status `classified`
- [x] Approve action: write approval row + set status `approved`
- [x] Reject action: write approval row + set status `rejected`
- [x] Release payment: write payment row + set status `paid` + `paid_at`
- [x] Audit log on every transition
- [x] Claim detail timeline: submit → classify → approve → pay with timestamps
- [x] Payments page: list released + pending payments
**DoD:** A claim goes from `submitted` → `classified` → `approved` → `paid` entirely in the app, each step persists, audit log shows all transitions.

## Sprint 3 — Dashboard + Departments + Audit
**Goal:** Visible overview for finance and management.
- [x] Dashboard: counts by status, total amount pending, total paid
- [x] Department management page: add/edit department
- [x] Audit log viewer: filter by claim
- [x] Claim list: sort by amount, date, status
**DoD:** Dashboard shows live counts from DB; departments CRUD works; audit log visible.

## Sprint 4 — Auto-Classification (Intelligence)
**Goal:** AI suggests category on claim submit.
- [x] `lib/ai/classify.ts` — call AI provider with claim text
- [x] Strict output schema: `{category, confidence}` both nullable
- [x] On submit, call classify → store in `suggested_category` fields
- [x] If confidence < 0.7 → `review_status = unreviewed`
- [x] Finance sees suggestion with confidence badge; can accept or override
- [x] Retry on AI failure; null on persistent failure
**DoD:** New claim shows AI-suggested category with confidence; low-confidence stays unreviewed; finance can override.

## Sprint 5 — Lock It Down (Auth + Per-User RLS)
**Goal:** Real users can use it with isolated data.
- [x] Supabase Auth: login/signup pages
- [x] Set `user_id` on all inserts to `auth.uid()`
- [x] RLS policies: claimants read their own claims; authorized Finance/Approvers can review all claims
- [x] Role records for `approver` and `finance`
- [x] Gate classify/approve/release by role
- [x] Remove permissive v1 policies
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
