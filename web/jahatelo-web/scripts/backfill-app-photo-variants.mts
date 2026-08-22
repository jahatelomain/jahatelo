/**
 * Genera variantes limpias para la app desde los originales locales, sin tocar
 * la variante con marca de agua que sirve la web pública.
 *
 * Uso seguro (por defecto):
 *   npx tsx scripts/backfill-app-photo-variants.mts
 *
 * Aplicación efectiva (solo después de revisar el reporte):
 *   npx tsx scripts/backfill-app-photo-variants.mts --apply
 */
import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createHash, randomBytes } from 'crypto';
import { readdir, readFile } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');
const ROOT = process.env.JAHATELO_ORIGINALS_ROOT || '/Users/jota/Desktop/AKAHATA STUDIO/media/jahatelo/originales/Moteles';
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif']);
const EXCLUDED_NAME_PARTS = ['logo', 'tarifario', 'promo', 'menu', 'precio'];
const SIZE = 64;
const CENTER_START = 19;
const CENTER_END = 45;
const MAX_DISTANCE = 28;
const MIN_MARGIN = 1.15;

type Candidate = { file: string; buffer: Buffer; fingerprint: Uint8Array };
type ExistingPhoto = { id: string; url: string; roomName: string; fingerprint: Uint8Array };
type Match = { photo: ExistingPhoto; candidate: Candidate; score: number; margin: number };

const normalize = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\b(motel|hotel|habitacion|suite|inn)\b/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const distance = (a: Uint8Array, b: Uint8Array) => {
  let total = 0;
  let count = 0;
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      // La marca de agua se ubica en el centro: se excluye para reconocer la
      // misma imagen aunque su versión pública esté protegida.
      if (x >= CENTER_START && x < CENTER_END && y >= CENTER_START && y < CENTER_END) continue;
      const offset = (y * SIZE + x) * 3;
      total += Math.abs(a[offset] - b[offset]);
      total += Math.abs(a[offset + 1] - b[offset + 1]);
      total += Math.abs(a[offset + 2] - b[offset + 2]);
      count += 3;
    }
  }
  return total / count;
};

async function fingerprint(buffer: Buffer) {
  return sharp(buffer, { animated: false })
    .rotate()
    .resize(SIZE, SIZE, { fit: 'cover', position: 'centre' })
    .removeAlpha()
    .raw()
    .toBuffer();
}

async function readCandidates(folder: string): Promise<Candidate[]> {
  const entries = await readdir(folder, { withFileTypes: true });
  const candidates: Candidate[] = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const extension = path.extname(entry.name).toLowerCase();
    const filename = normalize(entry.name);
    if (!IMAGE_EXTENSIONS.has(extension) || EXCLUDED_NAME_PARTS.some((part) => filename.includes(part))) continue;
    const file = path.join(folder, entry.name);
    try {
      const buffer = await readFile(file);
      candidates.push({ file, buffer, fingerprint: await fingerprint(buffer) });
    } catch {
      console.warn(`No se pudo leer ${file}`);
    }
  }
  return candidates;
}

function folderScore(motelName: string, folderName: string) {
  const motel = normalize(motelName);
  const folder = normalize(folderName);
  if (motel === folder || motel.includes(folder) || folder.includes(motel)) return 1;
  const motelTokens = new Set(motel.split(' ').filter(Boolean));
  const folderTokens = new Set(folder.split(' ').filter(Boolean));
  const intersection = [...motelTokens].filter((token) => folderTokens.has(token)).length;
  return intersection / Math.max(motelTokens.size, folderTokens.size, 1);
}

function getReliableMatches(photos: ExistingPhoto[], candidates: Candidate[]) {
  const matches: Match[] = [];
  const usedCandidates = new Set<string>();
  for (const photo of photos) {
    const ranked = candidates
      .filter((candidate) => !usedCandidates.has(candidate.file))
      .map((candidate) => ({ candidate, score: distance(photo.fingerprint, candidate.fingerprint) }))
      .sort((a, b) => a.score - b.score);
    const best = ranked[0];
    const second = ranked[1];
    if (!best) continue;
    const margin = second ? second.score / Math.max(best.score, 0.01) : Number.POSITIVE_INFINITY;
    if (best.score <= MAX_DISTANCE && margin >= MIN_MARGIN) {
      usedCandidates.add(best.candidate.file);
      matches.push({ photo, candidate: best.candidate, score: best.score, margin });
    }
  }
  return matches;
}

function s3Key(buffer: Buffer) {
  const date = new Date().toISOString().slice(0, 10);
  const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 16);
  return `uploads/app/${date}/${hash}-${randomBytes(4).toString('hex')}.webp`;
}

async function main() {
  const [folders, motels] = await Promise.all([
    readdir(ROOT, { withFileTypes: true }),
    prisma.motel.findMany({
      include: { rooms: { include: { roomPhotos: { orderBy: { order: 'asc' } } } } },
      orderBy: { name: 'asc' },
    }),
  ]);
  const motelFolders = folders.filter((entry) => entry.isDirectory());
  const s3 = APPLY ? new S3Client({
    region: process.env.AWS_S3_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  }) : null;

  let matched = 0;
  let matchedCovers = 0;
  let skipped = 0;
  let processedMotels = 0;
  const unresolved: string[] = [];

  for (const motel of motels) {
    const folder = motelFolders
      .map((entry) => ({ entry, score: folderScore(motel.name, entry.name) }))
      .sort((a, b) => b.score - a.score)[0];
    if (!folder || folder.score < 0.6) continue;

    const candidates = await readCandidates(path.join(ROOT, folder.entry.name));
    if (candidates.length === 0) continue;

    const existingCover = motel.featuredPhotoApp || motel.featuredPhotoWeb || motel.featuredPhoto;
    if (existingCover) {
      try {
        const response = await fetch(existingCover);
        if (!response.ok) throw new Error(String(response.status));
        const coverFingerprint = await fingerprint(Buffer.from(await response.arrayBuffer()));
        const ranked = candidates
          .map((candidate) => ({ candidate, score: distance(coverFingerprint, candidate.fingerprint) }))
          .sort((a, b) => a.score - b.score);
        const best = ranked[0];
        const second = ranked[1];
        const margin = second ? second.score / Math.max(best?.score || 0.01, 0.01) : Number.POSITIVE_INFINITY;
        if (best && best.score <= MAX_DISTANCE && margin >= MIN_MARGIN) {
          if (!APPLY) {
            console.log(`[DRY] ${motel.name} / portada ← ${path.basename(best.candidate.file)} (d=${best.score.toFixed(1)}, margen=${margin.toFixed(2)})`);
          } else {
            const clean = await sharp(best.candidate.buffer, { animated: false }).rotate().webp({ quality: 88, effort: 4 }).toBuffer();
            const key = s3Key(clean);
            await s3!.send(new PutObjectCommand({
              Bucket: process.env.AWS_S3_BUCKET!, Key: key, Body: clean, ContentType: 'image/webp',
            }));
            const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${key}`;
            await prisma.motel.update({ where: { id: motel.id }, data: { featuredPhotoApp: url } });
            console.log(`[OK] ${motel.name} / portada ← ${path.basename(best.candidate.file)}`);
          }
          matchedCovers += 1;
        }
      } catch {
        unresolved.push(`${motel.name}: no se pudo leer la portada pública`);
      }
    }

    const existing = motel.rooms.flatMap((room) => room.roomPhotos.map((photo) => ({ photo, roomName: room.name })));
    if (existing.length === 0) continue;

    const fingerprints: ExistingPhoto[] = [];
    for (const { photo, roomName } of existing) {
      if (photo.appUrl) continue;
      try {
        const response = await fetch(photo.url);
        if (!response.ok) throw new Error(String(response.status));
        fingerprints.push({ id: photo.id, url: photo.url, roomName, fingerprint: await fingerprint(Buffer.from(await response.arrayBuffer())) });
      } catch {
        unresolved.push(`${motel.name} / ${roomName}: no se pudo leer la foto pública`);
      }
    }

    const matches = getReliableMatches(fingerprints, candidates);
    if (matches.length === 0) continue;
    processedMotels += 1;
    for (const match of matches) {
      if (!APPLY) {
        console.log(`[DRY] ${motel.name} / ${match.photo.roomName} ← ${path.basename(match.candidate.file)} (d=${match.score.toFixed(1)}, margen=${match.margin.toFixed(2)})`);
        matched += 1;
        continue;
      }
      const clean = await sharp(match.candidate.buffer, { animated: false }).rotate().webp({ quality: 88, effort: 4 }).toBuffer();
      const key = s3Key(clean);
      await s3!.send(new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
        Body: clean,
        ContentType: 'image/webp',
      }));
      const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${key}`;
      await prisma.roomPhoto.update({ where: { id: match.photo.id }, data: { appUrl: url } });
      console.log(`[OK] ${motel.name} / ${match.photo.roomName} ← ${path.basename(match.candidate.file)}`);
      matched += 1;
    }
    skipped += fingerprints.length - matches.length;
  }

  console.log(JSON.stringify({ mode: APPLY ? 'apply' : 'dry-run', processedMotels, matched, matchedCovers, skipped, unresolved: unresolved.length }, null, 2));
  if (unresolved.length) console.log(unresolved.slice(0, 30).join('\n'));
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
