import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  FORECAST_HORIZON_WEEKS,
  getCurrentWeekRange,
  getForecastHorizonEnd,
  getTodayString,
  withForecastHorizon,
} from '../constants/forecastHorizon';
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
  createForecastGroup,
  deleteForecastGroup,
  fetchDayRecords,
  fetchForecastEditLog,
  fetchForecastGroups,
  postForecastEdit,
} from '../services/plannerApi';
import {
  aggregateToPeriods,
  childGranularity,
  parentGranularity,
  periodBounds,
  periodKey,
} from '../utils/periods';

export type DateRangePresetId = 'currentWeek' | 'ytd' | 'forecast5w' | 'custom';

function matchesPreset(
  start: string,
  end: string,
  preset: { start: string; end: string },
): boolean {
  return start === preset.start && end === preset.end;
}

export function detectDateRangePreset(
  start: string,
  end: string,
  presets: {
    currentWeek: { start: string; end: string };
    ytd: { start: string; end: string };
    forecast5w: { start: string; end: string };
  },
): DateRangePresetId {
  if (matchesPreset(start, end, presets.forecast5w)) return 'forecast5w';
  if (matchesPreset(start, end, presets.currentWeek)) return 'currentWeek';
  if (matchesPreset(start, end, presets.ytd)) return 'ytd';
  return 'custom';
}

function defaultRange() {
  return getCurrentWeekRange();
}

function recordKey(r: DayRecord): string {
  return `${r.date}|${r.storeId}|${r.departmentId}|${r.metricId}`;
}

function mergeRecords(prev: DayRecord[], incoming: DayRecord[]): DayRecord[] {
  const map = new Map(prev.map((r) => [recordKey(r), r]));
  for (const r of incoming) map.set(recordKey(r), r);
  return [...map.values()];
}

export function usePlannerData() {
  const initialRange = defaultRange();
  const [dayRecords, setDayRecords] = useState<DayRecord[]>([]);
  const [rangeStart, setRangeStart] = useState(initialRange.start);
  const [rangeEnd, setRangeEnd] = useState(initialRange.end);
  const [activeDatePreset, setActiveDatePreset] = useState<DateRangePresetId>('currentWeek');
  const [granularity, setGranularity] = useState<Granularity>('week');
  const [focusPeriodKey, setFocusPeriodKey] = useState<string | null>(null);
  const [storeIds, setStoreIds] = useState<string[]>(['s1', 's2', 's3', 's4', 's5']);
  const [departmentIds, setDepartmentIds] = useState<string[]>(['d1', 'd2', 'd3', 'd4']);
  const [metricIds, setMetricIds] = useState<string[]>(['m1', 'm2']);
  const [forecastGroups, setForecastGroups] = useState<ForecastGroup[]>([]);
  const [activeForecastGroupId, setActiveForecastGroupId] = useState<string | null>(null);
  const [visibleSeries, setVisibleSeries] = useState<SeriesKey[]>(['forecast', 'actual', 'budget']);
  const [forecastEditLog, setForecastEditLog] = useState<ForecastEditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const forecastHorizonEnd = getForecastHorizonEnd();
  const today = getTodayString();
  const dataRangeEnd = useMemo(() => withForecastHorizon(rangeEnd), [rangeEnd]);

  const loadRecordsForRange = useCallback(async (start: string, end: string) => {
    const records = await fetchDayRecords(start, end);
    setDayRecords((prev) => mergeRecords(prev, records));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const dataEnd = withForecastHorizon(initialRange.end);

    async function init() {
      try {
        setLoading(true);
        setError(null);
        const [records, groups, log] = await Promise.all([
          fetchDayRecords(initialRange.start, dataEnd),
          fetchForecastGroups(),
          fetchForecastEditLog(),
        ]);
        if (cancelled) return;
        setDayRecords(records);
        setForecastGroups(groups);
        setForecastEditLog(log);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load planner data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const displayRange = useMemo(() => {
    if (!focusPeriodKey) {
      return { start: rangeStart, end: rangeEnd };
    }
    const focusGranularity = parentGranularity(granularity) ?? granularity;
    return periodBounds(focusPeriodKey, focusGranularity);
  }, [focusPeriodKey, granularity, rangeStart, rangeEnd]);

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
          (r) => r.metricId === metricId && r.date >= p.start && r.date <= p.end,
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

  const applyDateRange = useCallback(
    async (start: string, end: string, presetId?: DateRangePresetId) => {
      setRangeStart(start);
      setRangeEnd(end);
      setFocusPeriodKey(null);
      const presets = {
        currentWeek: getCurrentWeekRange(),
        ytd: {
          start: format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'),
          end: getTodayString(),
        },
        forecast5w: {
          start: getTodayString(),
          end: getForecastHorizonEnd(),
        },
      };
      setActiveDatePreset(presetId ?? detectDateRangePreset(start, end, presets));
      try {
        setSyncing(true);
        setError(null);
        await loadRecordsForRange(start, withForecastHorizon(end));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load date range');
      } finally {
        setSyncing(false);
      }
    },
    [loadRecordsForRange],
  );

  const drillDown = useCallback(
    (periodKeyValue: string) => {
      const child = childGranularity(granularity);
      if (!child) return;
      setFocusPeriodKey(periodKeyValue);
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
    async (
      scopeKey: string,
      mode: ForecastEditMode,
      value: number,
      reason: string,
      periodLabelValue: string,
    ) => {
      try {
        setSyncing(true);
        setError(null);
        const result = await postForecastEdit({
          scopeKey,
          granularity,
          mode,
          value,
          reason,
          periodLabel: periodLabelValue,
          storeIds,
          departmentIds,
          metricIds: effectiveMetricIds,
          rangeStart,
          rangeEnd: dataRangeEnd,
        });
        setDayRecords((prev) => mergeRecords(prev, result.records));
        setForecastEditLog(result.editLog);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update forecast');
        throw err;
      } finally {
        setSyncing(false);
      }
    },
    [granularity, storeIds, departmentIds, effectiveMetricIds, rangeStart, dataRangeEnd],
  );

  const addForecastGroup = useCallback(async (name: string, ids: string[]) => {
    try {
      setError(null);
      const group = await createForecastGroup(name, ids);
      setForecastGroups((g) => [...g, group]);
      setActiveForecastGroupId(group.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create forecast group');
      throw err;
    }
  }, []);

  const removeForecastGroup = useCallback(async (id: string) => {
    try {
      setError(null);
      await deleteForecastGroup(id);
      setForecastGroups((g) => g.filter((x) => x.id !== id));
      setActiveForecastGroupId((cur) => (cur === id ? null : cur));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove forecast group');
      throw err;
    }
  }, []);

  const quickPresets = useMemo(
    () => ({
      currentWeek: getCurrentWeekRange(),
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
    activeDatePreset,
    forecastHorizonEnd,
    forecastHorizonWeeks: FORECAST_HORIZON_WEEKS,
    today,
    dataRangeEnd,
    displayRange,
    loading,
    error,
    syncing,
    canDrillUp: Boolean(parentGranularity(granularity) && focusPeriodKey),
    canDrillDown: Boolean(childGranularity(granularity)),
  };
}
