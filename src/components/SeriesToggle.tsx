import type { CSSProperties } from 'react';
import type { SeriesKey } from '../types';

const SERIES: { key: SeriesKey; label: string; color: string }[] = [
  { key: 'actual', label: 'Actuals', color: '#38bdf8' },
  { key: 'actualLy', label: 'Actuals (LY)', color: '#94a3b8' },
  { key: 'budget', label: 'Budget', color: '#fbbf24' },
  { key: 'forecast', label: 'Forecast', color: '#a78bfa' },
];

interface SeriesToggleProps {
  visible: SeriesKey[];
  onChange: (v: SeriesKey[]) => void;
}

export function SeriesToggle({ visible, onChange }: SeriesToggleProps) {
  const toggle = (key: SeriesKey) => {
    onChange(visible.includes(key) ? visible.filter((k) => k !== key) : [...visible, key]);
  };

  return (
    <div className="series-toggle">
      {SERIES.map((s) => (
        <button
          key={s.key}
          type="button"
          className={visible.includes(s.key) ? 'active' : ''}
          style={{ '--series-color': s.color } as CSSProperties}
          onClick={() => toggle(s.key)}
        >
          <span className="dot" />
          {s.label}
        </button>
      ))}
    </div>
  );
}
