import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { METRICS } from '../data/catalog';

interface ForecastGroupCreateFormProps {
  defaultMetricIds: string[];
  onCreate: (name: string, metricIds: string[]) => void;
  onCancel: () => void;
}

export function ForecastGroupCreateForm({
  defaultMetricIds,
  onCreate,
  onCancel,
}: ForecastGroupCreateFormProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [selectedMetricIds, setSelectedMetricIds] = useState<string[]>(
    defaultMetricIds.length > 0 ? defaultMetricIds : METRICS.map((m) => m.id),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const toggleMetric = (id: string) => {
    setSelectedMetricIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setError(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Enter a forecast group name.');
      return;
    }
    if (selectedMetricIds.length === 0) {
      setError('Select at least one metric.');
      return;
    }
    onCreate(trimmed, selectedMetricIds);
  };

  return (
    <form className="forecast-group-create" onSubmit={handleSubmit}>
      <label htmlFor={inputId}>Forecast group name</label>
      <input
        id={inputId}
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setError(null);
        }}
        placeholder="e.g. Weekend peak"
        autoComplete="off"
      />
      <p className="forecast-group-create-label">Metrics in this forecast group</p>
      <div className="check-list compact">
        {METRICS.map((m) => (
          <label key={m.id}>
            <input
              type="checkbox"
              checked={selectedMetricIds.includes(m.id)}
              onChange={() => toggleMetric(m.id)}
            />
            <span>
              {m.name}
              <small>{m.unit}</small>
            </span>
          </label>
        ))}
      </div>
      {error && <p className="forecast-group-create-error">{error}</p>}
      <div className="forecast-group-create-actions">
        <button type="button" className="chip" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="chip accent">
          Create forecast group
        </button>
      </div>
    </form>
  );
}
