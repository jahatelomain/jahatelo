import { NextRequest, NextResponse } from 'next/server';
import { processScheduledNotifications } from '@/lib/push-notifications';

/**
 * GET /api/cron/process-notifications
 * Procesa notificaciones programadas pendientes
 * Este endpoint debe ser llamado periódicamente por un cron job externo
 *
 * Seguridad: Usar un token de autorización en headers
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar token de autorización (opcional pero recomendado)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Procesar notificaciones programadas
    const result = await processScheduledNotifications();

    return NextResponse.json({
      success: true,
      ...result,
      message: `Processed ${result.processed} notifications: ${result.sent} sent, ${result.failed} failed`,
    });
  } catch (error) {
    console.error('Error in process-notifications cron:', error);
    return NextResponse.json(
      {
        error: 'Error processing notifications',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
