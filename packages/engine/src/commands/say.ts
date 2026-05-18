import type { CommandHandler } from './handler';
import { fail, messageBody } from './util';

/**
 * `say <message>` — speak to everyone at your current node.
 *
 * The engine only emits a `chat` event; delivery (and moderation) happens in
 * the game-service layer, since broadcasting to other players is I/O.
 */
export const sayCommand: CommandHandler = {
  verb: 'say',
  summary: 'Speak to everyone at your node. Usage: say <message>',
  run: (ctx, cmd) => {
    if (ctx.player.status === 'dead') {
      return fail('the dead have no voice on the mesh.');
    }
    const message = messageBody(cmd.raw);
    if (!message) {
      return fail('say what? — `say <message>`');
    }
    return {
      frames: [],
      mutations: [],
      events: [{ type: 'chat', actorId: ctx.player.id, payload: { channel: 'node', text: message } }],
    };
  },
};
