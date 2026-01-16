# 🧪 Guía de Testing - Jahatelo

Sistema de testing completo con Jest (unit tests) y Playwright (E2E tests).

## ✅ Tests Implementados

### **Unit Tests (Jest)** - 35 tests
```
✅ Validaciones Zod (17 tests)
   - LoginSchema
   - RegisterSchema (passwords fuertes)
   - ReviewSchema
   - MotelSchema

✅ Sanitización (18 tests)
   - sanitizeText (XSS prevention)
   - sanitizeHtml (safe HTML)
   - escapeHtml (HTML entities)
```

### **E2E Tests (Playwright)** - 26 tests
```
✅ Authentication Flow (4 tests)
   - Load login page
   - Invalid credentials error
   - Email validation
   - Successful login

✅ Public Website (4 tests)
   - Load homepage
   - Display motels
   - Navigate to detail
   - Perform search

✅ Admin Notifications (6 tests)
   - Load notifications page
   - Show notification form
   - Validate required fields
   - Filter by category
   - Handle missing IDs gracefully
   - Navigate to detail with valid ID

✅ Admin Motels (13 tests)
   - Load motels list page
   - Filter by status (PENDING/APPROVED/REJECTED)
   - Filter by active/inactive
   - Search motels by name
   - Navigate to motel detail
   - Edit motel basic information
   - Approve pending motel
   - Reject motel
   - Change motel plan
   - Toggle motel active status
   - Display motel statistics
   - Handle empty search results
   - Clear all filters
```

---

## 🚀 Comandos Rápidos

### Unit Tests (Jest)
```bash
# Ejecutar todos los tests
npm test

# Watch mode (re-ejecuta al guardar)
npm run test:watch

# Con reporte de cobertura
npm run test:coverage
```

### E2E Tests (Playwright)
```bash
# Ejecutar E2E tests
npm run test:e2e

# Modo UI (interfaz visual)
npm run test:e2e:ui

# Con navegador visible (debug)
npm run test:e2e:headed
```

---

## 📊 Resultados Actuales

```
Jest Tests:
✅ 35/35 tests passing (100%)
⏱️  0.61s execution time

Playwright Tests:
✅ 26 E2E tests configured
   - 4 tests de autenticación
   - 4 tests de website público
   - 6 tests de admin (notificaciones)
   - 13 tests de admin (moteles) ⭐ NUEVO
⚠️  Requieren servidor corriendo

Mobile App:
⚠️  Testing pendiente (Jest no configurado)
✅ Fetch helpers implementados con validación
✅ Documentación de best practices creada
```

---

## 🔧 Configuración

### Jest (`jest.config.js`)
- Environment: jsdom (para React)
- Coverage threshold: 50%
- Test match: `__tests__/**/*` y `*.test.ts`
- Ignora: `e2e/`, `node_modules/`, `.next/`

### Playwright (`playwright.config.ts`)
- Base URL: http://localhost:3000
- Browser: Chromium
- Auto-start server: `npm run dev`
- Screenshots: on failure
- Trace: on first retry

---

## 📝 Crear Nuevos Tests

### Unit Test (Jest)

**Archivo:** `__tests__/lib/myfunction.test.ts`

```typescript
import { myFunction } from '@/lib/myfunction';

describe('myFunction', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });

  it('should handle edge cases', () => {
    expect(() => myFunction(null)).toThrow();
  });
});
```

**Ejecutar:**
```bash
npm test -- myfunction
```

---

### E2E Test (Playwright)

**Archivo:** `e2e/myflow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('My Feature Flow', () => {
  test('should complete user action', async ({ page }) => {
    await page.goto('/my-page');

    // Interactuar
    await page.getByRole('button', { name: /submit/i }).click();

    // Verificar
    await expect(page).toHaveURL(/success/);
    await expect(page.getByText(/completed/i)).toBeVisible();
  });
});
```

**Ejecutar:**
```bash
npm run test:e2e -- myflow
```

---

## 🎯 Tests Prioritarios Pendientes

### **Alta Prioridad** (Crítico para negocio)

1. ✅ **Admin - Gestión de Moteles** - COMPLETADO
```typescript
// e2e/admin-motels.spec.ts
✅ 13 tests implementados
- Listar y filtrar moteles
- Editar motel existente
- Aprobar motel pendiente
- Rechazar motel
- Cambiar plan
- Activar/desactivar motel
```

2. **Mobile API - Reviews** ⚠️ PENDIENTE
```typescript
// __tests__/api/mobile/reviews.test.ts
- Crear review válida
- Rechazar review sin rating
- Rechazar review con comment corto
- Validar cooldown (30 días)
```

### **Media Prioridad**

4. **Search & Filters**
```typescript
// e2e/search.spec.ts
- Búsqueda por nombre
- Filtro por ciudad
- Filtro por amenidades
```

5. **Favoritos**
```typescript
// __tests__/api/favorites.test.ts
- Agregar a favoritos
- Remover de favoritos
- Listar favoritos
```

### **Baja Prioridad**

6. **Analytics**
```typescript
// __tests__/api/analytics.test.ts
- Track event
- Get analytics
```

---

## 📈 Cobertura Actual

```
Statements   : Unknown% (tests básicos)
Branches     : Unknown% (tests básicos)
Functions    : Unknown% (tests básicos)
Lines        : Unknown% (tests básicos)
```

**Target Goal:**
```
Statements   : 70%
Branches     : 60%
Functions    : 70%
Lines        : 70%
```

---

## 🐛 Debugging Tests

### Jest Debug

```bash
# Ejecutar un test específico
npm test -- validations

# Debug con breakpoint (usar debugger;)
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Playwright Debug

```bash
# Modo headed (ver navegador)
npm run test:e2e:headed

# Modo UI (mejor para debug)
npm run test:e2e:ui

# Con Playwright Inspector
npx playwright test --debug
```

### Ver Screenshots de Fallos

```
test-results/
└── auth-should-login-chromium/
    ├── test-failed-1.png
    └── trace.zip
```

---

## ✅ Checklist Pre-Deploy

```bash
# 1. Unit tests pasan
npm test
# ✅ 35/35 tests passing

# 2. E2E tests pasan
npm run test:e2e
# ✅ All tests passed

# 3. No hay errores de TypeScript
npx tsc --noEmit
# ✅ No errors

# 4. Build exitoso
npm run build
# ✅ Build completed

# 5. Cobertura aceptable (opcional)
npm run test:coverage
# ✅ Coverage > 50%
```

---

## 📚 Recursos

### Documentación Oficial
- [Jest Docs](https://jestjs.io/docs/getting-started)
- [Playwright Docs](https://playwright.dev/docs/intro)
- [Testing Library](https://testing-library.com/docs/)

### Buenas Prácticas
- Tests independientes (no depender de orden)
- Nombres descriptivos (`should login with valid credentials`)
- Un concepto por test
- Usar data-testid para elementos críticos
- Mock de servicios externos
- Tests rápidos (<5s unit, <30s E2E)

---

## 🎓 Ejemplos Avanzados

### Mock de Prisma

```typescript
jest.mock('@/lib/prisma', () => ({
  prisma: {
    motel: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: '123' }),
    },
  },
}));
```

### Test de API Route

```typescript
import { POST } from '@/app/api/motels/route';
import { NextRequest } from 'next/server';

test('should create motel', async () => {
  const request = new NextRequest('http://localhost/api/motels', {
    method: 'POST',
    body: JSON.stringify({ name: 'Test' }),
  });

  const response = await POST(request);
  expect(response.status).toBe(201);
});
```

### Playwright con Autenticación

```typescript
import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('/admin/login');
  await page.fill('[name=email]', 'admin@test.com');
  await page.fill('[name=password]', 'Pass123!');
  await page.click('button[type=submit]');

  await page.context().storageState({ path: 'auth.json' });
});

// Usar en tests
test.use({ storageState: 'auth.json' });
```

---

## 💡 Tips

1. **Ejecuta tests antes de commit**
   ```bash
   git add . && npm test && git commit -m "message"
   ```

2. **CI/CD Integration**
   ```yaml
   # .github/workflows/test.yml
   - run: npm test
   - run: npm run test:e2e
   ```

3. **Watch mode en desarrollo**
   ```bash
   npm run test:watch
   ```

4. **Tests coverage en PRs**
   ```bash
   npm run test:coverage -- --coverageReporters=lcov
   ```

---

**Tests Creados:** 13-14 de Enero 2026
**Cobertura Base:** 35 unit tests + 26 E2E tests
**Tiempo Invertido:** 15 horas
**Status:** ✅ Sistema de testing funcional con cobertura crítica
