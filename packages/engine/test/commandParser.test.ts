import { describe, it, expect } from 'vitest';
import { parseCommand } from '../src/index';

describe('parseCommand', () => {
  it('lower-cases the verb and trims the raw input', () => {
    const cmd = parseCommand('  LOOK  ');
    expect(cmd.verb).toBe('look');
    expect(cmd.raw).toBe('LOOK');
  });

  it('extracts a target and trailing args', () => {
    const cmd = parseCommand('move ATRIUM fast now');
    expect(cmd.verb).toBe('move');
    expect(cmd.target).toBe('ATRIUM');
    expect(cmd.args).toEqual(['fast', 'now']);
  });

  it('parses bare and valued flags', () => {
    const cmd = parseCommand('hack VAULT --tool=decrypt --verbose');
    expect(cmd.target).toBe('VAULT');
    expect(cmd.flags).toEqual({ tool: 'decrypt', verbose: true });
  });

  it('yields an empty verb for blank input rather than throwing', () => {
    const cmd = parseCommand('   ');
    expect(cmd.verb).toBe('');
    expect(cmd.target).toBeUndefined();
    expect(cmd.args).toEqual([]);
  });
});
