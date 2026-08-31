import sharp from 'sharp';

export type MediaUsage = 'motel-logo' | 'motel-photo' | 'thumbnail' | 'room-photo' | 'promo' | 'banner';

type MediaSpecification = {
  label: string;
  minWidth: number;
  minHeight: number;
  aspectRatio: string;
  watermark: boolean;
  dimensionsAreRecommendation?: boolean;
};

export const MEDIA_SPECIFICATIONS: Record<MediaUsage, MediaSpecification> = {
  'motel-logo': { label: 'Logo', minWidth: 512, minHeight: 512, aspectRatio: '1:1', watermark: false },
  // El editor genera y optimiza las variantes finales. Para la portada estas
  // dimensiones son una recomendación y nunca bloquean la carga.
  'motel-photo': { label: 'Portada del motel', minWidth: 1200, minHeight: 800, aspectRatio: '16:9 web y 4:5 app', watermark: true, dimensionsAreRecommendation: true },
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
    if (spec.dimensionsAreRecommendation) {
      return {
        valid: true as const,
        width,
        height,
        specification: spec,
        warning: `${spec.label}: la imagen mide ${width}×${height}px. Se aceptó y será ajustada automáticamente; para máxima calidad se recomienda ${spec.minWidth}×${spec.minHeight}px.`,
      };
    }
    return {
      valid: false as const,
      error: `${spec.label}: la imagen mide ${width}×${height}px. El mínimo es ${spec.minWidth}×${spec.minHeight}px (${spec.aspectRatio}).`,
    };
  }
  return { valid: true as const, width, height, specification: spec };
}
