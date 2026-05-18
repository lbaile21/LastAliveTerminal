const ADJECTIVES = [
  'QUIET',
  'ASHEN',
  'HOLLOW',
  'STILL',
  'PALE',
  'GRIM',
  'LONE',
  'COLD',
  'FAINT',
  'WARY',
] as const;

const NOUNS = [
  'NOMAD',
  'EMBER',
  'WARDEN',
  'CROW',
  'RELAY',
  'VECTOR',
  'HUSK',
  'SIGNAL',
  'DRIFTER',
  'CINDER',
] as const;

/**
 * Derive a stable survivor callsign from a player id.
 *
 * Deterministic: the same id always yields the same callsign, so a returning
 * player keeps their identity without it needing to be stored separately.
 */
export function generateCallsign(playerId: string): string {
  let hash = 7;
  for (const ch of playerId) {
    hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  }
  // Unsigned shift: `>>` is signed and would yield a negative index — and thus
  // an out-of-range `undefined` — for ids whose hash sets the high bit.
  const adjective = ADJECTIVES[hash % ADJECTIVES.length];
  const noun = NOUNS[(hash >>> 8) % NOUNS.length];
  const number = (hash % 900) + 100;
  return `${adjective}-${noun}-${number}`;
}
