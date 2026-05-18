import { describe, it, expect } from 'vitest';
import { runCommand, puzzleSeed } from '../src/index';
import type { Frame } from '@last-alive/shared';
import { wordFor } from '../src/puzzles/defs/binaryDecode';
import { makeContext } from './helpers';

const types = (frames: Frame[]): string[] => frames.map((f) => f.type);

/** The correct answer for the default test player's binary-keypad instance. */
const ANSWER = wordFor(puzzleSeed('player-1', 'binary-keypad', 'S01'));

describe('puzzle gating via move', () => {
  it('opens a puzzle interaction when moving to a sealed node', () => {
    const ctx = makeContext({ player: { currentNodeId: 'node-atrium' } });
    const result = runCommand(ctx, 'move LAB-A');

    expect(types(result.frames)).toContain('prompt');
    expect(result.mutations).toEqual([
      {
        type: 'startInteraction',
        playerId: 'player-1',
        interaction: { kind: 'puzzle', puzzleId: 'binary-keypad', nodeId: 'node-lab-a', attempts: 0 },
      },
    ]);
  });

  it('moves straight through once the gating puzzle is solved', () => {
    const ctx = makeContext({
      player: { currentNodeId: 'node-atrium', solvedPuzzles: ['binary-keypad'] },
    });
    const result = runCommand(ctx, 'move LAB-A');

    expect(result.mutations).toEqual([
      { type: 'move', playerId: 'player-1', toNodeId: 'node-lab-a' },
    ]);
  });
});

describe('resolving an active puzzle interaction', () => {
  const inPuzzle = () =>
    makeContext({
      player: {
        currentNodeId: 'node-atrium',
        interaction: { kind: 'puzzle', puzzleId: 'binary-keypad', nodeId: 'node-lab-a', attempts: 0 },
      },
    });

  it('solves the puzzle, unlocks it and completes the move', () => {
    const result = runCommand(inPuzzle(), ANSWER);
    expect(result.mutations).toEqual([
      { type: 'solvePuzzle', playerId: 'player-1', puzzleId: 'binary-keypad' },
      { type: 'endInteraction', playerId: 'player-1' },
      { type: 'move', playerId: 'player-1', toNodeId: 'node-lab-a' },
    ]);
    expect(result.frames[0]).toMatchObject({ type: 'text', style: 'success' });
  });

  it('counts a wrong answer as a failed attempt and re-prompts', () => {
    const result = runCommand(inPuzzle(), 'NOTITDEFINITELYISNT');
    expect(result.mutations).toEqual([{ type: 'bumpAttempts', playerId: 'player-1' }]);
    expect(types(result.frames)).toEqual(['text', 'prompt']);
  });

  it('escapes the interaction on `abort`', () => {
    const result = runCommand(inPuzzle(), 'abort');
    expect(result.mutations).toEqual([{ type: 'endInteraction', playerId: 'player-1' }]);
  });

  it('routes ALL input to the puzzle — a command verb is not dispatched', () => {
    const result = runCommand(inPuzzle(), 'look');
    // `look` is treated as a (wrong) answer, not run as the look command.
    expect(types(result.frames)).toEqual(['text', 'prompt']);
    expect(result.mutations).toEqual([{ type: 'bumpAttempts', playerId: 'player-1' }]);
  });

  it('re-shows the prompt for empty input without counting an attempt', () => {
    const result = runCommand(inPuzzle(), '   ');
    expect(types(result.frames)).toEqual(['prompt']);
    expect(result.mutations).toEqual([]);
  });
});
