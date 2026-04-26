-- Meguriai 初期スキーマ
-- 実装計画 v1 §4 データモデル準拠

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ユーザー
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nickname TEXT NOT NULL,
    icon_url TEXT,
    profile_summary TEXT,
    profile_detail TEXT,
    home_lat NUMERIC(9, 6),
    home_lng NUMERIC(9, 6),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- すれ違い記録（user_a_id < user_b_id で正規化）
CREATE TABLE IF NOT EXISTS encounters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_a_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_b_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    count INTEGER NOT NULL DEFAULT 1,
    last_encountered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_counted_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_user_order CHECK (user_a_id < user_b_id),
    UNIQUE (user_a_id, user_b_id)
);

CREATE INDEX IF NOT EXISTS idx_encounters_user_a ON encounters(user_a_id);
CREATE INDEX IF NOT EXISTS idx_encounters_user_b ON encounters(user_b_id);

-- 合意（アプローチ解禁後の Lv.3 詳細プロフィール開示用）
CREATE TABLE IF NOT EXISTS agreements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    user_a_agreed_at TIMESTAMPTZ,
    user_b_agreed_at TIMESTAMPTZ,
    unlocked_at TIMESTAMPTZ,
    expired_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (encounter_id)
);

-- サイレントリジェクト
CREATE TABLE IF NOT EXISTS silent_rejects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rejector_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rejected_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (rejector_id, rejected_id)
);

CREATE INDEX IF NOT EXISTS idx_silent_rejects_rejector ON silent_rejects(rejector_id);

-- 通報
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_id);
