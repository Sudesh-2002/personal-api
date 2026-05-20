import { fetchJson } from '@/utils/httpClient';
import { config } from '@/config';
import { ScheduleSnapshot, EventSnapshot, ServiceEvent } from '@/types';
import { logger } from '@/utils/logger';

interface EventListResponse {
  data: ServiceEvent[];
  count: number;
}

function toSnapshot(e: ServiceEvent): EventSnapshot {
  return {
    id: e.id,
    title: e.title,
    startAt: e.startAt,
    endAt: e.endAt,
    allDay: e.allDay,
    category: e.category,
    location: e.location,
    status: e.status,
  };
}

export async function fetchScheduleSnapshot(
  userId: string
): Promise<ScheduleSnapshot> {
  const headers = { 'x-user-id': userId };

  try {
    const [nowRes, todayRes] = await Promise.all([
      fetchJson<EventListResponse>(
        `${config.SCHEDULE_SERVICE_URL}/events/now`,
        { headers }
      ),
      fetchJson<EventListResponse>(
        `${config.SCHEDULE_SERVICE_URL}/events/today`,
        { headers }
      ),
    ]);

    const currentEvents = nowRes.data.map(toSnapshot);
    const todayEvents = todayRes.data.map(toSnapshot);
    const nowIso = new Date().toISOString();

    // Upcoming = today's events that haven't started yet, max 3
    const upcomingEvents = todayEvents
      .filter((e) => e.startAt > nowIso)
      .slice(0, 3);

    const nextEvent = upcomingEvents[0] ?? null;

    return {
      currentEvents,
      todayEvents,
      upcomingEvents,
      isBusy: currentEvents.length > 0,
      nextEvent,
    };
  } catch (err) {
    logger.warn({ err, userId }, 'Failed to fetch schedule — using empty snapshot');
    return {
      currentEvents: [],
      todayEvents: [],
      upcomingEvents: [],
      isBusy: false,
      nextEvent: null,
    };
  }
}