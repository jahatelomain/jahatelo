import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');
const backupDirectory = process.env.PLAN_MIGRATION_BACKUP_DIR
  || path.resolve(process.cwd(), '../../../../media/jahatelo/migraciones-planes');

const normalizeName = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/\bmotel\b/g, '')
  .replace(/[^a-z0-9]/g, '');

async function main() {
  const motels = await prisma.motel.findMany({
    select: { id: true, name: true, plan: true, status: true, isActive: true },
    orderBy: { name: 'asc' },
  });
  const studioA = motels.filter((motel) => normalizeName(motel.name) === 'studioa');
  if (studioA.length !== 1) {
    throw new Error(`Se esperaba exactamente un Motel Studio A y se encontraron ${studioA.length}. No se modificó ningún plan.`);
  }

  const targets = motels.filter((motel) => motel.id !== studioA[0].id && motel.plan !== 'BASIC');
  const manifest = {
    generatedAt: new Date().toISOString(),
    apply,
    excluded: studioA[0],
    totalMotels: motels.length,
    targets: targets.map((motel) => ({ ...motel, nextPlan: 'BASIC' })),
  };
  await mkdir(backupDirectory, { recursive: true });
  const filename = `planes-basic-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  await writeFile(path.join(backupDirectory, filename), `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(`Moteles totales: ${motels.length}. Studio A excluido: ${studioA[0].name}. Cambios requeridos: ${targets.length}.`);
  console.log(`Manifiesto de reversión: ${path.join(backupDirectory, filename)}`);
  if (!apply) {
    console.log('Modo simulación: no se modificó la base. Repetí con --apply para ejecutar.');
    return;
  }

  const result = await prisma.motel.updateMany({
    where: { id: { not: studioA[0].id }, plan: { not: 'BASIC' } },
    data: { plan: 'BASIC' },
  });
  console.log(`Planes actualizados a BASIC: ${result.count}.`);
}

main().finally(async () => prisma.$disconnect());
