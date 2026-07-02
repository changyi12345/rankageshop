import { HttpException, HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface Bucket {
  count: number;
  resetAt: number;
}

interface RateRule {
  id: string;
  match: (path: string) => boolean;
  max: number;
  windowMs: number;
}

const buckets = new Map<string, Bucket>();

/** Strip `/api` prefix so rules work with Nest global prefix. */
export function normalizeApiPath(req: Request): string {
  const raw = (req.originalUrl || req.url || req.path || '').split('?')[0];
  const withoutApi = raw.replace(/^\/api/, '') || '/';
  return withoutApi.replace(/\/$/, '') || '/';
}

const ROUTE_LIMITS: RateRule[] = [
  { id: 'auth-login', match: (p) => p === '/auth/login', max: 10, windowMs: 60_000 },
  { id: 'auth-register', match: (p) => p === '/auth/register', max: 5, windowMs: 60_000 },
  { id: 'auth-google', match: (p) => p === '/auth/google', max: 15, windowMs: 60_000 },
  { id: 'auth-2fa', match: (p) => p === '/auth/admin-2fa/verify', max: 8, windowMs: 60_000 },
  { id: 'auth-forgot', match: (p) => p === '/auth/forgot-password', max: 5, windowMs: 60_000 },
  { id: 'auth-reset', match: (p) => p === '/auth/reset-password', max: 10, windowMs: 60_000 },
  { id: 'auth-refresh', match: (p) => p === '/auth/token/refresh', max: 30, windowMs: 60_000 },
  { id: 'admin-upload', match: (p) => p === '/admin/upload' || p === '/admin/upload/base64', max: 30, windowMs: 60_000 },
  {
    id: 'upload-proof',
    match: (p) => p === '/uploads/payment-proof' || p === '/uploads/payment-proof-base64',
    max: 20,
    windowMs: 60_000,
  },
];

const GLOBAL_LIMIT = { max: 120, windowMs: 60_000 };

function clientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip ?? req.socket.remoteAddress ?? 'unknown';
}

function hitLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  return bucket.count > max;
}

function pruneExpiredBuckets() {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}

// Prevent unbounded memory growth on long-running processes.
setInterval(pruneExpiredBuckets, 5 * 60_000).unref?.();

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const path = normalizeApiPath(req);
    const ip = clientIp(req);

    const globalKey = `global:${ip}`;
    if (hitLimit(globalKey, GLOBAL_LIMIT.max, GLOBAL_LIMIT.windowMs)) {
      throw new HttpException('Too many requests. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const routeRule = ROUTE_LIMITS.find((rule) => rule.match(path));
    if (routeRule) {
      const routeKey = `${routeRule.id}:${ip}`;
      if (hitLimit(routeKey, routeRule.max, routeRule.windowMs)) {
        throw new HttpException('Too many requests. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
      }
    }

    next();
  }
}
