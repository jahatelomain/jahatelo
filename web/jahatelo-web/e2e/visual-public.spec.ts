import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.route('**/api/settings/public', (route) => route.fulfill({ json: { settings: { age_gate_enabled: false } } }));
  await page.route('**/api/mobile/cities', (route) => route.fulfill({ json: { cities: [] } }));
  await page.route('**/api/mobile/motels**', (route) => route.fulfill({ json: { data: [], meta: { total: 0 } } }));
});

test('contacto mantiene su referencia visual en escritorio', async ({ page }) => {
  await page.goto('/contacto', { waitUntil: 'networkidle' });
  await expect(page).toHaveScreenshot('contacto-desktop.png', { fullPage: true, animations: 'disabled' });
});

test('registro de motel mantiene su referencia visual móvil', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/registrar-motel', { waitUntil: 'networkidle' });
  await expect(page).toHaveScreenshot('registrar-motel-mobile.png', { fullPage: true, animations: 'disabled' });
});
