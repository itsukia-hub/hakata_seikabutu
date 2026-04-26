import { apiBaseUrl } from './api';
import { getUserId } from './session';

type SSEHandlers = {
  onAgreementUpdated?: (payload: unknown) => void;
  onEncounterUpdated?: (payload: unknown) => void;
  onReady?: () => void;
};

export function subscribeAgreementStream(handlers: SSEHandlers): () => void {
  const userId = getUserId();
  if (!userId) return () => {};

  // EventSource は独自ヘッダを付与できないので、ヘッダ送信用に fetch ストリーミング実装にする
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/agreements/stream`, {
        method: 'GET',
        headers: {
          'X-User-Id': userId,
          Accept: 'text/event-stream',
        },
        signal: controller.signal,
      });
      if (!res.ok || !res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let sep;
        while ((sep = buffer.indexOf('\n\n')) !== -1) {
          const block = buffer.slice(0, sep);
          buffer = buffer.slice(sep + 2);

          let eventName = 'message';
          let dataLine = '';
          for (const line of block.split('\n')) {
            if (line.startsWith('event:')) eventName = line.slice(6).trim();
            else if (line.startsWith('data:')) dataLine = line.slice(5).trim();
          }

          if (!dataLine) continue;
          let payload: unknown;
          try {
            payload = JSON.parse(dataLine);
          } catch {
            continue;
          }

          if (eventName === 'ready') handlers.onReady?.();
          else if (eventName === 'agreement:updated') handlers.onAgreementUpdated?.(payload);
          else if (eventName === 'encounter:updated') handlers.onEncounterUpdated?.(payload);
        }
      }
    } catch {
      // abort or network error
    }
  })();

  return () => controller.abort();
}
