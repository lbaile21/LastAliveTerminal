import type { CommandHandler } from './handler';
import { fail, messageBody } from './util';

/** `broadcast <message>` — transmit to every survivor on the mesh. */
export const broadcastCommand: CommandHandler = {
  verb: 'broadcast',
  summary: 'Transmit to every survivor on the mesh. Usage: broadcast <message>',
  run: (ctx, cmd) => {
    if (ctx.player.status === 'dead') {
      return fail('the dead have no voice on the mesh.');
    }
    const message = messageBody(cmd.raw);
    if (!message) {
      return fail('broadcast what? — `broadcast <message>`');
    }
    return {
      frames: [],
      mutations: [],
      events: [
        { type: 'chat', actorId: ctx.player.id, payload: { channel: 'world', text: message } },
      ],
    };
  },
};
