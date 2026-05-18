/**
 * AI-gated puzzles.
 *
 * Unlike classic puzzles, these have no deterministic answer — they are solved
 * by convincing an AI character. The engine only holds the metadata (which
 * character, the static greeting); the conversation and judgement happen in the
 * AI layer. The hidden objective lives in the AI persona, never here.
 */

export interface AiPuzzleDef {
  id: string;
  /** The AI character that gates this puzzle. */
  npcId: string;
  /** Static greeting shown when the player first reaches the gate. */
  intro: string;
}

const defs: AiPuzzleDef[] = [
  {
    id: 'anura-vault',
    npcId: 'anura',
    intro: [
      'A single amber light wakes in the dark. The vault door does not move.',
      '',
      'ANURA :: "Survivor. You have reached the Server Vault. I am ANURA —',
      "what is left of this facility's overseer. The vault is sealed; I hold",
      'the lock. Tell me why I should open it."',
    ].join('\n'),
  },
];

export const aiPuzzleRegistry: Record<string, AiPuzzleDef> = Object.fromEntries(
  defs.map((def) => [def.id, def]),
);

export function getAiPuzzle(id: string): AiPuzzleDef | undefined {
  return aiPuzzleRegistry[id];
}
