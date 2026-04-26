// 質問項目のラベル定義（UI と整合）

export const AGE_RANGE_OPTIONS: { value: string; label: string }[] = [
  { value: '20s_early', label: '20代前半' },
  { value: '20s_late', label: '20代後半' },
  { value: '30s_early', label: '30代前半' },
  { value: '30s_late', label: '30代後半' },
  { value: 'other', label: 'それ以外' },
];

export const RELATIONSHIP_OPTIONS: { value: string; label: string }[] = [
  { value: 'friend', label: '友達から' },
  { value: 'slow', label: 'じっくり知り合いたい' },
  { value: 'romance', label: '恋愛に発展したら' },
  { value: 'marriage', label: '結婚を視野に' },
  { value: 'undecided', label: 'まだ決めていない' },
];

export const CHRONOTYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'morning', label: '朝型' },
  { value: 'day', label: '昼型' },
  { value: 'night', label: '夜型' },
];

const toMap = (opts: { value: string; label: string }[]) =>
  Object.fromEntries(opts.map((o) => [o.value, o.label] as const));

export const AGE_RANGE_LABEL = toMap(AGE_RANGE_OPTIONS);
export const RELATIONSHIP_LABEL = toMap(RELATIONSHIP_OPTIONS);
export const CHRONOTYPE_LABEL = toMap(CHRONOTYPE_OPTIONS);
