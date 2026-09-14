import { NextRequest, NextResponse } from 'next/server';
import { processScheduledNotifications } from '@/lib/push-notifications';
import { EmptySchema } from '@/lib/validations/schemas';
import { z } from 'zod';
import { authorizeCron } from '@/lib/cronAuth';

/**
 * GET /api/cron/process-notifications
 * Procesa notificaciones programadas pendientes
 * Este endpoint debe ser llamado periódicamente por un cron job externo
 *
 * Seguridad: Usar un token de autorización en headers
 */
export async function GET(request: NextRequest) {
  try {
    EmptySchema.parse({});
    // Verificar token de autorización (opcional pero recomendado)
    const authError = authorizeCron(request);
    if (authError) return authError;

    // Procesar notificaciones programadas
    const result = await processScheduledNotifications();

    return NextResponse.json({
      success: true,
      ...result,
      message: `Processed ${result.processed} notifications: ${result.sent} sent, ${result.failed} failed`,
    });
  } catch (error) {
    console.error('Error in process-notifications cron:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      {
        error: 'Error processing notifications',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
