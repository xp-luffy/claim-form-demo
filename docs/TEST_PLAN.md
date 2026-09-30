# Test Plan

## v1 Success Scenario (manual)
1. Open app (no login) → Claims list loads with seeded demo claims.
2. Click **New Claim** → fill title "Office stationery", type petty_cash, department Finance, add item " pens RM 50", "paper RM 100", total RM 150.
3. Submit → redirected to claim detail, voucher number assigned (VC-2025-00x), status `submitted`.
4. On detail page, click **Classify** → enter category "Stationery", confirm petty cash → status `classified`.
5. Click **Approve** → enter note "Approved" → status `approved`, approval row visible.
6. Go to **Payments** → find the approved claim → enter method "bank_transfer", reference "BNI-12345" → click **Release**.
7. Claim detail shows status `paid`, payment reference visible, `paid_at` timestamp set.
8. Audit log section shows 4 entries: submit, classify, approve, release.

**Pass:** All 8 steps complete without error, data persisted (refresh page → still there).

## Empty State
- Claims list with zero claims (clear DB) → shows "No claims yet. Create your first claim." with CTA button.
- Payments page with no payments → "No payments released yet."

## Error State
- Submit claim with empty title → form validation blocks submit, shows "Title is required."
- Submit claim with no line items → "Add at least one item."
- Network error (disable network) → submit shows error toast "Could not save claim. Try again."
- Approve a claim that is not in `classified` status → action blocked with "Claim must be classified before approval."

## Loading State
- Claims list page → skeleton rows while fetching.
- Claim detail → spinner while loading.

## Partial State
- Claim with items but no approval/payment → timeline shows only "Submitted" step, later steps greyed.
- Claim classified but not approved → timeline shows submit + classify, approve step active.

## Cross-Check
- After lock-down: logged-out → redirect to /login. Logged-in as user A → cannot see user B's claims in list.