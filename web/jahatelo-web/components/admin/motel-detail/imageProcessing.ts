const loadImageFromFile = (file: File) =>
  new Promise<{ image: HTMLImageElement; revoke: () => void }>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => resolve({ image, revoke: () => URL.revokeObjectURL(objectUrl) });
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo leer la imagen.'));
    };
    image.src = objectUrl;
  });

const cropImageToRatio = (
  image: HTMLImageElement,
  ratio: number,
  position = { x: 50, y: 50, zoom: 1 },
  outputType = 'image/jpeg',
) =>
  new Promise<Blob>((resolve, reject) => {
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    if (!sourceWidth || !sourceHeight) {
      reject(new Error('La imagen no tiene dimensiones válidas.'));
      return;
    }

    const sourceRatio = sourceWidth / sourceHeight;
    let cropWidth = sourceWidth;
    let cropHeight = sourceHeight;
    let cropX = 0;
    let cropY = 0;

    if (sourceRatio > ratio) {
      cropWidth = Math.round(sourceHeight * ratio);
    } else if (sourceRatio < ratio) {
      cropHeight = Math.round(sourceWidth / ratio);
    }
    const zoom = Math.max(1, Math.min(2.5, position.zoom || 1));
    cropWidth = Math.round(cropWidth / zoom);
    cropHeight = Math.round(cropHeight / zoom);
    cropX = Math.round((sourceWidth - cropWidth) * (position.x / 100));
    cropY = Math.round((sourceHeight - cropHeight) * (position.y / 100));

    const canvas = document.createElement('canvas');
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      reject(new Error('No se pudo crear el canvas.'));
      return;
    }

    context.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('No se pudo procesar la imagen.'));
          return;
        }
        resolve(blob);
      },
      outputType,
      0.9,
    );
  });

export const createCroppedImageFile = async (
  file: File,
  ratio: number,
  suffix: string,
  position?: { x: number; y: number; zoom: number },
) => {
  const { image, revoke } = await loadImageFromFile(file);
  try {
    const blob = await cropImageToRatio(image, ratio, position);
    const baseName = file.name.replace(/\.[^.]+$/, '');
    return new File([blob], `${baseName}-${suffix}.jpg`, {
      type: blob.type || 'image/jpeg',
    });
  } finally {
    revoke();
  }
};
