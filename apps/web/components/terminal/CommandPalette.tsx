/** Tap-first command chips above the keyboard — the core mobile affordance. */

interface Option {
  label: string;
  command: string;
}

/** Always-available verbs, appended after any contextual options. */
const BASE_COMMANDS: Option[] = [
  { label: 'look', command: 'look' },
  { label: 'status', command: 'status' },
  { label: 'help', command: 'help' },
];

export function CommandPalette({
  options,
  disabled,
  onPick,
  hideBase = false,
}: {
  options: Option[];
  disabled: boolean;
  onPick: (command: string) => void;
  /** While mid-puzzle the always-on verbs are hidden — input is the answer. */
  hideBase?: boolean;
}) {
  const seen = new Set<string>();
  const items = [...options, ...(hideBase ? [] : BASE_COMMANDS)].filter((option) => {
    if (seen.has(option.command)) return false;
    seen.add(option.command);
    return true;
  });

  return (
    <div className="palette" role="group" aria-label="quick commands">
      {items.map((option) => (
        <button
          key={option.command}
          type="button"
          className="chip"
          disabled={disabled}
          onClick={() => onPick(option.command)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
