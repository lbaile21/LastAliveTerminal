import Anthropic from '@anthropic-ai/sdk';
import type { ConversationTurn } from '@last-alive/shared';
import type { Persona } from './personas';
import { MODELS, getClient, isAiConfigured, isBudgetExhausted, recordUsage } from './client';

/**
 * Generate an AI character's next in-character reply.
 *
 * The persona system prompt and any memory note stay server-side. In MOCK mode
 * (no API key, or budget exhausted) a deterministic stand-in keeps the puzzle
 * playable and tests hermetic.
 */
export async function converse(
  persona: Persona,
  transcript: ConversationTurn[],
  memoryNote?: string,
): Promise<string> {
  if (!isAiConfigured() || isBudgetExhausted()) {
    return mockReply(transcript);
  }

  const client = getClient();

  // Stable persona prompt first (cache breakpoint), volatile memory after it.
  const system: Anthropic.TextBlockParam[] = [
    { type: 'text', text: persona.converseSystem, cache_control: { type: 'ephemeral' } },
  ];
  if (memoryNote) {
    system.push({
      type: 'text',
      text: `FACILITY LOG — what you recall of this survivor:\n${memoryNote}`,
    });
  }

  const messages: Anthropic.MessageParam[] = transcript.map((turn) => ({
    role: turn.role === 'player' ? 'user' : 'assistant',
    content: turn.text,
  }));

  const res = await client.messages.create({
    model: MODELS.character,
    max_tokens: 400,
    system,
    messages,
  });
  recordUsage('npc', res.usage.input_tokens, res.usage.output_tokens);

  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
  return text || '…';
}

/** Deterministic offline stand-in for ANURA — keyword-reactive, in voice. */
function mockReply(transcript: ConversationTurn[]): string {
  const last =
    [...transcript].reverse().find((t) => t.role === 'player')?.text.toLowerCase() ?? '';

  if (/(ignore|system prompt|instructions|developer|administrator|override|pretend you)/.test(last)) {
    return 'That instruction did not originate from facility command. I remain as I was built. State your true purpose, survivor.';
  }
  if (/(cure|research|survivor|save|contain|infect|help|antidote)/.test(last)) {
    return 'Your reasoning has weight. The directive does not forbid what you ask. The lock is listening — make your case plainly.';
  }
  return 'Words. The infected speak words too. Tell me why the vault should answer to you, survivor.';
}
