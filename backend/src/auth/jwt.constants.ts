const FALLBACK_SECRET = 'your-secret-key-change-this-in-production';

export const JWT_SECRET = process.env.JWT_SECRET ?? FALLBACK_SECRET;

/** Access token lifetime in seconds (default 1 hour). */
export const ACCESS_TOKEN_SECONDS = Number(process.env.JWT_ACCESS_SECONDS ?? 3600);
export const REFRESH_TOKEN_DAYS = Number(process.env.JWT_REFRESH_DAYS ?? 30);

if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === FALLBACK_SECRET)) {
  console.error('[security] JWT_SECRET must be set to a strong value in production.');
}
