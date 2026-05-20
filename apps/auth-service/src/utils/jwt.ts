import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { config } from '@/config';

const secret = new TextEncoder().encode(config.JWT_SECRET);

export interface AccessTokenPayload extends JWTPayload {
  sub: string;        // userId
  kid: string;        // apiKeyId
  scope: string;      // space-separated
}

export async function signAccessToken(
  userId: string,
  apiKeyId: string,
  scope: string[]
): Promise<string> {
  return new SignJWT({
    sub: userId,
    kid: apiKeyId,
    scope: scope.join(' '),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${config.JWT_ACCESS_TOKEN_TTL}s`)
    .setIssuer('personal-api:auth-service')
    .setAudience('personal-api')
    .sign(secret);
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, secret, {
    issuer: 'personal-api:auth-service',
    audience: 'personal-api',
  });
  return payload as AccessTokenPayload;
}