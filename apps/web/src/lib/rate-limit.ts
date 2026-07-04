const WINDOW_MS = 60_000;
const MAX = 5;

const store = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string): { ok: boolean } {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || entry.resetAt < now) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }

  entry.count++;
  return { ok: entry.count <= MAX };
}

// Test helper — clears in-memory store between test runs
export function resetStore(): void {
  store.clear();
}
