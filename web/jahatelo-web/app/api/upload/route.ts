import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import { UploadFormSchema } from '@/lib/validations/schemas';
import { z } from 'zod';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

function createObjectKey(filename?: string | null, folder?: string) {
  const ext = filename?.includes('.') ? filename.split('.').pop() : undefined;
  const unique = crypto.randomBytes(8).toString('hex');
  const datePrefix = new Date().toISOString().split('T')[0];
  const folderPath = folder ? `${folder}/` : '';
  return `uploads/${folderPath}${datePrefix}/${unique}${ext ? `.${ext}` : ''}`;
}

export async function POST(request: Request) {
  try {
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
    const folder = formData.get('folder');
    const validated = UploadFormSchema.parse({
      folder: typeof folder === 'string' ? folder : undefined,
    });

    if (!(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 },
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = createObjectKey(
      typeof file.name === 'string' ? file.name : undefined,
      validated.folder ?? undefined,
    );

    // Fallback local: guarda en public/uploads/... y devuelve URL relativa
    if (useLocalFallback) {
      const uploadDir = path.join(
        process.cwd(),
        'public',
        'uploads',
        path.dirname(key).replace(/^uploads\//, ''),
      );
      await mkdir(uploadDir, { recursive: true });
      const filename = path.basename(key);
      await writeFile(path.join(uploadDir, filename), buffer);
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
        ContentType: file.type || 'application/octet-stream',
      }),
    );

    const url = `https://${process.env.AWS_S3_BUCKET!}.s3.${process.env.AWS_S3_REGION!}.amazonaws.com/${key}`;
    return NextResponse.json({ url });
  } catch (error) {
    console.error('[UPLOAD_ERROR]', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 },
    );
  }
}
