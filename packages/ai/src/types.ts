/** Verdict returned by the AI puzzle judge. */
export interface JudgeVerdict {
  /** True when the player has met the puzzle's hidden objective. */
  objectiveMet: boolean;
  /** The judge's private reasoning (logged, never shown to the player). */
  reasoning: string;
  /** True when the player attempted to manipulate the character out of role. */
  leakDetected: boolean;
}

/** Whether this run is talking to the real Claude API or the offline mock. */
export type AiMode = 'live' | 'mock';
