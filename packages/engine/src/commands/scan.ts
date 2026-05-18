import type { Frame } from '@last-alive/shared';
import { choice, text } from '../frameBuilders';
import type { CommandHandler } from './handler';

/** `scan` — list the other survivors (and zombies) at your node. */
export const scanCommand: CommandHandler = {
  verb: 'scan',
  summary: 'Scan your location for other survivors.',
  run: (ctx) => {
    if (ctx.occupants.length === 0) {
      return {
        frames: [text('·· no other signals at this node ··', 'system')],
        mutations: [],
        events: [],
      };
    }

    const rows = ctx.occupants.map((o) => `  ${o.callsign.padEnd(20)} ${o.apparentStatus}`);
    const frames: Frame[] = [text([':: SIGNALS AT THIS NODE', '', ...rows], 'system')];

    // A zombie sees its prey as tappable targets.
    if (ctx.player.status === 'zombie') {
      const prey = ctx.occupants.filter((o) => o.apparentStatus === 'human');
      if (prey.length > 0) {
        frames.push(
          choice(prey.map((o) => ({ label: `bite ${o.callsign}`, command: `bite ${o.callsign}` }))),
        );
      }
    }

    return { frames, mutations: [], events: [] };
  },
};
