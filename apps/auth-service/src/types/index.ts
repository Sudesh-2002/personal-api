// ── Database rows ─────────────────────────────────────────────
export interface ApiKeyRow {
  id: string;
  user_id: string;
  name: string;
  key_hash: string;       // SHA-256 hash of the raw key
  key_prefix: string;     // first 12 chars of raw key (for display)
  scope: string;          // space-separated scopes
  expires_at: string | null;
  last_used_at: string | null;
  is_active: number;      // 0 | 1
  created_at: string;
  updated_at: string;
}

export interface RefreshTokenRow {
  id: string;
  user_id: string;
  api_key_id: string;
  token_hash: string;
  expires_at: string;
  is_revoked: number;     // 0 | 1
  created_at: string;
}

// ── API-facing shapes ─────────────────────────────────────────
export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  scope: string[];
  expiresAt: string | null;
  lastUsedAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyWithSecret extends ApiKey {
  key: string;            // Only returned once on creation
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;      // seconds
  scope: string[];
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
      apiKeyId?: string;
    }
  }
}