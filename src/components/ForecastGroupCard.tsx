import { getMetricsByIds } from '../data/catalog';
import type { Metric } from '../types';

interface ForecastGroupCardProps {
  id: string;
  name: string;
  metricIds: string[];
  isActive: boolean;
  isDetailsOpen: boolean;
  onSelect: () => void;
  onToggleDetails: () => void;
  onRemove?: () => void;
  removeLabel?: string;
}

function MetricPills({ metrics }: { metrics: Metric[] }) {
  if (metrics.length === 0) {
    return <p className="forecast-group-metrics-empty">No metrics in this group.</p>;
  }

  return (
    <ul className="forecast-group-metrics-list">
      {metrics.map((m) => (
        <li key={m.id} className="metric-pill">
          <span className="metric-pill-name">{m.name}</span>
          <span className="metric-pill-unit">{m.unit}</span>
        </li>
      ))}
    </ul>
  );
}

export function ForecastGroupCard({
  id,
  name,
  metricIds,
  isActive,
  isDetailsOpen,
  onSelect,
  onToggleDetails,
  onRemove,
  removeLabel,
}: ForecastGroupCardProps) {
  const metrics = getMetricsByIds(metricIds);
  const detailsId = `forecast-group-metrics-${id}`;

  return (
    <article
      className={[
        'forecast-group-card',
        isActive ? 'is-active' : '',
        isDetailsOpen ? 'is-details-open' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="forecast-group-row">
        <button type="button" className="forecast-group-select" onClick={onSelect}>
          <span className="forecast-group-name">{name}</span>
          <span className="forecast-group-count">
            {metrics.length} metric{metrics.length === 1 ? '' : 's'}
          </span>
        </button>
        <button
          type="button"
          className="forecast-group-details-btn"
          aria-expanded={isDetailsOpen}
          aria-controls={detailsId}
          aria-label={isDetailsOpen ? `Hide metrics in ${name}` : `Show metrics in ${name}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleDetails();
          }}
        >
          <span className="forecast-group-details-chevron" aria-hidden />
        </button>
        {onRemove && (
          <button
            type="button"
            className="icon-btn forecast-group-remove"
            aria-label={removeLabel ?? `Remove ${name}`}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            ×
          </button>
        )}
      </div>
      <div className="forecast-group-metrics-wrap">
        <div id={detailsId} className="forecast-group-metrics-panel">
          <MetricPills metrics={metrics} />
        </div>
      </div>
    </article>
  );
}
