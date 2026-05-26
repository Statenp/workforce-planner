import type { DateRangePresetId } from '@/hooks/usePlannerData';

type PresetKey = Exclude<DateRangePresetId, 'custom'>;

interface DateRangePickerProps {
  start: string;
  end: string;
  activePreset: DateRangePresetId;
  onChange: (start: string, end: string, presetId?: DateRangePresetId) => void;
  presets: Record<PresetKey, { start: string; end: string }>;
  forecastHorizonEnd: string;
  forecastHorizonWeeks: number;
}

const PRESET_OPTIONS: { id: PresetKey; label: string }[] = [
  { id: 'currentWeek', label: 'Current week' },
  { id: 'ytd', label: 'Year to date' },
  { id: 'forecast5w', label: '5 Week Out Forecast' },
];

export function DateRangePicker({
  start,
  end,
  activePreset,
  onChange,
  presets,
  forecastHorizonEnd,
  forecastHorizonWeeks,
}: DateRangePickerProps) {
  return (
    <div className="control-card date-range">
      <span className="control-label">Date range</span>
      <p className="horizon-note">
        Forecast horizon: {forecastHorizonWeeks} weeks through {forecastHorizonEnd}
      </p>
      <div className="date-inputs">
        <input
          type="date"
          value={start}
          max={end}
          onChange={(e) => onChange(e.target.value, end, 'custom')}
          aria-label="Range start"
        />
        <span className="date-sep">to</span>
        <input
          type="date"
          value={end}
          min={start}
          onChange={(e) => onChange(start, e.target.value, 'custom')}
          aria-label="Range end"
        />
      </div>
      <div className="preset-row">
        {PRESET_OPTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`chip ${activePreset === id ? 'active' : ''}`}
            aria-pressed={activePreset === id}
            onClick={() => onChange(presets[id].start, presets[id].end, id)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
