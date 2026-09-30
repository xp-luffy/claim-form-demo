# Staff Claims App — PRD

## Problem
Staff across all departments submit expense claims on Excel sheets and paper forms. Voucher numbers get lost, approvals stall, and nobody knows if a payment was released. There is no single source of truth.

## Target User
- **Claimants:** any staff member in any department.
- **Approvers:** department heads / finance officers who classify and approve.
- **Finance:** staff who release payments and reconcile.

## Core Objects
- **Claim** — voucher number, type, department, amount, status lifecycle.
- **Claim Item** — line-level detail within a claim.
- **Approval** — decision record (approve/reject) with note.
- **Payment** — release record: amount, method, reference, status.
- **Department** — evergreen list for multi-departmental tagging.
- **Audit Log** — every status change recorded.

## MVP (v1) Checklist
- [x] Create a claim with items (title, type, petty-cash flag, department, amount)
- [x] Auto-generate voucher number on submit
- [x] Classify a submitted claim (set category, mark petty cash)
- [x] Approve or reject a classified claim
- [x] Release payment for an approved claim
- [x] List/filter claims by status and department
- [x] View claim detail with full timeline (submit → classify → approve → pay)
- [x] Audit log for every status transition

## Non-Goals (v1)
- No login/auth (demo-first, locked down later)
- No receipt file upload (text description only)
- No email notifications
- No multi-currency conversion
- No budget limits / policy enforcement

## Success Criteria
A staff member creates a petty-cash claim for RM 150 office supplies, the system assigns voucher **VC-2025-001**, a finance officer classifies it as "Stationery" and approves it, finance releases payment via bank transfer, and the claim status reads **"Paid"** with the payment reference visible — all within the app, no Excel involved.
