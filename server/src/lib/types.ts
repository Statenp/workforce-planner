export type Granularity = 'day' | 'week' | 'month';
export type ForecastEditMode = 'percent' | 'numeric';

export interface ForecastGroup {
  id: string;
  name: string;
  metricIds: string[];
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

export interface Store {
  id: string;
  name: string;
  region: string;
}

export interface Department {
  id: string;
  name: string;
}

export interface Metric {
  id: string;
  name: string;
  unit: string;
}
