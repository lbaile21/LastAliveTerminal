/**
 * Command parsing — the anti-cheat boundary.
 *
 * The client sends a raw string. This turns it into a typed Command. No game
 * state is touched here; parsing is pure and total (it never throws — an empty
 * or junk string just yields an empty verb that dispatch rejects cleanly).
 */

export interface Command {
  /** Lower-cased first token. Empty string when the input had no tokens. */
  verb: string;
  /** First positional argument after the verb, if any. */
  target?: string;
  /** Remaining positional arguments. */
  args: string[];
  /** `--key` flags. `--key=value` captures the value; bare `--key` is `true`. */
  flags: Record<string, string | boolean>;
  /** The original trimmed input, preserved for logging. */
  raw: string;
}

export function parseCommand(input: string): Command {
  const raw = input.trim();
  const tokens = raw.split(/\s+/).filter((t) => t.length > 0);

  const verb = (tokens.shift() ?? '').toLowerCase();
  const flags: Record<string, string | boolean> = {};
  const positional: string[] = [];

  for (const token of tokens) {
    if (token.startsWith('--')) {
      const body = token.slice(2);
      const eq = body.indexOf('=');
      if (eq >= 0) {
        flags[body.slice(0, eq)] = body.slice(eq + 1);
      } else {
        flags[body] = true;
      }
    } else {
      positional.push(token);
    }
  }

  return {
    verb,
    target: positional[0],
    args: positional.slice(1),
    flags,
    raw,
  };
}
