import { TimeSnapshot } from '@/types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getTimeOfDay(hour: number): TimeSnapshot['timeOfDay'] {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function buildTimeSnapshot(timezone: string): TimeSnapshot {
  const now = new Date();
  const hour = now.getUTCHours();
  const day = now.getUTCDay();

  return {
    iso: now.toISOString(),
    timezone,
    date: now.toISOString().split('T')[0],
    time: now.toISOString().split('T')[1].slice(0, 5),
    dayOfWeek: DAYS[day],
    isWeekend: day === 0 || day === 6,
    timeOfDay: getTimeOfDay(hour),
    weekNumber: getWeekNumber(now),
  };
}