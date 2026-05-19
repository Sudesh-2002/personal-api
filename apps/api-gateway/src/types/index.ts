import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  requestId: string;
  user?: {
    sub: string;
    email?: string;
    scope: string[];
  };
}

// RFC 7807 — Problem Details for HTTP APIs
export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  traceId?: string;
}

// Augment Express Request globally so requestId is available everywhere
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: {
        sub: string;
        email?: string;
        scope: string[];
      };
    }
  }
}