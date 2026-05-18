import { INCUBATION_MS } from '../simulation/tick';
import { text } from '../frameBuilders';
import type { CommandHandler } from './handler';
import { fail } from './util';

/** `bite <callsign>` — a zombie infects a survivor at the same node. */
export const biteCommand: CommandHandler = {
  verb: 'bite',
  summary: 'Infect a survivor at your location (zombies only).',
  run: (ctx, cmd) => {
    if (ctx.player.status !== 'zombie') {
      return fail('only the turned hunger like this. you cannot bite.');
    }
    const targetName = cmd.target;
    if (!targetName) {
      return fail('bite whom? name a survivor here — try `scan`.');
    }

    const target = ctx.occupants.find(
      (o) => o.callsign.toLowerCase() === targetName.toLowerCase(),
    );
    if (!target) {
      return fail(`no survivor called "${targetName}" is at this node.`);
    }
    if (target.apparentStatus === 'zombie') {
      return fail(`${target.callsign} is already one of us.`);
    }
    if (target.apparentStatus === 'dead') {
      return fail(`${target.callsign} is already dead. there is nothing left to turn.`);
    }

    // The target looks human. Whether the bite actually takes (they may already
    // be incubating) is decided by the store — the zombie never finds out.
    return {
      frames: [
        text(`you sink your teeth into ${target.callsign}. the strain does the rest.`, 'enemy'),
      ],
      mutations: [
        {
          type: 'infect',
          targetId: target.id,
          byId: ctx.player.id,
          incubationEndsAt: ctx.now + INCUBATION_MS,
        },
      ],
      events: [{ type: 'bite', actorId: ctx.player.id, targetId: target.id }],
    };
  },
};
