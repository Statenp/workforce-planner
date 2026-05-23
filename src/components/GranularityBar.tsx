import type { Granularity } from '../types';

interface GranularityBarProps {
  granularity: Granularity;
  onChange: (g: Granularity) => void;
  canDrillUp: boolean;
  canDrillDown: boolean;
  onDrillUp: () => void;
  onResetDrill: () => void;
  focusLabel: string | null;
}

const OPTIONS: { value: Granularity; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

export function GranularityBar({
  granularity,
  onChange,
  canDrillUp,
  canDrillDown,
  onDrillUp,
  onResetDrill,
  focusLabel,
}: GranularityBarProps) {
  return (
    <div className="control-card granularity-bar">
      <span className="control-label">View by</span>
      <div className="segmented">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            className={granularity === o.value ? 'active' : ''}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="drill-actions">
        <button type="button" className="chip" disabled={!canDrillUp} onClick={onDrillUp}>
          Drill up
        </button>
        {focusLabel && (
          <button type="button" className="chip ghost" onClick={onResetDrill}>
            Reset focus
          </button>
        )}
        {focusLabel && <span className="focus-badge">Focused: {focusLabel}</span>}
        {!canDrillDown && <span className="hint">At day level — select a row to inspect</span>}
      </div>
    </div>
  );
}
