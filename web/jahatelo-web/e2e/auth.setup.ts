import { test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? 'admin@jahatelo.com';
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? 'Admin123!';

test('authenticate admin', async ({ page, context }) => {
  await page.goto('/admin/login', { waitUntil: 'domcontentloaded' });
  await page.getByTestId('admin-login-email').fill(adminEmail);
  await page.getByTestId('admin-login-password').fill(adminPassword);

  const loginResponsePromise = page.waitForResponse((response) =>
    response.url().includes('/api/auth/login')
  );
  await page.getByTestId('admin-login-submit').click();
  const loginResponse = await loginResponsePromise;

  if (!loginResponse.ok()) {
    const body = await loginResponse.text();
    throw new Error(`Admin login failed: ${loginResponse.status()} ${body}`);
  }

  await page.waitForURL(/\/admin(\/|$)/, { timeout: 15000 });

  const loginError = page.getByTestId('admin-login-error');
  if (await loginError.isVisible().catch(() => false)) {
    const message = await loginError.textContent();
    throw new Error(`Admin login failed: ${message || 'unknown error'}`);
  }

  const cookies = await context.cookies();
  const hasAuthCookie = cookies.some((cookie) => cookie.name === 'auth_token');
  if (!hasAuthCookie) {
    throw new Error('Admin login failed: auth_token cookie not set');
  }

  const storageStatePath = path.resolve(__dirname, '.auth', 'admin.json');
  await mkdir(path.dirname(storageStatePath), { recursive: true });
  await context.storageState({ path: storageStatePath });
});
