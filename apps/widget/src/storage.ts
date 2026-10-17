/**
 * Small localStorage wrapper. Storage can be unavailable (private mode, blocked
 * third-party storage), so every access is guarded and falls back to memory.
 */
const memory = new Map<string, string>();

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    if (value === null) memory.delete(key);
    else memory.set(key, value);
  }
}

export function createStore(widgetKey: string) {
  const prefix = `smilecare:${widgetKey}:`;
  return {
    visitorId(): string {
      let id = read(`${prefix}visitor`);
      if (!id || !/^[A-Za-z0-9_-]{8,64}$/.test(id)) {
        id = `v_${randomId()}`;
        write(`${prefix}visitor`, id);
      }
      return id;
    },
    sessionId: () => read(`${prefix}session`),
    setSessionId: (id: string | null) => write(`${prefix}session`, id),
  };
}

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID().replace(/-/g, '');
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
