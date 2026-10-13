import { Week, PrayerRecord } from '../types';

/**
 * Calculates the total Ave-Marias prayed in a specific week.
 * If the week has individual records, it sums the counts from records.
 * Otherwise, if it has fixedTotalCount, it uses that.
 */
export function calculateWeekTotal(week: Week, records: PrayerRecord[]): number {
  if (week.hasIndividualData) {
    const weekRecords = records.filter(r => r.weekId === week.id);
    return weekRecords.reduce((acc, r) => acc + (r.count || 0), 0);
  }
  return week.fixedTotalCount || 0;
}

/**
 * Calculates the cumulative total across ALL weeks (historical + current active week).
 * Dynamically updates whenever any record is modified or added.
 */
export function calculateOverallTotal(weeks: Week[], records: PrayerRecord[]): number {
  return weeks.reduce((sum, w) => sum + calculateWeekTotal(w, records), 0);
}

/**
 * Computes a map of weekId -> cumulative total up to that week (in chronological order 1..N).
 */
export function computeCumulativeMap(weeks: Week[], records: PrayerRecord[]): Map<string, number> {
  const sorted = [...weeks].sort((a, b) => (a.weekNumber || 0) - (b.weekNumber || 0));
  const map = new Map<string, number>();
  let runningSum = 0;

  for (const w of sorted) {
    const total = calculateWeekTotal(w, records);
    runningSum += total;
    map.set(w.id, runningSum);
  }

  return map;
}
