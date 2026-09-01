import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/adminAccess';
import { getSearchConsoleDashboard, isSearchConsoleConfigured } from '@/lib/searchConsole';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const access = await requireAdminAccess(request, ['SUPERADMIN'], 'analytics');
  if (access.error) return access.error;

  const requestedDays = Number(request.nextUrl.searchParams.get('days'));
  const days = [7, 28, 90].includes(requestedDays) ? requestedDays : 28;
  if (!isSearchConsoleConfigured()) {
    return NextResponse.json({
      configured: false,
      siteUrl: process.env.SEARCH_CONSOLE_SITE_URL?.trim() || 'https://www.jahatelo.com/',
      requiredVariables: ['SEARCH_CONSOLE_CLIENT_EMAIL', 'SEARCH_CONSOLE_PRIVATE_KEY', 'SEARCH_CONSOLE_SITE_URL'],
    });
  }

  try {
    return NextResponse.json(await getSearchConsoleDashboard(days));
  } catch (error) {
    console.error('Error loading Search Console dashboard:', error);
    return NextResponse.json({ error: 'No se pudo consultar Search Console. Revisá los permisos y credenciales de la identidad técnica.' }, { status: 502 });
  }
}
