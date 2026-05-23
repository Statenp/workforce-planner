import { NAGER_DATE_API } from '../constants/holidays';
import type { PublicHoliday } from '../types';

interface NagerHolidayDto {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
}

const cache = new Map<string, PublicHoliday[]>();

function cacheKey(year: number, countryCode: string): string {
  return `${countryCode}-${year}`;
}

export async function fetchPublicHolidaysForYear(
  year: number,
  countryCode: string,
): Promise<PublicHoliday[]> {
  const key = cacheKey(year, countryCode);
  const cached = cache.get(key);
  if (cached) return cached;

  const res = await fetch(`${NAGER_DATE_API}/PublicHolidays/${year}/${countryCode}`);
  if (!res.ok) {
    throw new Error(`Holiday feed returned ${res.status} for ${year}/${countryCode}`);
  }

  const data = (await res.json()) as NagerHolidayDto[];
  const holidays: PublicHoliday[] = data.map((h) => ({
    date: h.date.slice(0, 10),
    localName: h.localName,
    name: h.name,
    countryCode: h.countryCode,
  }));

  cache.set(key, holidays);
  return holidays;
}

export function yearsInRange(rangeStart: string, rangeEnd: string): number[] {
  const startYear = Number(rangeStart.slice(0, 4));
  const endYear = Number(rangeEnd.slice(0, 4));
  const years: number[] = [];
  for (let y = startYear; y <= endYear; y += 1) years.push(y);
  return years;
}

export async function fetchPublicHolidaysInRange(
  rangeStart: string,
  rangeEnd: string,
  countryCode: string,
): Promise<PublicHoliday[]> {
  const years = yearsInRange(rangeStart, rangeEnd);
  const batches = await Promise.all(
    years.map((year) => fetchPublicHolidaysForYear(year, countryCode)),
  );
  return batches
    .flat()
    .filter((h) => h.date >= rangeStart && h.date <= rangeEnd)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function holidaysInPeriod(
  holidays: PublicHoliday[],
  periodStart: string,
  periodEnd: string,
): PublicHoliday[] {
  return holidays.filter((h) => h.date >= periodStart && h.date <= periodEnd);
}

export function holidayLabel(names: string[]): string {
  if (names.length === 0) return '';
  const first = names[0];
  const short = first.length > 20 ? `${first.slice(0, 18)}…` : first;
  if (names.length === 1) return short;
  return `${short} +${names.length - 1}`;
}
