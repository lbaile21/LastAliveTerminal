import { z } from 'zod';
import { PLAYER_STATUSES } from './game';

/**
 * The Frame contract.
 *
 * A Frame is the ONLY thing the server sends the client to render. The client
 * is a thin renderer: it never receives game state, puzzle answers, or AI
 * prompts — only an ordered list of frames describing what to draw. This is
 * the wire boundary that makes the game server-authoritative.
 */

export const TEXT_STYLES = ['normal', 'system', 'error', 'enemy', 'success'] as const;
export type TextStyle = (typeof TEXT_STYLES)[number];

export const textFrameSchema = z.object({
  type: z.literal('text'),
  lines: z.array(z.string()),
  style: z.enum(TEXT_STYLES).default('normal'),
});

export const asciiFrameSchema = z.object({
  type: z.literal('ascii'),
  /** Key into the client-side ASCII art registry (packages/ui). */
  artKey: z.string(),
});

export const statusFrameSchema = z.object({
  type: z.literal('status'),
  status: z.enum(PLAYER_STATUSES),
  vitals: z.object({
    health: z.number(),
    hunger: z.number(),
    energy: z.number(),
  }),
});

export const mapFrameSchema = z.object({
  type: z.literal('map'),
  current: z.string(),
  nodes: z.array(
    z.object({
      id: z.string(),
      code: z.string(),
      name: z.string(),
      locked: z.boolean(),
    }),
  ),
});

/** Feeds the mobile command-palette chips above the keyboard. */
export const choiceFrameSchema = z.object({
  type: z.literal('choice'),
  options: z.array(
    z.object({
      label: z.string(),
      command: z.string(),
    }),
  ),
});

/** Emitted by AI-gated / classic puzzles; the next input is the answer. */
export const promptFrameSchema = z.object({
  type: z.literal('prompt'),
  puzzleId: z.string(),
  prompt: z.string(),
});

export const fxFrameSchema = z.object({
  type: z.literal('fx'),
  effect: z.enum(['flicker', 'glitch', 'collapse', 'boot']),
});

/** Incremental AI output (NPC dialogue / ANURA), streamed token-by-token. */
export const streamFrameSchema = z.object({
  type: z.literal('stream'),
  channel: z.string(),
  text: z.string(),
});

export const frameSchema = z.discriminatedUnion('type', [
  textFrameSchema,
  asciiFrameSchema,
  statusFrameSchema,
  mapFrameSchema,
  choiceFrameSchema,
  promptFrameSchema,
  fxFrameSchema,
  streamFrameSchema,
]);

export type Frame = z.infer<typeof frameSchema>;
export type TextFrame = z.infer<typeof textFrameSchema>;
export type AsciiFrame = z.infer<typeof asciiFrameSchema>;
export type StatusFrame = z.infer<typeof statusFrameSchema>;
export type MapFrame = z.infer<typeof mapFrameSchema>;
export type ChoiceFrame = z.infer<typeof choiceFrameSchema>;
export type PromptFrame = z.infer<typeof promptFrameSchema>;
export type FxFrame = z.infer<typeof fxFrameSchema>;
export type StreamFrame = z.infer<typeof streamFrameSchema>;
