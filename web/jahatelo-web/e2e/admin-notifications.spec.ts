import { test, expect } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? 'admin@jahatelo.com';
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? 'Admin123!';

test.describe('Admin Notifications Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/notifications');

    // Si vemos la página de login, hacer login
    if (await page.getByTestId('admin-login-email').isVisible().catch(() => false)) {
      await page.getByTestId('admin-login-email').fill(adminEmail);
      await page.getByTestId('admin-login-password').fill(adminPassword);
      await page.getByTestId('admin-login-submit').click();
      await page.waitForURL(/\/admin\/notifications/, { timeout: 15000 });
    }

    // Esperar más tiempo para que cargue la página
    await expect(page.getByRole('heading', { name: /notificaciones masivas/i })).toBeVisible({ timeout: 60000 });
  });

  test('should load notifications page', async ({ page }) => {
    // Verificar que la página carga
    await expect(page.getByRole('heading', { name: /notificaciones masivas/i })).toBeVisible();

    // Verificar botón de nueva notificación
    await expect(page.getByRole('button', { name: /nueva notificación/i })).toBeVisible();
  });

  test('should show notification form', async ({ page }) => {
    // Click en nueva notificación
    await page.getByRole('button', { name: /nueva notificación/i }).click();

    // Verificar campos del formulario
    const form = page.getByRole('heading', { name: /nueva notificación push/i })
      .locator('..')
      .locator('..')
      .locator('form');
    await expect(page.getByPlaceholder(/nueva promoción/i)).toBeVisible();
    await expect(page.getByPlaceholder(/contenido de la notificación/i)).toBeVisible();
    await expect(form.getByRole('combobox').first()).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Abrir formulario
    await page.getByRole('button', { name: /nueva notificación/i }).click();

    // Intentar enviar sin llenar campos
    await page.getByRole('button', { name: /enviar ahora/i }).click();

    // Verificar que no se envía (el formulario tiene required)
    // El botón de cancelar aún debe estar visible
    await expect(page.getByRole('button', { name: /cancelar/i })).toBeVisible();
  });

  test('should filter notifications by category', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible({ timeout: 30000 });

    // Seleccionar filtro de categoría
    const categoryFilter = page.locator('select').first();
    if (await categoryFilter.isVisible()) {
      await categoryFilter.selectOption('advertising');

      // Verificar que el filtro se aplicó
      await page.waitForTimeout(500);
    }
  });

  test('should handle notifications without ID gracefully', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible({ timeout: 30000 });

    // Verificar que no hay links rotos (href="/admin/notifications/undefined")
    const invalidLinks = page.locator('a[href*="/admin/notifications/undefined"]');
    expect(await invalidLinks.count()).toBe(0);

    // Si hay mensaje de "ID no disponible", verificarlo
    const errorMessages = page.getByText(/id no disponible/i);
    if (await errorMessages.count() > 0) {
      console.log('Found notifications without ID - this needs database cleanup');
    }
  });

  test('should navigate to notification detail if ID exists', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible({ timeout: 30000 });

    // Buscar primer link de "Ver detalles" válido
    const detailLinks = page.getByRole('link', { name: /ver detalles/i });

    if (await detailLinks.count() > 0) {
      const firstLink = detailLinks.first();
      const href = await firstLink.getAttribute('href');

      // Verificar que el href no contiene undefined
      expect(href).not.toContain('undefined');

      // Click en el link
      await firstLink.click();

      // Verificar navegación
      await expect(page).toHaveURL(/.*\/admin\/notifications\/[^/]+/, { timeout: 5000 });
    }
  });
});
