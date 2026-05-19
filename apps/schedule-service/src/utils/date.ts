import { config } from '@/config';

// Returns current ISO datetime string
export function nowIso(): string {
  return new Date().toISOString();
}

// Format a Date to ISO string
export function toIso(date: Date): string {
  return date.toISOString();
}

// Parse ISO string to Date
export function fromIso(iso: string): Date {
  return new Date(iso);
}

// Start of today in UTC
export function startOfToday(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// End of today in UTC
export function endOfToday(): Date {
  const d = new Date();
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

// Start of current week (Monday)
export function startOfWeek(): Date {
  const d = new Date();
  const day = d.getUTCDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// End of current week (Sunday)
export function endOfWeek(): Date {
  const start = startOfWeek();
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

// Add N days to a date
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

// Add N weeks
export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

// Add N months
export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

// Check if two dates are the same calendar day (UTC)
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export const timezone = config.DEFAULT_TIMEZONE;