import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

type RateLimitResult = {
  success: boolean;
  remaining: number;
};

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;
const limiterCache = new Map<string, Ratelimit>();

const toWindowSeconds = (windowMs: number) => Math.max(1, Math.ceil(windowMs / 1000));

const getLimiter = (limit: number, windowMs: number) => {
  const key = `${limit}:${windowMs}`;
  const cached = limiterCache.get(key);
  if (cached) return cached;

  const limiter = new Ratelimit({
    redis: redis as Redis,
    limiter: Ratelimit.fixedWindow(limit, `${toWindowSeconds(windowMs)} s`),
    analytics: true,
  });

  limiterCache.set(key, limiter);
  return limiter;
};

export const isUpstashEnabled = () => Boolean(redis);

export const rateLimitUpstash = async (
  identifier: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> => {
  if (!redis) {
    return { success: true, remaining: limit };
  }

  const limiter = getLimiter(limit, windowMs);
  const result = await limiter.limit(identifier);

  return {
    success: result.success,
    remaining: Math.max(0, result.remaining ?? 0),
  };
};
