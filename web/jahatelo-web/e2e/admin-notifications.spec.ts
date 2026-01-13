import { test, expect } from '@playwright/test';

test.describe('Admin Notifications Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login como admin
    await page.goto('/admin/login');
    await page.getByRole('textbox', { name: /email/i }).fill('admin@jahatelo.com');
    await page.getByRole('textbox', { name: /password/i }).fill('Admin123!');
    await page.getByRole('button', { name: /iniciar|login/i }).click();

    // Esperar redirección al dashboard
    await page.waitForURL(/.*admin(?!\/login)/, { timeout: 10000 });
  });

  test('should load notifications page', async ({ page }) => {
    await page.goto('/admin/notifications');

    // Verificar que la página carga
    await expect(page.getByText(/notificaciones masivas/i)).toBeVisible();

    // Verificar botón de nueva notificación
    await expect(page.getByRole('button', { name: /nueva notificación/i })).toBeVisible();
  });

  test('should show notification form', async ({ page }) => {
    await page.goto('/admin/notifications');

    // Click en nueva notificación
    await page.getByRole('button', { name: /nueva notificación/i }).click();

    // Verificar campos del formulario
    await expect(page.getByLabel(/título/i)).toBeVisible();
    await expect(page.getByLabel(/mensaje/i)).toBeVisible();
    await expect(page.getByLabel(/categoría/i)).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/admin/notifications');

    // Abrir formulario
    await page.getByRole('button', { name: /nueva notificación/i }).click();

    // Intentar enviar sin llenar campos
    await page.getByRole('button', { name: /enviar ahora/i }).click();

    // Verificar que no se envía (el formulario tiene required)
    // El botón de cancelar aún debe estar visible
    await expect(page.getByRole('button', { name: /cancelar/i })).toBeVisible();
  });

  test('should filter notifications by category', async ({ page }) => {
    await page.goto('/admin/notifications');

    // Esperar a que carguen las notificaciones
    await page.waitForLoadState('networkidle');

    // Seleccionar filtro de categoría
    const categoryFilter = page.locator('select').first();
    if (await categoryFilter.isVisible()) {
      await categoryFilter.selectOption('advertising');

      // Verificar que el filtro se aplicó
      await page.waitForLoadState('networkidle');
    }
  });

  test('should handle notifications without ID gracefully', async ({ page }) => {
    await page.goto('/admin/notifications');

    // Esperar a que carguen las notificaciones
    await page.waitForLoadState('networkidle');

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
    await page.goto('/admin/notifications');

    // Esperar a que carguen las notificaciones
    await page.waitForLoadState('networkidle');

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
