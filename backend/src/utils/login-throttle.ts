// Limite de falhas de login POR CONTA (complementa o rate limit por IP, que não detém ataque distribuído).
// Em memória: vale por instância da API. Para múltiplas instâncias, migrar para Redis/banco.
const WINDOW_MS = 15 * 60_000;
const MAX_FAILURES = 8;
const MAX_ENTRIES = 5000;

const attempts = new Map<string, { count: number; resetAt: number }>();

function prune(now: number) {
  for (const [key, entry] of attempts) if (entry.resetAt <= now) attempts.delete(key);
}

export const loginThrottle = {
  isBlocked(key: string, now = Date.now()): boolean {
    const entry = attempts.get(key);
    if (!entry) return false;
    if (entry.resetAt <= now) {
      attempts.delete(key);
      return false;
    }
    return entry.count >= MAX_FAILURES;
  },

  recordFailure(key: string, now = Date.now()): void {
    const entry = attempts.get(key);
    if (!entry || entry.resetAt <= now) {
      if (attempts.size >= MAX_ENTRIES) prune(now);
      if (attempts.size >= MAX_ENTRIES) return; // proteção de memória
      attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
      return;
    }
    entry.count += 1;
  },

  reset(key: string): void {
    attempts.delete(key);
  },

  clear(): void {
    attempts.clear();
  },
};
