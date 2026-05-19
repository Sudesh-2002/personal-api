import { RecurrenceRule, CalendarEvent } from '@/types';
import { addDays, addWeeks, addMonths, fromIso, toIso } from './date';

const DAY_MAP: Record<string, number> = {
  SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6,
};

// Expand a recurring event into concrete occurrences within [rangeStart, rangeEnd]
export function expandRecurring(
  event: CalendarEvent,
  rangeStart: Date,
  rangeEnd: Date
): CalendarEvent[] {
  if (!event.recurrenceRule) return [event];

  const rule: RecurrenceRule = event.recurrenceRule;
  const occurrences: CalendarEvent[] = [];
  const eventStart = fromIso(event.startAt);
  const eventEnd = fromIso(event.endAt);
  const duration = eventEnd.getTime() - eventStart.getTime();

  let current = new Date(eventStart);
  let count = 0;
  const maxCount = rule.count ?? 365; // safety cap
  const untilDate = rule.until ? fromIso(rule.until) : null;

  while (count < maxCount) {
    // Stop if past until date or range end
    if (untilDate && current > untilDate) break;
    if (current > rangeEnd) break;

    // Check byDay filter
    const dayOk =
      !rule.byDay ||
      rule.byDay.length === 0 ||
      rule.byDay.includes(
        ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][current.getUTCDay()]
      );

    if (dayOk && current >= rangeStart) {
      const occurrenceEnd = new Date(current.getTime() + duration);
      occurrences.push({
        ...event,
        id: `${event.id}_${count}`,
        startAt: toIso(current),
        endAt: toIso(occurrenceEnd),
      });
    }

    // Advance by interval
    switch (rule.frequency) {
      case 'daily':
        current = addDays(current, rule.interval);
        break;
      case 'weekly':
        current = addWeeks(current, rule.interval);
        break;
      case 'monthly':
        current = addMonths(current, rule.interval);
        break;
      case 'yearly':
        current = addMonths(current, rule.interval * 12);
        break;
    }
    count++;
  }

  return occurrences;
}