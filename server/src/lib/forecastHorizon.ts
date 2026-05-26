import { addWeeks, endOfWeek, format, parseISO, startOfDay, startOfWeek } from 'date-fns';

export const FORECAST_HORIZON_WEEKS = 5;

export function getTodayString(): string {
  return format(startOfDay(new Date()), 'yyyy-MM-dd');
}

export function getForecastHorizonEnd(fromDate: Date = new Date()): string {
  return format(addWeeks(startOfDay(fromDate), FORECAST_HORIZON_WEEKS), 'yyyy-MM-dd');
}

export function getCurrentWeekRange(fromDate: Date = new Date()) {
  const weekOpts = { weekStartsOn: 1 as const };
  return {
    start: format(startOfWeek(fromDate, weekOpts), 'yyyy-MM-dd'),
    end: format(endOfWeek(fromDate, weekOpts), 'yyyy-MM-dd'),
  };
}

export function withForecastHorizon(rangeEnd: string): string {
  const horizonEnd = getForecastHorizonEnd();
  return rangeEnd > horizonEnd ? rangeEnd : horizonEnd;
}
