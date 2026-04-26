import Image from 'next/image';
import type { SubmarineLevel } from '@/lib/api';

interface Props {
  level: SubmarineLevel;
  imageUrl: string;
  size?: number;
  showLabel?: boolean;
  className?: string;
}

export default function SubmarineBadge({
  level,
  imageUrl,
  size = 64,
  showLabel = false,
  className = '',
}: Props) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div
        className="relative"
        style={{ width: size, height: size }}
        aria-label={`イエロー・サブマリン Lv.${level}`}
      >
        <Image
          src={imageUrl}
          alt={`Yellow Submarine Lv.${level}`}
          fill
          sizes={`${size}px`}
          className="object-contain"
          priority={false}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-[10px] tracking-widest text-ink-mute">
          Lv.{level}
        </p>
      )}
    </div>
  );
}
