# Fieldnote — Staff Claims

Staff expense claims with voucher tracking, classification, approval, payment records, and an audit trail.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, React 19, Server Actions) |
| Language | TypeScript strict |
| Styles | Tailwind CSS v4 (CSS-first, no config file) |
| Auth + DB | Supabase (`@supabase/ssr`) |
| Package manager | Bun |
| Deploy | Vercel |

## Run locally

```bash
pnpm install
Copy-Item .env.example .env.local
# Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
pnpm dev
```

Open http://localhost:3000 and create an account. See [role setup](docs/ROLE_ADMIN.md) to grant Finance or Approver permissions. AI category suggestions are optional; see [AI setup](docs/AI_CLASSIFICATION.md).

## Provisioning a new project

The Supabase schema is applied through the SQL migrations in `supabase/migrations/`. Vercel needs the same Supabase URL and publishable key as project environment variables. Set `ANTHROPIC_API_KEY` there if AI suggestions are enabled.

## Roles

New accounts can submit and track their own claims. A Supabase project administrator assigns Finance and Approver roles; they cannot be self-assigned. See [role setup](docs/ROLE_ADMIN.md).
