// 観察非対称を作らないよう、分単位の精度は出さない（日・週・月の粗い粒度のみ）
export function formatRelative(iso: string): string {
  const past = new Date(iso).getTime();
  if (Number.isNaN(past)) return '';
  const now = Date.now();
  const sec = Math.max(0, (now - past) / 1000);
  if (sec < 3600) return 'ついさっき';
  if (sec < 86400) return '今日';
  const days = Math.floor(sec / 86400);
  if (days === 1) return '昨日';
  if (days < 7) return `${days}日前`;
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  if (months >= 1) return `${months}か月前`;
  return `${weeks}週間前`;
}
