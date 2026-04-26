'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { setHome } from '@/lib/api';

const FUKUOKA_DEFAULT = { lat: 33.5904, lng: 130.4017 };

export default function HomeRegistrationPage() {
  const router = useRouter();
  const [lat, setLat] = useState<string>(FUKUOKA_DEFAULT.lat.toString());
  const [lng, setLng] = useState<string>(FUKUOKA_DEFAULT.lng.toString());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError('この端末では現在地を取得できません');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
      },
      (err) => setError(`現在地取得に失敗: ${err.message}`),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
      setError('緯度経度の形式が不正です');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await setHome(latNum, lngNum);
      router.push('/encounters');
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  async function skip() {
    router.push('/encounters');
  }

  return (
    <main className="flex flex-1 flex-col py-8">
      <header className="mb-10">
        <p className="text-xs tracking-widest text-ink-mute">STEP 2 / 2</p>
        <h1 className="mt-2 text-2xl font-medium text-ink">自宅エリアを守る</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          自宅から半径 500m 以内のすれ違いは自動でカウントされません。
          <br />
          住所そのものは保存されません（座標のみ）。
        </p>
      </header>

      <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-6">
        <button
          type="button"
          onClick={useCurrentLocation}
          className="rounded-lg border border-ink-mute/30 py-3 text-sm text-ink-soft transition hover:border-accent"
        >
          現在地を使う
        </button>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-ink-mute">緯度</span>
            <input
              type="text"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink-mute/30 bg-paper-card px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="block">
            <span className="text-xs text-ink-mute">経度</span>
            <input
              type="text"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink-mute/30 bg-paper-card px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="mt-auto space-y-3">
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-ink py-4 text-base font-medium text-paper transition hover:bg-ink-soft disabled:bg-ink-mute"
          >
            {submitting ? '登録中...' : '登録して はじめる'}
          </button>
          <button
            type="button"
            onClick={skip}
            disabled={submitting}
            className="w-full text-sm text-ink-mute hover:text-ink-soft"
          >
            あとで設定する
          </button>
        </div>
      </form>
    </main>
  );
}
