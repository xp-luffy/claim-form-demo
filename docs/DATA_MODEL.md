# Data Model

## departments
| Field | Type |
|-------|------|
| id | uuid pk |
| user_id | uuid (nullable, for owner-scoping later) |
| name | text not null |
| code | text not null unique |
| created_at | timestamptz default now() |

## claims
| Field | Type |
|-------|------|
| id | uuid pk |
| user_id | uuid nullable |
| voucher_number | text unique |
| department_id | uuid → departments(id) |
| claim_type | text not null (petty_cash / expense / travel / others) |
| title | text not null |
| description | text |
| amount | numeric(12,2) not null default 0 |
| currency | text default 'MYR' |
| status | text not null default 'draft' (draft → submitted → classified → approved → rejected → paid) |
| is_petty_cash | boolean default false |
| submitted_at | timestamptz |
| classified_at | timestamptz |
| approved_at | timestamptz |
| rejected_at | timestamptz |
| paid_at | timestamptz |
| suggested_category | text (AI field — value) |
| suggested_category_source | text (AI field — source) |
| suggested_category_confidence | numeric (AI field — confidence) |
| review_status | text default 'unreviewed' |
| created_at | timestamptz default now() |

**Status constraint:** `check (status in ('draft','submitted','classified','approved','rejected','paid'))`

## claim_items
| Field | Type |
|-------|------|
| id | uuid pk |
| user_id | uuid nullable |
| claim_id | uuid not null → claims(id) cascade |
| description | text not null |
| category | text |
| amount | numeric(12,2) not null default 0 |
| created_at | timestamptz default now() |

## approvals
| Field | Type |
|-------|------|
| id | uuid pk |
| user_id | uuid nullable |
| claim_id | uuid not null → claims(id) cascade |
| decision | text not null (approved / rejected) |
| note | text |
| created_at | timestamptz default now() |

## payments
| Field | Type |
|-------|------|
| id | uuid pk |
| user_id | uuid nullable |
| claim_id | uuid not null → claims(id) cascade |
| amount | numeric(12,2) not null default 0 |
| method | text (bank_transfer / cash / cheque) |
| reference | text |
| status | text not null default 'pending' (pending / released) |
| paid_at | timestamptz |
| created_at | timestamptz default now() |

## audit_logs
| Field | Type |
|-------|------|
| id | uuid pk |
| user_id | uuid nullable |
| entity_type | text not null (claim / payment / approval) |
| entity_id | uuid not null |
| action | text not null (submit / classify / approve / reject / release / edit / delete) |
| detail | text |
| created_at | timestamptz default now() |

## Relationships
```
departments 1───* claims
claims      1───* claim_items
claims      1───* approvals
claims      1───* payments
audit_logs  *───1 (any entity via entity_type + entity_id)
```

## RLS Notes
- v1: permissive read/write for all (demo-first, no login).
- Lock-down sprint: `auth.uid() = user_id` for write; read by department membership or all-staff read.
- AI fields: `suggested_category` is nullable; if confidence < 0.7, `review_status` stays `unreviewed` and finance must confirm.