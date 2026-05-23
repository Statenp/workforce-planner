export type Granularity = 'day' | 'week' | 'month';

export type SeriesKey = 'actual' | 'actualLy' | 'budget' | 'forecast';

export interface Metric {
  id: string;
  name: string;
  unit: string;
}

export interface ForecastGroup {
  id: string;
  name: string;
  metricIds: string[];
}

export interface Store {
  id: string;
  name: string;
  region: string;
}

export interface Department {
  id: string;
  name: string;
}

export interface DayRecord {
  date: string;
  storeId: string;
  departmentId: string;
  metricId: string;
  actual: number;
  actualLy: number;
  budget: number;
  forecast: number;
}

export interface PeriodBucket {
  key: string;
  label: string;
  start: string;
  end: string;
  actual: number;
  actualLy: number;
  budget: number;
  forecast: number;
  /** Entire period is after today (forecast-only window). */
  isFuture: boolean;
  /** Period spans today and includes upcoming forecast days. */
  spansForecastHorizon: boolean;
}

export interface PublicHoliday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
}

export interface ChartPoint {
  key: string;
  label: string;
  start?: string;
  end?: string;
  isFuture?: boolean;
  spansForecastHorizon?: boolean;
  hasHoliday?: boolean;
  holidays?: string[];
  [metricKey: string]: string | number | boolean | string[] | undefined;
}

export type ForecastEditMode = 'percent' | 'numeric';

export interface ForecastEditLog {
  id: string;
  timestamp: string;
  periodKey: string;
  periodLabel: string;
  granularity: Granularity;
  mode: ForecastEditMode;
  value: number;
  reason: string;
}
