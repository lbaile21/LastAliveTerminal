/**
 * Client-side ASCII art registry.
 *
 * The server emits `ascii` frames carrying only an `artKey`; the client
 * resolves the key to art here. Kept narrow (~31 columns) so it never overflows
 * a phone screen.
 */
export const ASCII_ART: Record<string, string> = {
  'anura-banner': [
    '┌─[ ANURA LABS ]──────────────┐',
    '│   L A S T   A L I V E       │',
    '│   containment terminal      │',
    '└─────────────────────────────┘',
  ].join('\n'),
};
