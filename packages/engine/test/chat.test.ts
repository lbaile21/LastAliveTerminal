import { describe, it, expect } from 'vitest';
import { runCommand } from '../src/index';
import { makeContext } from './helpers';

describe('say / broadcast', () => {
  it('say emits a node-channel chat event', () => {
    const result = runCommand(makeContext(), 'say hello survivors');
    expect(result.events).toEqual([
      { type: 'chat', actorId: 'player-1', payload: { channel: 'node', text: 'hello survivors' } },
    ]);
  });

  it('broadcast emits a world-channel chat event', () => {
    const result = runCommand(makeContext(), 'broadcast anyone out there');
    expect(result.events[0]).toMatchObject({
      type: 'chat',
      payload: { channel: 'world', text: 'anyone out there' },
    });
  });

  it('rejects an empty message', () => {
    const result = runCommand(makeContext(), 'say');
    expect(result.events).toEqual([]);
    expect(result.frames[0]).toMatchObject({ style: 'error' });
  });

  it('the dead cannot speak', () => {
    const result = runCommand(makeContext({ player: { status: 'dead' } }), 'say hello');
    expect(result.events).toEqual([]);
    expect(result.frames[0]).toMatchObject({ style: 'error' });
  });
});
