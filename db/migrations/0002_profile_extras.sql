-- Meguriai 0002: プロフィール質問項目を追加
-- profile_extras に下記を JSON で格納:
--   ageRange (string), relationshipIntent (string), chronotype (string),
--   hobbies (string[]), question1 (string), question2 (string)
-- Lv.2 で開示: ageRange, relationshipIntent, chronotype, hobbies
-- Lv.3 で開示: question1, question2

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS profile_extras JSONB NOT NULL DEFAULT '{}'::jsonb;
