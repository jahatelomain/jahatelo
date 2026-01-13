import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';

/**
 * GET /api/health
 *
 * Health check endpoint para monitoring
 * Verifica:
 * - Aplicación corriendo
 * - Conexión a base de datos
 * - Uptime del proceso
 */
export async function GET() {
  const startTime = Date.now();

  try {
    // Verificar conexión a base de datos
    await prisma.$queryRaw`SELECT 1`;

    const duration = Date.now() - startTime;

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(), // Segundos desde que inició
      environment: process.env.NODE_ENV,
      database: {
        status: 'connected',
        responseTime: duration,
      },
      version: process.env.npm_package_version || '1.0.0',
    };

    logger.debug({
      type: 'health_check',
      status: 'healthy',
      dbResponseTime: duration,
    });

    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error({
      type: 'health_check',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      dbResponseTime: duration,
    });

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        database: {
          status: 'disconnected',
          error: error instanceof Error ? error.message : 'Database connection failed',
        },
      },
      { status: 503 }
    );
  }
}
