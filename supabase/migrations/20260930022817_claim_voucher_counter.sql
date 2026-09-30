create table public.claim_voucher_counters (
  voucher_year integer primary key,
  last_number integer not null default 0 check (last_number >= 0)
);

alter table public.claim_voucher_counters enable row level security;
create policy "claim_voucher_counters_v1_write"
  on public.claim_voucher_counters for all using (true) with check (true);

create or replace function public.next_claim_voucher_number()
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_year integer := extract(year from current_date)::integer;
  sequence_number integer;
begin
  insert into public.claim_voucher_counters (voucher_year, last_number)
  values (current_year, 1)
  on conflict (voucher_year) do update
    set last_number = public.claim_voucher_counters.last_number + 1
  returning last_number into sequence_number;

  return format('VC-%s-%s', current_year, lpad(sequence_number::text, 3, '0'));
end;
$$;

grant execute on function public.next_claim_voucher_number() to anon, authenticated;
