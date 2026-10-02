-- Kør dette én gang i Supabase → SQL Editor.
-- Én tabel holder alle synkroniserede poster. Row Level Security sikrer,
-- at hver bruger kun kan læse og skrive sine egne rækker.

create table if not exists public.records (
  user_id    uuid    not null default auth.uid() references auth.users (id) on delete cascade,
  tbl        text    not null,
  id         text    not null,
  data       jsonb   not null,
  updated_at bigint  not null,
  deleted    boolean not null default false,
  primary key (user_id, tbl, id)
);

create index if not exists records_user_updated on public.records (user_id, updated_at);

alter table public.records enable row level security;

drop policy if exists "own rows: select" on public.records;
drop policy if exists "own rows: insert" on public.records;
drop policy if exists "own rows: update" on public.records;
drop policy if exists "own rows: delete" on public.records;

create policy "own rows: select" on public.records for select using (auth.uid() = user_id);
create policy "own rows: insert" on public.records for insert with check (auth.uid() = user_id);
create policy "own rows: update" on public.records for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows: delete" on public.records for delete using (auth.uid() = user_id);
