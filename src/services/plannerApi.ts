import type {
  DayRecord,
  ForecastEditLog,
  ForecastEditMode,
  ForecastGroup,
  Granularity,
} from '../types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function fetchDayRecords(start: string, end: string): Promise<DayRecord[]> {
  const data = await request<{ records: DayRecord[] }>(
    `/day-records?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
  );
  return data.records;
}

export async function fetchForecastGroups(): Promise<ForecastGroup[]> {
  const data = await request<{ groups: ForecastGroup[] }>('/forecast-groups');
  return data.groups;
}

export async function createForecastGroup(name: string, metricIds: string[]): Promise<ForecastGroup> {
  const data = await request<{ group: ForecastGroup }>('/forecast-groups', {
    method: 'POST',
    body: JSON.stringify({ name, metricIds }),
  });
  return data.group;
}

export async function deleteForecastGroup(id: string): Promise<void> {
  await request<void>(`/forecast-groups/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function fetchForecastEditLog(): Promise<ForecastEditLog[]> {
  const data = await request<{ editLog: ForecastEditLog[] }>('/forecast-edit-log');
  return data.editLog;
}

export async function postForecastEdit(params: {
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
}): Promise<{ records: DayRecord[]; editLog: ForecastEditLog[] }> {
  return request('/forecast-edits', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    await request<{ ok: boolean }>('/health');
    return true;
  } catch {
    return false;
  }
}
