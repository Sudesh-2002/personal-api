// ── Database row shapes ──────────────────────────────────────
export interface PreferenceRow {
  id: string;
  user_id: string;
  category: string;
  key: string;
  value: string;         // JSON-serialized
  value_type: string;    // 'string' | 'number' | 'boolean' | 'object' | 'array'
  description: string | null;
  created_at: string;
  updated_at: string;
}

// ── API-facing shapes ────────────────────────────────────────
export interface Preference {
  id: string;
  userId: string;
  category: string;
  key: string;
  value: unknown;
  valueType: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── RFC 7807 Problem Detail ──────────────────────────────────
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