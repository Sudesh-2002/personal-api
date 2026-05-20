import { fetchPreferenceSnapshot } from './preference.aggregator';
import { fetchScheduleSnapshot } from './schedule.aggregator';
import { deriveTags } from './tags';
import { buildTimeSnapshot } from '@/utils/time';
import { cache } from '@/utils/cache';
import { config } from '@/config';
import { ContextSnapshot } from '@/types';
import { logger } from '@/utils/logger';

function cacheKey(userId: string): string {
  return `context:${userId}`;
}

export async function buildContext(userId: string, forceRefresh = false): Promise<ContextSnapshot> {
  if (!forceRefresh) {
    const cached = cache.get<ContextSnapshot>(cacheKey(userId));
    if (cached) {
      logger.debug({ userId }, 'Context served from cache');
      return cached;
    }
  }

  logger.info({ userId }, 'Building fresh context snapshot');

  // Fetch preferences and schedule in parallel
  const [preferences, schedule] = await Promise.all([
    fetchPreferenceSnapshot(userId),
    fetchScheduleSnapshot(userId),
  ]);

  const time = buildTimeSnapshot(preferences.timezone);
  const tags = deriveTags(time, schedule, preferences);

  const snapshot: ContextSnapshot = {
    userId,
    generatedAt: new Date().toISOString(),
    ttlMs: config.CONTEXT_CACHE_TTL_MS,
    time,
    preferences,
    schedule,
    tags,
  };

  cache.set(cacheKey(userId), snapshot, config.CONTEXT_CACHE_TTL_MS);
  logger.info({ userId, tags }, 'Context snapshot built and cached');

  return snapshot;
}

export function invalidateContext(userId: string): void {
  cache.delete(cacheKey(userId));
  logger.info({ userId }, 'Context cache invalidated');
}