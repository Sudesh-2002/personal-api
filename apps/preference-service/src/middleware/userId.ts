import { Request, Response, NextFunction } from 'express';

// In production this reads the verified JWT sub forwarded by the gateway.
// The gateway sets x-user-id after auth validation.
export function userIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const userId = req.headers['x-user-id'] as string | undefined;

  if (!userId) {
    res.status(401).json({
      type: 'about:blank',
      title: 'Unauthorized',
      status: 401,
      detail: 'Missing x-user-id header. Requests must route through the API Gateway.',
    });
    return;
  }

  req.userId = userId;
  next();
}