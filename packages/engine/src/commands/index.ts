import { text } from '../frameBuilders';
import type { CommandHandler } from './handler';
import { lookCommand } from './look';
import { moveCommand } from './move';
import { statusCommand } from './status';
import { scanCommand } from './scan';
import { biteCommand } from './bite';
import { sayCommand } from './say';
import { broadcastCommand } from './broadcast';

/** `help` — list the verbs the terminal accepts. */
const helpCommand: CommandHandler = {
  verb: 'help',
  summary: 'List available commands.',
  run: () => ({
    frames: [
      text(
        [
          ':: TERMINAL MANIFEST',
          '',
          ...Object.values(commandRegistry).map((h) => `  ${h.verb.padEnd(9)} ${h.summary}`),
        ],
        'system',
      ),
    ],
    mutations: [],
    events: [],
  }),
};

const handlers: CommandHandler[] = [
  lookCommand,
  moveCommand,
  scanCommand,
  biteCommand,
  sayCommand,
  broadcastCommand,
  statusCommand,
  helpCommand,
];

/** Verb → handler. The single source of truth for what the engine accepts. */
export const commandRegistry: Record<string, CommandHandler> = Object.fromEntries(
  handlers.map((h) => [h.verb, h]),
);

export type { CommandHandler } from './handler';
