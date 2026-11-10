import { NextResponse } from 'next/server';
import { UNAUTHORIZED_MESSAGE } from '@/lib/authHelpers';

export function authorizeCron(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error('[cron] CRON_SECRET no está configurado');
    return NextResponse.json({ error: 'Cron no configurado' }, { status: 503 });
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: UNAUTHORIZED_MESSAGE }, { status: 401 });
  }
  return null;
}
