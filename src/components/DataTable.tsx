import type { Granularity, PeriodBucket, SeriesKey } from '../types';

interface DataTableProps {
  periods: PeriodBucket[];
  granularity: Granularity;
  visibleSeries: SeriesKey[];
  canDrillDown: boolean;
  onDrillDown: (key: string) => void;
  onSelectPeriod: (key: string) => void;
  selectedKey: string | null;
}

const SERIES_COLUMNS: { key: SeriesKey; label: string }[] = [
  { key: 'actual', label: 'Actual' },
  { key: 'actualLy', label: 'Actual LY' },
  { key: 'budget', label: 'Budget' },
  { key: 'forecast', label: 'Forecast' },
];

function fmt(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function DataTable({
  periods,
  granularity,
  visibleSeries,
  canDrillDown,
  onDrillDown,
  onSelectPeriod,
  selectedKey,
}: DataTableProps) {
  const cols = SERIES_COLUMNS.filter((c) => visibleSeries.includes(c.key));

  return (
    <div className="table-panel">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Period</th>
              {cols.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
              {canDrillDown && <th />}
            </tr>
          </thead>
          <tbody>
            {periods.map((p) => (
              <tr
                key={p.key}
                className={[
                  selectedKey === p.key ? 'selected' : '',
                  p.isFuture ? 'future-period' : '',
                  p.spansForecastHorizon ? 'forecast-span' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onSelectPeriod(p.key)}
              >
                <td>
                  <strong>{p.label}</strong>
                  {p.isFuture && <span className="period-badge">Forecast</span>}
                  {p.spansForecastHorizon && !p.isFuture && (
                    <span className="period-badge partial">Includes forecast days</span>
                  )}
                  <small>
                    {granularity} · {p.start} → {p.end}
                  </small>
                </td>
                {cols.map((c) => (
                  <td key={c.key}>{fmt(p[c.key])}</td>
                ))}
                {canDrillDown && (
                  <td>
                    <button
                      type="button"
                      className="chip"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDrillDown(p.key);
                      }}
                    >
                      Drill down
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
