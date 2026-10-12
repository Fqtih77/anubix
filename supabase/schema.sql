-- Run once in Supabase SQL Editor. The app connects with the database URL on the server.
create table if not exists public.sessions (
  token_hash text primary key,
  expires_at bigint not null
);
create table if not exists public.entries (
  id text primary key,
  kind text not null check (kind in ('notes','quests','calendar')),
  title text not null,
  body text not null default '',
  date_value text,
  done integer not null default 0,
  created_at text not null,
  updated_at text not null
);
create index if not exists entries_kind_date on public.entries(kind, date_value);
create table if not exists public.files (
  id text primary key,
  original_name text not null,
  stored_name text not null,
  mime text not null,
  size integer not null,
  created_at text not null
);
create table if not exists public.messages (
  id text primary key,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at text not null
);
create table if not exists public.settings (key text primary key, value text not null);
create table if not exists public.projects (
  id text primary key,
  title text not null,
  tagline text not null default '',
  status text not null check (status in ('in-progress','completed')),
  period text not null default '',
  summary text not null default '',
  description text not null default '',
  done text not null default '[]',
  planned text not null default '[]',
  tech text not null default '[]',
  github text,
  live text,
  live_note text,
  accent text not null,
  accent2 text not null,
  cover text not null default 'letter' check (cover in ('anubix','letter')),
  image_file text,
  image_mime text,
  image_alt text,
  sort_order integer not null default 0,
  published integer not null default 1,
  created_at text not null,
  updated_at text not null
);
create index if not exists projects_order on public.projects(sort_order);

-- No browser key gets table access. Only the server's database connection uses these tables.
alter table public.sessions enable row level security;
alter table public.entries enable row level security;
alter table public.files enable row level security;
alter table public.messages enable row level security;
alter table public.settings enable row level security;
alter table public.projects enable row level security;
revoke all on public.sessions, public.entries, public.files, public.messages, public.settings, public.projects from anon, authenticated;

insert into storage.buckets (id, name, public)
values ('anubix-private', 'anubix-private', false)
on conflict (id) do nothing;
