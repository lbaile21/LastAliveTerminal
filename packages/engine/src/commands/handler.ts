import type { Command } from '../commandParser';
import type { GameContext } from '../context';
import type { CommandResult } from '../types';

/**
 * A command is a pure function of (context, parsed command) → result.
 * It validates its own preconditions and never performs I/O.
 */
export interface CommandHandler {
  verb: string;
  /** One-line description shown by `help`. */
  summary: string;
  run(ctx: GameContext, cmd: Command): CommandResult;
}
