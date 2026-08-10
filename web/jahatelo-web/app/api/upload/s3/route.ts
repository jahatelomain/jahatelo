import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import { UploadFormSchema } from '@/lib/validations/schemas';
import { z } from 'zod';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { requireAdminAccess } from '@/lib/adminAccess';
import { WATERMARKED_IMAGE_CONTENT_TYPE, WATERMARKED_IMAGE_EXTENSION, watermarkUploadedImage } from '@/lib/media/watermark';
import { MAX_IMAGE_UPLOAD_BYTES, MAX_IMAGE_UPLOAD_LABEL } from '@/lib/media/uploadLimits';

export const runtime = 'nodejs';

function createObjectKey() {
  const unique = crypto.randomBytes(8).toString('hex');
  const datePrefix = new Date().toISOString().split('T')[0];
  return `uploads/${datePrefix}/${unique}.${WATERMARKED_IMAGE_EXTENSION}`;
}

export async function POST(request: Request) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels');
    if (access.error) return access.error;

    const isDev = process.env.NODE_ENV === 'development';

    // Validate AWS env vars
    const requiredEnv = [
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'AWS_S3_BUCKET',
      'AWS_S3_REGION',
    ];

    const missing = requiredEnv.filter((key) => !process.env[key]);
    const forceLocal = process.env.UPLOADS_USE_LOCAL === '1';
    const useLocalFallback = isDev && (forceLocal || missing.length > 0);
    const s3 = useLocalFallback
      ? null
      : new S3Client({
          region: process.env.AWS_S3_REGION!,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          },
        });

    const formData = await request.formData();
    const file = formData.get('file');
    UploadFormSchema.parse({});
    if (!(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 },
      );
    }

    // Validate file size before processing or storing it.
    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: `La imagen no puede superar ${MAX_IMAGE_UPLOAD_LABEL}.` },
        { status: 400 },
      );
    }

    const buffer = await watermarkUploadedImage(Buffer.from(await file.arrayBuffer()), file.type);
    const key = createObjectKey();

    if (useLocalFallback) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', path.dirname(key).replace(/^uploads\//, ''));
      await mkdir(uploadDir, { recursive: true });
      const filename = path.basename(key);
      const targetPath = path.join(uploadDir, filename);
      await writeFile(targetPath, buffer);
      const relativeDir = path.dirname(key).replace(/^uploads\//, '');
      const url = `/uploads/${relativeDir}/${filename}`;
      return NextResponse.json({ url });
    }

    if (!s3) {
      return NextResponse.json(
        { error: `Missing AWS config: ${missing.join(', ')}` },
        { status: 500 },
      );
    }

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
        Body: buffer,
        ContentType: WATERMARKED_IMAGE_CONTENT_TYPE,
      }),
    );

    const url = `https://${process.env.AWS_S3_BUCKET!}.s3.${process.env.AWS_S3_REGION!}.amazonaws.com/${key}`;
    return NextResponse.json({ url });
  } catch (error) {
    console.error('[S3_UPLOAD_ERROR]', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 },
    );
  }
}
