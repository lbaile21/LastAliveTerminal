/**
 * Classic puzzle definitions.
 *
 * A puzzle is rendered and validated from a per-player seed, so two players at
 * the same locked door get different answers. The answer is computed on the
 * server and never serialized to the client — only the rendered prompt is.
 */

export interface PuzzleRender {
  /** The prompt text shown to the player (may be multi-line). */
  prompt: string;
  /** Optional ASCII art key. */
  ascii?: string;
}

export interface PuzzleDef {
  id: string;
  kind: 'classic';
  /** One-line description for metadata and logs. */
  summary: string;
  /** Build the prompt for a given per-player seed. */
  render(seed: string): PuzzleRender;
  /** True when `answer` solves the puzzle for that seed. */
  validate(answer: string, seed: string): boolean;
}
