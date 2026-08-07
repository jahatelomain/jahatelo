import 'dotenv/config';
import crypto from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';
import * as watermarkModule from '../lib/media/watermark';

// tsx ejecuta scripts .mts como ESM, mientras que el helper de Next puede
// resolverse como CommonJS durante tareas operativas. Aceptamos ambas formas.
const watermarkExports = (watermarkModule as typeof watermarkModule & { default?: typeof watermarkModule }).default ?? watermarkModule;
const { WATERMARKED_IMAGE_CONTENT_TYPE, watermarkUploadedImage } = watermarkExports;

type ImageReference = {
  model: 'motel' | 'roomPhoto' | 'menuItem' | 'promo' | 'homeBanner' | 'advertisement';
  id: string;
  field: string;
  url: string;
};

type ManifestEntry = ImageReference & {
  sourceKey: string | null;
  targetKey?: string;
  targetUrl?: string;
  status: 'planned' | 'skipped' | 'uploaded' | 'updated' | 'failed';
  reason?: string;
};

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');
const limitIndex = process.argv.indexOf('--limit');
const limit = limitIndex >= 0 ? Number(process.argv[limitIndex + 1]) : undefined;
const bucket = process.env.AWS_S3_BUCKET;
const region = process.env.AWS_S3_REGION;

if (!bucket || !region || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error('Faltan credenciales AWS S3. Cargá las variables de producción antes de ejecutar la migración.');
}

const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const storageHost = `${bucket}.s3.${region}.amazonaws.com`;
const backupDirectory = process.env.WATERMARK_BACKUP_DIR
  || path.resolve(process.cwd(), '../../../../media/jahatelo/migraciones-marca-agua');

function getOwnedObjectKey(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== storageHost) return null;
    const key = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
    if (!key.startsWith('uploads/') || key.startsWith('uploads/watermarked/')) return null;
    return key;
  } catch {
    return null;
  }
}

function guessMimeType(key: string, contentType?: string) {
  if (contentType?.startsWith('image/')) return contentType;
  const extension = path.extname(key).toLowerCase();
  return extension === '.png' ? 'image/png'
    : extension === '.webp' ? 'image/webp'
      : extension === '.heic' ? 'image/heic'
        : extension === '.heif' ? 'image/heif'
          : 'image/jpeg';
}

async function collectReferences(): Promise<ImageReference[]> {
  const [motels, roomPhotos, menuItems, promos, homeBanners, advertisements] = await Promise.all([
    prisma.motel.findMany({ select: { id: true, featuredPhoto: true, featuredPhotoWeb: true, featuredPhotoApp: true } }),
    prisma.roomPhoto.findMany({ select: { id: true, url: true } }),
    prisma.menuItem.findMany({ select: { id: true, photoUrl: true } }),
    prisma.promo.findMany({ select: { id: true, imageUrl: true } }),
    prisma.homeBanner.findMany({ select: { id: true, imageUrl: true } }),
    prisma.advertisement.findMany({ select: { id: true, imageUrl: true, largeImageUrl: true, largeImageUrlWeb: true, largeImageUrlApp: true } }),
  ]);

  const references: ImageReference[] = [];
  const add = (model: ImageReference['model'], id: string, field: string, url: string | null) => {
    if (url) references.push({ model, id, field, url });
  };
  motels.forEach((item) => {
    add('motel', item.id, 'featuredPhoto', item.featuredPhoto);
    add('motel', item.id, 'featuredPhotoWeb', item.featuredPhotoWeb);
    add('motel', item.id, 'featuredPhotoApp', item.featuredPhotoApp);
  });
  roomPhotos.forEach((item) => add('roomPhoto', item.id, 'url', item.url));
  menuItems.forEach((item) => add('menuItem', item.id, 'photoUrl', item.photoUrl));
  promos.forEach((item) => add('promo', item.id, 'imageUrl', item.imageUrl));
  homeBanners.forEach((item) => add('homeBanner', item.id, 'imageUrl', item.imageUrl));
  advertisements.forEach((item) => {
    add('advertisement', item.id, 'imageUrl', item.imageUrl);
    add('advertisement', item.id, 'largeImageUrl', item.largeImageUrl);
    add('advertisement', item.id, 'largeImageUrlWeb', item.largeImageUrlWeb);
    add('advertisement', item.id, 'largeImageUrlApp', item.largeImageUrlApp);
  });
  return references;
}

async function updateReference(reference: ImageReference, url: string) {
  const data = { [reference.field]: url };
  switch (reference.model) {
    case 'motel': return prisma.motel.update({ where: { id: reference.id }, data });
    case 'roomPhoto': return prisma.roomPhoto.update({ where: { id: reference.id }, data });
    case 'menuItem': return prisma.menuItem.update({ where: { id: reference.id }, data });
    case 'promo': return prisma.promo.update({ where: { id: reference.id }, data });
    case 'homeBanner': return prisma.homeBanner.update({ where: { id: reference.id }, data });
    case 'advertisement': return prisma.advertisement.update({ where: { id: reference.id }, data });
  }
}

async function saveManifest(filename: string, manifest: ManifestEntry[]) {
  await mkdir(backupDirectory, { recursive: true });
  await writeFile(path.join(backupDirectory, filename), `${JSON.stringify({ generatedAt: new Date().toISOString(), apply, entries: manifest }, null, 2)}\n`);
}

async function main() {
  const references = await collectReferences();
  const manifest: ManifestEntry[] = references.map((reference) => ({
    ...reference,
    sourceKey: getOwnedObjectKey(reference.url),
    status: getOwnedObjectKey(reference.url) ? 'planned' : 'skipped',
    reason: getOwnedObjectKey(reference.url) ? undefined : 'URL externa o no administrada por el bucket actual',
  }));
  const manifestName = `marca-agua-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  await saveManifest(manifestName, manifest);

  const candidates = manifest.filter((entry) => entry.status === 'planned');
  const eligible = typeof limit === 'number' && Number.isFinite(limit) ? candidates.slice(0, limit) : candidates;
  console.log(`Referencias detectadas: ${references.length}. Administradas por S3: ${candidates.length}. Lote actual: ${eligible.length}. Omitidas: ${manifest.length - candidates.length}.`);
  console.log(`Manifiesto de reversión: ${path.join(backupDirectory, manifestName)}`);
  if (!apply) {
    console.log('Modo simulación: no se modificó S3 ni la base. Repetí con --apply para ejecutar.');
    return;
  }

  const cache = new Map<string, { key: string; url: string }>();
  for (const entry of eligible) {
    try {
      let target = cache.get(entry.url);
      if (!target) {
        const source = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: entry.sourceKey! }));
        const bytes = await source.Body?.transformToByteArray();
        if (!bytes) throw new Error('S3 devolvió un archivo vacío.');
        const marked = await watermarkUploadedImage(Buffer.from(bytes), guessMimeType(entry.sourceKey!, source.ContentType));
        const digest = crypto.createHash('sha256').update(entry.sourceKey!).digest('hex').slice(0, 20);
        const key = `uploads/watermarked/${new Date().toISOString().slice(0, 10)}/${digest}.webp`;
        await s3.send(new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: marked,
          ContentType: WATERMARKED_IMAGE_CONTENT_TYPE,
          Metadata: { sourcekey: entry.sourceKey! },
        }));
        target = { key, url: `https://${storageHost}/${key}` };
        cache.set(entry.url, target);
      }
      entry.targetKey = target.key;
      entry.targetUrl = target.url;
      entry.status = 'uploaded';
      await updateReference(entry, target.url);
      entry.status = 'updated';
    } catch (error) {
      entry.status = 'failed';
      entry.reason = error instanceof Error ? error.message : 'Error desconocido';
    }
    await saveManifest(manifestName, manifest);
  }

  const updated = manifest.filter((entry) => entry.status === 'updated').length;
  const failed = manifest.filter((entry) => entry.status === 'failed').length;
  console.log(`Migración finalizada. Referencias actualizadas: ${updated}. Fallidas: ${failed}.`);
  if (failed) process.exitCode = 1;
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
