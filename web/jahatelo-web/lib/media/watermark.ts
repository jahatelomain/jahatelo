import { readFile } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const SUPPORTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

let logoDataUriPromise: Promise<string> | null = null;

async function getLogoDataUri() {
  if (!logoDataUriPromise) {
    logoDataUriPromise = readFile(path.join(process.cwd(), 'public', 'logo-icon.png'))
      .then((logo) => `data:image/png;base64,${logo.toString('base64')}`);
  }
  return logoDataUriPromise;
}

/**
 * Inserta la marca dentro del archivo final. La imagen servida por S3 queda
 * protegida también al descargarse o capturarse, sin depender de la interfaz.
 */
export async function watermarkUploadedImage(input: Buffer, mimeType: string) {
  if (!SUPPORTED_IMAGE_TYPES.has(mimeType.toLowerCase())) {
    throw new Error('Solo se permiten fotos JPG, PNG, WebP o HEIC.');
  }

  const source = sharp(input, { animated: false }).rotate();
  const metadata = await source.metadata();
  const width = metadata.width;
  const height = metadata.height;
  if (!width || !height) throw new Error('No se pudo leer la foto cargada.');

  const watermarkSize = Math.max(96, Math.min(300, Math.round(Math.min(width, height) * 0.3)));
  const logoDataUri = await getLogoDataUri();
  const watermark = Buffer.from(
    `<svg width="${watermarkSize}" height="${watermarkSize}" viewBox="0 0 ${watermarkSize} ${watermarkSize}" xmlns="http://www.w3.org/2000/svg">
      <image href="${logoDataUri}" width="${watermarkSize}" height="${watermarkSize}" opacity="0.26"/>
    </svg>`,
  );

  return source
    .composite([{ input: watermark, gravity: 'centre' }])
    .webp({ quality: 88, effort: 4 })
    .toBuffer();
}

/**
 * Variante limpia optimizada para las apps nativas. No se usa en la web
 * pública, donde se conserva la variante marcada.
 */
export async function optimizeImageForApp(input: Buffer, mimeType: string) {
  if (!SUPPORTED_IMAGE_TYPES.has(mimeType.toLowerCase())) {
    throw new Error('Solo se permiten fotos JPG, PNG, WebP o HEIC.');
  }

  return sharp(input, { animated: false })
    .rotate()
    .webp({ quality: 88, effort: 4 })
    .toBuffer();
}

export const WATERMARKED_IMAGE_CONTENT_TYPE = 'image/webp';
export const WATERMARKED_IMAGE_EXTENSION = 'webp';
