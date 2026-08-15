-- ============================================================
-- schema_v3_add_size.sql
--
-- 写真のサイズ（小・中・大・おまかせ）を保存できるようにするための
-- 追加だけを行うマイグレーションです。schema_v2.sql は
-- そのままで問題ありません。これだけ追加で実行してください。
-- ============================================================

alter table photos
  add column if not exists size text not null default 'random';

-- size は 'small' / 'medium' / 'large' / 'random' のいずれか
