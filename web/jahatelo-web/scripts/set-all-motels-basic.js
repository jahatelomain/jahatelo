/**
 * Fuerza el plan BASIC para todos los moteles existentes.
 *
 * Uso:
 *   DATABASE_URL="..." node scripts/set-all-motels-basic.js
 * o con .env.local cargado por prisma/client:
 *   node scripts/set-all-motels-basic.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const totalBefore = await prisma.motel.count();
  const byPlanBefore = await prisma.motel.groupBy({
    by: ['plan'],
    _count: { _all: true },
  });

  const updated = await prisma.motel.updateMany({
    data: { plan: 'BASIC' },
  });

  const byPlanAfter = await prisma.motel.groupBy({
    by: ['plan'],
    _count: { _all: true },
  });

  console.log('Total moteles:', totalBefore);
  console.log('Distribucion antes:', byPlanBefore);
  console.log('Filas actualizadas:', updated.count);
  console.log('Distribucion despues:', byPlanAfter);
}

main()
  .catch((error) => {
    console.error('Error actualizando planes a BASIC:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

