import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/settings/public
 * Obtener configuraciones públicas del sistema
 * Estas configuraciones pueden ser consultadas sin autenticación
 */
export async function GET(request: NextRequest) {
  try {
    // Lista de configuraciones públicas permitidas
    const PUBLIC_SETTINGS = [
      'age_gate_enabled',
      // Agregar más configuraciones públicas aquí en el futuro
    ];

    // Obtener solo las configuraciones públicas
    const settings = await prisma.settings.findMany({
      where: {
        key: {
          in: PUBLIC_SETTINGS,
        },
      },
      select: {
        key: true,
        value: true,
      },
    });

    // Convertir a objeto key-value
    const settingsMap: Record<string, string | boolean> = {};
    settings.forEach((setting) => {
      // Convertir strings "true"/"false" a booleanos
      if (setting.value === 'true' || setting.value === 'false') {
        settingsMap[setting.key] = setting.value === 'true';
      } else {
        settingsMap[setting.key] = setting.value || '';
      }
    });

    // Si no existe age_gate_enabled, retornar false por defecto
    if (!settingsMap.hasOwnProperty('age_gate_enabled')) {
      settingsMap['age_gate_enabled'] = false;
    }

    return NextResponse.json({
      success: true,
      settings: settingsMap,
    });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuraciones públicas' },
      { status: 500 }
    );
  }
}
