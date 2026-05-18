/**
 * Per-player command rate limiting — a sliding window over recent timestamps.
 *
 * In-process and best-effort for M1; the durable token-bucket against the
 * `rate_limits` table arrives with the multiplayer milestone. Even this simple
 * form blunts command spamming and accidental client retry storms.
 */

const WINDOW_MS = 5_000;
const MAX_IN_WINDOW = 12;

const hits = new Map<string, number[]>();

/** Returns true if the command is allowed; false if the player is over the limit. */
export function checkRateLimit(playerId: string): boolean {
  const now = Date.now();
  const recent = (hits.get(playerId) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_IN_WINDOW) {
    hits.set(playerId, recent);
    return false;
  }

  recent.push(now);
  hits.set(playerId, recent);
  return true;
}
