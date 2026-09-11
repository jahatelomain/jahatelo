jest.mock('@/lib/prisma', () => ({ prisma: { user: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() }, userNotificationPreferences: { create: jest.fn() } } }));
jest.mock('@/lib/auth', () => ({ createToken: jest.fn(async () => 'session-token') }));
jest.mock('@/lib/logger', () => ({ __esModule: true, default: { error: jest.fn() } }));
jest.mock('next/headers', () => ({ cookies: async () => ({ set: mockSetCookie }) }));
import { POST as web } from '@/app/api/auth/google/callback/route';
import { POST as mobile } from '@/app/api/mobile/auth/login/route';
import { prisma } from '@/lib/prisma';
import { createToken } from '@/lib/auth';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import { clientHarness } from './clientHarness';
import type { NextRequest } from 'next/server';
const mockSetCookie = jest.fn();

test('web SDK credential reaches real route and signature verifier', async () => {
 const idToken = await signed();
 const harness = clientHarness({});
 const done = jest.fn();
 const error = jest.fn();
 const jwksFetch = global.fetch;
 global.fetch = jest.fn(async (url, options) => {
  if (String(url).includes('googleapis.com/oauth2/v3/certs')) return jwksFetch(url, options);
  expect(url).toBe('/api/auth/google/callback');
  const body = JSON.parse(String(options?.body));
  expect(body).toEqual({ provider: 'google', idToken });
  return web(request(body));
 });
 const tree = harness.web().default({ onSuccess: done, onError: error });
 type Element = { type: string; props: { children?: Element | Element[]; onSuccess: (value: { credential: string }) => Promise<void> } };
 const find = (node: Element): Element | undefined => node?.type === 'GoogleLogin' ? node : (Array.isArray(node?.props?.children) ? node.props.children : [node?.props?.children]).filter((child): child is Element => !!child).map(find).find(Boolean);
 const button = find(tree);
 expect(button).toBeDefined();
 await button!.props.onSuccess({ credential: idToken });
 expect(error).not.toHaveBeenCalled();
 expect(done).toHaveBeenCalledWith(expect.objectContaining({ id: victim.id }));
 expect(mockSetCookie).toHaveBeenCalledWith('auth_token', 'session-token', expect.objectContaining({ httpOnly: true, sameSite: 'lax' }));
});

test.each(['native', 'web'])('app %s SDK response crosses screen, context, API and real verifier', async (platform) => {
 const idToken = await signed({ aud: platform === 'native' ? 'ios-client' : 'web-client' });
 const harness = clientHarness(platform === 'native' ? { type: 'success', authentication: { idToken } } : { type: 'success', params: { id_token: idToken } });
 harness.native.Platform.OS = platform === 'native' ? 'ios' : 'web';
 const jwksFetch = global.fetch;
 const requests: object[] = [];
 global.fetch = jest.fn(async (url, options) => {
  if (String(url).includes('googleapis.com/oauth2/v3/certs')) return jwksFetch(url, options);
  expect(url).toBe('https://local.test/api/mobile/auth/login');
  const body = JSON.parse(String(options?.body)); requests.push(body);
  return mobile(request(body));
 });
 harness.mobile();
 harness.effects.forEach(effect => effect());
 for (let i = 0; i < 30 && !harness.stored.has('@jahatelo_auth_token'); i++) await new Promise(resolve => setTimeout(resolve, 5));
 expect(requests).toEqual([{ provider: 'google', idToken }]);
 expect(harness.stored.get('@jahatelo_auth_token')).toBe('session-token');
 expect(harness.config().webClientId).toBe('web-client');
 expect(harness.config().idTokenHook).toBe(true);
});
let signingKey: CryptoKey;
let jwks: object;
beforeAll(async () => {
 const pair = await generateKeyPair('RS256'); signingKey = pair.privateKey;
 jwks = { keys: [{ ...await exportJWK(pair.publicKey), kid: 'test-google', alg: 'RS256', use: 'sig' }] };
});
const signed = (overrides: Record<string, unknown> = {}) => new SignJWT({
 iss: 'https://accounts.google.com', aud: 'web-client', sub: 'victim-sub',
 exp: Math.floor(Date.now() / 1000) + 300, email: 'victim@example.test', email_verified: true, name: 'Verified', ...overrides,
}).setProtectedHeader({ alg: 'RS256', kid: 'test-google' }).sign(signingKey);

const victim = { id: 'victim', email: 'victim@example.test', role: 'USER', provider: 'google', providerId: 'victim-sub', isActive: true, isEmailVerified: true, notificationPreferences: {} };
const request = (body: object) => ({ json: async () => body }) as unknown as NextRequest;
beforeEach(() => { jest.clearAllMocks(); (prisma.user.findFirst as jest.Mock).mockResolvedValue(victim); process.env.GOOGLE_CLIENT_ID = 'web-client'; process.env.GOOGLE_MOBILE_CLIENT_IDS = 'ios-client,android-client'; global.fetch = jest.fn(async (url) => { if (String(url) !== 'https://www.googleapis.com/oauth2/v3/certs') throw new Error('Unexpected network'); return new Response(JSON.stringify(jwks), { status: 200, headers: { 'Content-Type': 'application/json' } }); }); });
test('mobile links existing email account instead of attempting duplicate creation', async () => {
 (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
 (prisma.user.findUnique as jest.Mock).mockResolvedValue({ ...victim, provider: 'email', providerId: null });
 (prisma.user.update as jest.Mock).mockResolvedValue(victim);
 const response = await mobile(request({ provider: 'google', idToken: await signed() }));
 expect(response.status).toBe(200);
 expect(prisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { email: victim.email } }));
 expect(prisma.user.create).not.toHaveBeenCalled();
 expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ provider: 'google', providerId: 'victim-sub', isEmailVerified: true }) }));
});

for (const [label, route] of [['web', web], ['mobile', mobile]] as const) {
 test.each([{ aud: 'untrusted' }, { iss: 'https://evil.test' }, { exp: 1 }, { exp: undefined }, { sub: undefined }, { nbf: Math.floor(Date.now() / 1000) + 300 }])(`${label}: rejects invalid registered claim %j`, async (claims) => {
  expect((await route(request({ provider: 'google', idToken: await signed(claims) }))).status).toBe(401);
  expect(prisma.user.findFirst).not.toHaveBeenCalled();
 });
 test(`${label}: rejects a valid-looking JWT signed by an attacker`, async () => {
  const pair = await generateKeyPair('RS256');
  const token = await new SignJWT({ email: victim.email, email_verified: true }).setSubject('victim-sub').setIssuer('https://accounts.google.com').setAudience('web-client').setExpirationTime('5m').setProtectedHeader({ alg: 'RS256', kid: 'test-google' }).sign(pair.privateKey);
  expect((await route(request({ provider: 'google', idToken: token }))).status).toBe(401);
  expect(createToken).not.toHaveBeenCalled();
 });
 test(`${label}: fails closed without audience configuration`, async () => {
  delete process.env.GOOGLE_CLIENT_ID; delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID; delete process.env.GOOGLE_MOBILE_CLIENT_IDS;
  expect((await route(request({ provider: 'google', idToken: await signed() }))).status).toBe(401);
  expect(prisma.user.findFirst).not.toHaveBeenCalled();
 });
 test(`${label}: uses signed identity, not forged profile fields`, async () => {
  expect((await route(request({ provider: 'google', idToken: await signed(), providerId: 'attacker', email: 'attacker@example.test', name: 'attacker' }))).status).toBe(200);
  expect(JSON.stringify((prisma.user.findFirst as jest.Mock).mock.calls)).not.toContain('attacker');
 });
 test(`${label}: rejects an existing Google account with another subject`, async () => {
  (prisma.user.findFirst as jest.Mock).mockResolvedValue({ ...victim, providerId: 'other-sub' });
  const response = await route(request({ provider: 'google', idToken: await signed() }));
  expect(response.status).toBe(409);
  expect(createToken).not.toHaveBeenCalled();
  expect(prisma.user.update).not.toHaveBeenCalled();
 });
 test(`${label}: does not mutate inactive accounts`, async () => {
  (prisma.user.findFirst as jest.Mock).mockResolvedValue({ ...victim, provider: 'email', providerId: null, isActive: false });
  const response = await route(request({ provider: 'google', idToken: await signed(), pushToken: 'device' }));
  expect(response.status).toBe(403);
  expect(prisma.user.update).not.toHaveBeenCalled();
  expect(createToken).not.toHaveBeenCalled();
 });
 test.each([{ sub: '' }, { sub: ' ' }, { email: '' }, { email: 42 }, { email: 'not-email' }])(`${label}: rejects malformed identity %j`, async (claims) => {
  const response = await route(request({ provider: 'google', idToken: await signed(claims) }));
  expect(response.status).toBe(401);
  expect(prisma.user.findFirst).not.toHaveBeenCalled();
 });
 test.each([false, 'true', undefined])(`${label}: rejects unverified email (%s)`, async (email_verified) => {
  const response = await route(request({ provider: 'google', idToken: await signed({ email_verified }) }));
  expect(response.status).toBe(401);
  expect(prisma.user.findFirst).not.toHaveBeenCalled();
  expect(createToken).not.toHaveBeenCalled();
 });
 test(`${label}: rejects an unsigned invented token before DB`, async () => {
  process.env.GOOGLE_CLIENT_ID = 'web-client';
  const response = await route(request({ provider: 'google', idToken: 'invented.jwt.token', providerId: 'victim-sub', email: victim.email }));
  expect(response.status).toBe(401);
  expect(prisma.user.findFirst).not.toHaveBeenCalled();
  expect(createToken).not.toHaveBeenCalled();
 });
 test(`${label}: rejects forged client identity before DB or session`, async () => {
  const response = await route(request({ provider: 'google', providerId: 'victim-sub', email: victim.email, name: 'Fake' }));
  expect(response.status).toBe(401);
  expect(prisma.user.findFirst).not.toHaveBeenCalled();
  expect(createToken).not.toHaveBeenCalled();
  expect(mockSetCookie).not.toHaveBeenCalled();
 });
}
