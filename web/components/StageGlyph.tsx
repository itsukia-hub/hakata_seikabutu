import type { Stage } from '@/lib/api';

interface Props {
  stage: Stage;
  size?: number;
  className?: string;
}

export default function StageGlyph({ stage, size = 32, className = '' }: Props) {
  const stroke = '#3a3b40';
  const accent = '#6b7a8f';
  const muted = '#7a7b80';
  const half = size / 2;

  switch (stage) {
    case 'Lv0':
      return (
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className={className}
          aria-label="Lv.0"
        >
          <circle cx={half} cy={half} r={2} fill={muted} />
        </svg>
      );
    case 'Lv1':
      return (
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className={className}
          aria-label="Lv.1"
        >
          <circle
            cx={half}
            cy={half}
            r={half - 4}
            fill="none"
            stroke={muted}
            strokeWidth={1.2}
            strokeDasharray="2 3"
          />
          <circle cx={half} cy={half} r={3} fill={muted} />
        </svg>
      );
    case 'Lv2':
      return (
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className={className}
          aria-label="Lv.2"
        >
          <circle
            cx={half}
            cy={half}
            r={half - 3}
            fill="none"
            stroke={stroke}
            strokeWidth={1.5}
          />
          <circle cx={half} cy={half} r={4} fill={stroke} />
        </svg>
      );
    case 'Lv3':
      return (
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className={className}
          aria-label="Lv.3"
        >
          <circle
            cx={half - 4}
            cy={half}
            r={half - 6}
            fill="none"
            stroke={accent}
            strokeWidth={1.5}
          />
          <circle
            cx={half + 4}
            cy={half}
            r={half - 6}
            fill="none"
            stroke={accent}
            strokeWidth={1.5}
          />
          <circle cx={half} cy={half} r={3} fill={accent} />
        </svg>
      );
  }
}
