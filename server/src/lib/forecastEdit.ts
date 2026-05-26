import { addDays, endOfMonth, endOfWeek, format, parseISO, startOfMonth, startOfWeek } from 'date-fns';
import type { Granularity } from './types.js';
import type { DayRecord } from './types.js';

export function periodKey(date: string, granularity: Granularity): string {
  const d = parseISO(date);
  if (granularity === 'day') return format(d, 'yyyy-MM-dd');
  if (granularity === 'week') {
    const ws = startOfWeek(d, { weekStartsOn: 1 });
    return format(ws, "yyyy-'W'II");
  }
  return format(startOfMonth(d), 'yyyy-MM');
}

export function periodBounds(
  key: string,
  granularity: Granularity,
): { start: string; end: string } {
  if (granularity === 'day') return { start: key, end: key };
  if (granularity === 'week') {
    const [year, weekPart] = key.split('-W');
    const jan4 = parseISO(`${year}-01-04`);
    const weekStart = startOfWeek(jan4, { weekStartsOn: 1 });
    const ws = addDays(weekStart, (Number(weekPart) - 1) * 7);
    const we = endOfWeek(ws, { weekStartsOn: 1 });
    return { start: format(ws, 'yyyy-MM-dd'), end: format(we, 'yyyy-MM-dd') };
  }
  const start = parseISO(`${key}-01`);
  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(endOfMonth(start), 'yyyy-MM-dd'),
  };
}

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
    mode: import('./types.js').ForecastEditMode;
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
