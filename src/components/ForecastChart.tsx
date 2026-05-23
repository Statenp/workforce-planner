import { useId, useState } from 'react';
import type { TooltipProps } from 'recharts';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { METRICS } from '../data/catalog';
import { holidayLabel } from '../services/nagerHolidays';
import type { ChartPoint, SeriesKey } from '../types';

const SERIES_COLORS: Record<SeriesKey, string> = {
  actual: '#38bdf8',
  actualLy: '#64748b',
  budget: '#fbbf24',
  forecast: '#c4b5fd',
};

const SERIES_LABELS: Record<SeriesKey, string> = {
  actual: 'Actual',
  actualLy: 'LY',
  budget: 'Budget',
  forecast: 'Forecast',
};

const HOLIDAY_STROKE = '#fb7185';

interface LineConfig {
  dataKey: string;
  name: string;
  color: string;
  strokeDash?: string;
}

interface ForecastChartProps {
  data: ChartPoint[];
  metricIds: string[];
  visibleSeries: SeriesKey[];
  holidaysLoading?: boolean;
  holidaysError?: string | null;
  holidayCountryCode?: string;
}

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as ChartPoint;

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {point.holidays && point.holidays.length > 0 && (
        <p className="chart-tooltip-holiday">
          Public holiday{point.holidays.length > 1 ? 's' : ''}: {point.holidays.join(' · ')}
        </p>
      )}
      <ul>
        {payload.map((entry) => (
          <li key={entry.dataKey} style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChartLegendBar({
  lines,
  showForecastWindow,
  showHolidays,
  holidayCountryCode,
  holidaysLoading,
  holidaysError,
}: {
  lines: LineConfig[];
  showForecastWindow: boolean;
  showHolidays: boolean;
  holidayCountryCode: string;
  holidaysLoading?: boolean;
  holidaysError?: string | null;
}) {
  const panelId = useId();
  const [expanded, setExpanded] = useState(true);

  const itemCount =
    lines.length +
    (showForecastWindow ? 1 : 0) +
    (showHolidays ? 1 : 0) +
    (holidaysLoading ? 1 : 0) +
    (holidaysError ? 1 : 0);

  return (
    <div className={`chart-legend-shell ${expanded ? 'is-expanded' : 'is-collapsed'}`}>
      <button
        type="button"
        className="chart-legend-toggle"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((open) => !open)}
        aria-label={expanded ? 'Collapse legend' : 'Expand legend'}
      >
        <span className="chart-legend-toggle-label">Legend</span>
        {expanded && (
          <span className="chart-legend-toggle-meta">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>
        )}
        <span className="chart-legend-chevron" aria-hidden />
      </button>
      <div className="chart-legend-wrap">
        <div id={panelId} className="chart-legend-bar" role="list" aria-label="Chart legend">
          {lines.map((line) => (
            <span key={line.dataKey} className="legend-item" role="listitem">
              <span
                className="legend-line-swatch"
                style={{
                  borderTopColor: line.color,
                  borderTopStyle: line.strokeDash ? 'dashed' : 'solid',
                }}
                aria-hidden
              />
              {line.name}
            </span>
          ))}
          {showForecastWindow && (
            <span className="legend-item" role="listitem">
              <span className="legend-area-swatch" aria-hidden />
              Forecast window
            </span>
          )}
          {showHolidays && (
            <span className="legend-item" role="listitem">
              <span className="legend-holiday-swatch" aria-hidden />
              Public holiday ({holidayCountryCode})
            </span>
          )}
          {holidaysLoading && (
            <span className="legend-status" role="status">
              Loading holidays…
            </span>
          )}
          {holidaysError && (
            <span className="legend-status legend-status-error" role="alert">
              {holidaysError}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ForecastChart({
  data,
  metricIds,
  visibleSeries,
  holidaysLoading,
  holidaysError,
  holidayCountryCode = 'US',
}: ForecastChartProps) {
  const futureStartIndex = data.findIndex((d) => d.isFuture || d.spansForecastHorizon);
  const futureStartLabel = futureStartIndex >= 0 ? data[futureStartIndex].label : null;
  const futureEndLabel = data.length > 0 ? data[data.length - 1].label : null;
  const holidayPoints = data.filter((d) => d.hasHoliday && d.holidays?.length);
  const showHolidays = holidayPoints.length > 0 || Boolean(holidaysLoading);

  const lines: LineConfig[] = [];

  for (const metricId of metricIds) {
    const metric = METRICS.find((m) => m.id === metricId);
    for (const series of visibleSeries) {
      const dataKey = `${metricId}_${series}`;
      lines.push({
        dataKey,
        name: `${metric?.name ?? metricId} (${SERIES_LABELS[series]})`,
        color: SERIES_COLORS[series],
        strokeDash: series === 'budget' ? '6 4' : series === 'actualLy' ? '2 6' : undefined,
      });
    }
  }

  return (
    <div className="chart-panel">
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={data} margin={{ top: 28, right: 20, left: 4, bottom: 4 }}>
          <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={(props) => {
              const { x, y, payload } = props;
              const point = data.find((d) => d.label === payload.value);
              const hasHoliday = point?.hasHoliday;
              return (
                <g transform={`translate(${x},${y})`}>
                  <text
                    x={0}
                    y={0}
                    dy={14}
                    textAnchor="middle"
                    fill={hasHoliday ? HOLIDAY_STROKE : '#94a3b8'}
                    fontSize={11}
                    fontWeight={hasHoliday ? 600 : 400}
                  >
                    {payload.value}
                  </text>
                  {hasHoliday && (
                    <text x={0} y={0} dy={26} textAnchor="middle" fill={HOLIDAY_STROKE} fontSize={9}>
                      ★
                    </text>
                  )}
                </g>
              );
            }}
            axisLine={false}
            tickLine={false}
            height={hasHolidayTick(data) ? 48 : 32}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip content={<ChartTooltip />} />
          {futureStartLabel && futureEndLabel && (
            <ReferenceArea
              x1={futureStartLabel}
              x2={futureEndLabel}
              fill="rgba(167, 139, 250, 0.1)"
              strokeOpacity={0}
            />
          )}
          {holidayPoints.map((point) => (
            <ReferenceLine
              key={`holiday-${point.key}`}
              x={point.label}
              stroke={HOLIDAY_STROKE}
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: holidayLabel(point.holidays ?? []),
                position: 'top',
                fill: HOLIDAY_STROKE,
                fontSize: 10,
              }}
            />
          ))}
          {lines.map((l) => (
            <Line
              key={l.dataKey}
              type="monotone"
              dataKey={l.dataKey}
              name={l.name}
              stroke={l.color}
              strokeWidth={2.5}
              strokeDasharray={l.strokeDash}
              dot={{ r: 3, strokeWidth: 0, fill: l.color }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <ChartLegendBar
        lines={lines}
        showForecastWindow={Boolean(futureStartLabel && futureEndLabel)}
        showHolidays={showHolidays}
        holidayCountryCode={holidayCountryCode}
        holidaysLoading={holidaysLoading}
        holidaysError={holidaysError}
      />
    </div>
  );
}

function hasHolidayTick(data: ChartPoint[]): boolean {
  return data.some((d) => d.hasHoliday);
}
