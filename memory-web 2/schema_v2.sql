-- ============================================================
-- schema_v2.sql
-- 「テーマ／デート」構造を廃止し、年月日順の写真・
-- 誰でも編集できる文言（ノート）・年ごとのプレイリストに
-- 作り直したスキーマです。
--
-- 以前 schema.sql を実行済みの場合も、これをそのまま
-- SQL Editor に貼り付けて実行すれば置き換わります。
-- （古い themes / groups は削除されます。comments はそのまま残ります）
-- ============================================================

create extension if not exists "uuid-ossp";

drop table if exists photos cascade;
drop table if exists groups cascade;
drop table if exists themes cascade;

-- 写真・動画（年月日順に並べる）
create table photos (
  id uuid primary key default uuid_generate_v4(),
  community text not null,              -- 'family' / 'friend' / 'boyfriend'
  photo_date date not null,
  year int not null,
  url text not null,
  media_type text not null default 'image', -- 'image' / 'video'
  caption text,
  sort_order int default 0,
  created_at timestamptz default now()
);
create index on photos (community, year, photo_date);

-- 文言（写真の合間に挟む説明文。誰でも編集できる）
create table notes (
  id uuid primary key default uuid_generate_v4(),
  community text not null,
  note_date date not null,
  year int not null,
  body text not null,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on notes (community, year, note_date);

-- 年ごとのプレイリスト
create table playlist_tracks (
  id uuid primary key default uuid_generate_v4(),
  community text not null,
  year int not null,
  url text not null,
  title text,
  sort_order int default 0,
  created_at timestamptz default now()
);
create index on playlist_tracks (community, year);

-- コメント（写真につける。以前からある表なので、無ければ作成）
create table if not exists comments (
  id uuid primary key default uuid_generate_v4(),
  community text not null,
  target_type text not null,            -- 'photo'
  target_id uuid not null,
  author_name text,
  body text not null,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table photos enable row level security;
alter table notes enable row level security;
alter table playlist_tracks enable row level security;
alter table comments enable row level security;

drop policy if exists "photos_all" on photos;
drop policy if exists "notes_all" on notes;
drop policy if exists "playlist_all" on playlist_tracks;
drop policy if exists "comments_all" on comments;

create policy "photos_all" on photos for all using (true) with check (true);
create policy "notes_all" on notes for all using (true) with check (true);
create policy "playlist_all" on playlist_tracks for all using (true) with check (true);
create policy "comments_all" on comments for all using (true) with check (true);
