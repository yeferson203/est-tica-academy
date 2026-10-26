create table public.privacy_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  policy_version text not null,
  accepted_at timestamptz not null default now(),
  unique (user_id, policy_version)
);

alter table public.privacy_consents enable row level security;
grant select, insert on public.privacy_consents to authenticated;
grant all on public.privacy_consents to service_role;

create policy "users read own privacy consents"
  on public.privacy_consents
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "users record own privacy consent"
  on public.privacy_consents
  for insert
  to authenticated
  with check (user_id = auth.uid());
