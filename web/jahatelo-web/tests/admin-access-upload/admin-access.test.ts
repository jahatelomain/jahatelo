/* eslint-disable @typescript-eslint/no-require-imports -- Load after mocks without hoisting in the isolated transformer. */
jest.mock('@/lib/auth', () => ({
  getTokenFromRequest: jest.fn(), verifyToken: jest.fn(),
  hasRole: (user: { role: string }, roles: string[]) => roles.includes(user.role),
}));
jest.mock('@/lib/audit', () => ({ logAuditEvent: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/lib/prisma', () => ({ prisma: { user: { findUnique: jest.fn() } } }));
const { getTokenFromRequest, verifyToken } = require('@/lib/auth');
const { prisma } = require('@/lib/prisma');
const { requireAdminAccess } = require('@/lib/adminAccess');
export {};
const request = new Request('http://localhost/api/admin/motels');
const claims = { id: 'admin', role: 'MOTEL_ADMIN', motelId: 'old-motel', modulePermissions: ['motels'] };
beforeEach(() => {
  jest.clearAllMocks();
  getTokenFromRequest.mockResolvedValue('test-token');
  verifyToken.mockResolvedValue(claims);
  prisma.user.findUnique.mockResolvedValue({ role: 'MOTEL_ADMIN', motelId: 'current-motel', modulePermissions: [], isActive: true });
});
it('does not revive a removed motel assignment from JWT claims', async () => {
  prisma.user.findUnique.mockResolvedValue({ role: 'MOTEL_ADMIN', motelId: null, modulePermissions: [], isActive: true });
  const result = await requireAdminAccess(request, ['MOTEL_ADMIN'], 'motels');
  expect(result.user?.motelId).toBeUndefined();
  expect(result.user?.modulePermissions).toEqual([]);
});
it('does not revive permissions from JWT when database permissions are absent', async () => {
  prisma.user.findUnique.mockResolvedValue({ role: 'MOTEL_ADMIN', motelId: null, modulePermissions: null, isActive: true });
  verifyToken.mockResolvedValue({ ...claims, modulePermissions: ['banners'] });
  const result = await requireAdminAccess(request, ['MOTEL_ADMIN'], 'banners');
  expect(result.error?.status).toBe(403);
});
it.each([null, { role: 'MOTEL_ADMIN', motelId: 'current-motel', modulePermissions: [], isActive: false }])('rejects removed or inactive administrator: %p', async (record) => {
  prisma.user.findUnique.mockResolvedValue(record);
  const result = await requireAdminAccess(request, ['MOTEL_ADMIN'], 'motels');
  expect(result.error?.status).toBe(403);
  expect(result.user).toBeUndefined();
});
