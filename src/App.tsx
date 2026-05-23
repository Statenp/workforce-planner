import { useMemo, useState } from 'react';
import { DateRangePicker } from './components/DateRangePicker';
import { DataTable } from './components/DataTable';
import { FilterPanel } from './components/FilterPanel';
import { ForecastChart } from './components/ForecastChart';
import { ForecastEditor } from './components/ForecastEditor';
import { GranularityBar } from './components/GranularityBar';
import { SeriesToggle } from './components/SeriesToggle';
import { usePlannerData } from './hooks/usePlannerData';
import { usePublicHolidays } from './hooks/usePublicHolidays';
import { holidaysInPeriod } from './services/nagerHolidays';
import { periodLabel } from './utils/periods';
import './App.css';

function App() {
  const planner = usePlannerData();
  const { holidays, loading: holidaysLoading, error: holidaysError, countryCode } =
    usePublicHolidays(planner.displayRange.start, planner.displayRange.end);

  const chartData = useMemo(() => {
    return planner.chartData.map((point) => {
      const period = planner.periods.find((p) => p.key === point.key);
      if (!period) return point;
      const inPeriod = holidaysInPeriod(holidays, period.start, period.end);
      return {
        ...point,
        start: period.start,
        end: period.end,
        hasHoliday: inPeriod.length > 0,
        holidays: inPeriod.map((h) => h.localName),
      };
    });
  }, [planner.chartData, planner.periods, holidays]);

  const [selectedPeriodKey, setSelectedPeriodKey] = useState<string | null>(null);

  const selectedPeriod =
    planner.periods.find((p) => p.key === selectedPeriodKey) ?? null;

  const focusLabel = planner.focusPeriodKey
    ? periodLabel(planner.focusPeriodKey, planner.granularity)
    : null;

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">Labor forecasting</p>
          <h1>Workforce Planner</h1>
        </div>
        <p className="subtitle">
          Forecast labor metrics by location and department — includes a rolling{' '}
          {planner.forecastHorizonWeeks}-week outlook through {planner.forecastHorizonEnd}.
        </p>
      </header>

      <div className="layout">
        <FilterPanel
          storeIds={planner.storeIds}
          departmentIds={planner.departmentIds}
          metricIds={planner.metricIds}
          onStores={planner.setStoreIds}
          onDepartments={planner.setDepartmentIds}
          onMetrics={planner.setMetricIds}
          forecastGroups={planner.forecastGroups}
          activeForecastGroupId={planner.activeForecastGroupId}
          onActiveForecastGroup={planner.setActiveForecastGroupId}
          onAddForecastGroup={planner.addForecastGroup}
          onRemoveForecastGroup={planner.removeForecastGroup}
        />

        <main className="main-panel">
          <div className="toolbar">
            <DateRangePicker
              start={planner.rangeStart}
              end={planner.rangeEnd}
              onChange={planner.applyDateRange}
              presets={planner.quickPresets}
              forecastHorizonEnd={planner.forecastHorizonEnd}
              forecastHorizonWeeks={planner.forecastHorizonWeeks}
            />
            <GranularityBar
              granularity={planner.granularity}
              onChange={(g) => {
                planner.setGranularity(g);
                planner.resetDrill();
                setSelectedPeriodKey(null);
              }}
              canDrillUp={planner.canDrillUp}
              canDrillDown={planner.canDrillDown}
              onDrillUp={planner.drillUp}
              onResetDrill={planner.resetDrill}
              focusLabel={focusLabel}
            />
          </div>

          <SeriesToggle visible={planner.visibleSeries} onChange={planner.setVisibleSeries} />

          <ForecastChart
            data={chartData}
            metricIds={planner.effectiveMetricIds}
            visibleSeries={planner.visibleSeries}
            holidaysLoading={holidaysLoading}
            holidaysError={holidaysError}
            holidayCountryCode={countryCode}
          />

          <div className="lower-grid">
            <DataTable
              periods={planner.periods}
              granularity={planner.granularity}
              visibleSeries={planner.visibleSeries}
              canDrillDown={planner.canDrillDown}
              onDrillDown={(key) => {
                planner.drillDown(key);
                setSelectedPeriodKey(null);
              }}
              onSelectPeriod={setSelectedPeriodKey}
              selectedKey={selectedPeriodKey}
            />
            <ForecastEditor
              period={selectedPeriod}
              editLog={planner.forecastEditLog}
              onApply={({ scopeKey, mode, value, reason, periodLabel }) => {
                planner.updateForecast(scopeKey, mode, value, reason, periodLabel);
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
