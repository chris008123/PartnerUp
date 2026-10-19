import { format, startOfWeek, subWeeks, startOfMonth, endOfMonth, startOfYear, endOfYear, endOfDay } from 'date-fns';
import { RecordDoc, Target } from './types';

// Set to false to count only VERIFIED records in "This month".
export const COUNT_PENDING = true;

export const monthKeyOf = (d: Date) => format(d, 'yyyy-MM');

export function monthTotal(records: RecordDoc[], key = monthKeyOf(new Date())) {
  return records
    .filter((r) => r.monthKey === key && r.status !== 'REJECTED' && (COUNT_PENDING || r.status === 'VERIFIED'))
    .reduce((sum, r) => sum + r.amount, 0);
}

export const pendingCount = (records: RecordDoc[]) => records.filter((r) => r.status === 'PENDING').length;

// Consecutive weeks (Mon-Sun) with at least one record. A quiet current week doesn't break the streak yet.
export function weekStreak(records: RecordDoc[]) {
  const weeks = new Set(records.filter((r) => r.status !== 'REJECTED').map((r) => startOfWeek(r.date, { weekStartsOn: 1 }).getTime()));
  let cursor = startOfWeek(new Date(), { weekStartsOn: 1 });
  if (!weeks.has(cursor.getTime())) cursor = subWeeks(cursor, 1);
  let n = 0;
  while (weeks.has(cursor.getTime())) { n++; cursor = subWeeks(cursor, 1); }
  return n;
}

export function targetRange(t: Target, now = new Date()): [Date, Date] {
  if (t.period === 'monthly') return [startOfMonth(now), endOfMonth(now)];
  if (t.period === 'yearly') return [startOfYear(now), endOfYear(now)];
  return [t.startDate ?? new Date(0), t.endDate ? endOfDay(t.endDate) : new Date(8.64e15)];
}

export function targetProgress(t: Target, records: RecordDoc[]) {
  const [a, b] = targetRange(t);
  return records
    .filter((r) =>
      r.status !== 'REJECTED' && (COUNT_PENDING || r.status === 'VERIFIED') &&
      r.date >= a && r.date <= b && (!t.categoryId || r.categoryId === t.categoryId))
    .reduce((sum, r) => sum + r.amount, 0);
}
