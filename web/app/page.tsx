'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
    <main className="flex flex-1 flex-col justify-between py-12">
      <div className="space-y-6">
        <p className="text-sm tracking-widest text-ink-mute">SUREChIGAI</p>
        <h1 className="text-3xl font-medium leading-relaxed text-ink">
          同じ場所で、
          <br />
          何度か会っている。
        </h1>
        <p className="text-base leading-relaxed text-ink-soft">
          双方が望んだときだけ、
          <br />
          一歩前に進める。
        </p>
      </div>
      <button
        type="button"
        onClick={() => router.push('/onboarding')}
        className="mt-12 rounded-full bg-ink py-4 text-base font-medium text-paper transition hover:bg-ink-soft"
      >
        はじめる
      </button>
    </main>
  );
}
