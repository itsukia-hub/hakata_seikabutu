'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createUser,
  type AgeRange,
  type Chronotype,
  type RelationshipIntent,
} from '@/lib/api';
import { setUserId } from '@/lib/session';
import {
  AGE_RANGE_OPTIONS,
  CHRONOTYPE_OPTIONS,
  RELATIONSHIP_OPTIONS,
} from '@/lib/labels';

const IS_DEV = process.env.NODE_ENV !== 'production';

export default function OnboardingPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [summary, setSummary] = useState('');
  const [detail, setDetail] = useState('');

  // 質問項目
  const [ageRange, setAgeRange] = useState<AgeRange | ''>('');
  const [relationshipIntent, setRelationshipIntent] = useState<RelationshipIntent | ''>('');
  const [chronotype, setChronotype] = useState<Chronotype | ''>('');
  const [hobbies, setHobbies] = useState('');
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');

  // 開発モード時のみフォーム初期値をプリフィル（hydration後）
  useEffect(() => {
    if (!IS_DEV) return;
    const suffix = Math.random().toString(36).slice(2, 5);
    setNickname((v) => v || `dev_${suffix}`);
    setSummary((v) => v || '朝、同じカフェに通っています');
    setDetail((v) => v || '本と植物が好き。週末は近所を散歩して1日が終わります。最近は北欧文学が気になっていて、静かなカフェで少しずつ読み進めています。');
    setAgeRange((v) => v || '20s_late');
    setRelationshipIntent((v) => v || 'slow');
    setChronotype((v) => v || 'morning');
    setHobbies((v) => v || '読書, カフェ巡り, 植物');
    setQ1((v) => v || 'いつも同じカフェにいらっしゃいますね、行きつけはありますか？');
    setQ2((v) => v || '書店で偶然手にとった本の最初の一文が、ふいに良かったとき');
  }, []);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nickname.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const hobbyList = hobbies
        .split(/[,、]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 20);

      const profileExtras: Record<string, unknown> = {};
      if (ageRange) profileExtras.ageRange = ageRange;
      if (relationshipIntent) profileExtras.relationshipIntent = relationshipIntent;
      if (chronotype) profileExtras.chronotype = chronotype;
      if (hobbyList.length) profileExtras.hobbies = hobbyList;
      if (q1.trim()) profileExtras.question1 = q1.trim();
      if (q2.trim()) profileExtras.question2 = q2.trim();

      const user = await createUser({
        nickname: nickname.trim(),
        profileSummary: summary.trim() || null,
        profileDetail: detail.trim() || null,
        profileExtras: Object.keys(profileExtras).length
          ? (profileExtras as Parameters<typeof createUser>[0]['profileExtras'])
          : undefined,
      });
      setUserId(user.id);
      router.push('/onboarding/home');
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col py-8">
      <header className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-1 flex-1 rounded-full bg-ink" />
          <span className="h-1 flex-1 rounded-full bg-ink-mute/30" />
        </div>
        <p className="text-xs tracking-widest text-ink-mute">STEP 1 / 2</p>
        <h1 className="mt-2 text-2xl font-medium tracking-tight text-ink">
          あなたのこと
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          実名は要りません。
          <br />
          すべて、必要な分だけ少しずつ開示されます。
        </p>
      </header>

      <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-5">
        {/* 必須: ニックネーム */}
        <label className="block">
          <span className="text-xs tracking-wider text-ink-mute">NICKNAME *</span>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={40}
            required
            className="mt-2 w-full rounded-lg border border-ink-mute/30 bg-paper-card px-4 py-3 text-base outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            placeholder="しずか / そら / もり ..."
          />
        </label>

        {/* Lv.2 で開示される項目群 */}
        <fieldset className="space-y-4 rounded-xl border border-ink-mute/15 bg-paper-card/50 p-4">
          <legend className="px-2 text-[10px] tracking-widest text-ink-mute">
            LV.2 でお互いに見える · 3回すれ違ったら
          </legend>

          <label className="block">
            <span className="text-xs tracking-wider text-ink-mute">年代</span>
            <select
              value={ageRange}
              onChange={(e) => setAgeRange(e.target.value as AgeRange)}
              className="mt-2 w-full appearance-none rounded-lg border border-ink-mute/30 bg-paper-card px-4 py-3 text-base outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              <option value="">未選択</option>
              {AGE_RANGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs tracking-wider text-ink-mute">求める関係</span>
            <select
              value={relationshipIntent}
              onChange={(e) => setRelationshipIntent(e.target.value as RelationshipIntent)}
              className="mt-2 w-full appearance-none rounded-lg border border-ink-mute/30 bg-paper-card px-4 py-3 text-base outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              <option value="">未選択</option>
              {RELATIONSHIP_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs tracking-wider text-ink-mute">朝型 / 夜型</span>
            <select
              value={chronotype}
              onChange={(e) => setChronotype(e.target.value as Chronotype)}
              className="mt-2 w-full appearance-none rounded-lg border border-ink-mute/30 bg-paper-card px-4 py-3 text-base outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              <option value="">未選択</option>
              {CHRONOTYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs tracking-wider text-ink-mute">
              興味・趣味（カンマ区切り、最大20個）
            </span>
            <input
              type="text"
              value={hobbies}
              onChange={(e) => setHobbies(e.target.value)}
              maxLength={400}
              className="mt-2 w-full rounded-lg border border-ink-mute/30 bg-paper-card px-4 py-3 text-base outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="読書, 散歩, カフェ巡り"
            />
          </label>

          <label className="block">
            <span className="text-xs tracking-wider text-ink-mute">短い自己紹介</span>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              maxLength={200}
              className="mt-2 w-full rounded-lg border border-ink-mute/30 bg-paper-card px-4 py-3 text-base outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="朝、同じカフェにいることが多いです"
            />
          </label>
        </fieldset>

        {/* Lv.3 で開示される項目群 */}
        <fieldset className="space-y-4 rounded-xl border border-accent/30 bg-accent/5 p-4">
          <legend className="px-2 text-[10px] tracking-widest text-accent">
            LV.3 でお互いに見える · 双方の合意があったら
          </legend>

          <label className="block">
            <span className="text-xs tracking-wider text-ink-soft">
              合意したら、最初に話したいこと
            </span>
            <textarea
              value={q1}
              onChange={(e) => setQ1(e.target.value)}
              maxLength={500}
              rows={3}
              className="mt-2 w-full resize-none rounded-lg border border-ink-mute/30 bg-paper-card px-4 py-3 text-base outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="例: いつも同じカフェですれ違っていますね、行きつけはありますか？"
            />
          </label>

          <label className="block">
            <span className="text-xs tracking-wider text-ink-soft">
              最近、心が動いた瞬間
            </span>
            <textarea
              value={q2}
              onChange={(e) => setQ2(e.target.value)}
              maxLength={500}
              rows={3}
              className="mt-2 w-full resize-none rounded-lg border border-ink-mute/30 bg-paper-card px-4 py-3 text-base outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="例: 書店で偶然手にとった本の最初の一文"
            />
          </label>

          <label className="block">
            <span className="text-xs tracking-wider text-ink-soft">
              詳しいプロフィール
            </span>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              maxLength={2000}
              rows={4}
              className="mt-2 w-full resize-none rounded-lg border border-ink-mute/30 bg-paper-card px-4 py-3 text-base outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="価値観、よくいる場所、好きな本など"
            />
          </label>
        </fieldset>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="space-y-3">
          <button
            type="submit"
            disabled={submitting || !nickname.trim()}
            className="w-full rounded-full bg-ink py-4 text-base font-medium tracking-wider text-paper shadow-sm transition hover:bg-ink-soft hover:shadow-md disabled:bg-ink-mute"
          >
            {submitting ? '登録中...' : '次へ'}
          </button>
          <p className="text-center text-[10px] tracking-widest text-ink-mute">
            * 以外は任意。後から変更できます（予定）。
          </p>
        </div>
      </form>
    </main>
  );
}
