-- Support common nested lookups and keep auth.uid() work outside row loops.
create index if not exists claims_user_id_idx on public.claims(user_id);
create index if not exists claims_department_id_idx on public.claims(department_id);
create index if not exists claim_items_claim_id_idx on public.claim_items(claim_id);
create index if not exists approvals_claim_id_idx on public.approvals(claim_id);
create index if not exists payments_claim_id_idx on public.payments(claim_id);
create index if not exists audit_logs_claim_timeline_idx on public.audit_logs(entity_type, entity_id, created_at);

drop policy if exists user_roles_read_self on public.user_roles;
create policy user_roles_read_self on public.user_roles for select to authenticated
using (user_id = (select auth.uid()));

alter table public.claims
  add constraint claims_amount_finite check (amount::text not in ('NaN', 'Infinity', '-Infinity')) not valid;
alter table public.claim_items
  add constraint claim_items_amount_finite check (amount::text not in ('NaN', 'Infinity', '-Infinity')) not valid;
alter table public.payments
  add constraint payments_amount_finite check (amount::text not in ('NaN', 'Infinity', '-Infinity')) not valid;
alter table public.claims validate constraint claims_amount_finite;
alter table public.claim_items validate constraint claim_items_amount_finite;
alter table public.payments validate constraint payments_amount_finite;
