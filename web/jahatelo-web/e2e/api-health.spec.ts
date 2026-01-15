import { test, expect } from '@playwright/test';

test.describe('API Health', () => {
  test('should respond healthy', async ({ request }) => {
    test.skip(process.env.E2E_SKIP_DB === '1', 'DB health check skipped');
    const response = await request.get('/api/health');

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('healthy');
  });
});
