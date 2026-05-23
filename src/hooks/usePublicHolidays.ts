import { useEffect, useState } from 'react';
import { HOLIDAY_COUNTRY_CODE } from '../constants/holidays';
import { fetchPublicHolidaysInRange } from '../services/nagerHolidays';
import type { PublicHoliday } from '../types';

export function usePublicHolidays(rangeStart: string, rangeEnd: string) {
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPublicHolidaysInRange(rangeStart, rangeEnd, HOLIDAY_COUNTRY_CODE)
      .then((data) => {
        if (!cancelled) {
          setHolidays(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setHolidays([]);
          setError(err instanceof Error ? err.message : 'Failed to load holidays');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [rangeStart, rangeEnd]);

  return { holidays, loading, error, countryCode: HOLIDAY_COUNTRY_CODE };
}
