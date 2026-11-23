interface RateLimitEntry {
  timestamps: number[];
}

const buckets = new Map<string, RateLimitEntry>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now()
): RateLimitResult {
  const existing = buckets.get(key);
  const windowStart = now - windowMs;
  const recent = existing
    ? existing.timestamps.filter((ts) => ts > windowStart)
    : [];

  if (recent.length >= limit) {
    const oldest = recent[0] ?? now;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldest + windowMs - now) / 1000)
    );
    buckets.set(key, { timestamps: recent });
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  recent.push(now);
  buckets.set(key, { timestamps: recent });

  return {
    allowed: true,
    remaining: Math.max(0, limit - recent.length),
    retryAfterSeconds: 0,
  };
}

export function resetRateLimitStore(): void {
  buckets.clear();
}
