'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  agreeOnEncounter,
  ApiError,
  getEncounters,
  silentReject,
  type EncounterCard,
} from '@/lib/api';
import { subscribeAgreementStream } from '@/lib/sse';
import { clearUserId, getUserId } from '@/lib/session';

export default function EncounterDetailPage() {
  const params = useParams<{ id: string }>();
  const encounterId = params?.id;
  const router = useRouter();
  const [encounter, setEncounter] = useState<EncounterCard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [agreeing, setAgreeing] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);

  const refresh = useCallback(async () => {
    if (!encounterId) return;
    try {
      const { encounters } = await getEncounters();
      const found = encounters.find((e) => e.encounterId === encounterId);
      setEncounter(found ?? null);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 404)) {
        clearUserId();
        router.replace('/');
        return;
      }
      setError((err as Error).message);
    }
  }, [encounterId, router]);

  useEffect(() => {
    if (!getUserId()) {
      router.replace('/');
      return;
    }
    refresh().finally(() => setLoading(false));

    const unsubscribe = subscribeAgreementStream({
      onAgreementUpdated: (payload: unknown) => {
        const p = payload as { encounterId?: string; unlockedAt?: string | null };
        if (p.encounterId === encounterId) {
          if (p.unlockedAt && !encounter?.agreement.unlockedAt) {
            setJustUnlocked(true);
            setTimeout(() => setJustUnlocked(false), 3000);
          }
          void refresh();
        }
      },
    });
    return () => unsubscribe();
  }, [encounterId, refresh, router, encounter?.agreement.unlockedAt]);

  const stage = encounter?.partner.stage;
  const agreement = encounter?.agreement;

  const canAgree = useMemo(() => {
    if (!encounter) return false;
    if (stage !== 'Lv2') return false;
    if (agreement?.myAgreedAt) return false;
    if (agreement?.expiredAt) return false;
    return true;
  }, [encounter, stage, agreement]);

  async function onAgree() {
    if (!encounterId) return;
    setAgreeing(true);
    setError(null);
    try {
      const result = await agreeOnEncounter(encounterId);
      if (result.unlockedAt) {
        setJustUnlocked(true);
        setTimeout(() => setJustUnlocked(false), 3000);
      }
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAgreeing(false);
    }
  }

  async function onReject() {
    if (!encounter) return;
    try {
      await silentReject(encounter.partner.id);
      router.replace('/encounters');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (loading) {
    return <p className="py-12 text-sm text-ink-mute">読み込み中...</p>;
  }

  if (!encounter) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center py-12">
        <p className="text-sm text-ink-mute">この相手は見つかりませんでした。</p>
        <Link href="/encounters" className="mt-6 text-sm text-accent hover:underline">
          一覧に戻る
        </Link>
      </main>
    );
  }

  const unlocked = !!agreement?.unlockedAt;
  const expired = !!agreement?.expiredAt;
  const myAgreed = !!agreement?.myAgreedAt;
  const partnerAgreed = !!agreement?.partnerAgreedAt;

  return (
    <main className="relative flex flex-1 flex-col py-8">
      <Link href="/encounters" className="mb-6 text-xs text-ink-mute hover:text-ink-soft">
        ← 一覧に戻る
      </Link>

      <section className="mb-8">
        <p className="text-xs tracking-widest text-ink-mute">
          {encounter.count} TIMES PASSED
        </p>
        <div className="mt-3 flex items-baseline gap-3">
          <h1 className="text-3xl font-medium text-ink transition-all duration-1000">
            {encounter.partner.nickname ??
              (encounter.partner.nicknameInitial ? `${encounter.partner.nicknameInitial}…` : '？')}
          </h1>
          <span className="text-xs text-ink-mute">{stage}</span>
        </div>
      </section>

      {/* 段階別の本文表示 */}
      {stage === 'Lv0' && (
        <p className="text-sm leading-relaxed text-ink-soft">
          まだ一度しか会っていません。
          <br />
          もう少し、自然のリズムに任せましょう。
        </p>
      )}

      {stage === 'Lv1' && (
        <p className="text-sm leading-relaxed text-ink-soft">
          二度目です。もう一度すれ違うと、お互いをもう少し知ることができます。
        </p>
      )}

      {(stage === 'Lv2' || stage === 'Lv3') && encounter.partner.profileSummary && (
        <section className="rounded-lg border border-ink-mute/20 bg-paper-card p-5">
          <p className="text-xs text-ink-mute">自己紹介</p>
          <p className="mt-2 text-base leading-relaxed text-ink">
            {encounter.partner.profileSummary}
          </p>
        </section>
      )}

      {/* 詳細プロフィール: Lv.3 でフェードイン */}
      <section
        className={`mt-6 overflow-hidden rounded-lg border p-5 transition-all duration-700 ease-out ${
          unlocked
            ? 'max-h-[800px] border-accent/40 bg-paper-card opacity-100'
            : 'max-h-0 border-transparent p-0 opacity-0'
        } ${justUnlocked ? 'animate-pulse' : ''}`}
      >
        {unlocked && encounter.partner.profileDetail && (
          <>
            <p className="text-xs tracking-widest text-accent">UNLOCKED ✦ 詳細プロフィール</p>
            <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-ink">
              {encounter.partner.profileDetail}
            </p>
          </>
        )}
      </section>

      {/* 合意状態のメッセージング */}
      <section className="mt-8">
        {expired ? (
          <p className="rounded-lg border border-ink-mute/20 bg-paper-card p-4 text-center text-sm text-ink-mute">
            合意の窓は閉じました。
            <br />
            また何度かすれ違ったら、新しい流れが始まります。
          </p>
        ) : unlocked ? (
          <p className="rounded-lg border border-accent/30 bg-accent/5 p-4 text-center text-sm text-ink-soft">
            お互いに合意しました。
            <br />
            ここから先は、二人のペースで。
          </p>
        ) : stage === 'Lv2' ? (
          myAgreed ? (
            <div className="rounded-lg border border-ink-mute/20 bg-paper-card p-5 text-center">
              <div className="mx-auto mb-3 h-2 w-2 animate-ping rounded-full bg-accent" />
              <p className="text-sm leading-relaxed text-ink-soft">
                あなたは合意しました。
                <br />
                {partnerAgreed ? '解放中...' : '相手の応答を待っています'}
              </p>
              <p className="mt-3 text-xs text-ink-mute">
                4回目のすれ違いが起きるまでに、相手も合意すれば詳細が解放されます
              </p>
            </div>
          ) : partnerAgreed ? (
            <div className="rounded-lg border border-accent/40 bg-accent/5 p-5 text-center">
              <p className="text-sm leading-relaxed text-ink">
                相手はすでに合意しています。
                <br />
                あなたが合意すれば、お互いの詳細が解放されます。
              </p>
            </div>
          ) : (
            <p className="text-center text-sm leading-relaxed text-ink-soft">
              アプローチが解禁されました。
              <br />
              次のすれ違いまでに、双方が合意すれば詳細が見えます。
            </p>
          )
        ) : null}
      </section>

      {/* 合意ボタン */}
      {canAgree && (
        <button
          type="button"
          onClick={onAgree}
          disabled={agreeing}
          className="mt-6 rounded-full bg-ink py-4 text-base font-medium text-paper transition hover:bg-ink-soft disabled:bg-ink-mute"
        >
          {agreeing ? '送信中...' : '合意する'}
        </button>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {/* サイレントリジェクト導線 */}
      <div className="mt-12 border-t border-ink-mute/10 pt-6">
        {!confirmReject ? (
          <button
            type="button"
            onClick={() => setConfirmReject(true)}
            className="text-xs text-ink-mute hover:text-ink-soft"
          >
            この人とは、もう会っていないことにする
          </button>
        ) : (
          <div className="rounded-lg border border-ink-mute/20 bg-paper-card p-4">
            <p className="text-sm leading-relaxed text-ink-soft">
              相手には通知されません。
              <br />
              これ以降、お互いのカウントは進みません。
            </p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={onReject}
                className="flex-1 rounded-full border border-ink-mute py-2 text-sm text-ink-soft hover:bg-ink-mute/10"
              >
                静かに離れる
              </button>
              <button
                type="button"
                onClick={() => setConfirmReject(false)}
                className="flex-1 rounded-full bg-ink py-2 text-sm text-paper hover:bg-ink-soft"
              >
                やめておく
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 詳細解放演出 */}
      {justUnlocked && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-paper/70 backdrop-blur-sm">
          <div className="text-center">
            <p className="text-xs tracking-[0.3em] text-accent">UNLOCKED</p>
            <p className="mt-3 text-2xl font-medium text-ink">お互いに、合意しました。</p>
          </div>
        </div>
      )}
    </main>
  );
}
