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
      <header className="mb-10">
        <p className="text-xs tracking-widest text-ink-mute">STEP 1 / 2</p>
        <h1 className="mt-2 text-2xl font-medium text-ink">あなたの呼び名</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          実名は要りません。相手に最初に見えるのはこの呼び名だけです。
        </p>
      </header>

      <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-6">
        <label className="block">
          <span className="text-sm text-ink-soft">ニックネーム</span>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={40}
            required
            className="mt-2 w-full rounded-lg border border-ink-mute/30 bg-paper-card px-4 py-3 text-base outline-none focus:border-accent"
            placeholder="例: しずか"
          />
        </label>

        <label className="block">
          <span className="text-sm text-ink-soft">短い自己紹介（Lv.2 で表示）</span>
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            maxLength={200}
            className="mt-2 w-full rounded-lg border border-ink-mute/30 bg-paper-card px-4 py-3 text-base outline-none focus:border-accent"
            placeholder="例: 朝、同じカフェにいることが多いです"
          />
        </label>

        <label className="block">
          <span className="text-sm text-ink-soft">詳しいプロフィール（Lv.3 / 双方合意で表示）</span>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            maxLength={2000}
            rows={4}
            className="mt-2 w-full resize-none rounded-lg border border-ink-mute/30 bg-paper-card px-4 py-3 text-base outline-none focus:border-accent"
            placeholder="趣味、よくいる場所、好きな本など"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !nickname.trim()}
          className="mt-auto rounded-full bg-ink py-4 text-base font-medium text-paper transition hover:bg-ink-soft disabled:bg-ink-mute"
        >
          {submitting ? '登録中...' : '次へ'}
        </button>
      </form>
    </main>
  );
}
