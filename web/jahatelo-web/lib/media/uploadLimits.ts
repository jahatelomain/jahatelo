export const MAX_IMAGE_UPLOAD_BYTES = 4 * 1024 * 1024;
export const MAX_IMAGE_UPLOAD_LABEL = '4 MB';

export const exceedsImageUploadLimit = (file: Blob) =>
  file.size > MAX_IMAGE_UPLOAD_BYTES;

export const imageUploadLimitMessage = `La imagen no puede superar ${MAX_IMAGE_UPLOAD_LABEL}.`;
