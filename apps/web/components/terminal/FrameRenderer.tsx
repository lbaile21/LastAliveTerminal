import type { Frame, MapFrame, StatusFrame } from '@last-alive/shared';
import { ASCII_ART } from './asciiArt';

/** Render one engine frame. The client never interprets game state — only frames. */

function VitalBar({ label, value }: { label: string; value: number }) {
  const filled = Math.max(0, Math.min(10, Math.round(value / 10)));
  return (
    <div className="vital">
      <span className="vital-label">{label}</span>
      <span className="vital-bar">
        {'█'.repeat(filled)}
        {'░'.repeat(10 - filled)}
      </span>
      <span className="vital-value">{value}</span>
    </div>
  );
}

function StatusPanel({ frame }: { frame: StatusFrame }) {
  return (
    <div className={`frame-status status-${frame.status}`}>
      <div className="status-head">:: STATUS — {frame.status.toUpperCase()}</div>
      <VitalBar label="HP " value={frame.vitals.health} />
      <VitalBar label="FED" value={frame.vitals.hunger} />
      <VitalBar label="PWR" value={frame.vitals.energy} />
    </div>
  );
}

function MapPanel({ frame }: { frame: MapFrame }) {
  return (
    <div className="frame-map">
      <div className="map-head">:: LOCAL MESH</div>
      {frame.nodes.map((node) => {
        const here = node.id === frame.current;
        return (
          <div key={node.id} className={`map-node${here ? ' map-here' : ''}`}>
            <span className="map-mark">{here ? '▸' : ' '}</span>
            <span className="map-code">{node.code}</span>
            <span className="map-name">{node.name}</span>
            {here && <span className="map-you">[you]</span>}
            {node.locked && <span className="map-lock">[locked]</span>}
          </div>
        );
      })}
    </div>
  );
}

export function FrameRenderer({
  frame,
  onCommand,
}: {
  frame: Frame;
  onCommand: (command: string) => void;
}) {
  switch (frame.type) {
    case 'text':
      return (
        <div className={`frame-text text-${frame.style}`}>
          {frame.lines.map((line, i) => (
            <div key={i} className="line">
              {line === '' ? ' ' : line}
            </div>
          ))}
        </div>
      );
    case 'ascii':
      return <pre className="frame-ascii">{ASCII_ART[frame.artKey] ?? `[ ${frame.artKey} ]`}</pre>;
    case 'status':
      return <StatusPanel frame={frame} />;
    case 'map':
      return <MapPanel frame={frame} />;
    case 'choice':
      return (
        <div className="frame-choice">
          {frame.options.map((option) => (
            <button
              key={option.command}
              type="button"
              className="chip chip-inline"
              onClick={() => onCommand(option.command)}
            >
              {option.label}
            </button>
          ))}
        </div>
      );
    case 'prompt':
      return (
        <div className="frame-text text-system frame-prompt">
          {frame.prompt.split('\n').map((line, i) => (
            <div key={i} className="line">
              {line === '' ? ' ' : line}
            </div>
          ))}
        </div>
      );
    case 'stream':
      return <div className="frame-text text-normal">{frame.text}</div>;
    case 'fx':
      // Visual effects are wired up in a later milestone.
      return <div className={`frame-fx fx-${frame.effect}`} aria-hidden="true" />;
    default:
      return null;
  }
}
