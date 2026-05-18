'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Frame } from '@last-alive/shared';
import { FrameRenderer } from './FrameRenderer';
import { CommandPalette } from './CommandPalette';

/**
 * The terminal — a thin client.
 *
 * It owns no game logic: it POSTs a command string, receives frames, and
 * renders them. Identity lives in an httpOnly cookie it cannot read. Inspecting
 * this code or the network tab reveals nothing the player has not already seen.
 */

type Entry =
  | { id: number; kind: 'echo'; text: string }
  | { id: number; kind: 'frame'; frame: Frame };

interface SessionPayload {
  sessionId: string;
  frames: Frame[];
  serverFrameSeq: number;
}

interface CommandPayload {
  frames: Frame[];
  serverFrameSeq: number;
}

function errorFrame(message: string): Frame {
  return { type: 'text', style: 'error', lines: [message] };
}

export function Terminal() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [input, setInput] = useState('');
  const [seq, setSeq] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const idCounter = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const append = useCallback((items: Entry[]) => {
    setEntries((prev) => [...prev, ...items]);
  }, []);

  const pushFrames = useCallback(
    (frames: Frame[]) => {
      append(frames.map((frame) => ({ id: idCounter.current++, kind: 'frame' as const, frame })));
    },
    [append],
  );

  // Open a session on mount.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/session', { method: 'POST' });
        if (cancelled || !res.ok) return;
        const data = (await res.json()) as SessionPayload;
        if (cancelled) return;
        setSessionId(data.sessionId);
        setSeq(data.serverFrameSeq);
        pushFrames(data.frames);
      } catch {
        if (!cancelled) pushFrames([errorFrame('·· could not reach the mesh — reload ··')]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pushFrames]);

  // Poll for out-of-band notifications (a bite landing, etc.) while idle.
  useEffect(() => {
    if (!sessionId) return;
    const interval = setInterval(() => {
      void (async () => {
        try {
          const res = await fetch('/api/poll', { method: 'POST' });
          if (!res.ok) return;
          const data = (await res.json()) as { frames: Frame[] };
          if (data.frames.length > 0) pushFrames(data.frames);
        } catch {
          // Best-effort — a missed poll just surfaces on the next one.
        }
      })();
    }, 18_000);
    return () => clearInterval(interval);
  }, [sessionId, pushFrames]);

  // Keep the latest output in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries, busy]);

  const submit = useCallback(
    async (raw: string) => {
      const command = raw.trim();
      if (!command || busy || !sessionId) return;

      setBusy(true);
      setInput('');
      append([{ id: idCounter.current++, kind: 'echo', text: command }]);

      try {
        const res = await fetch('/api/command', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sessionId, command, clientFrameSeq: seq }),
        });
        if (res.status === 401) {
          pushFrames([errorFrame('SESSION LOST :: reload the page.')]);
          return;
        }
        const data = (await res.json()) as CommandPayload;
        setSeq(data.serverFrameSeq);
        pushFrames(data.frames);
      } catch {
        pushFrames([errorFrame('·· mesh link dropped — try again ··')]);
      } finally {
        setBusy(false);
        inputRef.current?.focus();
      }
    },
    [busy, sessionId, seq, append, pushFrames],
  );

  // The most recent frame sets the UI mode. A `prompt` means the player is
  // mid-puzzle: input becomes the answer and the palette collapses to `abort`.
  let lastFrameType: Frame['type'] | null = null;
  for (let i = entries.length - 1; i >= 0; i--) {
    const entry = entries[i];
    if (entry && entry.kind === 'frame') {
      lastFrameType = entry.frame.type;
      break;
    }
  }
  const puzzleMode = lastFrameType === 'prompt';

  let paletteOptions: { label: string; command: string }[] = [];
  if (puzzleMode) {
    paletteOptions = [{ label: 'abort', command: 'abort' }];
  } else {
    for (let i = entries.length - 1; i >= 0; i--) {
      const entry = entries[i];
      if (entry && entry.kind === 'frame' && entry.frame.type === 'choice') {
        paletteOptions = entry.frame.options;
        break;
      }
    }
  }

  return (
    <main className="crt">
      <div className="crt-scanlines" aria-hidden="true" />

      <div className="terminal-scroll" ref={scrollRef}>
        {entries.map((entry) =>
          entry.kind === 'echo' ? (
            <div key={entry.id} className="echo">
              <span className="echo-sigil">&gt;</span> {entry.text}
            </div>
          ) : (
            <FrameRenderer key={entry.id} frame={entry.frame} onCommand={submit} />
          ),
        )}
        {busy && <div className="busy">·· decrypting transmission ··</div>}
      </div>

      <CommandPalette
        options={paletteOptions}
        disabled={busy || !sessionId}
        onPick={submit}
        hideBase={puzzleMode}
      />

      <form
        className="prompt"
        onSubmit={(event) => {
          event.preventDefault();
          void submit(input);
        }}
      >
        <span className="prompt-sigil">&gt;</span>
        <input
          ref={inputRef}
          className="prompt-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={
            !sessionId ? 'connecting to mesh…' : puzzleMode ? 'type your answer…' : 'enter command…'
          }
          disabled={!sessionId}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="send"
          aria-label="terminal command input"
        />
      </form>
    </main>
  );
}
