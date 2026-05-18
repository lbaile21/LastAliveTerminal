import Anthropic from '@anthropic-ai/sdk';
import type { AiMode } from './types';

/**
 * Claude API client and guardrails.
 *
 * When `ANTHROPIC_API_KEY` is unset the package runs in MOCK mode — deterministic
 * canned characters and a keyword judge — so the game is fully playable and
 * testable with zero configuration. Set the key to switch to live Claude.
 */

/** Model tiers (per the project plan): a capable model for the overseer AI,
 *  a cheaper one for the structured judge. */
export const MODELS = {
  /** ANURA and other lead characters. */
  character: 'claude-opus-4-7',
  /** The puzzle judge — structured output, high volume. */
  judge: 'claude-sonnet-4-6',
  /** Chat moderation — cheap, very high volume. */
  moderation: 'claude-haiku-4-5',
} as const;

let client: Anthropic | null = null;

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function aiMode(): AiMode {
  return isAiConfigured() ? 'live' : 'mock';
}

export function getClient(): Anthropic {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('getClient() called without ANTHROPIC_API_KEY');
    }
    client = new Anthropic();
  }
  return client;
}

/**
 * Budget guard.
 *
 * A coarse per-process token ceiling so a runaway loop or abuse can't burn an
 * unbounded amount of inference. The durable per-season budget + `ai_interactions`
 * cost table arrive in a later milestone.
 */
const TOKEN_BUDGET = 2_000_000;
let tokensUsed = 0;

export function recordUsage(kind: string, inputTokens: number, outputTokens: number): void {
  tokensUsed += inputTokens + outputTokens;
  console.log(`[ai] ${kind}: in=${inputTokens} out=${outputTokens} cumulative=${tokensUsed}`);
}

export function isBudgetExhausted(): boolean {
  return tokensUsed >= TOKEN_BUDGET;
}
