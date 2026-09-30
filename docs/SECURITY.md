# Security

## Secret Handling
- Supabase URL + anon key: public-safe (env var, not secret). Exposed in client.
- Supabase service role key: server-only, never in client code or env exposed to browser.
- No other secrets in v1.
- AI provider key (later): server-side only, never sent to client.

## Permission Model
- **v1 (demo):** All tables permissive read/write, no login required. RLS enabled but policies allow all.
- **Lock-down sprint:**
  - Write: `auth.uid() = user_id` (claimant owns their claims).
  - Read: all staff can read all claims (transparency) OR scoped by department membership.
  - Finance role: can classify, release payment (role check via `user_role` column — later).
  - Approver role: can approve/reject.
- Agent inherits the logged-in user's permissions — never runs as service role for user actions.

## Approved-Tools Rule
- Agent may only call named tools listed in Agentic Layer.
- No raw SQL execution, no `run_any`, no arbitrary API calls.
- Each tool has a narrow input schema and structured error output.

## Audit Principle
- Every status transition writes to `audit_logs` with actor, action, entity, detail.
- AI-suggested fields are stored with `source` + `confidence`; low-confidence suggestions stay `unreviewed` and are never shown as confirmed fact.
- No PII in audit detail beyond what the user entered.

## Security Pass (lock-down sprint)
- Injection: parameterized Supabase queries only.
- XSS: React auto-escapes; no `dangerouslySetInnerHTML`.
- Rate-limiting: Supabase default per-key limits.
- PII: claim descriptions may contain names — treated as user-entered data, not exposed beyond app.
- Could not verify: full pen-test, CSRF on form submissions (relies on Supabase auth tokens later).