import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitRecord>();

// Clean up expired records every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of store.entries()) {
    if (now > record.resetTime) {
      store.delete(ip);
    }
  }
}, 5 * 60 * 1000);

/**
 * Creates a configurable in-memory sliding-window rate limiter middleware.
 */
export function rateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  statusCode?: number;
}) {
  const {
    windowMs,
    max,
    message = 'Too many requests from this IP, please try again later.',
    statusCode = 429,
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Determine client IP
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown-ip';

    const key = `${req.baseUrl || ''}:${req.path}:${clientIp}`;
    const now = Date.now();

    const record = store.get(key);

    if (!record || now > record.resetTime) {
      store.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });

      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', max - 1);
      res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000));
      next();
      return;
    }

    record.count += 1;
    const remaining = Math.max(0, max - record.count);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      res.status(statusCode).json({
        success: false,
        message,
        retryAfterSeconds,
      });
      return;
    }

    next();
  };
}

// Pre-configured rate limiters for live production
export const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // 60 attempts per 15 minutes per IP
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
});

export const apiRateLimiter = rateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute
  message: 'API rate limit exceeded. Please slow down your requests.',
});
