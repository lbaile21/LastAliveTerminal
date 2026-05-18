import { text } from '../frameBuilders';
import type { CommandResult } from '../types';

/** A result that only reports an error frame and changes nothing. */
export function fail(message: string): CommandResult {
  return { frames: [text(message, 'error')], mutations: [], events: [] };
}

/** A result that only reports informational frames and changes nothing. */
export function info(...frames: CommandResult['frames']): CommandResult {
  return { frames, mutations: [], events: [] };
}

/** Everything after the first whitespace-delimited token — a command's message body. */
export function messageBody(raw: string): string {
  return raw.replace(/^\S+\s*/, '').trim();
}
