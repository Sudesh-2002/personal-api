import { initDb, getDb, persistDb } from './connection';
import { runMigrations } from './migrate';
import { logger } from '@/utils/logger';
import { randomUUID } from 'crypto';
import { addDays, addWeeks, toIso, startOfToday } from '@/utils/date';

async function seed(): Promise<void> {
  await initDb();
  runMigrations();

  const db = getDb();
  const userId = 'user_default';
  const today = startOfToday();

  const events = [
    {
      id: randomUUID(),
      title: 'Daily Standup',
      description: 'Team sync — 15 minutes',
      location: 'Google Meet',
      start_at: toIso(new Date(today.getTime() + 9 * 3600000)),
      end_at: toIso(new Date(today.getTime() + 9.25 * 3600000)),
      all_day: 0,
      timezone: 'Asia/Colombo',
      recurrence_rule: JSON.stringify({ frequency: 'daily', interval: 1, byDay: ['MO','TU','WE','TH','FR'] }),
      status: 'confirmed',
      category: 'work',
    },
    {
      id: randomUUID(),
      title: 'Weekly Review',
      description: 'Review goals and plan next week',
      location: null,
      start_at: toIso(new Date(addWeeks(today, 0).getTime() + 17 * 3600000)),
      end_at: toIso(new Date(addWeeks(today, 0).getTime() + 18 * 3600000)),
      all_day: 0,
      timezone: 'Asia/Colombo',
      recurrence_rule: JSON.stringify({ frequency: 'weekly', interval: 1, byDay: ['FR'] }),
      status: 'confirmed',
      category: 'personal',
    },
    {
      id: randomUUID(),
      title: 'Project Deadline',
      description: 'Personal API v1 release',
      location: null,
      start_at: toIso(addDays(today, 14)),
      end_at: toIso(addDays(today, 14)),
      all_day: 1,
      timezone: 'Asia/Colombo',
      recurrence_rule: null,
      status: 'confirmed',
      category: 'work',
    },
    {
      id: randomUUID(),
      title: 'Gym',
      description: 'Strength training',
      location: 'Local Gym',
      start_at: toIso(new Date(today.getTime() + 6 * 3600000)),
      end_at: toIso(new Date(today.getTime() + 7 * 3600000)),
      all_day: 0,
      timezone: 'Asia/Colombo',
      recurrence_rule: JSON.stringify({ frequency: 'weekly', interval: 1, byDay: ['MO','WE','FR'] }),
      status: 'confirmed',
      category: 'health',
    },
  ];

  for (const e of events) {
    db.run(
      `INSERT OR IGNORE INTO events
        (id, user_id, title, description, location, start_at, end_at,
         all_day, timezone, recurrence_rule, status, category)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [e.id, userId, e.title, e.description ?? null, e.location ?? null,
       e.start_at, e.end_at, e.all_day, e.timezone,
       e.recurrence_rule ?? null, e.status, e.category]
    );
  }

  persistDb();
  logger.info({ count: events.length, userId }, '🌱 Schedule seed data inserted');
}

seed().catch((err) => { console.error(err); process.exit(1); });