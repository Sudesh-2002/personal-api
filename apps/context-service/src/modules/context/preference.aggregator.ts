import { fetchJson } from '@/utils/httpClient';
import { config } from '@/config';
import { PreferenceSnapshot, ServicePreference } from '@/types';
import { logger } from '@/utils/logger';

interface PreferenceListResponse {
  data: ServicePreference[];
  count: number;
}

export async function fetchPreferenceSnapshot(
  userId: string
): Promise<PreferenceSnapshot> {
  try {
    const res = await fetchJson<PreferenceListResponse>(
      `${config.PREFERENCE_SERVICE_URL}/preferences`,
      { headers: { 'x-user-id': userId } }
    );

    const prefs = res.data;

    // Helper to get a value by category + key
    const get = (category: string, key: string): unknown =>
      prefs.find((p) => p.category === category && p.key === key)?.value;

    // Collect all non-standard preferences as custom
    const standardKeys = new Set([
      'ui:theme', 'ui:language', 'ui:timezone',
      'notifications:email_enabled', 'notifications:push_enabled',
    ]);

    const custom: Record<string, unknown> = {};
    for (const p of prefs) {
      const k = `${p.category}:${p.key}`;
      if (!standardKeys.has(k)) {
        custom[k] = p.value;
      }
    }

    return {
      theme: (get('ui', 'theme') as string) ?? 'light',
      language: (get('ui', 'language') as string) ?? 'en-US',
      timezone: (get('ui', 'timezone') as string) ?? 'UTC',
      notifications: {
        email: get('notifications', 'email_enabled') === true ||
               get('notifications', 'email_enabled') === 'true',
        push: get('notifications', 'push_enabled') === true ||
              get('notifications', 'push_enabled') === 'true',
      },
      custom,
    };
  } catch (err) {
    logger.warn({ err, userId }, 'Failed to fetch preferences — using defaults');
    return {
      theme: 'light',
      language: 'en-US',
      timezone: 'UTC',
      notifications: { email: false, push: false },
      custom: {},
    };
  }
}