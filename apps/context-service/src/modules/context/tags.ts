import { ScheduleSnapshot, TimeSnapshot, PreferenceSnapshot } from '@/types';

export function deriveTags(
  time: TimeSnapshot,
  schedule: ScheduleSnapshot,
  preferences: PreferenceSnapshot
): string[] {
  const tags: string[] = [];

  // Time of day
  tags.push(time.timeOfDay);

  // Day type
  if (time.isWeekend) {
    tags.push('weekend');
  } else {
    tags.push('weekday');
  }

  // Work hours (9am–5pm weekday)
  const [hourStr] = time.time.split(':');
  const hour = parseInt(hourStr, 10);
  if (!time.isWeekend && hour >= 9 && hour < 17) {
    tags.push('work-hours');
  }

  // Busy status
  if (schedule.isBusy) {
    tags.push('busy');
  } else {
    tags.push('free');
  }

  // Current event categories
  for (const event of schedule.currentEvents) {
    if (!tags.includes(event.category)) {
      tags.push(`in:${event.category}`);
    }
  }

  // Upcoming soon (within 15 minutes)
  if (schedule.nextEvent) {
    const diff = new Date(schedule.nextEvent.startAt).getTime() - Date.now();
    if (diff > 0 && diff <= 15 * 60 * 1000) {
      tags.push('upcoming-soon');
    }
  }

  // Heavy schedule day (4+ events)
  if (schedule.todayEvents.length >= 4) {
    tags.push('heavy-day');
  }

  // Notification preferences
  if (preferences.notifications.email) tags.push('notify:email');
  if (preferences.notifications.push) tags.push('notify:push');

  // Theme
  tags.push(`theme:${preferences.theme}`);

  return [...new Set(tags)]; // deduplicate
}