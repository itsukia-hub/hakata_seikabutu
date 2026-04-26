const KEY = 'surechigai.userId';

export function getUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(KEY);
}

export function setUserId(id: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, id);
}

export function clearUserId() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEY);
}
