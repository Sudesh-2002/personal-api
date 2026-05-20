import { createHash, randomBytes } from 'crypto';
import { config } from '@/config';

// Generate a secure random API key
export function generateApiKey(): string {
  const random = randomBytes(32).toString('base64url');
  return `${config.API_KEY_PREFIX}_${random}`;
}

// SHA-256 hash — stored in DB, never the raw key
export function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

// First 12 chars used for display/identification without exposing the full key
export function keyPrefix(key: string): string {
  return key.slice(0, 12);
}

// Generate a secure refresh token
export function generateRefreshToken(): string {
  return randomBytes(48).toString('base64url');
}