jest.mock('@/lib/audit', () => ({ logAuditEvent: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/lib/prisma', () => ({ prisma: { user: { findUnique: jest.fn() } } }));
import { SignJWT } from 'jose';
import { createToken, verifyToken } from '@/lib/auth';
import { requireAdminAccess } from '@/lib/adminAccess';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

const secret = 'offline-test-signing-key-at-least-32-bytes';
const user = { id: 'admin', email: 'admin@example.test', role: 'SUPERADMIN' as const };
beforeEach(() => { jest.clearAllMocks(); process.env.JWT_SECRET = secret; });

test('session signing and verification fail closed without JWT_SECRET', async () => {
 delete process.env.JWT_SECRET;
 const forged = await new SignJWT(user).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('5m').sign(new TextEncoder().encode('your-secret-key-change-in-production'));
 expect(await verifyToken(forged)).toBeNull();
 await expect(createToken(user)).rejects.toThrow();
});

test.each(['cookie', 'bearer'])('real %s session resolves current admin state, never stale JWT role', async (source) => {
 const token = await createToken(user);
 const request = new NextRequest('http://local.test/api/upload/s3', { headers: source === 'cookie' ? { cookie: `auth_token=${token}` } : { authorization: `Bearer ${token}` } });
 (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: 'USER', isActive: true, modulePermissions: [] });
 expect((await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels')).error?.status).toBe(403);
 (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: 'SUPERADMIN', isActive: true, modulePermissions: [] });
 expect((await requireAdminAccess(request, ['SUPERADMIN'], 'motels')).user?.id).toBe('admin');
});
