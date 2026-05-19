// ── Recurrence rule (RFC 5545 inspired) ─────────────────────
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number;        // every N frequency units
  until?: string;          // ISO date — end of recurrence
  count?: number;          // max occurrences
  byDay?: string[];        // ['MO','TU','WE','TH','FR'] etc.
}

// ── Database row ─────────────────────────────────────────────
export interface EventRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_at: string;        // ISO datetime
  end_at: string;          // ISO datetime
  all_day: number;         // 0 | 1
  timezone: string;
  recurrence_rule: string | null;  // JSON-serialized RecurrenceRule
  status: string;          // 'confirmed' | 'tentative' | 'cancelled'
  category: string;
  created_at: string;
  updated_at: string;
}

// ── API-facing shape ──────────────────────────────────────────
export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: string;
  endAt: string;
  allDay: boolean;
  timezone: string;
  recurrenceRule: RecurrenceRule | null;
  status: 'confirmed' | 'tentative' | 'cancelled';
  category: string;
  createdAt: string;
  updatedAt: string;
}

// ── RFC 7807 ──────────────────────────────────────────────────
export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      userId: string;
    }
  }
}