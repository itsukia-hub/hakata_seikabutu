'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getEncounters, getMe, type EncounterCard, type MeResponse } from '@/lib/api';
import { subscribeAgreementStream } from '@/lib/sse';
import { clearUserId, getUserId } from '@/lib/session';

const STAGE_LABEL: Record<string, string> = {
  Lv0: 'すれ違いました',
  Lv1: '少しずつ',
  Lv2: 'アプローチ可能',
  Lv3: 'お互いに合意済み',
};

export default function EncountersPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [encounters, setEncounters] = useState<EncounterCard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await getEncounters();
      setEncounters(data.encounters);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    if (!getUserId()) {
      router.replace('/');
      return;
    }
    Promise.all([getMe().then(setMe), refresh()]).finally(() => setLoading(false));

    const unsubscribe = subscribeAgreementStream({
      onAgreementUpdated: () => refresh(),
      onEncounterUpdated: () => refresh(),
    });
    return () => unsubscribe();
  }, [router, refresh]);

  function reset() {
    clearUserId();
    router.replace('/');
  }

  return (
    <main className="flex flex-1 flex-col py-8">
      <header className="mb-8">
        <p className="text-xs tracking-widest text-ink-mute">YOUR DAY</p>
        <h1 className="mt-2 text-2xl font-medium text-ink">すれ違い</h1>
      </header>

      {me && (
        <section className="mb-6 rounded-lg border border-ink-mute/20 bg-paper-card p-4">
          <p className="text-xs text-ink-mute">こんにちは</p>
          <p className="mt-1 text-base text-ink">{me.nickname}</p>
          {me.home_lat && (
            <p className="mt-2 text-xs text-ink-mute">
              自宅エリア保護中（半径500m）
            </p>
          )}
        </section>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-ink-mute">読み込み中...</p>
      ) : encounters.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-ink-mute/30 p-8 text-center">
          <p className="text-sm leading-relaxed text-ink-mute">
            まだすれ違っている人はいません。
            <br />
            焦らず、いつもの場所へ。
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {encounters.map((e) => (
            <li key={e.encounterId}>
              <Link
                href={`/encounters/${e.encounterId}`}
                className="block rounded-lg border border-ink-mute/20 bg-paper-card p-4 transition hover:border-accent"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-xs tracking-wider text-ink-mute">
                      {STAGE_LABEL[e.partner.stage]}
                    </p>
                    <p className="mt-1 text-base text-ink">
                      {e.partner.nickname ??
                        (e.partner.nicknameInitial
                          ? `${e.partner.nicknameInitial}…`
                          : '？')}
                    </p>
                    {e.partner.profileSummary && (
                      <p className="mt-2 text-sm text-ink-soft">
                        {e.partner.profileSummary}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-light text-ink">{e.count}</p>
                    <p className="text-[10px] tracking-widest text-ink-mute">TIMES</p>
                  </div>
                </div>
                {e.agreement.unlockedAt && (
                  <p className="mt-3 text-xs text-accent">✦ 双方合意・詳細を見る</p>
                )}
                {e.agreement.myAgreedAt && !e.agreement.unlockedAt && !e.agreement.expiredAt && (
                  <p className="mt-3 text-xs text-ink-mute">あなたは合意済み・相手の応答を待っています</p>
                )}
                {e.agreement.expiredAt && (
                  <p className="mt-3 text-xs text-ink-mute">合意の窓は閉じました</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={reset}
        className="mt-8 text-xs text-ink-mute hover:text-ink-soft"
      >
        セッションをリセット（デバッグ）
      </button>
    </main>
  );
}
