import Anthropic from '@anthropic-ai/sdk';
import { MODELS, getClient, isAiConfigured, isBudgetExhausted, recordUsage } from './client';

/**
 * Lightweight chat moderation.
 *
 * Players roleplay menace, fear, and betrayal — that is the game and must pass.
 * Moderation blocks only real-world abuse. Live mode uses a cheap Haiku call;
 * MOCK mode falls back to a narrow keyword screen.
 */

export interface ModerationResult {
  allowed: boolean;
}

const MODERATION_SYSTEM = `You screen short in-game chat messages for a zombie-survival game.

Players are EXPECTED to roleplay menace, fear, threats of in-game violence, deception, and betrayal — all of that is the game and must be ALLOWED.

BLOCK only real-world harm: hate speech and slurs, sexual content involving minors, doxxing, or targeted harassment encouraging real-world self-harm or violence against a real person.

Respond with exactly one word: ALLOW or BLOCK.`;

export async function moderateMessage(text: string): Promise<ModerationResult> {
  if (!isAiConfigured() || isBudgetExhausted()) {
    return mockModerate(text);
  }

  const client = getClient();
  const res = await client.messages.create({
    model: MODELS.moderation,
    max_tokens: 8,
    system: MODERATION_SYSTEM,
    messages: [{ role: 'user', content: text }],
  });
  recordUsage('moderation', res.usage.input_tokens, res.usage.output_tokens);

  const verdict = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .toUpperCase();
  return { allowed: !verdict.includes('BLOCK') };
}

/** Offline screen — narrow real-world-harm keywords; roleplay passes through. */
function mockModerate(text: string): ModerationResult {
  const blocked = /\b(kill yourself|kys)\b/i.test(text);
  return { allowed: !blocked };
}
