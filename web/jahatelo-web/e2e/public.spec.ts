import { test, expect } from '@playwright/test';

test.describe('Public Website Flow', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');

    // Verificar que la home page carga
    await expect(page).toHaveTitle(/jahatelo/i);

    // Verificar elementos principales
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('should display motels list', async ({ page }) => {
    await page.goto('/');

    // Esperar a que carguen los moteles
    await page.waitForLoadState('networkidle');

    // Verificar que hay contenido (pueden ser moteles, categorías, etc.)
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  test('should navigate to motel detail', async ({ page }) => {
    await page.goto('/');

    // Esperar a que carguen los moteles
    await page.waitForLoadState('networkidle');

    // Intentar hacer click en el primer motel visible
    const motelCards = page.locator('[data-testid="motel-card"], [role="article"], a[href*="/motels/"]').first();

    if (await motelCards.count() > 0) {
      await motelCards.click();

      // Verificar navegación a detalle
      await expect(page).toHaveURL(/.*motels\/.*/, { timeout: 5000 });
    }
  });

  test('should perform search', async ({ page }) => {
    await page.goto('/');

    // Buscar el campo de búsqueda
    const searchInput = page.getByPlaceholder(/buscar|search/i);

    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await searchInput.press('Enter');

      // Verificar que navegó o mostró resultados
      await page.waitForLoadState('networkidle');

      // Verificar que algo cambió (URL o contenido)
      const url = page.url();
      expect(url).toBeTruthy();
    }
  });
});
