import { describe, it, expect } from 'vitest';
import { frameSchema, commandRequestSchema, MAX_COMMAND_LENGTH } from '../src/index';

describe('frame contract', () => {
  it('parses a text frame and applies the default style', () => {
    const parsed = frameSchema.parse({ type: 'text', lines: ['hello'] });
    expect(parsed).toEqual({ type: 'text', lines: ['hello'], style: 'normal' });
  });

  it('parses each frame variant in the discriminated union', () => {
    expect(() => frameSchema.parse({ type: 'ascii', artKey: 'anura-banner' })).not.toThrow();
    expect(() =>
      frameSchema.parse({
        type: 'status',
        status: 'human',
        vitals: { health: 100, hunger: 80, energy: 60 },
      }),
    ).not.toThrow();
    expect(() =>
      frameSchema.parse({ type: 'choice', options: [{ label: 'go', command: 'move ATRIUM' }] }),
    ).not.toThrow();
  });

  it('rejects an unknown frame type', () => {
    expect(() => frameSchema.parse({ type: 'explode' })).toThrow();
  });
});

describe('command request contract', () => {
  it('accepts a well-formed request', () => {
    expect(() =>
      commandRequestSchema.parse({ sessionId: 's1', command: 'look', clientFrameSeq: 0 }),
    ).not.toThrow();
  });

  it('rejects an over-long command', () => {
    const long = 'x'.repeat(MAX_COMMAND_LENGTH + 1);
    expect(() =>
      commandRequestSchema.parse({ sessionId: 's1', command: long, clientFrameSeq: 0 }),
    ).toThrow();
  });

  it('rejects an empty command', () => {
    expect(() =>
      commandRequestSchema.parse({ sessionId: 's1', command: '', clientFrameSeq: 0 }),
    ).toThrow();
  });
});
