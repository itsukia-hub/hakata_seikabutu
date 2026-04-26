-- Meguriai 0003: リカバリーコードを追加
-- ログイン機能の代わりに、ユーザー作成時に発行する復元コード。
-- 別端末・ブラウザクリア後の引き継ぎに使う。

ALTER TABLE users ADD COLUMN IF NOT EXISTS recovery_code TEXT;

-- 既存ユーザーに自動付与（uuid v4 の先頭16文字）
UPDATE users
SET recovery_code = SUBSTRING(REPLACE(uuid_generate_v4()::text, '-', ''), 1, 16)
WHERE recovery_code IS NULL;

-- NOT NULL + UNIQUE 制約
ALTER TABLE users ALTER COLUMN recovery_code SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_recovery_code_key'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_recovery_code_key UNIQUE (recovery_code);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_recovery_code ON users(recovery_code);
