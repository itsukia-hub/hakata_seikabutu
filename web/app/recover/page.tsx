'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ApiError, recoverByCode } from '@/lib/api';
import { setUserId } from '@/lib/session';

export default function RecoverPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const user = await recoverByCode(code.trim());
      setUserId(user.id);
      router.push('/encounters');
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError('このコードに対応するアカウントが見つかりませんでした。');
      } else {
        setError((err as Error).message);
      }
      setSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col py-8">
      <header className="mb-8">
        <Link href="/" className="mb-6 inline-block text-xs text-ink-mute hover:text-ink-soft">
          ← 戻る
        </Link>
        <p className="text-xs tracking-widest text-ink-mute">RECOVER</p>
        <h1 className="mt-2 text-2xl font-medium tracking-tight text-ink">
          コードで戻る
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          以前の端末で受け取った復元コードを入力してください。
        </p>
      </header>

      <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-5">
        <label className="block">
          <span className="text-xs tracking-wider text-ink-mute">RECOVERY CODE</span>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={64}
            required
            inputMode="text"
            autoCapitalize="off"
            autoComplete="off"
            spellCheck={false}
            className="mt-2 w-full rounded-lg border border-ink-mute/30 bg-paper-card px-4 py-3 font-mono text-base tracking-[0.15em] outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            placeholder="0000000000000000"
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
            disabled={submitting || !code.trim()}
            className="w-full rounded-full bg-ink py-4 text-base font-medium tracking-wider text-paper shadow-sm transition hover:bg-ink-soft hover:shadow-md disabled:bg-ink-mute"
          >
            {submitting ? '確認中...' : 'このアカウントに戻る'}
          </button>
          <p className="text-center text-[10px] tracking-widest text-ink-mute">
            連絡先（メール・SMS）は送られません
          </p>
        </div>
      </form>
    </main>
  );
}
