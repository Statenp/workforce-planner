import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { addDays, format, parseISO } from 'date-fns';
import { DEPARTMENTS, METRICS, STORES } from './lib/catalog.js';
import { editForecast } from './lib/forecastEdit.js';
import { getCurrentWeekRange, withForecastHorizon } from './lib/forecastHorizon.js';
import { generateMockDayRecords } from './lib/generateMockData.js';
import type {
  DayRecord,
  ForecastEditLog,
  ForecastEditMode,
  ForecastGroup,
  Granularity,
} from './lib/types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const STORE_PATH = join(DATA_DIR, 'store.json');

const DEFAULT_FORECAST_GROUPS: ForecastGroup[] = [
  { id: 'g1', name: 'Sales & Returns', metricIds: ['m1', 'm3'] },
  { id: 'g2', name: 'Traffic & Volume', metricIds: ['m2', 'm4'] },
];

interface DbShape {
  dayRecords: DayRecord[];
  forecastGroups: ForecastGroup[];
  forecastEditLog: ForecastEditLog[];
}

function recordKey(r: DayRecord): string {
  return `${r.date}|${r.storeId}|${r.departmentId}|${r.metricId}`;
}

function seedInitialRecords(): DayRecord[] {
  const week = getCurrentWeekRange();
  const end = withForecastHorizon(week.end);
  return generateMockDayRecords(week.start, end);
}

function loadDb(): DbShape {
  if (!existsSync(STORE_PATH)) {
    mkdirSync(DATA_DIR, { recursive: true });
    const initial: DbShape = {
      dayRecords: seedInitialRecords(),
      forecastGroups: DEFAULT_FORECAST_GROUPS,
      forecastEditLog: [],
    };
    writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  return JSON.parse(readFileSync(STORE_PATH, 'utf-8')) as DbShape;
}

function saveDb(db: DbShape): void {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(STORE_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

export class PlannerStore {
  private db: DbShape;

  constructor() {
    this.db = loadDb();
  }

  private persist(): void {
    saveDb(this.db);
  }

  private recordsMap(): Map<string, DayRecord> {
    return new Map(this.db.dayRecords.map((r) => [recordKey(r), r]));
  }

  private setRecordsFromMap(map: Map<string, DayRecord>): void {
    this.db.dayRecords = [...map.values()];
  }

  ensureDateRange(rangeStart: string, rangeEnd: string): void {
    const map = this.recordsMap();
    let changed = false;
    let cursor = parseISO(rangeStart);
    const end = parseISO(rangeEnd);

    while (cursor <= end) {
      const dateStr = format(cursor, 'yyyy-MM-dd');
      const complete = STORES.every((s) =>
        DEPARTMENTS.every((d) =>
          METRICS.every((m) => map.has(`${dateStr}|${s.id}|${d.id}|${m.id}`)),
        ),
      );
      if (!complete) {
        for (const r of generateMockDayRecords(dateStr, dateStr)) {
          map.set(recordKey(r), r);
        }
        changed = true;
      }
      cursor = addDays(cursor, 1);
    }

    if (changed) {
      this.setRecordsFromMap(map);
      this.persist();
    }
  }

  getDayRecords(rangeStart: string, rangeEnd: string): DayRecord[] {
    this.ensureDateRange(rangeStart, rangeEnd);
    return this.db.dayRecords.filter((r) => r.date >= rangeStart && r.date <= rangeEnd);
  }

  getForecastGroups(): ForecastGroup[] {
    return this.db.forecastGroups;
  }

  addForecastGroup(name: string, metricIds: string[]): ForecastGroup {
    const group: ForecastGroup = {
      id: `g_${Date.now()}`,
      name,
      metricIds,
    };
    this.db.forecastGroups = [...this.db.forecastGroups, group];
    this.persist();
    return group;
  }

  removeForecastGroup(id: string): void {
    this.db.forecastGroups = this.db.forecastGroups.filter((g) => g.id !== id);
    this.persist();
  }

  getForecastEditLog(): ForecastEditLog[] {
    return this.db.forecastEditLog;
  }

  applyForecastEdit(params: {
    scopeKey: string;
    granularity: Granularity;
    mode: ForecastEditMode;
    value: number;
    reason: string;
    periodLabel: string;
    storeIds: string[];
    departmentIds: string[];
    metricIds: string[];
    rangeStart: string;
    rangeEnd: string;
  }): { records: DayRecord[]; editLogEntry: ForecastEditLog; editLog: ForecastEditLog[] } {
    this.ensureDateRange(params.rangeStart, params.rangeEnd);
    const updated = editForecast(this.db.dayRecords, params);
    this.setRecordsFromMap(new Map(updated.map((r) => [recordKey(r), r])));

    const editLogEntry: ForecastEditLog = {
      id: `edit_${Date.now()}`,
      timestamp: new Date().toISOString(),
      periodKey: params.scopeKey,
      periodLabel: params.periodLabel,
      granularity: params.granularity,
      mode: params.mode,
      value: params.value,
      reason: params.reason,
    };

    this.db.forecastEditLog = [editLogEntry, ...this.db.forecastEditLog].slice(0, 25);
    this.persist();

    return {
      records: this.getDayRecords(params.rangeStart, params.rangeEnd),
      editLogEntry,
      editLog: this.db.forecastEditLog,
    };
  }
}

export const store = new PlannerStore();
