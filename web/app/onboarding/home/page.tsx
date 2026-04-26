'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { setHome } from '@/lib/api';

const FUKUOKA_DEFAULT = { lat: 33.5904, lng: 130.4017 };
const PROTECT_RADIUS_M = 500;

type LeafletMap = unknown;
type LeafletMarker = unknown;
type LeafletCircle = unknown;

export default function HomeRegistrationPage() {
  const router = useRouter();
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const circleRef = useRef<LeafletCircle | null>(null);

  const [coords, setCoords] = useState(FUKUOKA_DEFAULT);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const L = (await import('leaflet')).default;

      // デフォルトアイコンの URL 解決問題回避
      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapEl.current || !mounted) return;

      const map = L.map(mapEl.current, {
        zoomControl: false,
        attributionControl: true,
      }).setView([FUKUOKA_DEFAULT.lat, FUKUOKA_DEFAULT.lng], 15);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([FUKUOKA_DEFAULT.lat, FUKUOKA_DEFAULT.lng], {
        draggable: true,
      }).addTo(map);

      const circle = L.circle([FUKUOKA_DEFAULT.lat, FUKUOKA_DEFAULT.lng], {
        radius: PROTECT_RADIUS_M,
        color: '#6b7a8f',
        weight: 2,
        fillColor: '#6b7a8f',
        fillOpacity: 0.15,
      }).addTo(map);

      const update = (lat: number, lng: number) => {
        marker.setLatLng([lat, lng]);
        circle.setLatLng([lat, lng]);
        if (mounted) setCoords({ lat, lng });
      };

      marker.on('dragend', () => {
        const p = marker.getLatLng();
        update(p.lat, p.lng);
      });

      map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
        update(e.latlng.lat, e.latlng.lng);
      });

      mapRef.current = map;
      markerRef.current = marker;
      circleRef.current = circle;
      if (mounted) setMapReady(true);
    })();

    return () => {
      mounted = false;
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove();
        mapRef.current = null;
      }
    };
  }, []);

  function flyToAndSet(lat: number, lng: number, zoom = 16) {
    const map = mapRef.current as { flyTo?: (latlng: [number, number], zoom: number) => void } | null;
    const marker = markerRef.current as { setLatLng?: (latlng: [number, number]) => void } | null;
    const circle = circleRef.current as { setLatLng?: (latlng: [number, number]) => void } | null;
    if (map?.flyTo) map.flyTo([lat, lng], zoom);
    if (marker?.setLatLng) marker.setLatLng([lat, lng]);
    if (circle?.setLatLng) circle.setLatLng([lat, lng]);
    setCoords({ lat, lng });
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError('この端末では現在地を取得できません');
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        flyToAndSet(pos.coords.latitude, pos.coords.longitude, 16);
        setLocating(false);
      },
      (err) => {
        setError(`現在地取得に失敗: ${err.message}`);
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  async function onSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await setHome(coords.lat, coords.lng);
      router.push('/encounters');
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  function skip() {
    router.push('/encounters');
  }

  return (
    <main className="flex flex-1 flex-col py-6">
      <header className="mb-5">
        <p className="text-xs tracking-widest text-ink-mute">STEP 2 / 2</p>
        <h1 className="mt-2 text-2xl font-medium tracking-tight text-ink">
          自宅エリアを守る
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          地図をタップ、またはピンをドラッグして、自宅の位置を選んでください。
          <br />
          <span className="text-ink-mute">
            円の中（半径500m）はカウントから自動除外されます。
          </span>
        </p>
      </header>

      {/* 地図 */}
      <div className="relative mb-4 overflow-hidden rounded-xl border border-ink-mute/20 shadow-md">
        <div ref={mapEl} className="h-[360px] w-full" />
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-paper/80 backdrop-blur-sm">
            <p className="animate-pulse text-xs tracking-widest text-ink-mute">
              地図を読み込み中...
            </p>
          </div>
        )}
        {/* 範囲ラベル */}
        <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-paper-card/95 px-3 py-1 text-[10px] tracking-widest text-ink-soft shadow-sm">
          PROTECT · 500m
        </div>
      </div>

      {/* コントロール */}
      <button
        type="button"
        onClick={useCurrentLocation}
        disabled={locating || !mapReady}
        className="mb-3 flex items-center justify-center gap-2 rounded-lg border border-ink-mute/30 py-3 text-sm text-ink-soft transition hover:border-accent disabled:opacity-50"
      >
        <span className="h-2 w-2 rounded-full bg-accent" />
        {locating ? '現在地を取得中...' : '現在地を中心にする'}
      </button>

      <div className="mb-5 rounded-lg border border-ink-mute/15 bg-paper-card px-4 py-3">
        <p className="text-[10px] tracking-widest text-ink-mute">SELECTED</p>
        <p className="mt-1 font-mono text-xs text-ink-soft">
          {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
        </p>
      </div>

      {error && (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-auto space-y-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting || !mapReady}
          className="w-full rounded-full bg-ink py-4 text-base font-medium tracking-wider text-paper shadow-sm transition hover:bg-ink-soft hover:shadow-md disabled:bg-ink-mute"
        >
          {submitting ? '登録中...' : 'この場所を自宅として登録'}
        </button>
        <button
          type="button"
          onClick={skip}
          disabled={submitting}
          className="w-full text-center text-xs text-ink-mute hover:text-ink-soft"
        >
          あとで設定する
        </button>
      </div>
    </main>
  );
}
