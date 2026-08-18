-- ============================================================
-- notify_setup.sql
-- 通知機能に必要な表を追加するだけの、安全な追加専用SQLです。
-- 既存の表（photos, notes, comments など）には一切触れません。
-- SQL Editor で実行してください。
-- ============================================================

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  community text not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);

alter table push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_all" on push_subscriptions;
create policy "push_subscriptions_all" on push_subscriptions for all using (true) with check (true);
