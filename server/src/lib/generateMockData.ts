import { addDays, format, parseISO } from 'date-fns';
import { getTodayString } from './forecastHorizon.js';
import type { DayRecord } from './types.js';
import { DEPARTMENTS, METRICS, STORES } from './catalog.js';

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function baseValue(metricId: string, date: Date, rand: () => number): number {
  const dow = date.getDay();
  const weekend = dow === 0 || dow === 6 ? 1.15 : 1;
  const monthBoost = 1 + date.getDate() / 31 * 0.08;
  const metricScale: Record<string, number> = {
    m1: 42,
    m2: 12,
    m3: 6,
    m4: 2800,
  };
  return Math.round(metricScale[metricId] * weekend * monthBoost * (0.85 + rand() * 0.3));
}

export function generateMockDayRecords(rangeStart: string, rangeEnd: string): DayRecord[] {
  const records: DayRecord[] = [];
  const start = parseISO(rangeStart);
  const end = parseISO(rangeEnd);
  let cursor = start;
  let dayIndex = 0;
  const today = getTodayString();

  while (cursor <= end) {
    const dateStr = format(cursor, 'yyyy-MM-dd');
    const isFuture = dateStr > today;

    for (const store of STORES) {
      for (const dept of DEPARTMENTS) {
        for (const metric of METRICS) {
          const rand = seededRandom(dayIndex * 97 + store.id.charCodeAt(1) + dept.id.charCodeAt(1));
          const projected = baseValue(metric.id, cursor, rand);

          if (isFuture) {
            records.push({
              date: dateStr,
              storeId: store.id,
              departmentId: dept.id,
              metricId: metric.id,
              actual: 0,
              actualLy: 0,
              budget: Math.round(projected * (1.02 + rand() * 0.05)),
              forecast: Math.round(projected * (1.06 + rand() * 0.07)),
            });
          } else {
            const actual = projected;
            records.push({
              date: dateStr,
              storeId: store.id,
              departmentId: dept.id,
              metricId: metric.id,
              actual,
              actualLy: Math.round(actual * (0.92 + rand() * 0.12)),
              budget: Math.round(actual * (1.02 + rand() * 0.06)),
              forecast: Math.round(actual * (1.05 + rand() * 0.08)),
            });
          }
        }
      }
    }
    cursor = addDays(cursor, 1);
    dayIndex += 1;
  }

  return records;
}
