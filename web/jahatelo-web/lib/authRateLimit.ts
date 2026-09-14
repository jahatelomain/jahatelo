import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { rateLimitUpstash } from './rateLimit';

const fingerprint = (value: string) => createHash('sha256').update(value).digest('hex').slice(0, 24);

export async function enforceAuthRateLimit(
  request: Request,
  action: string,
  subject: string,
  limit = 10,
  windowMs = 15 * 60_000
): Promise<NextResponse | null> {
  const headers = request.headers;
  const ip = headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim()
    || headers?.get?.('x-real-ip')
    || 'unknown';
  const normalizedSubject = subject.toLowerCase().trim();
  const [subjectResult, ipResult] = await Promise.all([
    rateLimitUpstash(`auth:${action}:subject:${fingerprint(normalizedSubject)}`, limit, windowMs),
    rateLimitUpstash(`auth:${action}:ip:${fingerprint(ip)}`, limit * 5, windowMs),
  ]);
  if (subjectResult.success && ipResult.success) return null;
  return NextResponse.json(
    { error: 'Demasiados intentos. Intenta nuevamente más tarde.' },
    { status: 429, headers: { 'Retry-After': String(Math.ceil(windowMs / 1000)) } }
  );
}
