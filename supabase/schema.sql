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

-- ---------------------------------------------------------------------------
-- Egne kurser ("Tilføj kursus"): én række pr. kursus + selve kursusfilen i
-- den private Storage-bucket "courses" under <bruger-id>/<slug>.md.
-- Kun ejeren kan se, ændre og slette sine kurser.

create table if not exists public.courses (
  owner      uuid    not null default auth.uid() references auth.users (id) on delete cascade,
  slug       text    not null check (slug ~ '^[a-z0-9][a-z0-9-]{1,40}$'),
  title      text    not null default '',
  file_name  text    not null default '',
  hash       text    not null default '',
  hidden     boolean not null default false,
  deleted    boolean not null default false,
  updated_at bigint  not null,
  primary key (owner, slug)
);

alter table public.courses enable row level security;

drop policy if exists "own courses: select" on public.courses;
drop policy if exists "own courses: insert" on public.courses;
drop policy if exists "own courses: update" on public.courses;
drop policy if exists "own courses: delete" on public.courses;

create policy "own courses: select" on public.courses for select using ((select auth.uid()) = owner);
create policy "own courses: insert" on public.courses for insert with check ((select auth.uid()) = owner);
create policy "own courses: update" on public.courses for update using ((select auth.uid()) = owner) with check ((select auth.uid()) = owner);
create policy "own courses: delete" on public.courses for delete using ((select auth.uid()) = owner);

-- Privat bucket til kursusfilerne (højst 5 MB pr. fil, kun tekst).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('courses', 'courses', false, 5242880, array['text/markdown', 'text/plain'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "own course files: select" on storage.objects;
drop policy if exists "own course files: insert" on storage.objects;
drop policy if exists "own course files: update" on storage.objects;
drop policy if exists "own course files: delete" on storage.objects;

-- Filen skal ligge i en mappe med brugerens eget id: <uid>/<slug>.md
create policy "own course files: select" on storage.objects for select to authenticated
  using (bucket_id = 'courses' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "own course files: insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'courses' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "own course files: update" on storage.objects for update to authenticated
  using (bucket_id = 'courses' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "own course files: delete" on storage.objects for delete to authenticated
  using (bucket_id = 'courses' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---------------------------------------------------------------- the code judge
-- Hidden tests and reference solutions of the site's coding problems. Written
-- by the deploy workflow (service role); no policies, so no learner can read them.
create table if not exists public.problem_tests (
  id text primary key,
  course text not null,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.problem_tests enable row level security;

-- One row per call to the judge, for the rate limit (only the Edge Function reads and writes it).
create table if not exists public.judge_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  ts timestamptz not null default now()
);
create index if not exists judge_usage_user_ts on public.judge_usage (user_id, ts);
alter table public.judge_usage enable row level security;

-- Submission history as judged on the server; each learner can read their own.
create table if not exists public.submissions (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  problem_id text not null,
  language text not null,
  verdict text not null check (verdict in ('AC', 'WA', 'TLE', 'MLE', 'RE', 'CE')),
  passed int not null default 0,
  total int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.submissions enable row level security;
drop policy if exists "own submissions" on public.submissions;
create policy "own submissions" on public.submissions for select using ((select auth.uid()) = user_id);
