import type { WorldGraph } from '../graph';

/**
 * Season 01 — "Containment" — the hand-authored launch map.
 *
 * Small on purpose: a six-node graph that exercises the gate → hub → spokes
 * topology. Later seasons are AI-generated and solver-verified before being
 * frozen into the same WorldGraph shape.
 */
export const season01: WorldGraph = {
  seasonCode: 'S01',
  startNodeId: 'node-gate',
  nodes: {
    'node-gate': {
      id: 'node-gate',
      code: 'GATE',
      name: 'Containment Gate C-7',
      type: 'gate',
      asciiArtKey: 'anura-banner',
      lore: 'Blast doors jammed half-open on something that used to be a guard. Your terminal flickers awake on its wrist — cracked screen, three bars of mesh signal. Somewhere in this building the outbreak started. You are LAST ALIVE until the network proves otherwise.',
      edges: ['node-atrium'],
    },
    'node-atrium': {
      id: 'node-atrium',
      code: 'ATRIUM',
      name: 'Anura Labs Atrium',
      type: 'atrium',
      lore: 'A four-storey glass atrium gone dark. Reception monitors loop a containment notice nobody read in time. Corridors branch toward the wet labs, the server vault, and a maintenance stairwell down into the sewers.',
      edges: ['node-gate', 'node-lab-a', 'node-vault', 'node-sewer'],
    },
    'node-lab-a': {
      id: 'node-lab-a',
      code: 'LAB-A',
      name: 'Wet Lab Alpha',
      type: 'lab',
      lore: 'Specimen fridges hang open and humming. Whiteboards are dense with notation for something called the ANURA strain. A cure was being worked here — the research is half-finished and the researchers are gone.',
      puzzleId: 'binary-keypad',
      edges: ['node-atrium', 'node-vault'],
    },
    'node-vault': {
      id: 'node-vault',
      code: 'VAULT',
      name: 'Server Vault',
      type: 'vault',
      lore: 'Cold aisles of racks, most of them dead. One cabinet still breathes — a single amber light. The lab overseer AI, ANURA, runs in there, talking quietly to itself in the dark.',
      // AI-gated: ANURA must be persuaded to open the vault.
      puzzleId: 'anura-vault',
      edges: ['node-atrium', 'node-lab-a'],
    },
    'node-sewer': {
      id: 'node-sewer',
      code: 'SEWER',
      name: 'Sewer Access D',
      type: 'sewer',
      lore: 'Ankle-deep runoff and a smell that gets into your teeth. The infected do not like the water. Other survivors have scratched arrows into the brick, pointing further down.',
      edges: ['node-atrium', 'node-burrow'],
    },
    'node-burrow': {
      id: 'node-burrow',
      code: 'BURROW',
      name: 'Safehouse: The Burrow',
      type: 'safehouse',
      lore: 'A dry maintenance room behind a welded grate. Sleeping bags, ration tins, a corkboard of callsigns. Whoever is here decided to trust each other. The question is whether they should.',
      edges: ['node-sewer'],
    },
  },
};
