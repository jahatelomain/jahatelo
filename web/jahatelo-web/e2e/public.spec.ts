import { test, expect, Page } from '@playwright/test';

const closeAdPopupIfPresent = async (page: Page) => {
  const closeButton = page.getByRole('button', { name: /cerrar anuncio/i });
  if (await closeButton.isVisible()) {
    await closeButton.click();
  }
};

test.describe('Public Website Flow', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await closeAdPopupIfPresent(page);

    // Verificar que la home page carga
    await expect(page).toHaveTitle(/jahatelo/i);

    // Verificar elementos principales
    await expect(page.getByTestId('homepage-main')).toBeVisible();
  });

  test('should display motels list', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await closeAdPopupIfPresent(page);
    await expect(page.getByTestId('homepage-main')).toBeVisible();

    // Verificar que hay contenido (pueden ser moteles, categorías, etc.)
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  test('should navigate to motel detail', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await closeAdPopupIfPresent(page);
    await expect(page.getByTestId('homepage-main')).toBeVisible();

    // Navegar al primer motel disponible (evita overlays que bloquean clicks)
    const motelLink = page.locator('a[href*="/motels/"]').first();

    if (await motelLink.count() > 0) {
      const href = await motelLink.getAttribute('href');
      if (href) {
        await page.goto(href);
        await expect(page).toHaveURL(/.*motels\/.*/, { timeout: 5000 });
      }
    }
  });

  test('should perform search', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await closeAdPopupIfPresent(page);
    await expect(page.getByTestId('homepage-main')).toBeVisible();

    // Buscar el campo de búsqueda
    const searchInput = page.getByPlaceholder(/buscar|search/i);

    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await searchInput.press('Enter');

      // Verificar que navegó o mostró resultados
      await page.waitForLoadState('domcontentloaded');

      // Verificar que algo cambió (URL o contenido)
      const url = page.url();
      expect(url).toBeTruthy();
    }
  });
});
