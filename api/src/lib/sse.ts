type Listener = (event: { type: string; data: unknown }) => void;

class SSEHub {
  private listeners = new Map<string, Set<Listener>>();

  subscribe(userId: string, listener: Listener): () => void {
    let set = this.listeners.get(userId);
    if (!set) {
      set = new Set();
      this.listeners.set(userId, set);
    }
    set.add(listener);
    return () => {
      set?.delete(listener);
      if (set && set.size === 0) {
        this.listeners.delete(userId);
      }
    };
  }

  publish(userId: string, type: string, data: unknown) {
    const set = this.listeners.get(userId);
    if (!set) return;
    for (const listener of set) {
      listener({ type, data });
    }
  }
}

export const sseHub = new SSEHub();
