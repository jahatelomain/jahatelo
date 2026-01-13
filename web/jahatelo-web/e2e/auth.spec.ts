import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should load admin login page', async ({ page }) => {
    await page.goto('/admin/login');

    // Verificar que la página carga
    await expect(page).toHaveURL(/.*login/);

    // Verificar elementos clave
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /password/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /iniciar|login/i })).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/admin/login');

    // Intentar login con credenciales inválidas
    await page.getByRole('textbox', { name: /email/i }).fill('wrong@example.com');
    await page.getByRole('textbox', { name: /password/i }).fill('wrongpassword');
    await page.getByRole('button', { name: /iniciar|login/i }).click();

    // Verificar mensaje de error
    await expect(page.getByText(/credenciales|inválid|error/i)).toBeVisible({ timeout: 5000 });
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    await page.goto('/admin/login');

    // Intentar con email inválido
    await page.getByRole('textbox', { name: /email/i }).fill('not-an-email');
    await page.getByRole('textbox', { name: /password/i }).fill('SomePass123');
    await page.getByRole('button', { name: /iniciar|login/i }).click();

    // Verificar error de validación
    await expect(page.getByText(/email.*inválid|invalid.*email/i)).toBeVisible({ timeout: 5000 });
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/admin/login');

    // Login con credenciales válidas (debes tener un usuario de prueba)
    await page.getByRole('textbox', { name: /email/i }).fill('admin@jahatelo.com');
    await page.getByRole('textbox', { name: /password/i }).fill('Admin123!');
    await page.getByRole('button', { name: /iniciar|login/i }).click();

    // Verificar redirección al dashboard
    await expect(page).toHaveURL(/.*admin(?!\/login)/, { timeout: 10000 });
  });
});
