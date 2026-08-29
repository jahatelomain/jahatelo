import sharp from 'sharp';

export type MediaUsage = 'motel-logo' | 'motel-photo' | 'thumbnail' | 'room-photo' | 'promo' | 'banner';

export const MEDIA_SPECIFICATIONS: Record<MediaUsage, { label: string; minWidth: number; minHeight: number; aspectRatio: string; watermark: boolean }> = {
  'motel-logo': { label: 'Logo', minWidth: 512, minHeight: 512, aspectRatio: '1:1', watermark: false },
  'motel-photo': { label: 'Portada del motel', minWidth: 1200, minHeight: 800, aspectRatio: '16:9 web y 4:5 app', watermark: true },
  thumbnail: { label: 'Miniatura', minWidth: 800, minHeight: 600, aspectRatio: '4:3', watermark: true },
  'room-photo': { label: 'Foto de habitación', minWidth: 1200, minHeight: 800, aspectRatio: '3:2', watermark: true },
  promo: { label: 'Promoción', minWidth: 1080, minHeight: 1080, aspectRatio: '1:1', watermark: true },
  banner: { label: 'Banner', minWidth: 1600, minHeight: 600, aspectRatio: '8:3', watermark: true },
};

export async function validateMediaDimensions(input: Buffer, usage: MediaUsage) {
  const metadata = await sharp(input, { animated: false }).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;
  const spec = MEDIA_SPECIFICATIONS[usage];
  if (width < spec.minWidth || height < spec.minHeight) {
    return {
      valid: false as const,
      error: `${spec.label}: la imagen mide ${width}×${height}px. El mínimo es ${spec.minWidth}×${spec.minHeight}px (${spec.aspectRatio}).`,
    };
  }
  return { valid: true as const, width, height, specification: spec };
}
