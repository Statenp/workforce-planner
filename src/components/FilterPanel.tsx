import { useId, useState, type ReactNode } from 'react';
import { DEPARTMENTS, METRICS, STORES } from '../data/catalog';
import type { ForecastGroup } from '../types';
import { ForecastGroupCard } from './ForecastGroupCard';
import { ForecastGroupCreateForm } from './ForecastGroupCreateForm';

interface FilterPanelProps {
  storeIds: string[];
  departmentIds: string[];
  metricIds: string[];
  onStores: (ids: string[]) => void;
  onDepartments: (ids: string[]) => void;
  onMetrics: (ids: string[]) => void;
  forecastGroups: ForecastGroup[];
  activeForecastGroupId: string | null;
  onActiveForecastGroup: (id: string | null) => void;
  onAddForecastGroup: (name: string, metricIds: string[]) => Promise<void>;
  onRemoveForecastGroup: (id: string) => Promise<void>;
}

type SectionKey = 'locations' | 'departments' | 'metrics' | 'forecastGroups';

const DEFAULT_EXPANDED: Record<SectionKey, boolean> = {
  locations: false,
  departments: false,
  metrics: false,
  forecastGroups: false,
};

function toggle(id: string, list: string[], set: (v: string[]) => void) {
  set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
}

interface CollapsibleSectionProps {
  title: string;
  summary?: string;
  expanded: boolean;
  onToggle: () => void;
  headerAction?: ReactNode;
  children: ReactNode;
}

function CollapsibleSection({
  title,
  summary,
  expanded,
  onToggle,
  headerAction,
  children,
}: CollapsibleSectionProps) {
  const panelId = useId();

  return (
    <section className={`filter-section ${expanded ? 'is-expanded' : 'is-collapsed'}`}>
      <div className="filter-section-header">
        <button
          type="button"
          className="filter-section-toggle"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <span className="filter-section-title">{title}</span>
          {summary && <span className="filter-section-summary">{summary}</span>}
          <span className="filter-section-chevron" aria-hidden />
        </button>
        {headerAction}
      </div>
      <div id={panelId} className="filter-section-panel" hidden={!expanded}>
        {children}
      </div>
    </section>
  );
}

export function FilterPanel({
  storeIds,
  departmentIds,
  metricIds,
  onStores,
  onDepartments,
  onMetrics,
  forecastGroups,
  activeForecastGroupId,
  onActiveForecastGroup,
  onAddForecastGroup,
  onRemoveForecastGroup,
}: FilterPanelProps) {
  const [expanded, setExpanded] = useState(DEFAULT_EXPANDED);
  const [creatingGroup, setCreatingGroup] = useState(false);
  /** `all` = all selected metrics row; otherwise a forecast group id */
  const [detailsGroupId, setDetailsGroupId] = useState<string | null>(null);

  const toggleSection = (key: SectionKey) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const startCreateGroup = () => {
    setExpanded((prev) => ({ ...prev, forecastGroups: true }));
    setCreatingGroup(true);
  };

  const finishCreateGroup = async (name: string, ids: string[]) => {
    try {
      await onAddForecastGroup(name, ids);
      setCreatingGroup(false);
    } catch {
      /* error surfaced via app status */
    }
  };

  const toggleDetails = (id: string) => {
    setDetailsGroupId((cur) => (cur === id ? null : id));
  };

  const selectAllMetrics = () => {
    onActiveForecastGroup(null);
    setDetailsGroupId('all');
  };

  const selectForecastGroup = (id: string) => {
    onActiveForecastGroup(id);
    setDetailsGroupId(id);
  };

  return (
    <aside className="filter-panel">
      <CollapsibleSection
        title="Locations"
        summary={`${storeIds.length}/${STORES.length}`}
        expanded={expanded.locations}
        onToggle={() => toggleSection('locations')}
      >
        <div className="check-list">
          {STORES.map((s) => (
            <label key={s.id}>
              <input
                type="checkbox"
                checked={storeIds.includes(s.id)}
                onChange={() => toggle(s.id, storeIds, onStores)}
              />
              <span>
                {s.name}
                <small>{s.region}</small>
              </span>
            </label>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Departments"
        summary={`${departmentIds.length}/${DEPARTMENTS.length}`}
        expanded={expanded.departments}
        onToggle={() => toggleSection('departments')}
      >
        <div className="check-list">
          {DEPARTMENTS.map((d) => (
            <label key={d.id}>
              <input
                type="checkbox"
                checked={departmentIds.includes(d.id)}
                onChange={() => toggle(d.id, departmentIds, onDepartments)}
              />
              {d.name}
            </label>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Metrics"
        summary={`${metricIds.length}/${METRICS.length}`}
        expanded={expanded.metrics}
        onToggle={() => toggleSection('metrics')}
      >
        <div className="check-list">
          {METRICS.map((m) => (
            <label key={m.id}>
              <input
                type="checkbox"
                checked={metricIds.includes(m.id)}
                onChange={() => toggle(m.id, metricIds, onMetrics)}
              />
              <span>
                {m.name}
                <small>{m.unit}</small>
              </span>
            </label>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Forecast groups"
        summary={`${forecastGroups.length} groups`}
        expanded={expanded.forecastGroups}
        onToggle={() => toggleSection('forecastGroups')}
        headerAction={
          <button
            type="button"
            className="chip section-action"
            onClick={(e) => {
              e.stopPropagation();
              startCreateGroup();
            }}
          >
            + New
          </button>
        }
      >
        {creatingGroup && (
          <ForecastGroupCreateForm
            defaultMetricIds={metricIds}
            onCreate={finishCreateGroup}
            onCancel={() => setCreatingGroup(false)}
          />
        )}
        <div className="forecast-group-list">
          <ForecastGroupCard
            id="all"
            name="All selected metrics"
            metricIds={metricIds}
            isActive={activeForecastGroupId === null}
            isDetailsOpen={detailsGroupId === 'all'}
            onSelect={selectAllMetrics}
            onToggleDetails={() => toggleDetails('all')}
          />
          {forecastGroups.map((g) => (
            <ForecastGroupCard
              key={g.id}
              id={g.id}
              name={g.name}
              metricIds={g.metricIds}
              isActive={activeForecastGroupId === g.id}
              isDetailsOpen={detailsGroupId === g.id}
              onSelect={() => selectForecastGroup(g.id)}
              onToggleDetails={() => toggleDetails(g.id)}
              onRemove={() => {
                if (detailsGroupId === g.id) setDetailsGroupId(null);
                void onRemoveForecastGroup(g.id);
              }}
              removeLabel={`Remove forecast group ${g.name}`}
            />
          ))}
        </div>
      </CollapsibleSection>
    </aside>
  );
}
