import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { getForecastHorizonEnd, getTodayString } from '../constants/forecastHorizon';
import type { DayRecord, Granularity, PeriodBucket } from '../types';

export function periodKey(date: string, granularity: Granularity): string {
  const d = parseISO(date);
  if (granularity === 'day') return format(d, 'yyyy-MM-dd');
  if (granularity === 'week') {
    const ws = startOfWeek(d, { weekStartsOn: 1 });
    return format(ws, "yyyy-'W'II");
  }
  return format(startOfMonth(d), 'yyyy-MM');
}

export function periodLabel(key: string, granularity: Granularity): string {
  if (granularity === 'day') return format(parseISO(key), 'MMM d, yyyy');
  if (granularity === 'week') {
    const [y, w] = key.split('-W');
    return `Week ${w}, ${y}`;
  }
  const d = parseISO(`${key}-01`);
  return format(d, 'MMMM yyyy');
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

function inRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

function periodFlags(start: string, end: string, today = getTodayString()) {
  const horizonEnd = getForecastHorizonEnd();
  return {
    isFuture: start > today,
    spansForecastHorizon: start <= today && end > today && end <= horizonEnd,
  };
}

export function aggregateToPeriods(
  records: DayRecord[],
  granularity: Granularity,
  rangeStart: string,
  rangeEnd: string,
): PeriodBucket[] {
  const map = new Map<string, PeriodBucket>();

  for (const r of records) {
    if (!inRange(r.date, rangeStart, rangeEnd)) continue;
    const key = periodKey(r.date, granularity);
    const bounds = periodBounds(key, granularity);
    const existing = map.get(key);
    if (existing) {
      existing.actual += r.actual;
      existing.actualLy += r.actualLy;
      existing.budget += r.budget;
      existing.forecast += r.forecast;
    } else {
      const flags = periodFlags(bounds.start, bounds.end);
      map.set(key, {
        key,
        label: periodLabel(key, granularity),
        start: bounds.start,
        end: bounds.end,
        actual: r.actual,
        actualLy: r.actualLy,
        budget: r.budget,
        forecast: r.forecast,
        ...flags,
      });
    }
  }

  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export function childGranularity(g: Granularity): Granularity | null {
  if (g === 'month') return 'week';
  if (g === 'week') return 'day';
  return null;
}

export function parentGranularity(g: Granularity): Granularity | null {
  if (g === 'day') return 'week';
  if (g === 'week') return 'month';
  return null;
}
