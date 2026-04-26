'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUser } from '@/lib/api';
import { setUserId } from '@/lib/session';

export default function OnboardingPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [summary, setSummary] = useState('');
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nickname.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const user = await createUser({
        nickname: nickname.trim(),
        profileSummary: summary.trim() || null,
        profileDetail: detail.trim() || null,
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
      <header className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-1 flex-1 rounded-full bg-ink" />
          <span className="h-1 flex-1 rounded-full bg-ink-mute/30" />
        </div>
        <p className="text-xs tracking-widest text-ink-mute">STEP 1 / 2</p>
        <h1 className="mt-2 text-2xl font-medium tracking-tight text-ink">
          あなたの呼び名
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          実名は要りません。
          <br />
          相手に最初に見えるのは、この呼び名だけです。
        </p>
      </header>

      <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-5">
        <label className="block">
          <span className="text-xs tracking-wider text-ink-mute">NICKNAME</span>
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

        <label className="block">
          <span className="text-xs tracking-wider text-ink-mute">
            自己紹介（Lv.2 で開示）
          </span>
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            maxLength={200}
            className="mt-2 w-full rounded-lg border border-ink-mute/30 bg-paper-card px-4 py-3 text-base outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            placeholder="朝、同じカフェにいることが多いです"
          />
        </label>

        <label className="block">
          <span className="text-xs tracking-wider text-ink-mute">
            詳しいプロフィール（Lv.3 / 双方合意で開示）
          </span>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            maxLength={2000}
            rows={4}
            className="mt-2 w-full resize-none rounded-lg border border-ink-mute/30 bg-paper-card px-4 py-3 text-base outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            placeholder="趣味、よくいる場所、好きな本、価値観 ..."
          />
        </label>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-auto space-y-3">
          <button
            type="submit"
            disabled={submitting || !nickname.trim()}
            className="w-full rounded-full bg-ink py-4 text-base font-medium tracking-wider text-paper shadow-sm transition hover:bg-ink-soft hover:shadow-md disabled:bg-ink-mute"
          >
            {submitting ? '登録中...' : '次へ'}
          </button>
          <p className="text-center text-[10px] tracking-widest text-ink-mute">
            この情報は段階開示されます。一度に見せません。
          </p>
        </div>
      </form>
    </main>
  );
}
