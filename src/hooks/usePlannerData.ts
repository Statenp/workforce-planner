import { useCallback, useMemo, useState } from 'react';
import { addDays, format, parseISO, subMonths } from 'date-fns';
import {
  FORECAST_HORIZON_WEEKS,
  getFiveWeekForecastRange,
  getForecastHorizonEnd,
  getTodayString,
  withForecastHorizon,
} from '../constants/forecastHorizon';
import { generateMockDayRecords } from '../data/generateMockData';
import type {
  ChartPoint,
  DayRecord,
  ForecastEditLog,
  ForecastEditMode,
  Granularity,
  ForecastGroup,
  PeriodBucket,
  SeriesKey,
} from '../types';
import {
  aggregateToPeriods,
  childGranularity,
  parentGranularity,
  periodBounds,
  periodKey,
} from '../utils/periods';
import { editForecast } from '../utils/forecastEdit';

const DEFAULT_FORECAST_GROUPS: ForecastGroup[] = [
  { id: 'g1', name: 'Sales & Returns', metricIds: ['m1', 'm3'] },
  { id: 'g2', name: 'Traffic & Volume', metricIds: ['m2', 'm4'] },
];

function defaultRange() {
  return getFiveWeekForecastRange();
}

export function usePlannerData() {
  const initialRange = defaultRange();
  const [dayRecords, setDayRecords] = useState<DayRecord[]>(() =>
    generateMockDayRecords(initialRange.start, initialRange.end),
  );
  const [rangeStart, setRangeStart] = useState(initialRange.start);
  const [rangeEnd, setRangeEnd] = useState(initialRange.end);
  const [granularity, setGranularity] = useState<Granularity>('week');
  const [focusPeriodKey, setFocusPeriodKey] = useState<string | null>(null);
  const [storeIds, setStoreIds] = useState<string[]>(['s1', 's2', 's3', 's4', 's5']);
  const [departmentIds, setDepartmentIds] = useState<string[]>(['d1', 'd2', 'd3', 'd4']);
  const [metricIds, setMetricIds] = useState<string[]>(['m1', 'm2']);
  const [forecastGroups, setForecastGroups] = useState<ForecastGroup[]>(DEFAULT_FORECAST_GROUPS);
  const [activeForecastGroupId, setActiveForecastGroupId] = useState<string | null>(null);
  const [visibleSeries, setVisibleSeries] = useState<SeriesKey[]>(['forecast', 'actual', 'budget']);
  const [forecastEditLog, setForecastEditLog] = useState<ForecastEditLog[]>([]);

  const effectiveMetricIds = useMemo(() => {
    if (!activeForecastGroupId) return metricIds;
    const group = forecastGroups.find((g) => g.id === activeForecastGroupId);
    return group ? group.metricIds.filter((id) => metricIds.includes(id)) : metricIds;
  }, [activeForecastGroupId, forecastGroups, metricIds]);

  const filteredRecords = useMemo(
    () =>
      dayRecords.filter(
        (r) =>
          storeIds.includes(r.storeId) &&
          departmentIds.includes(r.departmentId) &&
          effectiveMetricIds.includes(r.metricId),
      ),
    [dayRecords, storeIds, departmentIds, effectiveMetricIds],
  );

  const forecastHorizonEnd = getForecastHorizonEnd();
  const today = getTodayString();

  const dataRangeEnd = useMemo(() => withForecastHorizon(rangeEnd), [rangeEnd]);

  const displayRange = useMemo(() => {
    if (!focusPeriodKey) {
      return { start: rangeStart, end: dataRangeEnd };
    }
    const focusGranularity = parentGranularity(granularity) ?? granularity;
    return periodBounds(focusPeriodKey, focusGranularity);
  }, [focusPeriodKey, granularity, rangeStart, dataRangeEnd]);

  const periods: PeriodBucket[] = useMemo(
    () => aggregateToPeriods(filteredRecords, granularity, displayRange.start, displayRange.end),
    [filteredRecords, granularity, displayRange],
  );

  const chartData: ChartPoint[] = useMemo(() => {
    return periods.map((p) => {
      const point: ChartPoint = {
        key: p.key,
        label: p.label,
        isFuture: p.isFuture,
        spansForecastHorizon: p.spansForecastHorizon,
      };
      for (const metricId of effectiveMetricIds) {
        const slice = filteredRecords.filter(
          (r) =>
            r.metricId === metricId &&
            r.date >= p.start &&
            r.date <= p.end,
        );
        for (const series of visibleSeries) {
          const field = series === 'actualLy' ? 'actualLy' : series;
          const total = slice.reduce((s, r) => s + r[field], 0);
          point[`${metricId}_${series}`] = total;
        }
      }
      return point;
    });
  }, [periods, filteredRecords, effectiveMetricIds, visibleSeries]);

  const applyDateRange = useCallback((start: string, end: string) => {
    setRangeStart(start);
    setRangeEnd(end);
    setFocusPeriodKey(null);
    const dataEnd = withForecastHorizon(end);
    setDayRecords((prev) => {
      const dates = new Set(prev.map((r) => r.date));
      let cursor = parseISO(start);
      const endDate = parseISO(dataEnd);
      let missing = false;
      while (cursor <= endDate) {
        const d = format(cursor, 'yyyy-MM-dd');
        if (!dates.has(d)) {
          missing = true;
          break;
        }
        cursor = addDays(cursor, 1);
      }
      if (!missing) return prev;
      const extra = generateMockDayRecords(start, dataEnd);
      const map = new Map(prev.map((r) => [`${r.date}|${r.storeId}|${r.departmentId}|${r.metricId}`, r]));
      for (const r of extra) {
        const k = `${r.date}|${r.storeId}|${r.departmentId}|${r.metricId}`;
        if (!map.has(k)) map.set(k, r);
      }
      return [...map.values()];
    });
  }, []);

  const drillDown = useCallback(
    (periodKey: string) => {
      const child = childGranularity(granularity);
      if (!child) return;
      setFocusPeriodKey(periodKey);
      setGranularity(child);
    },
    [granularity],
  );

  const drillUp = useCallback(() => {
    const parent = parentGranularity(granularity);
    if (!parent) return;
    setGranularity(parent);
    if (parent === 'month') {
      setFocusPeriodKey(null);
    } else if (focusPeriodKey) {
      const { start } = periodBounds(focusPeriodKey, granularity);
      setFocusPeriodKey(periodKey(start, parent));
    }
  }, [granularity, focusPeriodKey]);

  const resetDrill = useCallback(() => {
    setFocusPeriodKey(null);
  }, []);

  const updateForecast = useCallback(
    (
      scopeKey: string,
      mode: ForecastEditMode,
      value: number,
      reason: string,
      periodLabel: string,
    ) => {
      setDayRecords((prev) =>
        editForecast(prev, {
          scopeKey,
          granularity,
          mode,
          value,
          storeIds,
          departmentIds,
          metricIds: effectiveMetricIds,
        }),
      );
      setForecastEditLog((log) => [
        {
          id: `edit_${Date.now()}`,
          timestamp: new Date().toISOString(),
          periodKey: scopeKey,
          periodLabel,
          granularity,
          mode,
          value,
          reason,
        },
        ...log,
      ].slice(0, 25));
    },
    [granularity, storeIds, departmentIds, effectiveMetricIds],
  );

  const addForecastGroup = useCallback((name: string, ids: string[]) => {
    const id = `g_${Date.now()}`;
    setForecastGroups((g) => [...g, { id, name, metricIds: ids }]);
    setActiveForecastGroupId(id);
  }, []);

  const removeForecastGroup = useCallback((id: string) => {
    setForecastGroups((g) => g.filter((x) => x.id !== id));
    setActiveForecastGroupId((cur) => (cur === id ? null : cur));
  }, []);

  const quickPresets = useMemo(
    () => ({
      last90: {
        start: format(subMonths(new Date(), 3), 'yyyy-MM-dd'),
        end: today,
      },
      ytd: {
        start: format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'),
        end: today,
      },
      forecast5w: {
        start: today,
        end: forecastHorizonEnd,
      },
    }),
    [today, forecastHorizonEnd],
  );

  return {
    rangeStart,
    rangeEnd,
    granularity,
    setGranularity,
    focusPeriodKey,
    storeIds,
    setStoreIds,
    departmentIds,
    setDepartmentIds,
    metricIds,
    setMetricIds,
    forecastGroups,
    activeForecastGroupId,
    setActiveForecastGroupId,
    visibleSeries,
    setVisibleSeries,
    periods,
    chartData,
    effectiveMetricIds,
    applyDateRange,
    drillDown,
    drillUp,
    resetDrill,
    updateForecast,
    forecastEditLog,
    addForecastGroup,
    removeForecastGroup,
    quickPresets,
    forecastHorizonEnd,
    forecastHorizonWeeks: FORECAST_HORIZON_WEEKS,
    today,
    dataRangeEnd,
    displayRange,
    canDrillUp: Boolean(parentGranularity(granularity) && focusPeriodKey),
    canDrillDown: Boolean(childGranularity(granularity)),
  };
}
