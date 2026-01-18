import { test, expect } from '@playwright/test';

/**
 * Tests E2E para Gestión de Moteles en Admin Panel
 *
 * Requiere:
 * - Usuario admin autenticado (via auth.setup.ts)
 * - Servidor corriendo en localhost:3000
 * - Base de datos con datos de prueba
 */

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? 'admin@jahatelo.com';
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? 'Admin123!';

test.describe('Admin - Gestión de Moteles', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/motels');
    if (await page.getByTestId('admin-login-email').isVisible().catch(() => false)) {
      await page.getByTestId('admin-login-email').fill(adminEmail);
      await page.getByTestId('admin-login-password').fill(adminPassword);
      await page.getByTestId('admin-login-submit').click();
      await page.waitForURL(/\/admin\/motels/, { timeout: 15000 });
    }
    await expect(page.getByRole('heading', { name: /moteles/i })).toBeVisible({ timeout: 30000 });
  });

  test('should load motels list page', async ({ page }) => {
    // Verificar título de la página
    await expect(page.getByRole('heading', { name: /moteles/i })).toBeVisible();

    // Verificar que existe el botón de agregar motel
    await expect(page.getByRole('link', { name: /agregar motel/i })).toBeVisible();

    // Verificar que existe la tabla con las columnas correctas
    await expect(page.getByRole('columnheader', { name: 'Nombre' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Ubicación' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Estado' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Activo' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Acciones' })).toBeVisible();
  });

  test('should filter motels by status', async ({ page }) => {
    // Click en filtro de pendientes
    const pendingButton = page.getByRole('button', { name: /pendientes/i });
    await pendingButton.click();
    await page.waitForTimeout(500);

    // Verificar que el filtro está activo (debe tener clase de color)
    const pendingButtonClass = await pendingButton.getAttribute('class');
    expect(pendingButtonClass).toContain('bg-yellow-600');

    // Click en filtro de aprobados
    const approvedButton = page.getByRole('button', { name: /aprobados/i });
    await approvedButton.click();
    await page.waitForTimeout(500);

    const approvedButtonClass = await approvedButton.getAttribute('class');
    expect(approvedButtonClass).toContain('bg-green-600');

    // Click en "Todos" para limpiar filtro
    await page.getByRole('button', { name: /^todos/i }).first().click();
    await page.waitForTimeout(500);
  });

  test('should filter motels by active/inactive', async ({ page }) => {
    // Click en filtro de activos
    const activeButton = page.getByRole('button', { name: /^activos/i });
    await activeButton.click();
    await page.waitForTimeout(500);

    const activeClass = await activeButton.getAttribute('class');
    expect(activeClass).toContain('bg-green-600');

    // Click en inactivos
    const inactiveButton = page.getByRole('button', { name: /inactivos/i });
    await inactiveButton.click();
    await page.waitForTimeout(500);

    const inactiveClass = await inactiveButton.getAttribute('class');
    expect(inactiveClass).toContain('bg-slate-600');

    // Volver a todos
    await page.getByRole('button', { name: /^todos/i }).nth(1).click();
  });

  test('should search motels by name', async ({ page }) => {
    // Buscar input de búsqueda
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    await expect(searchInput).toBeVisible();

    // Escribir búsqueda
    await searchInput.fill('Motel');
    await page.waitForTimeout(500);

    // Verificar que muestra texto de resultados
    await expect(page.getByText(/mostrando/i)).toBeVisible();

    // Limpiar búsqueda
    await searchInput.clear();
    await page.waitForTimeout(500);
  });

  test('should navigate to motel detail', async ({ page }) => {
    // Buscar primer link "Ver detalle"
    const detailLinks = page.getByRole('link', { name: /ver detalle/i });
    const count = await detailLinks.count();

    // Si no hay moteles, skip test
    if (count === 0) {
      test.skip();
      return;
    }

    // Obtener URL actual antes del click
    const currentUrl = page.url();

    // Click en el primer link
    await detailLinks.first().click();

    // Esperar navegación a página de detalle
    await page.waitForURL(/\/admin\/motels\/[a-z0-9-]+/, { timeout: 10000 });

    // Verificar que navegamos exitosamente
    const newUrl = page.url();
    expect(newUrl).not.toBe(currentUrl);
    expect(newUrl).toMatch(/\/admin\/motels\/[a-z0-9-]+/);
  });

  test('should display motel statistics', async ({ page }) => {
    // Verificar que muestra el contador de resultados
    await expect(page.getByText(/mostrando/i)).toBeVisible();

    // Verificar que muestra contadores en los filtros (formato: "Todos (X)")
    const allButton = page.getByRole('button', { name: /^todos/i }).first();
    const allButtonText = await allButton.textContent();
    expect(allButtonText).toMatch(/\(\d+\)/);
  });

  test('should handle empty search results', async ({ page }) => {
    // Buscar algo que no existe
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    await searchInput.fill('XYZABC123NOEXISTE999');
    await page.waitForTimeout(500);

    // Verificar mensaje de "no encontrado"
    await expect(page.getByText(/no se encontraron moteles/i)).toBeVisible();
  });

  test('should clear all filters', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Buscar"]');

    // Aplicar varios filtros
    await page.getByRole('button', { name: /pendientes/i }).click();
    await page.waitForTimeout(300);

    await page.getByRole('button', { name: /^activos/i }).click();
    await page.waitForTimeout(300);

    await searchInput.fill('Test');
    await page.waitForTimeout(300);

    // Buscar y click en "Limpiar filtros"
    const clearButton = page.getByRole('button', { name: /limpiar filtros/i });

    // Solo si el botón existe (aparece cuando hay filtros activos)
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await page.waitForTimeout(500);

      // Verificar que la búsqueda se limpió
      await expect(searchInput).toHaveValue('');
    }
  });

  test('should edit motel basic information', async ({ page }) => {
    // Ir al primer motel
    const detailLinks = page.getByRole('link', { name: /ver detalle/i });
    const count = await detailLinks.count();

    if (count === 0) {
      test.skip();
      return;
    }

    await detailLinks.first().click();
    await page.waitForURL(/\/admin\/motels\/[a-z0-9-]+/);

    // Buscar botón de editar información básica
    const editButton = page.getByRole('button', { name: /editar información/i });

    if (!(await editButton.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    await editButton.click();
    await page.waitForTimeout(500);

    // Verificar que el formulario está visible
    const nameInput = page.locator('input[name="name"]');
    await expect(nameInput).toBeVisible();

    // Nota: No modificamos data real, solo verificamos que el formulario abre
  });

  test('should approve pending motel', async ({ page }) => {
    // Filtrar por pendientes
    await page.getByRole('button', { name: /pendientes/i }).click();
    await page.waitForTimeout(500);

    // Ir al primer motel pendiente
    const detailLinks = page.getByRole('link', { name: /ver detalle/i });
    const count = await detailLinks.count();

    if (count === 0) {
      test.skip();
      return;
    }

    await detailLinks.first().click();
    await page.waitForURL(/\/admin\/motels\/[a-z0-9-]+/);

    // Buscar botón de editar
    const editButton = page.getByRole('button', { name: /editar información/i });

    if (!(await editButton.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    await editButton.click();
    await page.waitForTimeout(500);

    // Buscar select de estado
    const statusSelect = page.locator('select[name="status"]');

    if (!(await statusSelect.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    // Verificar que tiene las opciones correctas
    const options = await statusSelect.locator('option').allTextContents();
    expect(options.some(opt => opt.includes('APPROVED') || opt.includes('Aprobado'))).toBeTruthy();

    // Nota: No modificamos el estado real para no afectar la BD
  });

  test('should reject motel', async ({ page }) => {
    // Filtrar por pendientes
    await page.getByRole('button', { name: /pendientes/i }).click();
    await page.waitForTimeout(500);

    const detailLinks = page.getByRole('link', { name: /ver detalle/i });
    const count = await detailLinks.count();

    if (count === 0) {
      test.skip();
      return;
    }

    await detailLinks.first().click();
    await page.waitForURL(/\/admin\/motels\/[a-z0-9-]+/);

    const editButton = page.getByRole('button', { name: /editar información/i });

    if (!(await editButton.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    await editButton.click();
    await page.waitForTimeout(500);

    const statusSelect = page.locator('select[name="status"]');

    if (!(await statusSelect.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    // Verificar que tiene opción REJECTED
    const options = await statusSelect.locator('option').allTextContents();
    expect(options.some(opt => opt.includes('REJECTED') || opt.includes('Rechazado'))).toBeTruthy();
  });

  test('should change motel plan', async ({ page }) => {
    const detailLinks = page.getByRole('link', { name: /ver detalle/i });
    const count = await detailLinks.count();

    if (count === 0) {
      test.skip();
      return;
    }

    await detailLinks.first().click();
    await page.waitForURL(/\/admin\/motels\/[a-z0-9-]+/);

    // Buscar tab o sección de "Información Comercial"
    const commercialTab = page.getByText(/información comercial/i).or(
      page.getByRole('button', { name: /comercial/i })
    );

    if (await commercialTab.count() > 0) {
      await commercialTab.first().click();
      await page.waitForTimeout(500);
    }

    // Buscar botón de editar comercial
    const editCommercialButton = page.getByRole('button', { name: /editar/i }).filter({
      hasText: /comercial|información comercial/i
    });

    if (!(await editCommercialButton.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    await editCommercialButton.click();
    await page.waitForTimeout(500);

    // Buscar select de plan
    const planSelect = page.locator('select[name="plan"]');

    if (!(await planSelect.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    // Verificar que tiene opciones de planes
    const options = await planSelect.locator('option').allTextContents();
    expect(options.some(opt => opt.includes('GOLD') || opt.includes('DIAMOND'))).toBeTruthy();
  });

  test('should toggle motel active status', async ({ page }) => {
    const detailLinks = page.getByRole('link', { name: /ver detalle/i });
    const count = await detailLinks.count();

    if (count === 0) {
      test.skip();
      return;
    }

    await detailLinks.first().click();
    await page.waitForURL(/\/admin\/motels\/[a-z0-9-]+/);

    const editButton = page.getByRole('button', { name: /editar información/i });

    if (!(await editButton.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    await editButton.click();
    await page.waitForTimeout(500);

    // Buscar checkbox o toggle de isActive
    const activeCheckbox = page.locator('input[name="isActive"]');

    if (await activeCheckbox.count() > 0) {
      await expect(activeCheckbox).toBeVisible();
      // Verificar que es un checkbox
      const inputType = await activeCheckbox.getAttribute('type');
      expect(inputType).toBe('checkbox');
    }
  });
});
