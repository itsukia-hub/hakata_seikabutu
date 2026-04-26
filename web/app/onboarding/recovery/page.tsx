'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingRecoveryPage() {
  const router = useRouter();
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    const c = sessionStorage.getItem('meguriai.recoveryCode');
    if (!c) {
      router.replace('/');
      return;
    }
    setCode(c);
  }, [router]);

  async function copy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // フォールバック: テキストエリア選択
    }
  }

  function next() {
    sessionStorage.removeItem('meguriai.recoveryCode');
    router.push('/onboarding/home');
  }

  if (!code) return null;

  return (
    <main className="flex flex-1 flex-col py-8">
      <header className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-1 flex-1 rounded-full bg-ink" />
          <span className="h-1 flex-1 rounded-full bg-ink" />
          <span className="h-1 flex-1 rounded-full bg-ink-mute/30" />
        </div>
        <p className="text-xs tracking-widest text-ink-mute">STEP 2 / 3</p>
        <h1 className="mt-2 text-2xl font-medium tracking-tight text-ink">
          あなたの復元コード
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          別の端末で続きを開きたくなったときに使います。
          <br />
          <span className="text-ink-mute">
            このコードを失うと、アカウントには戻れません。
          </span>
        </p>
      </header>

      {/* コード表示 */}
      <section className="mb-5 rounded-xl border border-accent/30 bg-accent/5 p-6 text-center">
        <p className="text-[10px] tracking-widest text-accent">RECOVERY CODE</p>
        <p
          className="mt-3 select-all break-all font-mono text-2xl tracking-[0.2em] text-ink"
          aria-label="復元コード"
        >
          {code}
        </p>
        <button
          type="button"
          onClick={copy}
          className="mt-4 rounded-full border border-accent/40 px-5 py-2 text-xs tracking-wider text-accent transition hover:bg-accent/10"
        >
          {copied ? 'コピーしました' : 'コピーする'}
        </button>
      </section>

      {/* 注意 */}
      <ul className="mb-6 space-y-2 text-xs leading-relaxed text-ink-mute">
        <li>· スクリーンショットや、パスワードマネージャーへの保存を推奨</li>
        <li>· メール・SMSは送信されません（Meguriaiは連絡先を保持しません）</li>
        <li>· 第三者には共有しないでください（コードを知る人が同じアカウントになれます）</li>
      </ul>

      {/* 確認チェック */}
      <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-lg border border-ink-mute/15 bg-paper-card p-4">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
          className="mt-0.5"
        />
        <span className="text-sm leading-relaxed text-ink-soft">
          コードを保存しました
        </span>
      </label>

      <div className="mt-auto space-y-3">
        <button
          type="button"
          onClick={next}
          disabled={!acknowledged}
          className="w-full rounded-full bg-ink py-4 text-base font-medium tracking-wider text-paper shadow-sm transition hover:bg-ink-soft hover:shadow-md disabled:bg-ink-mute"
        >
          次へ
        </button>
      </div>
    </main>
  );
}
