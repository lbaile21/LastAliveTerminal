import { z } from 'zod';
import { frameSchema } from './frames';

/**
 * Wire contract for the server-authoritative command loop.
 * Client POSTs a CommandRequest to /api/command; server replies CommandResponse.
 */

/** Hard cap on raw command length — first line of defence against abuse. */
export const MAX_COMMAND_LENGTH = 280;

export const commandRequestSchema = z.object({
  sessionId: z.string().min(1),
  command: z.string().min(1).max(MAX_COMMAND_LENGTH),
  /** Last frame sequence the client has rendered (for ordering / dedupe). */
  clientFrameSeq: z.number().int().nonnegative(),
});
export type CommandRequest = z.infer<typeof commandRequestSchema>;

export const commandResponseSchema = z.object({
  frames: z.array(frameSchema),
  serverFrameSeq: z.number().int().nonnegative(),
});
export type CommandResponse = z.infer<typeof commandResponseSchema>;
