import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

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
    // Validate AWS env vars
    const requiredEnv = [
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'AWS_S3_BUCKET',
      'AWS_S3_REGION',
    ];

    const missing = requiredEnv.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing AWS config: ${missing.join(', ')}` },
        { status: 500 },
      );
    }

    // Initialize S3 client
    const s3 = new S3Client({
      region: process.env.AWS_S3_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const formData = await request.formData();
    const file = formData.get('file');
    const folder = formData.get('folder');

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
      typeof folder === 'string' ? folder : undefined,
    );

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
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 },
    );
  }
}
