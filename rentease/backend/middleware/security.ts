import { Request, Response, NextFunction } from 'express';

/**
 * Security headers middleware that injects industry-standard HTTP protective headers
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // XSS protection for older browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Control referrer information sent with requests
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Prevent clickjacking while permitting embed in necessary iframe previews
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  next();
}

/**
 * Robust Cross-Origin Resource Sharing (CORS) middleware
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin;

  // Allow origin or reflect request origin
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma'
  );
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  // Respond immediately to OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
}

/**
 * Input sanitization helper to strip dangerous tags or malformed scripts
 */
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim();
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  if (typeof input === 'object' && input !== null) {
    const sanitizedObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      sanitizedObj[key] = sanitizeInput(value);
    }
    return sanitizedObj;
  }
  return input;
}
