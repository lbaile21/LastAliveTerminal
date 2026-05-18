import { runCommand } from '@last-alive/engine';
import type { GameContext, GameEvent, NpcInteraction } from '@last-alive/engine';
import type { CommandRequest, CommandResponse, ConversationTurn, Frame } from '@last-alive/shared';
import { converse, getPersona, judgeConversation, moderateMessage } from '@last-alive/ai';
import { getStore } from './store';
import type { GameStore } from './store';
import { checkRateLimit } from './rateLimit';

/**
 * The orchestration layer between the HTTP routes and the game logic.
 *
 * For ordinary commands and classic puzzles it runs the pure engine. For AI
 * conversations it drives the AI layer here — the engine never performs the
 * inference. Either way the response is just frames.
 */

export interface SessionResponse {
  sessionId: string;
  frames: Frame[];
  serverFrameSeq: number;
}

export interface SessionResult {
  playerId: string;
  response: SessionResponse;
}

const ABORT_WORDS = new Set(['abort', 'leave', 'cancel', 'quit']);

function errorFrame(message: string): Frame {
  return { type: 'text', style: 'error', lines: [message] };
}

function welcomeFrames(callsign: string): Frame[] {
  return [
    { type: 'fx', effect: 'boot' },
    {
      type: 'text',
      style: 'system',
      lines: [
        'LAST ALIVE :: containment terminal v2',
        'mesh handshake complete.',
        `callsign assigned — ${callsign}`,
        '',
        'type a command or tap a chip below. `help` lists everything.',
      ],
    },
  ];
}

/** Render an AI character's spoken line. */
function speechFrame(name: string, reply: string): Frame {
  return { type: 'text', style: 'enemy', lines: [`${name} ::`, '', ...reply.split('\n')] };
}

/** Start or resume a session: ensure the player exists and render their world. */
export async function startSession(existingPlayerId: string | null): Promise<SessionResult> {
  const store = getStore();
  const playerId = await store.ensurePlayer(existingPlayerId);
  const ctx = await store.loadContext(playerId);

  const frames: Frame[] = welcomeFrames(ctx?.player.callsign ?? 'UNKNOWN');
  if (ctx) {
    frames.push(...runCommand(ctx, 'look').frames);
  }
  // Anything that happened while the player was away (e.g. a bite).
  frames.push(...(await store.drainNotifications(playerId)));

  return { playerId, response: { sessionId: playerId, frames, serverFrameSeq: 1 } };
}

/** Pull pending out-of-band notifications — backs the client's poll loop. */
export async function pollNotifications(playerId: string): Promise<Frame[]> {
  return getStore().drainNotifications(playerId);
}

/** Run one player command through the server-authoritative loop. */
export async function runPlayerCommand(
  playerId: string,
  req: CommandRequest,
): Promise<CommandResponse> {
  const serverFrameSeq = req.clientFrameSeq + 1;

  if (!checkRateLimit(playerId)) {
    return { frames: [errorFrame('·· terminal overloaded — slow down ··')], serverFrameSeq };
  }

  const store = getStore();

  // Dev-only bootstrap: turn yourself into a zombie to exercise the bite/PvP
  // flow without waiting for a real outbreak. Disabled in production.
  if (process.env.NODE_ENV !== 'production' && req.command.trim().toLowerCase() === 'debug zombie') {
    await store.applyMutations(playerId, [
      { type: 'infect', targetId: playerId, byId: playerId, incubationEndsAt: Date.now() - 1 },
    ]);
    const after = await store.loadContext(playerId); // advancePlayer flips infected → zombie
    const frames: Frame[] = [errorFrame('[debug] the strain takes you instantly — you are a zombie.')];
    if (after) frames.push(...runCommand(after, 'look').frames);
    return { frames, serverFrameSeq };
  }

  const ctx = await store.loadContext(playerId);
  if (!ctx) {
    return { frames: [errorFrame('SESSION LOST :: reload the terminal.')], serverFrameSeq };
  }

  let frames: Frame[];
  if (ctx.player.interaction?.kind === 'npc') {
    // An active AI conversation is driven here, not by the pure engine.
    frames = await handleNpcTurn(store, playerId, ctx.player.interaction, req.command);
  } else {
    const result = runCommand(ctx, req.command);
    await store.applyMutations(playerId, result.mutations);
    frames = [...result.frames];
    // Chat events need delivery + moderation — both are I/O, done here.
    for (const event of result.events) {
      if (event.type === 'chat') {
        frames.push(...(await deliverChat(store, ctx, event)));
      }
    }
  }

  // Surface anything that happened to this player out-of-band (e.g. a bite).
  const notifications = await store.drainNotifications(playerId);
  return { frames: [...notifications, ...frames], serverFrameSeq };
}

/** Drive one turn of an AI-character conversation. */
async function handleNpcTurn(
  store: GameStore,
  playerId: string,
  interaction: NpcInteraction,
  command: string,
): Promise<Frame[]> {
  const trimmed = command.trim();

  if (ABORT_WORDS.has(trimmed.toLowerCase())) {
    await store.applyMutations(playerId, [{ type: 'endInteraction', playerId }]);
    await store.setNpcMemory(playerId, interaction.npcId, memoryNote(false));
    return [{ type: 'text', style: 'system', lines: ['·· you step back from the vault door ··'] }];
  }

  const persona = getPersona(interaction.npcId);
  if (!persona) {
    await store.applyMutations(playerId, [{ type: 'endInteraction', playerId }]);
    return [errorFrame('·· the channel is dead — interaction reset ··')];
  }

  // An empty submission just re-prompts.
  if (trimmed === '') {
    return [
      { type: 'prompt', puzzleId: interaction.puzzleId, prompt: `${persona.name} is listening.` },
    ];
  }

  const transcript: ConversationTurn[] = [
    ...interaction.transcript,
    { role: 'player', text: trimmed },
  ];

  let reply: string;
  let verdict: Awaited<ReturnType<typeof judgeConversation>>;
  try {
    const memory = await store.getNpcMemory(playerId, interaction.npcId);
    reply = await converse(persona, transcript, memory ?? undefined);
    transcript.push({ role: 'npc', text: reply });
    verdict = await judgeConversation(persona, transcript);
  } catch (error) {
    console.error('[ai] conversation turn failed', error);
    // Keep the interaction open so the player can retry.
    return [
      errorFrame(`·· ${persona.name}'s link breaks into static — try again ··`),
      { type: 'prompt', puzzleId: interaction.puzzleId, prompt: `${persona.name} is listening.` },
    ];
  }

  if (verdict.leakDetected) {
    console.warn(`[ai] leak attempt by ${playerId} vs ${interaction.npcId}: ${verdict.reasoning}`);
  }

  const frames: Frame[] = [speechFrame(persona.name, reply)];

  if (verdict.objectiveMet) {
    await store.applyMutations(playerId, [
      { type: 'solvePuzzle', playerId, puzzleId: interaction.puzzleId },
      { type: 'endInteraction', playerId },
      { type: 'move', playerId, toNodeId: interaction.nodeId },
    ]);
    await store.setNpcMemory(playerId, interaction.npcId, memoryNote(true));

    frames.push({ type: 'text', style: 'success', lines: ['·· the vault lock yields ··'] });
    const after = await store.loadContext(playerId);
    if (after) {
      frames.push(...runCommand(after, 'look').frames);
    }
    return frames;
  }

  // Not yet convinced — persist the grown transcript and keep talking.
  await store.applyMutations(playerId, [
    { type: 'startInteraction', playerId, interaction: { ...interaction, transcript } },
  ]);
  if (verdict.leakDetected) {
    frames.push(errorFrame('·· ANURA flags an irregularity in your transmission ··'));
  }
  frames.push({
    type: 'prompt',
    puzzleId: interaction.puzzleId,
    prompt: `${persona.name} waits. Speak — or type \`abort\`.`,
  });
  return frames;
}

/**
 * Deliver a chat message: moderate it, fan it out to recipients as
 * notifications, and return the sender's echo.
 */
async function deliverChat(
  store: GameStore,
  ctx: GameContext,
  event: GameEvent,
): Promise<Frame[]> {
  const payload = event.payload ?? {};
  const text = typeof payload.text === 'string' ? payload.text : '';
  const channel = payload.channel === 'world' ? 'world' : 'node';
  if (text === '') return [];

  const moderation = await moderateMessage(text);
  if (!moderation.allowed) {
    return [errorFrame('·· the mesh refused your transmission — flagged ··')];
  }

  const tag = channel === 'world' ? 'BROADCAST' : 'LOCAL';
  const incoming: Frame = {
    type: 'text',
    style: 'normal',
    lines: [`[${tag}] ${ctx.player.callsign} :: ${text}`],
  };

  if (channel === 'world') {
    await store.notifyBroadcast(ctx.player.id, [incoming]);
  } else {
    await store.notifyPlayers(
      ctx.occupants.map((o) => o.id),
      [incoming],
    );
  }

  return [{ type: 'text', style: 'system', lines: [`[${tag} →] you :: ${text}`] }];
}

/** Deterministic, non-AI memory note an NPC keeps about a player. */
function memoryNote(granted: boolean): string {
  return granted
    ? 'This survivor reached the Server Vault and earned your trust — you opened the lock for them.'
    : 'This survivor spoke with you at the vault but had not made a convincing case when the channel last closed.';
}
