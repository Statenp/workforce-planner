import { useEffect, useState } from 'react';
import type { ForecastEditLog, ForecastEditMode, PeriodBucket } from '../types';

interface ForecastEditorProps {
  period: PeriodBucket | null;
  editLog: ForecastEditLog[];
  onApply: (params: {
    scopeKey: string;
    mode: ForecastEditMode;
    value: number;
    reason: string;
    periodLabel: string;
  }) => Promise<void>;
}

function formatEditValue(mode: ForecastEditMode, value: number): string {
  return mode === 'percent' ? `${value > 0 ? '+' : ''}${value}%` : `${value > 0 ? '+' : ''}${value.toLocaleString()}`;
}

function formatEditTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function EditLogList({ entries }: { entries: ForecastEditLog[] }) {
  if (entries.length === 0) {
    return (
      <div className="forecast-edit-log">
        <h4>Recent edits</h4>
        <p className="forecast-edit-log-empty">No forecast changes yet.</p>
      </div>
    );
  }

  return (
    <div className="forecast-edit-log">
      <h4>Recent edits</h4>
      <ul className="forecast-edit-log-list">
        {entries.map((entry) => (
          <li key={entry.id} className="forecast-edit-log-item">
            <div className="forecast-edit-log-head">
              <span className="forecast-edit-log-period">{entry.periodLabel}</span>
              <span className="forecast-edit-log-delta">{formatEditValue(entry.mode, entry.value)}</span>
            </div>
            <p className="forecast-edit-log-reason">{entry.reason}</p>
            <time className="forecast-edit-log-time" dateTime={entry.timestamp}>
              {formatEditTime(entry.timestamp)}
            </time>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ForecastEditor({ period, editLog, onApply }: ForecastEditorProps) {
  const [mode, setMode] = useState<ForecastEditMode>('percent');
  const [value, setValue] = useState('5');
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  const [applyError, setApplyError] = useState<string | null>(null);

  useEffect(() => {
    setReason('');
    setReasonError(null);
    setApplyError(null);
    setApplied(false);
  }, [period?.key]);

  const handleApply = async () => {
    if (!period) return;
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setReasonError('Add a reason for this forecast change.');
      return;
    }
    const num = Number(value);
    if (Number.isNaN(num)) return;

    try {
      setApplyError(null);
      await onApply({
        scopeKey: period.key,
        mode,
        value: num,
        reason: trimmedReason,
        periodLabel: period.label,
      });
      setReason('');
      setReasonError(null);
      setApplied(true);
      window.setTimeout(() => setApplied(false), 2500);
    } catch {
      setApplyError('Could not save forecast change. Check the API connection.');
    }
  };

  if (!period) {
    return (
      <div className="forecast-editor">
        <div className="forecast-editor empty">
          <p>Select a period in the table to adjust forecast values.</p>
          <small>Edits prorate to weeks and days when you are at month or week level.</small>
        </div>
        <EditLogList entries={editLog} />
      </div>
    );
  }

  return (
    <div className="forecast-editor">
      <h3>Edit forecast</h3>
      <p className="editor-context">
        {period.label} · current total <strong>{period.forecast.toLocaleString()}</strong>
      </p>
      <div className="editor-mode">
        <button
          type="button"
          className={mode === 'percent' ? 'active' : ''}
          onClick={() => setMode('percent')}
        >
          By %
        </button>
        <button
          type="button"
          className={mode === 'numeric' ? 'active' : ''}
          onClick={() => setMode('numeric')}
        >
          By amount
        </button>
      </div>
      <label>
        {mode === 'percent' ? 'Adjust forecast by (%)' : 'Add to forecast total'}
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          step={mode === 'percent' ? '0.5' : '100'}
        />
      </label>
      <label>
        Reason for change
        <textarea
          value={reason}
          rows={3}
          placeholder="e.g. Local event expected to increase traffic"
          onChange={(e) => {
            setReason(e.target.value);
            setReasonError(null);
          }}
        />
      </label>
      {reasonError && <p className="forecast-edit-reason-error">{reasonError}</p>}
      {applyError && <p className="forecast-edit-reason-error">{applyError}</p>}
      <button type="button" className="primary-btn" onClick={handleApply}>
        Apply to forecast
      </button>
      {applied && <p className="forecast-edit-success">Forecast updated.</p>}
      <p className="editor-note">
        Only forecast is editable. Changes distribute across underlying days using proportional
        proration. A reason is required for each edit.
      </p>
      <EditLogList entries={editLog} />
    </div>
  );
}
