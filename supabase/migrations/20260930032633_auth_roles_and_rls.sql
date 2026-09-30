-- Authentication and workflow permissions for Sprint 5.
-- All workflow mutations are narrow SECURITY DEFINER RPCs. Public API roles
-- receive read access through RLS and cannot directly mutate workflow rows.

create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('approver', 'finance')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);
alter table public.user_roles enable row level security;
drop policy if exists user_roles_read_self on public.user_roles;
create policy user_roles_read_self on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_claim_role(required_role text)
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select auth.uid() is not null and exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = required_role
  );
$$;
revoke all on function public.has_claim_role(text) from public, anon;
grant execute on function public.has_claim_role(text) to authenticated;

create or replace function public.can_read_claim(claim_id uuid)
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select auth.uid() is not null and exists (
    select 1 from public.claims c
    where c.id = claim_id and (
      c.user_id = auth.uid()
      or public.has_claim_role('finance')
      or public.has_claim_role('approver')
    )
  );
$$;
revoke all on function public.can_read_claim(uuid) from public, anon;
grant execute on function public.can_read_claim(uuid) to authenticated;

drop policy if exists claim_voucher_counters_v1_write on public.claim_voucher_counters;
create or replace function public.next_claim_voucher_number()
returns text
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  current_year integer := extract(year from current_date)::integer;
  sequence_number integer;
begin
  if auth.uid() is null then raise exception 'Sign in before submitting a claim'; end if;
  insert into public.claim_voucher_counters (voucher_year, last_number)
  values (current_year, 1)
  on conflict (voucher_year) do update
    set last_number = public.claim_voucher_counters.last_number + 1
  returning last_number into sequence_number;
  return format('VC-%s-%s', current_year, lpad(sequence_number::text, 3, '0'));
end;
$$;
revoke all on function public.next_claim_voucher_number() from public, anon;
grant execute on function public.next_claim_voucher_number() to authenticated;
revoke all on public.claim_voucher_counters from anon, authenticated;

create or replace function public.submit_claim(
  p_department_id uuid,
  p_claim_type text,
  p_title text,
  p_description text,
  p_is_petty_cash boolean,
  p_items jsonb
)
returns uuid
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  claim_id uuid := gen_random_uuid();
  voucher text;
  item jsonb;
  item_description text;
  item_amount numeric(12,2);
  total numeric(12,2) := 0;
begin
  if actor is null then raise exception 'Sign in before submitting a claim'; end if;
  if p_title is null or length(btrim(p_title)) not between 1 and 120 then raise exception 'Enter a claim title under 120 characters'; end if;
  if p_description is not null and length(p_description) > 1000 then raise exception 'Keep the description under 1,000 characters'; end if;
  if p_claim_type is null or p_claim_type not in ('petty_cash', 'expense', 'travel', 'others') then raise exception 'Choose a valid claim type'; end if;
  if not exists (select 1 from public.departments where id = p_department_id) then raise exception 'Choose a valid department'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then raise exception 'Add between one and twenty line items'; end if;
  if jsonb_array_length(p_items) not between 1 and 20 then raise exception 'Add between one and twenty line items'; end if;

  for item in select value from jsonb_array_elements(p_items) loop
    item_description := btrim(item->>'description');
    begin item_amount := (item->>'amount')::numeric(12,2);
    exception when others then raise exception 'Each line item needs a valid amount'; end;
    if item_description is null or length(item_description) not between 1 and 200 or item_amount is null or item_amount <= 0 or item_amount::text in ('NaN', 'Infinity', '-Infinity') then
      raise exception 'Each line item needs a description and a positive amount';
    end if;
    total := total + item_amount;
  end loop;
  if total <= 0 or total::text in ('NaN', 'Infinity', '-Infinity') then raise exception 'Enter a valid positive claim amount'; end if;

  voucher := public.next_claim_voucher_number();
  insert into public.claims (id, user_id, voucher_number, department_id, claim_type, title, description, amount, currency, status, is_petty_cash, submitted_at)
  values (claim_id, actor, voucher, p_department_id, p_claim_type, btrim(p_title), nullif(btrim(p_description), ''), total, 'MYR', 'submitted', coalesce(p_is_petty_cash, false), now());

  for item in select value from jsonb_array_elements(p_items) loop
    insert into public.claim_items (user_id, claim_id, description, amount)
    values (actor, claim_id, btrim(item->>'description'), (item->>'amount')::numeric(12,2));
  end loop;

  insert into public.audit_logs (user_id, entity_type, entity_id, action, detail)
  values (actor, 'claim', claim_id, 'submit', jsonb_build_object('voucher_number', voucher, 'actor', 'claimant')::text);
  return claim_id;
end;
$$;

create or replace function public.save_claim_suggestion(
  p_claim_id uuid,
  p_category text,
  p_confidence numeric,
  p_source text
)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then raise exception 'Sign in before saving a suggestion'; end if;
  if p_category is not null and (length(btrim(p_category)) not between 1 and 80 or p_confidence is null or p_confidence < 0 or p_confidence > 1) then
    raise exception 'Invalid category suggestion';
  end if;
  if p_category is null and p_confidence is not null then raise exception 'Confidence must be empty when there is no category'; end if;
  update public.claims
  set suggested_category = nullif(btrim(p_category), ''),
      suggested_category_confidence = p_confidence,
      suggested_category_source = p_source,
      review_status = 'unreviewed'
  where id = p_claim_id and user_id = auth.uid() and status = 'submitted';
  if not found then raise exception 'Claim not found or no longer awaiting review'; end if;
end;
$$;

create or replace function public.classify_claim(p_claim_id uuid, p_category text, p_is_petty_cash boolean)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  current_suggestion text;
begin
  if actor is null or not public.has_claim_role('finance') then raise exception 'Finance role required'; end if;
  if p_category is null or length(btrim(p_category)) not between 1 and 80 then raise exception 'Enter a valid category'; end if;
  select suggested_category into current_suggestion from public.claims where id = p_claim_id and status = 'submitted' for update;
  if not found then raise exception 'Claim must be submitted before classification'; end if;
  update public.claim_items set category = btrim(p_category) where claim_id = p_claim_id;
  update public.claims set status = 'classified', is_petty_cash = p_is_petty_cash, classified_at = now(),
    review_status = case when current_suggestion is null then 'manual' when lower(current_suggestion) = lower(btrim(p_category)) then 'accepted' else 'overridden' end
  where id = p_claim_id;
  insert into public.audit_logs (user_id, entity_type, entity_id, action, detail)
  values (actor, 'claim', p_claim_id, 'classify', jsonb_build_object('category', btrim(p_category), 'is_petty_cash', p_is_petty_cash)::text);
end;
$$;

create or replace function public.decide_claim(p_claim_id uuid, p_decision text, p_note text)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare actor uuid := auth.uid();
begin
  if actor is null or not public.has_claim_role('approver') then raise exception 'Approver role required'; end if;
  if p_decision is null or p_decision not in ('approved', 'rejected') then raise exception 'Choose approve or reject'; end if;
  if p_note is not null and length(p_note) > 500 then raise exception 'Keep the decision note under 500 characters'; end if;
  update public.claims set status = p_decision,
    approved_at = case when p_decision = 'approved' then now() else null end,
    rejected_at = case when p_decision = 'rejected' then now() else null end
  where id = p_claim_id and status = 'classified';
  if not found then raise exception 'Claim must be classified before a decision'; end if;
  insert into public.approvals (user_id, claim_id, decision, note)
  values (actor, p_claim_id, p_decision, nullif(btrim(p_note), ''));
  insert into public.audit_logs (user_id, entity_type, entity_id, action, detail)
  values (actor, 'claim', p_claim_id, case when p_decision = 'approved' then 'approve' else 'reject' end,
    jsonb_build_object('note', nullif(btrim(p_note), ''))::text);
end;
$$;

create or replace function public.release_claim_payment(p_claim_id uuid, p_method text, p_reference text)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  claim_amount numeric(12,2);
  paid_time timestamptz := now();
begin
  if actor is null or not public.has_claim_role('finance') then raise exception 'Finance role required'; end if;
  if p_method is null or p_method not in ('bank_transfer', 'cash', 'cheque') or p_reference is null or length(btrim(p_reference)) not between 1 and 80 then
    raise exception 'Choose a payment method and enter its reference';
  end if;
  select amount into claim_amount from public.claims where id = p_claim_id and status = 'approved' for update;
  if not found then raise exception 'Claim must be approved before payment'; end if;
  insert into public.payments (user_id, claim_id, amount, method, reference, status, paid_at)
  values (actor, p_claim_id, claim_amount, p_method, btrim(p_reference), 'released', paid_time);
  update public.claims set status = 'paid', paid_at = paid_time where id = p_claim_id;
  insert into public.audit_logs (user_id, entity_type, entity_id, action, detail)
  values (actor, 'claim', p_claim_id, 'release', jsonb_build_object('method', p_method, 'reference', btrim(p_reference), 'amount', claim_amount)::text);
end;
$$;

revoke all on function public.submit_claim(uuid, text, text, text, boolean, jsonb) from public, anon;
revoke all on function public.save_claim_suggestion(uuid, text, numeric, text) from public, anon;
revoke all on function public.classify_claim(uuid, text, boolean) from public, anon;
revoke all on function public.decide_claim(uuid, text, text) from public, anon;
revoke all on function public.release_claim_payment(uuid, text, text) from public, anon;
grant execute on function public.submit_claim(uuid, text, text, text, boolean, jsonb) to authenticated;
grant execute on function public.save_claim_suggestion(uuid, text, numeric, text) to authenticated;
grant execute on function public.classify_claim(uuid, text, boolean) to authenticated;
grant execute on function public.decide_claim(uuid, text, text) to authenticated;
grant execute on function public.release_claim_payment(uuid, text, text) to authenticated;

alter table public.departments enable row level security;
alter table public.claims enable row level security;
alter table public.claim_items enable row level security;
alter table public.approvals enable row level security;
alter table public.payments enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists departments_v1_read on public.departments;
drop policy if exists departments_v1_write on public.departments;
drop policy if exists claims_v1_read on public.claims;
drop policy if exists claims_v1_write on public.claims;
drop policy if exists claim_items_v1_read on public.claim_items;
drop policy if exists claim_items_v1_write on public.claim_items;
drop policy if exists approvals_v1_read on public.approvals;
drop policy if exists approvals_v1_write on public.approvals;
drop policy if exists payments_v1_read on public.payments;
drop policy if exists payments_v1_write on public.payments;
drop policy if exists audit_logs_v1_read on public.audit_logs;
drop policy if exists audit_logs_v1_write on public.audit_logs;

create policy departments_staff_read on public.departments for select to authenticated using (true);
create policy departments_finance_insert on public.departments for insert to authenticated with check (public.has_claim_role('finance'));
create policy departments_finance_update on public.departments for update to authenticated using (public.has_claim_role('finance')) with check (public.has_claim_role('finance'));
create policy departments_finance_delete on public.departments for delete to authenticated using (public.has_claim_role('finance'));
create policy claims_owner_or_reviewer_read on public.claims for select to authenticated using (public.can_read_claim(id));
create policy claim_items_authorized_read on public.claim_items for select to authenticated using (public.can_read_claim(claim_id));
create policy approvals_authorized_read on public.approvals for select to authenticated using (public.can_read_claim(claim_id));
create policy payments_authorized_read on public.payments for select to authenticated using (public.can_read_claim(claim_id));
create policy audit_authorized_read on public.audit_logs for select to authenticated using (entity_type = 'claim' and public.can_read_claim(entity_id));

revoke all on public.departments, public.claims, public.claim_items, public.approvals, public.payments, public.audit_logs, public.user_roles from anon;
revoke insert, update, delete, truncate, references, trigger on public.claims, public.claim_items, public.approvals, public.payments, public.audit_logs, public.user_roles from authenticated;
grant select on public.departments, public.claims, public.claim_items, public.approvals, public.payments, public.audit_logs, public.user_roles to authenticated;
grant insert, update, delete on public.departments to authenticated;
