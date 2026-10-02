-- Kør dette én gang i Supabase → SQL Editor.
-- Én tabel holder alle synkroniserede poster. Row Level Security sikrer,
-- at hver bruger kun kan læse og skrive sine egne rækker.

create table if not exists public.records (
  user_id    uuid    not null default auth.uid() references auth.users (id) on delete cascade,
  tbl        text    not null,
  id         text    not null,
  data       jsonb   not null,
  updated_at bigint  not null,              -- the client's edit time (used to merge: newest wins)
  deleted    boolean not null default false,
  synced_at  timestamptz not null default now(), -- server time of the last upload (used as pull watermark)
  primary key (user_id, tbl, id)
);

alter table public.records add column if not exists synced_at timestamptz not null default now();
create index if not exists records_user_synced on public.records (user_id, synced_at);

-- Stamp every insert/update with the server's clock, so a device that edited
-- offline and uploads late is still picked up by the other devices.
create or replace function public.records_touch() returns trigger language plpgsql as $$
begin
  new.synced_at := now();
  return new;
end $$;

drop trigger if exists records_touch on public.records;
create trigger records_touch before insert or update on public.records
  for each row execute function public.records_touch();

alter table public.records enable row level security;

drop policy if exists "own rows: select" on public.records;
drop policy if exists "own rows: insert" on public.records;
drop policy if exists "own rows: update" on public.records;
drop policy if exists "own rows: delete" on public.records;

create policy "own rows: select" on public.records for select using (auth.uid() = user_id);
create policy "own rows: insert" on public.records for insert with check (auth.uid() = user_id);
create policy "own rows: update" on public.records for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows: delete" on public.records for delete using (auth.uid() = user_id);
