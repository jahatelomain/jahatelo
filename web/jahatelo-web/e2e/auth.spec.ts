import { test, expect } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? 'admin@jahatelo.com';
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? 'Admin123!';

test.describe('Authentication Flow', () => {
  test('should load admin login page', async ({ page }) => {
    await page.goto('/admin/login');

    // Verificar que la página carga
    await expect(page).toHaveURL(/.*login/);

    // Verificar elementos clave
    await expect(page.getByTestId('admin-login-email')).toBeVisible();
    await expect(page.getByTestId('admin-login-password')).toBeVisible();
    await expect(page.getByTestId('admin-login-submit')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    test.skip(process.env.E2E_MODE === '1', 'Evita lockouts por intentos fallidos en E2E.');
    await page.goto('/admin/login');

    // Intentar login con credenciales inválidas
    await page.getByTestId('admin-login-email').fill('wrong@example.com');
    await page.getByTestId('admin-login-password').fill('wrongpassword');
    await page.getByTestId('admin-login-submit').click();

    // Verificar mensaje de error
    await expect(page.getByTestId('admin-login-error')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('admin-login-error')).toHaveText(/credenciales|error|demasiados intentos/i);
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    await page.goto('/admin/login');

    // Intentar con email inválido
    const emailInput = page.getByTestId('admin-login-email');
    await emailInput.fill('not-an-email');
    await page.getByTestId('admin-login-password').fill('SomePass123');
    await page.getByTestId('admin-login-submit').click();

    // Verificar error de validación
    const isValid = await emailInput.evaluate((input) => (input as HTMLInputElement).validity.valid);
    expect(isValid).toBe(false);
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/admin/login?redirect=/admin/motels');

    // Login con credenciales válidas (debes tener un usuario de prueba)
    await page.getByTestId('admin-login-email').fill(adminEmail);
    await page.getByTestId('admin-login-password').fill(adminPassword);
    await page.getByTestId('admin-login-submit').click();

    // Verificar redirección a moteles
    await expect(page).toHaveURL(/\/admin\/motels/, { timeout: 10000 });
  });
});
