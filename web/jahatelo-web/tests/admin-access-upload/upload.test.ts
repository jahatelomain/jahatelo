/* eslint-disable @typescript-eslint/no-require-imports -- Load after mocks without hoisting in the isolated transformer. */
export {};
jest.mock('@/lib/auth', () => ({
  getTokenFromRequest: jest.fn(), verifyToken: jest.fn(),
  hasRole: (user: { role: string }, roles: string[]) => roles.includes(user.role),
}));
jest.mock('@/lib/audit', () => ({ logAuditEvent: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/lib/prisma', () => ({ prisma: { user: { findUnique: jest.fn() } } }));
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: jest.fn().mockResolvedValue({}) })),
  PutObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
}));
jest.mock('fs/promises', () => ({ ...jest.requireActual('fs/promises'), mkdir: jest.fn(), writeFile: jest.fn() }));
const { getTokenFromRequest, verifyToken } = require('@/lib/auth');
const { prisma } = require('@/lib/prisma');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { writeFile } = require('fs/promises');
const { POST } = require('@/app/api/upload/s3/route');
let png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
function request(bytes: Uint8Array = png, type = 'image/png', name = 'photo.png') {
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(bytes)], { type }), name);
  form.append('assetType', 'motel-logo');
  return { url: 'http://localhost/api/upload/s3', method: 'POST', headers: new Headers(), formData: jest.fn().mockResolvedValue(form) } as unknown as Request;
}
beforeAll(async () => {
  png = await require('sharp')({ create: { width: 128, height: 128, channels: 3, background: '#ffffff' } }).png().toBuffer();
});
beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(process.env, { NODE_ENV: 'test' });
  process.env.AWS_ACCESS_KEY_ID = 'offline-fixture';
  process.env.AWS_SECRET_ACCESS_KEY = 'offline-fixture';
  process.env.AWS_S3_BUCKET = 'offline-fixture';
  process.env.AWS_S3_REGION = 'us-east-1';
  getTokenFromRequest.mockResolvedValue('test-token');
  verifyToken.mockResolvedValue({ id: 'admin', role: 'SUPERADMIN' });
  prisma.user.findUnique.mockResolvedValue({ role: 'MOTEL_ADMIN', motelId: 'motel', modulePermissions: [], isActive: true });
});
it.each(['missing', 'invalid', 'deleted', 'inactive', 'USER', 'module-denied'])('denies %s session before parsing or storing uploads', async (scenario) => {
  if (scenario === 'missing') getTokenFromRequest.mockResolvedValue(null);
  if (scenario === 'invalid') verifyToken.mockResolvedValue(null);
  if (scenario === 'deleted') prisma.user.findUnique.mockResolvedValue(null);
  if (scenario === 'inactive') prisma.user.findUnique.mockResolvedValue({ role: 'SUPERADMIN', isActive: false });
  if (scenario === 'USER') prisma.user.findUnique.mockResolvedValue({ role: 'USER', isActive: true, modulePermissions: ['motels'] });
  if (scenario === 'module-denied') prisma.user.findUnique.mockResolvedValue({ role: 'MOTEL_ADMIN', isActive: true, modulePermissions: ['dashboard'] });
  const req = request();
  const result = await POST(req);
  expect(result.status).toBe(scenario === 'missing' ? 401 : 403);
  expect(req.formData).not.toHaveBeenCalled();
  expect(S3Client).not.toHaveBeenCalled();
  expect(writeFile).not.toHaveBeenCalled();
});
it.each(['text/html', 'image/svg+xml', 'application/octet-stream', 'image/avif', 'image/gif'])('rejects unsupported MIME %s', async (type) => {
  expect((await POST(request(png, type))).status).toBe(400);
  expect(PutObjectCommand).not.toHaveBeenCalled();
  expect(writeFile).not.toHaveBeenCalled();
});
it.each(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])('rejects disguised HTML for %s', async (type) => {
  expect((await POST(request(Buffer.from('<script>alert(1)</script>'), type))).status).toBe(400);
  expect(PutObjectCommand).not.toHaveBeenCalled();
});
it.each([Buffer.alloc(0), png.subarray(0, 8)])('rejects empty or signature-only image', async (bytes) => {
  expect((await POST(request(bytes))).status).toBe(400);
  expect(PutObjectCommand).not.toHaveBeenCalled();
});
it('fails closed when storage configuration is absent outside development', async () => {
  delete process.env.AWS_S3_BUCKET;
  const req = request();
  expect((await POST(req)).status).toBe(503);
  expect(S3Client).not.toHaveBeenCalled();
  expect(req.formData).not.toHaveBeenCalled();
});
it('rejects content that disagrees with its MIME', async () => {
  expect((await POST(request(png, 'image/jpeg'))).status).toBe(400);
});
it('keeps the current 4MB size limit', async () => {
  expect((await POST(request(Buffer.alloc(4 * 1024 * 1024 + 1)))).status).toBe(400);
  expect(PutObjectCommand).not.toHaveBeenCalled();
});
it.each(['jpeg', 'png', 'webp'])('stores decoded %s as WebP with a server-selected extension', async (format) => {
  const bytes = await require('sharp')(png).toFormat(format).toBuffer();
  const result = await POST(request(bytes, `image/${format}`, '../../photo.html'));
  expect(result.status).toBe(200);
  const input = PutObjectCommand.mock.calls[0][0];
  expect(input.Key).toMatch(/^uploads\/logos\/\d{4}-\d{2}-\d{2}\/[a-f0-9]{16}\.webp$/);
  expect(input.ContentType).toBe('image/webp');
  expect((await require('sharp')(input.Body).metadata()).format).toBe('webp');
});
it.each(['MOTEL_ADMIN', 'SUPERADMIN'])('allows active %s motel image uploads', async (role) => {
  prisma.user.findUnique.mockResolvedValue({ role, motelId: 'motel', isActive: true, modulePermissions: [] });
  expect((await POST(request())).status).toBe(200);
  expect(PutObjectCommand).toHaveBeenCalled();
});
