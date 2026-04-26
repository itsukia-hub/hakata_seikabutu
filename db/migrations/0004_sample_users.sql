-- Meguriai 0004: 開発・デモ用のサンプル相手を固定 UUID で投入
-- 新規ユーザーがオンボーディングを終えると、これらサンプル相手との
-- すれ違い履歴が自動生成される（API 側 /api/dev/seed-encounters）

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_sample BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_users_is_sample ON users(is_sample) WHERE is_sample = true;

-- サンプル相手を ON CONFLICT で冪等投入
INSERT INTO users (id, nickname, profile_summary, profile_detail, profile_extras, recovery_code, is_sample, home_lat, home_lng)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'Bob',
    '通勤途中で見かける気がします',
    '博多区在住。朝のラジオが日課で、休日はカメラを持って街歩き。',
    '{"ageRange":"30s_early","relationshipIntent":"romance","chronotype":"morning","hobbies":["ラジオ","コーヒー","カメラ"],"question1":"いつ頃から通勤されていますか？","question2":"夜の駅のホームの静けさ"}'::jsonb,
    'sample0bob111111',
    true,
    33.6,
    130.42
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Carol',
    '昼はだいたい外で過ごしています',
    '大濠公園そば在住。走ることと植物が好き。週末はマーケットへ。',
    '{"ageRange":"20s_early","relationshipIntent":"friend","chronotype":"day","hobbies":["ランニング","植物","音楽"],"question1":"おすすめの散歩コース教えてほしいです","question2":"雨上がりの植物の匂い"}'::jsonb,
    'sample0carol2222',
    true,
    33.585,
    130.39
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'David',
    '朝のジムが日課です',
    '薬院在住。週末は自炊と日本酒。落ち着いた話が好き。',
    '{"ageRange":"30s_late","relationshipIntent":"marriage","chronotype":"morning","hobbies":["ジム","料理","日本酒"]}'::jsonb,
    'sample0david3333',
    true,
    33.58,
    130.41
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'Emma',
    NULL,
    NULL,
    '{"ageRange":"20s_late","relationshipIntent":"undecided","chronotype":"night"}'::jsonb,
    'sample0emma44444',
    true,
    33.59,
    130.41
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'Fiona',
    '夜の散歩派です',
    '中央区在住。映画とジャズが好き。',
    '{"ageRange":"30s_early","relationshipIntent":"slow","chronotype":"night","hobbies":["映画","夜散歩","ジャズ"],"question1":"夜が好きな理由を聞いてみたいです","question2":"夜中、街灯の下で本を読む人を見たとき"}'::jsonb,
    'sample0fiona5555',
    true,
    33.595,
    130.4
  ),
  (
    '77777777-7777-7777-7777-777777777777',
    'Harry',
    '通勤の電車でよく見ました',
    '南区在住。鉄道好き。最近は引っ越しで忙しい。',
    '{"ageRange":"30s_early","relationshipIntent":"slow","chronotype":"morning","hobbies":["鉄道","写真","ジャズ"],"question1":"ホームのベンチで読書されてましたね","question2":"古い写真をスキャンしているとき"}'::jsonb,
    'sample0harry7777',
    true,
    33.572,
    130.41
  ),
  (
    '88888888-8888-8888-8888-888888888888',
    'Ivy',
    NULL,
    NULL,
    '{"ageRange":"20s_late","relationshipIntent":"undecided","chronotype":"night","hobbies":["古着","陶器"]}'::jsonb,
    'sample0ivy888888',
    true,
    33.61,
    130.42
  )
ON CONFLICT (id) DO NOTHING;
