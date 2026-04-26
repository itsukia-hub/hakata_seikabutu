'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ApiError, getEncounters, getMe, type EncounterCard, type MeResponse } from '@/lib/api';
import { subscribeAgreementStream } from '@/lib/sse';
import { clearUserId, getUserId } from '@/lib/session';
import { formatRelative } from '@/lib/relative-time';
import StageGlyph from '@/components/StageGlyph';

const STAGE_LABEL: Record<string, string> = {
  Lv0: 'すれ違いました',
  Lv1: '少しずつ',
  Lv2: 'アプローチ可能',
  Lv3: 'お互いに合意済み',
};

const STAGE_TONE: Record<string, string> = {
  Lv0: 'text-ink-mute',
  Lv1: 'text-ink-soft',
  Lv2: 'text-ink',
  Lv3: 'text-accent',
};

export default function EncountersPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [encounters, setEncounters] = useState<EncounterCard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const handleApiError = useCallback(
    (err: unknown): boolean => {
      if (err instanceof ApiError && (err.status === 401 || err.status === 404)) {
        clearUserId();
        router.replace('/');
        return true;
      }
      return false;
    },
    [router],
  );

  const refresh = useCallback(async () => {
    try {
      const data = await getEncounters();
      setEncounters(data.encounters);
    } catch (err) {
      if (!handleApiError(err)) setError((err as Error).message);
    }
  }, [handleApiError]);

  useEffect(() => {
    if (!getUserId()) {
      router.replace('/');
      return;
    }

    let cancelled = false;
    let unsubscribe: (() => void) | null = null;

    (async () => {
      try {
        const meData = await getMe();
        if (cancelled) return;
        setMe(meData);
        await refresh();
        if (cancelled) return;

        unsubscribe = subscribeAgreementStream({
          onAgreementUpdated: () => refresh(),
          onEncounterUpdated: () => refresh(),
        });
      } catch (err) {
        if (cancelled) return;
        if (!handleApiError(err)) {
          setError((err as Error).message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [router, refresh, handleApiError]);

  function reset() {
    clearUserId();
    router.replace('/');
  }

  return (
    <main className="flex flex-1 flex-col py-8">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-[10px] tracking-[0.4em] text-ink-mute">YOUR DAY</p>
          <h1 className="mt-1 text-2xl font-medium tracking-tight text-ink">
            すれ違い
          </h1>
        </div>
        <p className="text-[10px] tracking-widest text-ink-mute">
          {new Date().toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </header>

      {me && (
        <section className="mb-6 rounded-xl border border-ink-mute/15 bg-paper-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink/5">
              <span className="text-sm text-ink-soft">
                {me.nickname.slice(0, 1).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-[10px] tracking-widest text-ink-mute">YOU</p>
              <p className="text-sm text-ink">{me.nickname}</p>
            </div>
            {me.home_lat && (
              <div className="text-right">
                <p className="text-[10px] tracking-widest text-ink-mute">PROTECT</p>
                <p className="text-xs text-accent">500m 圏</p>
              </div>
            )}
          </div>
        </section>
      )}

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="animate-pulse text-xs tracking-widest text-ink-mute">
            読み込み中...
          </p>
        </div>
      ) : encounters.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-ink-mute/30 p-10 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-ink-mute/30">
            <span className="h-2 w-2 rounded-full bg-ink-mute" />
          </div>
          <p className="text-sm leading-relaxed text-ink-mute">
            まだすれ違っている人はいません。
            <br />
            焦らず、いつもの場所へ。
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {encounters.map((e) => {
            const unlocked = !!e.agreement.unlockedAt;
            const myAgreed = !!e.agreement.myAgreedAt;
            const expired = !!e.agreement.expiredAt;
            return (
              <li key={e.encounterId} className="animate-fade-up">
                <Link
                  href={`/encounters/${e.encounterId}`}
                  className={`block rounded-xl border bg-paper-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                    unlocked
                      ? 'border-accent/40'
                      : 'border-ink-mute/15 hover:border-accent/40'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <StageGlyph stage={e.partner.stage} size={36} />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[10px] tracking-widest ${STAGE_TONE[e.partner.stage]}`}
                      >
                        {STAGE_LABEL[e.partner.stage]}
                      </p>
                      <p className="mt-1 truncate text-base text-ink">
                        {e.partner.nickname ??
                          (e.partner.nicknameInitial
                            ? `${e.partner.nicknameInitial}…`
                            : '？')}
                      </p>
                      {e.partner.profileSummary && (
                        <p className="mt-2 line-clamp-2 text-sm text-ink-soft">
                          {e.partner.profileSummary}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-light leading-none text-ink">
                        {e.count}
                      </p>
                      <p className="mt-1 text-[10px] tracking-widest text-ink-mute">
                        TIMES
                      </p>
                      <p className="mt-2 text-[10px] text-ink-mute">
                        {formatRelative(e.lastEncounteredAt)}
                      </p>
                    </div>
                  </div>

                  {/* 状態バッジ */}
                  {(unlocked || myAgreed || expired) && (
                    <div className="mt-3 border-t border-ink-mute/10 pt-2">
                      {unlocked ? (
                        <p className="flex items-center gap-2 text-xs text-accent">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                          双方合意 · 詳細を見る
                        </p>
                      ) : myAgreed && !expired ? (
                        <p className="flex items-center gap-2 text-xs text-ink-soft">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                          相手の応答を待っています
                        </p>
                      ) : expired ? (
                        <p className="text-xs text-ink-mute">
                          合意の窓は閉じました
                        </p>
                      ) : null}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={reset}
        className="mt-8 text-center text-[10px] tracking-widest text-ink-mute hover:text-ink-soft"
      >
        セッションをリセット（デバッグ）
      </button>
    </main>
  );
}
