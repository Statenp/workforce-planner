import { addWeeks, format, parseISO, startOfDay } from 'date-fns';

export const FORECAST_HORIZON_WEEKS = 5;

export function getTodayString(): string {
  return format(startOfDay(new Date()), 'yyyy-MM-dd');
}

/** First day of the rolling 5-week forecast window (today). */
export function getForecastHorizonStart(fromDate: Date = new Date()): string {
  return format(startOfDay(fromDate), 'yyyy-MM-dd');
}

/** Last calendar day included in the rolling 5-week forecast window. */
export function getForecastHorizonEnd(fromDate: Date = new Date()): string {
  return format(addWeeks(startOfDay(fromDate), FORECAST_HORIZON_WEEKS), 'yyyy-MM-dd');
}

export function getFiveWeekForecastRange(fromDate: Date = new Date()) {
  return {
    start: getForecastHorizonStart(fromDate),
    end: getForecastHorizonEnd(fromDate),
  };
}

export function isFutureDate(dateStr: string, today = getTodayString()): boolean {
  return dateStr > today;
}

export function isOnOrBeforeHorizon(dateStr: string, today = getTodayString()): boolean {
  return dateStr <= getForecastHorizonEnd(parseISO(today));
}

/** View/data end includes at least the 5-week forecast window beyond today. */
export function withForecastHorizon(rangeEnd: string): string {
  const horizonEnd = getForecastHorizonEnd();
  return rangeEnd > horizonEnd ? rangeEnd : horizonEnd;
}
