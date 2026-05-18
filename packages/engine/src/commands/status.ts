import type { Frame } from '@last-alive/shared';
import { text } from '../frameBuilders';
import type { CommandHandler } from './handler';

const STATUS_LINE: Record<string, string> = {
  human: 'VITALS NOMINAL — you are, for now, uninfected.',
  infected: 'WARNING :: pathogen detected in bloodstream. Incubation in progress.',
  zombie: 'STRAIN DOMINANT — you are one of them now. Hunt. Spread.',
  dead: 'FLATLINE — the mesh keeps your callsign as a ghost.',
};

/** `status` — report vitals and infection state. */
export const statusCommand: CommandHandler = {
  verb: 'status',
  summary: 'Report your vitals and infection status.',
  run: (ctx) => {
    const { player } = ctx;
    const statusFrame: Frame = {
      type: 'status',
      status: player.status,
      vitals: { health: player.health, hunger: player.hunger, energy: player.energy },
    };

    const lines = [`:: ${player.callsign}`, STATUS_LINE[player.status] ?? ''];
    if (player.status === 'infected' && player.incubationEndsAt !== null) {
      const minutesLeft = Math.max(0, Math.ceil((player.incubationEndsAt - ctx.now) / 60_000));
      lines.push(
        minutesLeft > 0
          ? `the change comes in roughly ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`
          : 'the change is upon you.',
      );
    }

    return {
      frames: [statusFrame, text(lines, 'system')],
      mutations: [],
      events: [],
    };
  },
};
