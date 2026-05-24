interface DateRangePickerProps {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
  presets: {
    currentWeek: { start: string; end: string };
    ytd: { start: string; end: string };
    forecast5w: { start: string; end: string };
  };
  forecastHorizonEnd: string;
  forecastHorizonWeeks: number;
}

export function DateRangePicker({
  start,
  end,
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
          onChange={(e) => onChange(e.target.value, end)}
          aria-label="Range start"
        />
        <span className="date-sep">to</span>
        <input
          type="date"
          value={end}
          min={start}
          onChange={(e) => onChange(start, e.target.value)}
          aria-label="Range end"
        />
      </div>
      <div className="preset-row">
        <button type="button" className="chip" onClick={() => onChange(presets.currentWeek.start, presets.currentWeek.end)}>
          Current week
        </button>
        <button type="button" className="chip" onClick={() => onChange(presets.ytd.start, presets.ytd.end)}>
          Year to date
        </button>
        <button
          type="button"
          className="chip accent"
          onClick={() => onChange(presets.forecast5w.start, presets.forecast5w.end)}
        >
          5 Week Out Forecast
        </button>
      </div>
    </div>
  );
}
