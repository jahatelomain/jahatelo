import { prisma } from '@/lib/prisma';

/**
 * Toca motel.updatedAt para que el mecanismo de caché de la app detecte
 * cualquier cambio en entidades hijas (habitaciones, fotos, menú, promos).
 *
 * Prisma actualiza @updatedAt automáticamente en cualquier update(),
 * incluso con data: {}. Esto invalida:
 *   - El caché de detalle de la app (serverUpdatedAt comparison)
 *   - El latestUpdatedAt del list route (clearMotelDetailCaches)
 *
 * Llamar después de cada operación write en entidades hijas del motel.
 */
export async function touchMotel(motelId: string): Promise<void> {
  await prisma.motel.update({ where: { id: motelId }, data: {} });
}
