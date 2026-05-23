import type { DayRecord, ForecastEditMode } from '../types';
import { periodBounds, periodKey } from './periods';
import type { Granularity } from '../types';

function matchesScope(
  record: DayRecord,
  scopeKey: string,
  granularity: Granularity,
  storeIds: string[],
  departmentIds: string[],
  metricIds: string[],
): boolean {
  if (!storeIds.includes(record.storeId)) return false;
  if (!departmentIds.includes(record.departmentId)) return false;
  if (!metricIds.includes(record.metricId)) return false;
  return periodKey(record.date, granularity) === scopeKey;
}

function applyNumericDelta(
  records: DayRecord[],
  scopeKey: string,
  granularity: Granularity,
  filters: { storeIds: string[]; departmentIds: string[]; metricIds: string[] },
  targetTotal: number,
): DayRecord[] {
  const scoped = records.filter((r) =>
    matchesScope(r, scopeKey, granularity, filters.storeIds, filters.departmentIds, filters.metricIds),
  );
  if (scoped.length === 0) return records;

  const currentTotal = scoped.reduce((s, r) => s + r.forecast, 0);
  const delta = targetTotal - currentTotal;

  if (granularity === 'day') {
    return records.map((r) => {
      if (!matchesScope(r, scopeKey, granularity, filters.storeIds, filters.departmentIds, filters.metricIds)) {
        return r;
      }
      return { ...r, forecast: Math.max(0, Math.round(r.forecast + delta)) };
    });
  }

  const weights = scoped.map((r) => Math.max(r.forecast, 0.01));
  const weightSum = weights.reduce((a, b) => a + b, 0);

  return records.map((r) => {
    if (!matchesScope(r, scopeKey, granularity, filters.storeIds, filters.departmentIds, filters.metricIds)) {
      return r;
    }
    const idx = scoped.findIndex(
      (s) =>
        s.date === r.date &&
        s.storeId === r.storeId &&
        s.departmentId === r.departmentId &&
        s.metricId === r.metricId,
    );
    const share = weights[idx] / weightSum;
    return { ...r, forecast: Math.max(0, Math.round(r.forecast + delta * share)) };
  });
}

function applyPercent(
  records: DayRecord[],
  scopeKey: string,
  granularity: Granularity,
  filters: { storeIds: string[]; departmentIds: string[]; metricIds: string[] },
  percent: number,
): DayRecord[] {
  const factor = 1 + percent / 100;
  return records.map((r) => {
    if (!matchesScope(r, scopeKey, granularity, filters.storeIds, filters.departmentIds, filters.metricIds)) {
      return r;
    }
    return { ...r, forecast: Math.max(0, Math.round(r.forecast * factor)) };
  });
}

export function editForecast(
  records: DayRecord[],
  params: {
    scopeKey: string;
    granularity: Granularity;
    mode: ForecastEditMode;
    value: number;
    storeIds: string[];
    departmentIds: string[];
    metricIds: string[];
  },
): DayRecord[] {
  const { scopeKey, granularity, mode, value, storeIds, departmentIds, metricIds } = params;
  const filters = { storeIds, departmentIds, metricIds };

  if (mode === 'percent') {
    return applyPercent(records, scopeKey, granularity, filters, value);
  }

  const scoped = records.filter((r) =>
    matchesScope(r, scopeKey, granularity, storeIds, departmentIds, metricIds),
  );
  const currentTotal = scoped.reduce((s, r) => s + r.forecast, 0);
  return applyNumericDelta(records, scopeKey, granularity, filters, currentTotal + value);
}

export function drillDownRange(
  parentKey: string,
  parentGranularity: Granularity,
): { start: string; end: string } {
  return periodBounds(parentKey, parentGranularity);
}
