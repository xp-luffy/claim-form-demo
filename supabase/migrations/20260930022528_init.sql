create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  code text not null unique,
  created_at timestamptz not null default now()
);
alter table departments enable row level security;
drop policy if exists "departments_v1_read" on departments;
create policy "departments_v1_read" on departments for select using (true);
drop policy if exists "departments_v1_write" on departments;
create policy "departments_v1_write" on departments for all using (true) with check (true);

create table if not exists claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  voucher_number text unique,
  department_id uuid references departments(id),
  claim_type text not null default 'petty_cash',
  title text not null,
  description text,
  amount numeric(12,2) not null default 0,
  currency text not null default 'MYR',
  status text not null default 'draft' check (status in ('draft','submitted','classified','approved','rejected','paid')),
  is_petty_cash boolean not null default false,
  submitted_at timestamptz,
  classified_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  paid_at timestamptz,
  suggested_category text,
  suggested_category_source text,
  suggested_category_confidence numeric,
  review_status text default 'unreviewed',
  created_at timestamptz not null default now()
);
alter table claims enable row level security;
drop policy if exists "claims_v1_read" on claims;
create policy "claims_v1_read" on claims for select using (true);
drop policy if exists "claims_v1_write" on claims;
create policy "claims_v1_write" on claims for all using (true) with check (true);

create table if not exists claim_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  claim_id uuid not null references claims(id) on delete cascade,
  description text not null,
  category text,
  amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);
alter table claim_items enable row level security;
drop policy if exists "claim_items_v1_read" on claim_items;
create policy "claim_items_v1_read" on claim_items for select using (true);
drop policy if exists "claim_items_v1_write" on claim_items;
create policy "claim_items_v1_write" on claim_items for all using (true) with check (true);

create table if not exists approvals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  claim_id uuid not null references claims(id) on delete cascade,
  decision text not null check (decision in ('approved','rejected')),
  note text,
  created_at timestamptz not null default now()
);
alter table approvals enable row level security;
drop policy if exists "approvals_v1_read" on approvals;
create policy "approvals_v1_read" on approvals for select using (true);
drop policy if exists "approvals_v1_write" on approvals;
create policy "approvals_v1_write" on approvals for all using (true) with check (true);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  claim_id uuid not null references claims(id) on delete cascade,
  amount numeric(12,2) not null default 0,
  method text,
  reference text,
  status text not null default 'pending' check (status in ('pending','released')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
alter table payments enable row level security;
drop policy if exists "payments_v1_read" on payments;
create policy "payments_v1_read" on payments for select using (true);
drop policy if exists "payments_v1_write" on payments;
create policy "payments_v1_write" on payments for all using (true) with check (true);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  detail text,
  created_at timestamptz not null default now()
);
alter table audit_logs enable row level security;
drop policy if exists "audit_logs_v1_read" on audit_logs;
create policy "audit_logs_v1_read" on audit_logs for select using (true);
drop policy if exists "audit_logs_v1_write" on audit_logs;
create policy "audit_logs_v1_write" on audit_logs for all using (true) with check (true);

insert into departments (name, code) values
  ('Finance', 'FIN'),
  ('Human Resources', 'HR'),
  ('Operations', 'OPS'),
  ('Information Technology', 'IT'),
  ('Marketing', 'MKT')
on conflict do nothing;

insert into claims (voucher_number, department_id, claim_type, title, description, amount, status, is_petty_cash, submitted_at, classified_at, approved_at, paid_at) values
  ('VC-2025-001', (select id from departments where code='OPS'), 'petty_cash', 'Office stationery purchase', 'Pens, paper, and folders for weekly use', 150.00, 'paid', true, now() - interval '10 days', now() - interval '9 days', now() - interval '8 days', now() - interval '5 days'),
  ('VC-2025-002', (select id from departments where code='IT'), 'expense', 'Software licenses renewal', 'Annual renewal for team productivity tools', 1200.00, 'approved', false, now() - interval '6 days', now() - interval '5 days', now() - interval '4 days', null),
  ('VC-2025-003', (select id from departments where code='MKT'), 'travel', 'Client visit taxi fares', 'Taxi to KL for client meeting', 85.50, 'classified', false, now() - interval '3 days', now() - interval '2 days', null, null),
  ('VC-2025-004', (select id from departments where code='HR'), 'petty_cash', 'Staff meeting refreshments', 'Tea and snacks for monthly all-hands', 230.00, 'submitted', true, now() - interval '1 day', null, null, null),
  ('VC-2025-005', (select id from departments where code='FIN'), 'expense', 'Printer toner cartridges', 'Replacement toner for office printer', 410.00, 'submitted', false, now() - interval '12 hours', null, null, null)
on conflict do nothing;

insert into claim_items (claim_id, description, category, amount) values
  ((select id from claims where voucher_number='VC-2025-001'), 'Ballpoint pens (box)', 'Stationery', 45.00),
  ((select id from claims where voucher_number='VC-2025-001'), 'A4 paper (5 reams)', 'Stationery', 60.00),
  ((select id from claims where voucher_number='VC-2025-001'), 'Document folders', 'Stationery', 45.00),
  ((select id from claims where voucher_number='VC-2025-002'), 'Productivity suite annual license', 'Software', 1200.00),
  ((select id from claims where voucher_number='VC-2025-003'), 'Taxi fare to KL Sentral', 'Travel', 45.00),
  ((select id from claims where voucher_number='VC-2025-003'), 'Taxi fare return', 'Travel', 40.50),
  ((select id from claims where voucher_number='VC-2025-004'), 'Tea and coffee', 'Meals', 130.00),
  ((select id from claims where voucher_number='VC-2025-004'), 'Snacks and biscuits', 'Meals', 100.00),
  ((select id from claims where voucher_number='VC-2025-005'), 'Toner cartridge black', 'Office Supplies', 210.00),
  ((select id from claims where voucher_number='VC-2025-005'), 'Toner cartridge color', 'Office Supplies', 200.00)
on conflict do nothing;

insert into approvals (claim_id, decision, note) values
  ((select id from claims where voucher_number='VC-2025-001'), 'approved', 'Approved for petty cash reimbursement'),
  ((select id from claims where voucher_number='VC-2025-002'), 'approved', 'Approved for software renewal')
on conflict do nothing;

insert into payments (claim_id, amount, method, reference, status, paid_at) values
  ((select id from claims where voucher_number='VC-2025-001'), 150.00, 'bank_transfer', 'BNI-20250115-001', 'released', now() - interval '5 days')
on conflict do nothing;

insert into audit_logs (entity_type, entity_id, action, detail) values
  ('claim', (select id from claims where voucher_number='VC-2025-001'), 'submit', 'Claim submitted by staff'),
  ('claim', (select id from claims where voucher_number='VC-2025-001'), 'classify', 'Category set to Stationery, petty cash confirmed'),
  ('claim', (select id from claims where voucher_number='VC-2025-001'), 'approve', 'Approved by department head'),
  ('claim', (select id from claims where voucher_number='VC-2025-001'), 'release', 'Payment released via bank transfer ref BNI-20250115-001'),
  ('claim', (select id from claims where voucher_number='VC-2025-002'), 'submit', 'Claim submitted by staff'),
  ('claim', (select id from claims where voucher_number='VC-2025-002'), 'classify', 'Category set to Software'),
  ('claim', (select id from claims where voucher_number='VC-2025-002'), 'approve', 'Approved by department head')
on conflict do nothing;