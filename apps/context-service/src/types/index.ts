// ── Preference snapshot ───────────────────────────────────────
export interface PreferenceSnapshot {
  theme: string;
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
  };
  custom: Record<string, unknown>;
}

// ── Schedule snapshot ────────────────────────────────────────
export interface EventSnapshot {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  category: string;
  location: string | null;
  status: string;
}

export interface ScheduleSnapshot {
  currentEvents: EventSnapshot[];
  todayEvents: EventSnapshot[];
  upcomingEvents: EventSnapshot[];  // next 3 after now
  isBusy: boolean;
  nextEvent: EventSnapshot | null;
}

// ── Time snapshot ─────────────────────────────────────────────
export interface TimeSnapshot {
  iso: string;
  timezone: string;
  date: string;         // YYYY-MM-DD
  time: string;         // HH:MM
  dayOfWeek: string;    // Monday
  isWeekend: boolean;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  weekNumber: number;
}

// ── Full context snapshot ────────────────────────────────────
export interface ContextSnapshot {
  userId: string;
  generatedAt: string;
  ttlMs: number;
  time: TimeSnapshot;
  preferences: PreferenceSnapshot;
  schedule: ScheduleSnapshot;
  tags: string[];       // derived context tags e.g. ['busy', 'work-hours', 'weekend']
}

// ── Service response shapes ───────────────────────────────────
export interface ServicePreference {
  id: string;
  userId: string;
  category: string;
  key: string;
  value: unknown;
  valueType: string;
}

export interface ServiceEvent {
  id: string;
  userId: string;
  title: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  category: string;
  location: string | null;
  status: string;
  recurrenceRule: unknown;
}

// ── RFC 7807 ──────────────────────────────────────────────────
export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
}

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      userId: string;
    }
  }
}