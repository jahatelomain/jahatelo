jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number; headers?: Record<string, string> }) => ({
      body,
      status: init?.status ?? 200,
      headers: init?.headers,
    }),
  },
}));
jest.mock('@/lib/rateLimit', () => {
  const counts = new Map<string, number>();
  return {
    rateLimitUpstash: async (key: string, limit: number) => {
      const count = (counts.get(key) || 0) + 1;
      counts.set(key, count);
      return { success: count <= limit, remaining: Math.max(0, limit - count) };
    },
  };
});
jest.mock('jose', () => ({
  SignJWT: class {
    setProtectedHeader() { return this; }
    setIssuedAt() { return this; }
    setExpirationTime() { return this; }
    async sign() { return 'signed'; }
  },
  jwtVerify: jest.fn(),
}));

import { authorizeCron } from '@/lib/cronAuth';
import { enforceAuthRateLimit } from '@/lib/authRateLimit';
import { createEmailVerificationToken } from '@/lib/emailVerification';

describe('security guards', () => {
  const request = (authorization?: string, ip?: string) => ({
    headers: new Headers({
      ...(authorization ? { authorization } : {}),
      ...(ip ? { 'x-forwarded-for': ip } : {}),
    }),
  }) as Request;

  const originalCronSecret = process.env.CRON_SECRET;
  const originalEmailSecret = process.env.EMAIL_VERIFICATION_SECRET;
  const originalJwtSecret = process.env.JWT_SECRET;

  afterEach(() => {
    process.env.CRON_SECRET = originalCronSecret;
    process.env.EMAIL_VERIFICATION_SECRET = originalEmailSecret;
    process.env.JWT_SECRET = originalJwtSecret;
  });

  it('fails closed when CRON_SECRET is missing', async () => {
    delete process.env.CRON_SECRET;
    const response = authorizeCron(request());
    expect(response?.status).toBe(503);
  });

  it('rejects an invalid cron bearer token', () => {
    process.env.CRON_SECRET = 'correct-secret';
    const response = authorizeCron(request('Bearer wrong-secret'));
    expect(response?.status).toBe(401);
  });

  it('accepts the configured cron bearer token', () => {
    process.env.CRON_SECRET = 'correct-secret';
    const response = authorizeCron(request('Bearer correct-secret'));
    expect(response).toBeNull();
  });

  it('limits repeated authentication attempts even without Redis', async () => {
    const loginRequest = request(undefined, '198.51.100.77');
    expect(await enforceAuthRateLimit(loginRequest, 'test-login', 'unique@example.test', 2, 60_000)).toBeNull();
    expect(await enforceAuthRateLimit(loginRequest, 'test-login', 'unique@example.test', 2, 60_000)).toBeNull();
    expect((await enforceAuthRateLimit(loginRequest, 'test-login', 'unique@example.test', 2, 60_000))?.status).toBe(429);
  });

  it('does not sign email tokens with a known fallback secret', async () => {
    delete process.env.EMAIL_VERIFICATION_SECRET;
    delete process.env.JWT_SECRET;
    await expect(createEmailVerificationToken('user@example.test')).rejects.toThrow('must be configured');
  });
});
