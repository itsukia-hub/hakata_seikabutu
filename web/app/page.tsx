'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUserId } from '@/lib/session';

export default function HomePage() {
  const router = useRouter();
  const [decided, setDecided] = useState(false);

  useEffect(() => {
    const userId = getUserId();
    if (userId) {
      router.replace('/encounters');
    } else {
      setDecided(true);
    }
  }, [router]);

  if (!decided) return null;

  return (
    <main className="flex flex-1 flex-col justify-between py-10">
      <div className="space-y-10">
        <p className="animate-fade-up text-xs tracking-[0.4em] text-ink-mute">
          MEGURIAI
        </p>

        {/* 重なる円のビジュアル */}
        <div className="relative mx-auto h-44 w-full max-w-xs">
          <div
            aria-hidden
            className="absolute left-1/2 top-1/2 h-32 w-32 rounded-full border border-ink-mute/40 animate-breathe-left"
          />
          <div
            aria-hidden
            className="absolute left-1/2 top-1/2 h-32 w-32 rounded-full border border-accent/50 animate-breathe-right"
          />
          <div
            aria-hidden
            className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-[60%] -translate-y-1/2 rounded-full bg-ink/50"
          />
          <div
            aria-hidden
            className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-[40%] -translate-y-1/2 rounded-full bg-accent/70"
          />
        </div>

        <div className="space-y-4">
          <h1 className="animate-fade-up animate-fade-up-delay-1 text-3xl font-medium leading-relaxed tracking-tight text-ink">
            風景の一部だった
            <br />
            誰かと、
          </h1>
          <p className="animate-fade-up animate-fade-up-delay-2 text-lg leading-relaxed text-ink-soft">
            静かに。
            <br />
            名前を、呼び合うまで。
          </p>
        </div>

        <p className="animate-fade-up animate-fade-up-delay-3 border-l-2 border-accent/60 pl-4 text-sm leading-relaxed tracking-wider text-ink-mute">
          「いつもの街」を、
          <br />
          二人の「はじまりの場所」へ。
        </p>
      </div>

      <div className="mt-12 space-y-3 animate-fade-up animate-fade-up-delay-4">
        <button
          type="button"
          onClick={() => router.push('/onboarding')}
          className="w-full rounded-full bg-ink py-4 text-base font-medium tracking-wider text-paper shadow-sm transition hover:bg-ink-soft hover:shadow-md"
        >
          はじめる
        </button>
        <Link
          href="/recover"
          className="block text-center text-xs text-ink-mute transition hover:text-ink-soft"
        >
          すでに復元コードがある →
        </Link>
        <p className="text-center text-[10px] tracking-widest text-ink-mute">
          観察非対称を作らない。場所も時刻も、表示しない。
        </p>
      </div>
    </main>
  );
}
