import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

const LIMITS: Record<string, { max: number; windowMs: number }> = {
  '/auth/login': { max: 10, windowMs: 60_000 },
  '/auth/register': { max: 5, windowMs: 60_000 },
  '/auth/forgot-password': { max: 5, windowMs: 60_000 },
  '/auth/reset-password': { max: 10, windowMs: 60_000 },
  '/admin/upload': { max: 30, windowMs: 60_000 },
  '/uploads/payment-proof': { max: 20, windowMs: 60_000 },
  '/uploads/payment-proof-base64': { max: 20, windowMs: 60_000 },
};

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const path = req.path.replace(/\/$/, '');
    const rule = LIMITS[path];
    if (!rule) return next();

    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const key = `${path}:${ip}`;
    const now = Date.now();
    let bucket = buckets.get(key);

    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 0, resetAt: now + rule.windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;
    if (bucket.count > rule.max) {
      throw new HttpException('Too many requests. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }

    next();
  }
}
