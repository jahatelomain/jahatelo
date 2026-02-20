import type { NextRequest } from 'next/server';

export type AnalyticsEnvironment = 'production' | 'staging' | 'development';

export function resolveAnalyticsEnvironment(request?: NextRequest): AnalyticsEnvironment {
  const vercelEnv = process.env.VERCEL_ENV;

  if (vercelEnv === 'production') return 'production';
  if (vercelEnv === 'preview') return 'staging';

  if (process.env.NODE_ENV !== 'production') return 'development';

  const host = request?.headers.get('host')?.toLowerCase() || request?.nextUrl?.hostname?.toLowerCase() || '';
  if (host.includes('localhost') || host.startsWith('127.0.0.1')) return 'development';
  if (host.includes('staging')) return 'staging';

  return 'production';
}
